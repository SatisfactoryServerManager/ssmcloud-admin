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

	ctx := context.Background()
	authSvc, err := auth.New(ctx)
	if err != nil {
		log.Fatalf("failed to initialize authentik auth: %v", err)
	}
	grpc, err := grpcclient.Dial(ctx, grpcclient.Config{BackendAddr: backendAddr, AdminKey: adminKey})
	if err != nil {
		log.Fatalf("failed to dial backend gRPC: %v", err)
	}
	defer grpc.Conn.Close()

	api := httpapi.New(grpc.Admin)
	mux := http.NewServeMux()
	if authSvc != nil {
		log.Printf("auth enabled; protecting /api and SPA")
		mux.Handle("/auth/", authSvc.Routes())
		mux.Handle("/api/", authSvc.RequireAdmin(api.Routes()))
	} else {
		missing := auth.MissingEnv()
		if len(missing) > 0 {
			log.Printf("auth disabled; missing env: %s", strings.Join(missing, ", "))
		} else {
			log.Printf("auth disabled")
		}
		mux.Handle("/auth/", auth.DisabledHandler(missing))
		mux.Handle("/api/", api.Routes())
	}

	// In production, serve the built Vite app if it exists.
	// In development, run Vite and use its dev server (proxying /api to this process).
	distDir := filepath.Join("web", "dist")
	if stat, err := os.Stat(distDir); err == nil && stat.IsDir() {
		fs := http.FileServer(http.Dir(distDir))
		spa := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Serve index.html for SPA routes that don't map to a file
			p := filepath.Join(distDir, filepath.Clean(r.URL.Path))
			if info, err := os.Stat(p); err == nil && !info.IsDir() {
				fs.ServeHTTP(w, r)
				return
			}
			r.URL.Path = "/"
			fs.ServeHTTP(w, r)
		})
		if authSvc != nil {
			mux.Handle("/", authSvc.RequireAdmin(spa))
		} else {
			mux.Handle("/", spa)
		}
	}

	httpServer := &http.Server{
		Addr:              httpAddr,
		Handler:           mux,
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
}
