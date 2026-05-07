package grpcclient

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"

	pb "github.com/SatisfactoryServerManager/ssmcloud-resources/proto/generated"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Client struct {
	Conn  *grpc.ClientConn
	Admin pb.AdminServiceClient
}

type Config struct {
	BackendAddr string
	AdminKey    string
}

func Dial(ctx context.Context, cfg Config) (*Client, error) {
	if cfg.BackendAddr == "" {
		return nil, fmt.Errorf("BackendAddr is required")
	}

	unary := grpc.WithUnaryInterceptor(func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		if cfg.AdminKey != "" {
			ctx = metadata.AppendToOutgoingContext(ctx, "x-ssmcloud-admin-key", cfg.AdminKey)
		}
		return invoker(ctx, method, req, reply, cc, opts...)
	})

	fmt.Printf("Connecting to gRPC server at: %s\n", cfg.BackendAddr)

	// Create TLS credentials
	tlsConfig := &tls.Config{}
	creds := credentials.NewTLS(tlsConfig)

	if os.Getenv("APP_MODE") == "development" {
		creds = insecure.NewCredentials()
		fmt.Println("Using insecure gRPC credentials for development mode")
	}

	conn, err := grpc.NewClient(
		cfg.BackendAddr,
		grpc.WithTransportCredentials(creds),
		unary,
	)

	if err != nil {
		fmt.Printf("Failed to connect to gRPC server: %v\n", err)
		return nil, err
	}

	fmt.Println("Successfully connected to gRPC server")

	return &Client{
		Conn:  conn,
		Admin: pb.NewAdminServiceClient(conn),
	}, nil
}
