package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

const requiredAdminGroup = "authentikAdmins"

type Service struct {
	appURL      string
	baseAuthURL string
    providerName string

	oauth2Config *oauth2.Config
	verifier     *oidc.IDTokenVerifier
	store        sessions.Store
}

func MissingEnv() []string {
	required := []string{
		"AUTHENTIK_CLIENT_ID",
		"AUTHENTIK_CLIENT_SECRET",
		"AUTHENTIK_URL",
		"AUTHENTIK_PROVIDER",
		"APP_URL",
		"JWT_SECRET",
	}
	missing := make([]string, 0)
	for _, key := range required {
		if os.Getenv(key) == "" {
			missing = append(missing, key)
		}
	}
	return missing
}

func DisabledHandler(missing []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		msg := "auth not configured"
		if len(missing) > 0 {
			msg = msg + ": missing " + strings.Join(missing, ", ")
		}
		http.Error(w, msg, http.StatusServiceUnavailable)
	})
}

func New(ctx context.Context) (*Service, error) {
	clientID := os.Getenv("AUTHENTIK_CLIENT_ID")
	clientSecret := os.Getenv("AUTHENTIK_CLIENT_SECRET")
	baseAuthURL := os.Getenv("AUTHENTIK_URL")
	providerName := os.Getenv("AUTHENTIK_PROVIDER")
	appURL := os.Getenv("APP_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	// If Authentik isn't configured, keep auth disabled.
	if clientID == "" || clientSecret == "" || baseAuthURL == "" || providerName == "" || appURL == "" || jwtSecret == "" {
		return nil, nil
	}

	issuerURL := strings.TrimRight(baseAuthURL, "/") + "/application/o/" + url.PathEscape(providerName) + "/"
	redirectURL := strings.TrimRight(appURL, "/") + "/auth/callback"

	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		return nil, fmt.Errorf("oidc provider discovery failed: %w", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	oauth2Config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email", "offline_access", "avatar"},
	}

	hashKey := sha256.Sum256([]byte(jwtSecret + ":hash"))
	blockKey := sha256.Sum256([]byte(jwtSecret + ":block"))
	cookieStore := sessions.NewCookieStore(hashKey[:], blockKey[:])
	cookieStore.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400, // 1 day
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   strings.HasPrefix(strings.ToLower(appURL), "https://"),
	}

	return &Service{
		appURL:       appURL,
		baseAuthURL:  strings.TrimRight(baseAuthURL, "/"),
		providerName: providerName,
		oauth2Config: oauth2Config,
		verifier:     verifier,
		store:        cookieStore,
	}, nil
}

func (s *Service) Enabled() bool { return s != nil }

func (s *Service) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/login", s.handleLogin)
	mux.HandleFunc("/auth/callback", s.handleCallback)
	mux.HandleFunc("/auth/logout", s.handleLogout)
	return mux
}

func (s *Service) RequireAdmin(next http.Handler) http.Handler {
	if s == nil {
		return next
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Always allow auth endpoints.
		if strings.HasPrefix(r.URL.Path, "/auth/") {
			next.ServeHTTP(w, r)
			return
		}
		// Allow unauthenticated health checks.
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}

		ok, err := s.isAdminRequest(r)
		if err != nil {
			unauthorized(w, r)
			return
		}
		if !ok {
			unauthorized(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Service) isAdminRequest(r *http.Request) (bool, error) {
	sess, err := s.store.Get(r, "session")
	if err != nil {
		return false, err
	}
	v, ok := sess.Values["is_admin"].(bool)
	if !ok {
		return false, nil
	}
	return v, nil
}

func unauthorized(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}
	http.Redirect(w, r, "/auth/login", http.StatusFound)
}

func (s *Service) handleLogin(w http.ResponseWriter, r *http.Request) {
	sess, _ := s.store.Get(r, "session")
	state := randomToken(32)
	if state == "" {
		http.Error(w, "failed to generate state", http.StatusInternalServerError)
		return
	}
	sess.Values["oidc_state"] = state
	if next := r.URL.Query().Get("next"); next != "" {
		sess.Values["return_to"] = next
	}
	if err := sess.Save(r, w); err != nil {
		http.Error(w, "failed to save session", http.StatusInternalServerError)
		return
	}

	url := s.oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusFound)
}

