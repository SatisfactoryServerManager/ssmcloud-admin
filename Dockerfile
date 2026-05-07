# syntax=docker/dockerfile:1

FROM node:26-alpine AS web
WORKDIR /src/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
RUN NEXT_STATIC_BUILD=1 npm run build


FROM golang:1.26-alpine AS go
WORKDIR /src

COPY go.mod go.sum ./
# CI/container build should use the published resources module (drop local replace)
RUN go mod edit -dropreplace=github.com/SatisfactoryServerManager/ssmcloud-resources || true
RUN go mod download

COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN GOOS=linux GOARCH=amd64 go build -o /out/ssmcloud-admin ./cmd/admin


FROM alpine:3.23
WORKDIR /app

RUN adduser -D -H -s /sbin/nologin appuser

COPY --from=go /out/ssmcloud-admin ./ssmcloud-admin
COPY --from=web /src/web/out ./web/out
COPY .env.example ./.env.example

USER appuser
EXPOSE 3001

ENV ADMIN_HTTP_ADDR=:3001
CMD ["./ssmcloud-admin"]
