package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newLoginCmd() *cobra.Command {
	var token string
	cmd := &cobra.Command{
		Use:   "login",
		Short: "Authenticate with LTF1",
		RunE: func(cmd *cobra.Command, args []string) error {
			if token != "" {
				return loginWithToken(token)
			}
			return loginWithBrowser()
		},
	}
	cmd.Flags().StringVar(&token, "token", "", "use API token instead of browser OAuth")
	return cmd
}

func loginWithToken(token string) error {
	if len(token) < 20 {
		return fmt.Errorf("token appears invalid (too short)")
	}
	cfg, _ := api.LoadAuthConfig()
	if cfg == nil {
		cfg = &api.AuthConfig{}
	}
	cfg.Auth.Token = token
	cfg.Auth.TokenType = "api"
	cfg.Auth.ExpiresAt = 0 // API tokens don't expire
	if err := api.SaveAuthConfig(cfg); err != nil {
		return fmt.Errorf("save config: %w", err)
	}
	output.Successf("authenticated with API token")
	return nil
}

func loginWithBrowser() error {
	state := randomState()
	port := 9876
	callback := "http://localhost:" + strconv.Itoa(port) + "/callback"

	webURL := getWebURL()
	authURL := webURL + "/cli-auth?state=" + state + "&callback=" + callback

	output.Infof("opening browser for authentication...")
	output.Infof("if it doesn't open, visit: %s", authURL)

	if err := openBrowser(authURL); err != nil {
		output.Warningf("could not open browser automatically: %v", err)
	}

	resultCh := make(chan loginResult, 1)
	server := &http.Server{
		Addr: ":" + strconv.Itoa(port),
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if q.Get("state") != state {
			http.Error(w, "invalid state", http.StatusBadRequest)
			resultCh <- loginResult{err: fmt.Errorf("CSRF state mismatch")}
			return
		}
		result := loginResult{
			token:     q.Get("token"),
			userID:    q.Get("userId"),
			email:     q.Get("email"),
			sessionID: q.Get("sessionId"),
		}
		fmt.Fprint(w, "<html><body><h1>Authenticated</h1><p>You can close this window.</p></body></html>")
		resultCh <- result
	})
	server.Handler = mux

	go func() {
		_ = server.ListenAndServe()
	}()

	select {
	case result := <-resultCh:
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = server.Shutdown(ctx)

		if result.err != nil {
			return result.err
		}
		if result.token == "" {
			return fmt.Errorf("did not receive token")
		}

		cfg, _ := api.LoadAuthConfig()
		if cfg == nil {
			cfg = &api.AuthConfig{}
		}
		cfg.Auth.Token = result.token
		cfg.Auth.TokenType = "clerk"
		cfg.Auth.UserID = result.userID
		cfg.Auth.Email = result.email
		cfg.Auth.SessionID = result.sessionID
		cfg.Auth.ExpiresAt = float64(time.Now().Add(24 * time.Hour).UnixMilli())
		if err := api.SaveAuthConfig(cfg); err != nil {
			return fmt.Errorf("save config: %w", err)
		}

		output.Successf("authenticated as %s", result.email)
		return nil

	case <-time.After(5 * time.Minute):
		_ = server.Shutdown(context.Background())
		return fmt.Errorf("authentication timed out after 5 minutes")
	}
}

type loginResult struct {
	token     string
	userID    string
	email     string
	sessionID string
	err       error
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func openBrowser(url string) error {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	default:
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

func getWebURL() string {
	if u := os.Getenv("LTF_WEB_URL"); u != "" {
		return u
	}
	if u := os.Getenv("WEB_APP_URL"); u != "" {
		return u
	}
	if os.Getenv("NODE_ENV") == "development" {
		return "http://localhost:3000"
	}
	return "https://ltf1.dev"
}
