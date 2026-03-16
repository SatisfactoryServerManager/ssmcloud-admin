# ssmcloud-admin

Minimal admin panel for SSMCloud.

## What it is

A small Go HTTP API (BFF) that talks to `ssmcloud-backend` using gRPC via the `AdminService` proto in `ssmcloud-resources`, plus a Vite (Vue) frontend.

## Run

The Go process loads environment variables from `.env` (if present). Copy `.env.example` to `.env` and set `ADMIN_SECRET_KEY`.

If you set the Authentik OIDC variables (`AUTHENTIK_*`, `APP_URL`, `JWT_SECRET`), the admin UI and `/api/*` will require login and will only allow users in the `authentikAdmins` group.

1. Run backend (in another terminal):

- Ensure the backend has `ADMIN_SECRET_KEY` (or `SECRET_KEY`) set.
- Start `ssmcloud-backend` as you normally do (gRPC defaults to `:50051`).

2. Start admin dev mode:

- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`
- Linux/macOS: `./scripts/dev.sh`

This starts:

- Go API on `ADMIN_HTTP_ADDR` (default `:3001`)
- Vite dev server (with `/api` proxied to the Go API)

If Authentik OIDC is enabled, Vite also proxies `/auth/*` to the Go API so `APP_URL` can be the Vite origin during development.

Then open the URL printed by Vite (usually `http://localhost:5173/`).

## Build

- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
- Linux/macOS: `./scripts/build.sh`

Build output:

- `release/<os>/ssmcloud-admin(.exe)`
- `release/<os>/web/dist/`
