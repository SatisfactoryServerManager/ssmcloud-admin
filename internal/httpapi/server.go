package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	pb "github.com/SatisfactoryServerManager/ssmcloud-resources/proto/generated"
	"google.golang.org/protobuf/encoding/protojson"
)

type Server struct {
	admin pb.AdminServiceClient
}

func New(admin pb.AdminServiceClient) *Server {
	return &Server{admin: admin}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/users", s.handleUsers)
	mux.HandleFunc("/api/users/update", s.handleUsersUpdate)
	mux.HandleFunc("/api/users/delete", s.handleUsersDelete)

	mux.HandleFunc("/api/accounts", s.handleAccounts)
	mux.HandleFunc("/api/accounts/update", s.handleAccountsUpdate)
	mux.HandleFunc("/api/accounts/delete", s.handleAccountsDelete)

	mux.HandleFunc("/api/agents", s.handleAgents)
	mux.HandleFunc("/api/agents/update", s.handleAgentsUpdate)
	mux.HandleFunc("/api/agents/delete", s.handleAgentsDelete)

	mux.HandleFunc("/api/users/accounts", s.handleUserAccounts)
	mux.HandleFunc("/api/users/accounts/add", s.handleUserAccountsAdd)
	mux.HandleFunc("/api/users/accounts/remove", s.handleUserAccountsRemove)
	mux.HandleFunc("/api/users/accounts/set-active", s.handleUserAccountsSetActive)

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	return mux
}

var pj = protojson.MarshalOptions{UseProtoNames: true, EmitUnpopulated: true}

func writeJSON(w http.ResponseWriter, status int, b []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(b)
}

func writeErr(w http.ResponseWriter, status int, err error) {
	payload, _ := json.Marshal(map[string]string{"error": err.Error()})
	writeJSON(w, status, payload)
}

func decodeJSON(r *http.Request, out any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(out)
}

func (s *Server) withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 15*time.Second)
}

// ---- Users ----

func (s *Server) handleUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	page := parseInt32(q.Get("page"), 1)
	pageSize := parseInt32(q.Get("page_size"), 50)
	search := q.Get("search")

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.ListUsers(ctx, &pb.AdminListUsersRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type updateUserBody struct {
	UserID     string `json:"user_id"`
	ExternalID string `json:"external_id"`
	Email      string `json:"email"`
	Username   string `json:"username"`
}

func (s *Server) handleUsersUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body updateUserBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.UpdateUser(ctx, &pb.AdminUpdateUserRequest{UserId: body.UserID, ExternalId: body.ExternalID, Email: body.Email, Username: body.Username})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type deleteUserBody struct {
	UserID string `json:"user_id"`
}

func (s *Server) handleUsersDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body deleteUserBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	_, err := s.admin.DeleteUser(ctx, &pb.AdminDeleteUserRequest{UserId: body.UserID})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

// ---- Accounts ----

func (s *Server) handleAccounts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	page := parseInt32(q.Get("page"), 1)
	pageSize := parseInt32(q.Get("page_size"), 50)
	search := q.Get("search")

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.ListAccounts(ctx, &pb.AdminListAccountsRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type updateAccountBody struct {
	AccountID   string `json:"account_id"`
	AccountName string `json:"account_name"`
}

func (s *Server) handleAccountsUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body updateAccountBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.UpdateAccount(ctx, &pb.AdminUpdateAccountRequest{AccountId: body.AccountID, AccountName: body.AccountName})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type deleteAccountBody struct {
	AccountID string `json:"account_id"`
}

func (s *Server) handleAccountsDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body deleteAccountBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	_, err := s.admin.DeleteAccount(ctx, &pb.AdminDeleteAccountRequest{AccountId: body.AccountID})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

// ---- Agents ----

func (s *Server) handleAgents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	page := parseInt32(q.Get("page"), 1)
	pageSize := parseInt32(q.Get("page_size"), 50)
	search := q.Get("search")

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.ListAgents(ctx, &pb.AdminListAgentsRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type updateAgentBody struct {
	AgentID   string `json:"agent_id"`
	AgentName string `json:"agent_name"`
	APIKey    string `json:"api_key"`
}

func (s *Server) handleAgentsUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body updateAgentBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.UpdateAgent(ctx, &pb.AdminUpdateAgentRequest{AgentId: body.AgentID, AgentName: body.AgentName, ApiKey: body.APIKey})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type deleteAgentBody struct {
	AgentID string `json:"agent_id"`
}

func (s *Server) handleAgentsDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body deleteAgentBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	_, err := s.admin.DeleteAgent(ctx, &pb.AdminDeleteAgentRequest{AgentId: body.AgentID})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

// ---- User Accounts ----

func (s *Server) handleUserAccounts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userId := r.URL.Query().Get("user_id")
	if userId == "" {
		writeErr(w, http.StatusBadRequest, errors.New("missing user_id"))
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	resp, err := s.admin.ListUserAccounts(ctx, &pb.AdminListUserAccountsRequest{UserId: userId})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, bytes)
}

type userAccountAddBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
	SetActive bool   `json:"set_active"`
}

func (s *Server) handleUserAccountsAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body userAccountAddBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	_, err := s.admin.AddUserToAccount(ctx, &pb.AdminAddUserToAccountRequest{UserId: body.UserID, AccountId: body.AccountID, SetActive: body.SetActive})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

type userAccountRemoveBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
}

func (s *Server) handleUserAccountsRemove(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body userAccountRemoveBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	_, err := s.admin.RemoveUserFromAccount(ctx, &pb.AdminRemoveUserFromAccountRequest{UserId: body.UserID, AccountId: body.AccountID})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

type userAccountSetActiveBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
}

func (s *Server) handleUserAccountsSetActive(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body userAccountSetActiveBody
	if err := decodeJSON(r, &body); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(r.Context())
	defer cancel()

	_, err := s.admin.SetUserActiveAccount(ctx, &pb.AdminSetUserActiveAccountRequest{UserId: body.UserID, AccountId: body.AccountID})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusOK, []byte(`{"ok":true}`))
}

func parseInt32(v string, def int32) int32 {
	if v == "" {
		return def
	}
	// avoid strconv import by using json
	var i int32
	if err := json.Unmarshal([]byte(v), &i); err == nil {
		return i
	}
	return def
}
