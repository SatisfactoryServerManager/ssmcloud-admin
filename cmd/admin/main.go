package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/SatisfactoryServerManager/ssmcloud-admin/internal/auth"
	"github.com/SatisfactoryServerManager/ssmcloud-admin/internal/grpcclient"
	"github.com/SatisfactoryServerManager/ssmcloud-admin/internal/httpapi"
)

func main() {
	_ = godotenv.Load()

	httpAddr := os.Getenv("ADMIN_HTTP_ADDR")
	if httpAddr == "" {
		httpAddr = ":3001"
	}

	backendAddr := os.Getenv("BACKEND_GRPC_ADDR")
	if backendAddr == "" {
		backendAddr = "localhost:50051"
	}

	adminKey := os.Getenv("ADMIN_SECRET_KEY")
	if adminKey == "" {
		adminKey = os.Getenv("SECRET_KEY")
	}

	if os.Getenv("APP_MODE") != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx := context.Background()
	authSvc, err := auth.New(ctx)
	if err != nil {
		log.Fatalf("failed to initialize authentik auth: %v", err)
	}

	grpcClient, err := grpcclient.Dial(ctx, grpcclient.Config{BackendAddr: backendAddr, AdminKey: adminKey})
	if err != nil {
		log.Fatalf("failed to dial backend gRPC: %v", err)
	}
	defer grpcClient.Conn.Close()

	api := httpapi.New(grpcClient.Admin)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// Health endpoint — always accessible, no auth required.
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	if authSvc != nil {
		log.Printf("auth enabled; protecting /api and SPA")
		authSvc.RegisterRoutes(r)
		protected := r.Group("/")
		protected.Use(authSvc.RequireAdmin())
		api.RegisterRoutes(protected.Group("/api"))
	} else {
		missing := auth.MissingEnv()
		if len(missing) > 0 {
			log.Printf("auth disabled; missing env: %s", strings.Join(missing, ", "))
		} else {
			log.Printf("auth disabled")
		}
		r.Any("/auth/*path", auth.DisabledGinHandler(missing))
		api.RegisterRoutes(r.Group("/api"))
	}

	// In production, serve the built Next.js static export from web/out.
	// In development, the Next.js dev server proxies /api requests to this process.
	distDir := filepath.Join("web", "out")
	if stat, err := os.Stat(distDir); err == nil && stat.IsDir() {
		r.Static("/_next", filepath.Join(distDir, "_next"))

		spaHandler := func(c *gin.Context) {
			reqPath := filepath.Clean(c.Request.URL.Path)
			// Try exact file
			if tryFile(c, filepath.Join(distDir, reqPath)) {
				return
			}
			// Try <path>.html (Next.js static export)
			if tryFile(c, filepath.Join(distDir, reqPath+".html")) {
				return
			}
			// Try <path>/index.html
			if tryFile(c, filepath.Join(distDir, reqPath, "index.html")) {
				return
			}
			// Fallback to root
			c.File(filepath.Join(distDir, "index.html"))
		}

		if authSvc != nil {
			r.NoRoute(authSvc.RequireAdmin(), spaHandler)
		} else {
			r.NoRoute(spaHandler)
		}
	}

	httpServer := &http.Server{
		Addr:              httpAddr,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("admin panel listening on http://%s", httpAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = httpServer.Shutdown(shutdownCtx)
	log.Println("server stopped")
}

func tryFile(c *gin.Context, path string) bool {
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		return false
	}
	c.File(path)
	return true
}
