package grpcclient

import (
	"context"
	"fmt"

	pb "github.com/SatisfactoryServerManager/ssmcloud-resources/proto/generated"
	"google.golang.org/grpc"
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

	conn, err := grpc.DialContext(ctx, cfg.BackendAddr, grpc.WithTransportCredentials(insecure.NewCredentials()), unary)
	if err != nil {
		return nil, err
	}

	return &Client{
		Conn:  conn,
		Admin: pb.NewAdminServiceClient(conn),
	}, nil
}
