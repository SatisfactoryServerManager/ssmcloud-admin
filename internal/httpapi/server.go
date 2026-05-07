package httpapi

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	pb "github.com/SatisfactoryServerManager/ssmcloud-resources/proto/generated"
	"google.golang.org/protobuf/encoding/protojson"
)

type Server struct {
	admin pb.AdminServiceClient
}

func New(admin pb.AdminServiceClient) *Server {
	return &Server{admin: admin}
}

var pj = protojson.MarshalOptions{UseProtoNames: true, EmitUnpopulated: true}

func (s *Server) RegisterRoutes(rg gin.IRouter) {
	rg.GET("/users", s.handleUsers)
	rg.POST("/users/update", s.handleUsersUpdate)
	rg.POST("/users/delete", s.handleUsersDelete)

	rg.GET("/accounts", s.handleAccounts)
	rg.POST("/accounts/update", s.handleAccountsUpdate)
	rg.POST("/accounts/delete", s.handleAccountsDelete)

	rg.GET("/agents", s.handleAgents)
	rg.POST("/agents/update", s.handleAgentsUpdate)
	rg.POST("/agents/delete", s.handleAgentsDelete)

	rg.GET("/users/accounts", s.handleUserAccounts)
	rg.POST("/users/accounts/add", s.handleUserAccountsAdd)
	rg.POST("/users/accounts/remove", s.handleUserAccountsRemove)
	rg.POST("/users/accounts/set-active", s.handleUserAccountsSetActive)
}

func writeErr(c *gin.Context, status int, err error) {
	c.JSON(status, gin.H{"error": err.Error()})
}

func (s *Server) withTimeout(c *gin.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(c.Request.Context(), 15*time.Second)
}

// ---- Users ----

func (s *Server) handleUsers(c *gin.Context) {
	page := parseInt32(c.Query("page"), 1)
	pageSize := parseInt32(c.Query("page_size"), 50)
	search := c.Query("search")

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.ListUsers(ctx, &pb.AdminListUsersRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type updateUserBody struct {
	UserID     string `json:"user_id"`
	ExternalID string `json:"external_id"`
	Email      string `json:"email"`
	Username   string `json:"username"`
}

func (s *Server) handleUsersUpdate(c *gin.Context) {
	var body updateUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.UpdateUser(ctx, &pb.AdminUpdateUserRequest{UserId: body.UserID, ExternalId: body.ExternalID, Email: body.Email, Username: body.Username})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type deleteUserBody struct {
	UserID string `json:"user_id"`
}

func (s *Server) handleUsersDelete(c *gin.Context) {
	var body deleteUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	_, err := s.admin.DeleteUser(ctx, &pb.AdminDeleteUserRequest{UserId: body.UserID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ---- Accounts ----

func (s *Server) handleAccounts(c *gin.Context) {
	page := parseInt32(c.Query("page"), 1)
	pageSize := parseInt32(c.Query("page_size"), 50)
	search := c.Query("search")

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.ListAccounts(ctx, &pb.AdminListAccountsRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type updateAccountBody struct {
	AccountID   string `json:"account_id"`
	AccountName string `json:"account_name"`
}

func (s *Server) handleAccountsUpdate(c *gin.Context) {
	var body updateAccountBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.UpdateAccount(ctx, &pb.AdminUpdateAccountRequest{AccountId: body.AccountID, AccountName: body.AccountName})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type deleteAccountBody struct {
	AccountID string `json:"account_id"`
}

func (s *Server) handleAccountsDelete(c *gin.Context) {
	var body deleteAccountBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	_, err := s.admin.DeleteAccount(ctx, &pb.AdminDeleteAccountRequest{AccountId: body.AccountID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ---- Agents ----

func (s *Server) handleAgents(c *gin.Context) {
	page := parseInt32(c.Query("page"), 1)
	pageSize := parseInt32(c.Query("page_size"), 50)
	search := c.Query("search")

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.ListAgents(ctx, &pb.AdminListAgentsRequest{Page: page, PageSize: pageSize, Search: search})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type updateAgentBody struct {
	AgentID   string `json:"agent_id"`
	AgentName string `json:"agent_name"`
	APIKey    string `json:"api_key"`
}

func (s *Server) handleAgentsUpdate(c *gin.Context) {
	var body updateAgentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.UpdateAgent(ctx, &pb.AdminUpdateAgentRequest{AgentId: body.AgentID, AgentName: body.AgentName, ApiKey: body.APIKey})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type deleteAgentBody struct {
	AgentID string `json:"agent_id"`
}

func (s *Server) handleAgentsDelete(c *gin.Context) {
	var body deleteAgentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	_, err := s.admin.DeleteAgent(ctx, &pb.AdminDeleteAgentRequest{AgentId: body.AgentID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ---- User Accounts ----

func (s *Server) handleUserAccounts(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		writeErr(c, http.StatusBadRequest, errors.New("missing user_id"))
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	resp, err := s.admin.ListUserAccounts(ctx, &pb.AdminListUserAccountsRequest{UserId: userID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	bytes, err := pj.Marshal(resp)
	if err != nil {
		writeErr(c, http.StatusInternalServerError, err)
		return
	}
	c.Data(http.StatusOK, "application/json", bytes)
}

type userAccountAddBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
	SetActive bool   `json:"set_active"`
}

func (s *Server) handleUserAccountsAdd(c *gin.Context) {
	var body userAccountAddBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	_, err := s.admin.AddUserToAccount(ctx, &pb.AdminAddUserToAccountRequest{UserId: body.UserID, AccountId: body.AccountID, SetActive: body.SetActive})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

type userAccountRemoveBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
}

func (s *Server) handleUserAccountsRemove(c *gin.Context) {
	var body userAccountRemoveBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	_, err := s.admin.RemoveUserFromAccount(ctx, &pb.AdminRemoveUserFromAccountRequest{UserId: body.UserID, AccountId: body.AccountID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

type userAccountSetActiveBody struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
}

func (s *Server) handleUserAccountsSetActive(c *gin.Context) {
	var body userAccountSetActiveBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}

	ctx, cancel := s.withTimeout(c)
	defer cancel()

	_, err := s.admin.SetUserActiveAccount(ctx, &pb.AdminSetUserActiveAccountRequest{UserId: body.UserID, AccountId: body.AccountID})
	if err != nil {
		writeErr(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func parseInt32(v string, def int32) int32 {
	if v == "" {
		return def
	}
	i, err := strconv.ParseInt(v, 10, 32)
	if err != nil {
		return def
	}
	return int32(i)
}
