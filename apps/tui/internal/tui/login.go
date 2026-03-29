package tui

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// LoginState tracks the login flow
type LoginState int

const (
	LoginIdle       LoginState = iota // Show welcome, waiting for Enter
	LoginWaiting                      // Browser opened, waiting for callback
	LoginSuccess                      // Auth received, transitioning
	LoginError                        // Auth failed
)

// AuthResult is sent when OAuth callback is received
type AuthResult struct {
	Config *api.AuthConfig
	Err    error
}

const authPort = 9876
const webAppURL = "https://ltf1.dev"

// ASCII art logo
var logo = `
  ██       ████████ ███████  ██
  ██          ██    ██       ███
  ██          ██    █████     ██
  ██          ██    ██        ██
  ███████     ██    ██        ██
`

// renderLoginScreen renders the full login screen
func renderLoginScreen(state LoginState, errMsg string, width, height int) string {
	// Logo
	logoStyle := lipgloss.NewStyle().
		Foreground(theme.TextPrimary).
		Bold(true)
	renderedLogo := logoStyle.Render(logo)

	// Subtitle
	subtitle := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Render("Legion Task Framework")

	// Status message based on state
	var statusMsg string
	switch state {
	case LoginIdle:
		enter := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("[Enter]")
		statusMsg = enter + lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(" to authenticate via browser")
	case LoginWaiting:
		statusMsg = lipgloss.NewStyle().Foreground(theme.Amber).Render(theme.SymDot+" Waiting for browser authentication...")
	case LoginSuccess:
		statusMsg = lipgloss.NewStyle().Foreground(theme.Green).Render(theme.SymCheck+" Authenticated successfully")
	case LoginError:
		statusMsg = lipgloss.NewStyle().Foreground(theme.Red).Render(theme.SymCross+" "+errMsg)
	}

	// Quit hint
	quitHint := lipgloss.NewStyle().
		Foreground(theme.TextDim).
		Render("[q] quit")

	// Compose vertically
	content := strings.Join([]string{
		renderedLogo,
		"",
		subtitle,
		"",
		"",
		statusMsg,
		"",
		"",
		quitHint,
	}, "\n")

	// Center everything
	return lipgloss.Place(width, height, lipgloss.Center, lipgloss.Center, content)
}

// startOAuthFlow generates CSRF state, opens browser, starts callback server
func startOAuthFlow() tea.Cmd {
	return func() tea.Msg {
		// Generate CSRF state
		stateBytes := make([]byte, 32)
		if _, err := rand.Read(stateBytes); err != nil {
			return AuthResult{Err: fmt.Errorf("failed to generate state: %w", err)}
		}
		csrfState := hex.EncodeToString(stateBytes)

		// Result channel
		resultCh := make(chan AuthResult, 1)

		// Start callback server
		mux := http.NewServeMux()
		server := &http.Server{
			Addr:    fmt.Sprintf(":%d", authPort),
			Handler: mux,
		}

		mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
			q := r.URL.Query()

			// Verify CSRF
			if q.Get("state") != csrfState {
				w.WriteHeader(403)
				fmt.Fprint(w, "Invalid state")
				return
			}

			if errStr := q.Get("error"); errStr != "" {
				w.WriteHeader(400)
				fmt.Fprintf(w, "Auth error: %s", errStr)
				resultCh <- AuthResult{Err: fmt.Errorf("%s", errStr)}
				return
			}

			token := q.Get("token")
			if token == "" {
				w.WriteHeader(400)
				fmt.Fprint(w, "No token received")
				resultCh <- AuthResult{Err: fmt.Errorf("no token received")}
				return
			}

			// Build config
			config := &api.AuthConfig{
				Auth: api.AuthInfo{
					Token:     token,
					TokenType: "clerk",
					UserID:    q.Get("userId"),
					Email:     q.Get("email"),
					SessionID: q.Get("sessionId"),
					ExpiresAt: float64(time.Now().Add(7 * 24 * time.Hour).UnixMilli()),
				},
			}

			// Save to config file
			if err := saveAuthConfig(config); err != nil {
				w.WriteHeader(500)
				fmt.Fprint(w, "Failed to save config")
				resultCh <- AuthResult{Err: fmt.Errorf("failed to save: %w", err)}
				return
			}

			// Success page
			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(200)
			fmt.Fprint(w, `<!DOCTYPE html><html><head><title>LTF1</title>
				<style>body{background:#0A0A0A;color:#F9FAFB;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
				.card{text-align:center;padding:2rem}.check{color:#22C55E;font-size:3rem}h1{margin:1rem 0 .5rem}p{color:#9CA3AF}</style></head>
				<body><div class="card"><div class="check">`+theme.SymCheck+`</div><h1>Authenticated</h1><p>You can close this window and return to the terminal.</p></div></body></html>`)

			resultCh <- AuthResult{Config: config}
		})

		// Start server in background
		go func() {
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				resultCh <- AuthResult{Err: fmt.Errorf("callback server: %w", err)}
			}
		}()

		// Build auth URL
		callbackURL := fmt.Sprintf("http://localhost:%d/callback", authPort)
		authURL := fmt.Sprintf("%s/cli-auth?state=%s&redirectUri=%s",
			webAppURL,
			url.QueryEscape(csrfState),
			url.QueryEscape(callbackURL),
		)

		// Open browser
		openBrowser(authURL)

		// Wait for result (with timeout)
		select {
		case result := <-resultCh:
			server.Close()
			return result
		case <-time.After(5 * time.Minute):
			server.Close()
			return AuthResult{Err: fmt.Errorf("authentication timed out (5 minutes)")}
		}
	}
}

// saveAuthConfig writes the config to disk
func saveAuthConfig(config *api.AuthConfig) error {
	path := api.GetConfigPath()
	if path == "" {
		return fmt.Errorf("could not determine config path")
	}

	// Ensure directory exists
	dir := path[:strings.LastIndex(path, "/")]
	os.MkdirAll(dir, 0755)

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

// openBrowser opens a URL in the default browser
func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}