func (s *Service) handleCallback(w http.ResponseWriter, r *http.Request) {
	sess, _ := s.store.Get(r, "session")

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		http.Error(w, "missing code/state", http.StatusBadRequest)
		return
	}
	if expected, _ := sess.Values["oidc_state"].(string); expected == "" || state != expected {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}

	tok, err := s.oauth2Config.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "exchange failed", http.StatusInternalServerError)
		return
	}

	rawIDToken, ok := tok.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		http.Error(w, "no id_token field in oauth2 token", http.StatusInternalServerError)
		return
	}

	idtok, err := s.verifier.Verify(r.Context(), rawIDToken)
	if err != nil {
		http.Error(w, "invalid id token", http.StatusUnauthorized)
		return
	}

	claims := map[string]any{}
	if err := idtok.Claims(&claims); err != nil {
		http.Error(w, "failed to parse claims", http.StatusInternalServerError)
		return
	}

	groups := extractGroups(claims)
	if !contains(groups, requiredAdminGroup) {
		// Clear session and reject.
		sess.Values = map[any]any{}
		_ = sess.Save(r, w)
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	sess.Values["is_admin"] = true
	sess.Values["id_token"] = rawIDToken
	if email, _ := claims["email"].(string); email != "" {
		sess.Values["email"] = email
	}
	sess.Values["groups"] = strings.Join(groups, ",")
	delete(sess.Values, "oidc_state")

	if err := sess.Save(r, w); err != nil {
		http.Error(w, "failed to save session", http.StatusInternalServerError)
		return
	}

	returnTo, _ := sess.Values["return_to"].(string)
	if returnTo == "" {
		returnTo = "/"
	}
	http.Redirect(w, r, returnTo, http.StatusFound)
}

func (s *Service) handleLogout(w http.ResponseWriter, r *http.Request) {
	sess, _ := s.store.Get(r, "session")
	idToken, _ := sess.Values["id_token"].(string)

	sess.Values = map[any]any{}
	sess.Options = &sessions.Options{Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: strings.HasPrefix(strings.ToLower(s.appURL), "https://")}
	_ = sess.Save(r, w)

	logoutURL, err := s.authentikLogoutURL(idToken)
	if err != nil {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	http.Redirect(w, r, logoutURL, http.StatusFound)
}

func (s *Service) authentikLogoutURL(idToken string) (string, error) {
	if s.baseAuthURL == "" || s.oauth2Config == nil {
		return "", errors.New("auth not configured")
	}
	endSessionURL := s.baseAuthURL + "/application/o/"+s.providerName+"/end-session/"
	params := url.Values{}
	params.Set("client_id", s.oauth2Config.ClientID)
	params.Set("post_logout_redirect_uri", strings.TrimRight(s.appURL, "/"))
	if idToken != "" {
		params.Set("id_token_hint", idToken)
	}
	return endSessionURL + "?" + params.Encode(), nil
}

func randomToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

func extractGroups(claims map[string]any) []string {
	// Authentik emits groups as the `groups` claim (array of strings).
	// Keep this strict to avoid accidentally trusting a different claim.
	v, ok := claims["groups"]
	if !ok {
		return nil
	}
	return coerceStringSlice(v)
}

func coerceStringSlice(v any) []string {
	switch t := v.(type) {
	case []string:
		return t
	case []any:
		out := make([]string, 0, len(t))
		for _, item := range t {
			if s, ok := item.(string); ok && s != "" {
				out = append(out, s)
			}
		}
		return out
	case string:
		if t == "" {
			return nil
		}
		parts := strings.Split(t, ",")
		out := make([]string, 0, len(parts))
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				out = append(out, p)
			}
		}
		return out
	default:
		return nil
	}
}

func contains(items []string, want string) bool {
	for _, item := range items {
		if item == want {
			return true
		}
	}
	return false
}
