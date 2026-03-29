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

type LoginState int

const (
	LoginIdle    LoginState = iota
	LoginWaiting
	LoginSuccess
	LoginError
)

type AuthResult struct {
	Config *api.AuthConfig
	Err    error
}

const authPort = 9876
const webAppURL = "https://ltf1.dev"

// Compact world map — fits ~76 chars wide, subtle dot pattern
var worldMap = `        .  .       .           .       .      .        .
    . .:::::.   .:::::.     . .:::.       .        .
  .::::::::: .::::::::::. .::::::::.          .  .
 :::::::::::::::::::::::::::::::::::::.   .:::.
 :::::::::::::::::::::::::::::::::::::::::::::::
 ::::::::::::::::::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::::
   :::::::::::::::::::::::::::::::::::::::::::::
    ::::::::: .:::::::::::::::::::::::::::::::.
      ::::::    :::::::::::::::::::::::::::::
        ::::      ::::::::::::::::::::::::::
         :::       ::::::::::::::::::::::::
          ::         :::::::::::::::::::::
           :          .:::::::::::::::::.
                        ::::::::::::::
                         ::::::::::::
                          ::::::::::
                           ::::::::
                            ::::::
                             ::::
                              ::`

func renderLoginScreen(state LoginState, errMsg string, width, height int) string {
	// World map — very dim, barely visible texture
	dimMap := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#181818")).
		Render(worldMap)

	// Clean text logo
	logo := lipgloss.NewStyle().
		Foreground(theme.TextPrimary).
		Bold(true).
		Render("ltf1")

	// Subtitle
	subtitle := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Render("Legion Task Framework")

	// Status
	var statusLine string
	switch state {
	case LoginIdle:
		key := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("Enter")
		statusLine = lipgloss.NewStyle().Foreground(theme.TextSecondary).Render("Press ") + key + lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(" to authenticate")
	case LoginWaiting:
		statusLine = lipgloss.NewStyle().Foreground(theme.Amber).Render(theme.SymDot + " Waiting for browser...")
	case LoginSuccess:
		statusLine = lipgloss.NewStyle().Foreground(theme.Green).Render(theme.SymCheck + " Authenticated")
	case LoginError:
		statusLine = lipgloss.NewStyle().Foreground(theme.Red).Render(theme.SymCross+" "+errMsg) +
			"\n\n" + lipgloss.NewStyle().Foreground(theme.TextDim).Render("Press Enter to retry")
	}

	// Bottom
	bottom := lipgloss.NewStyle().Foreground(theme.TextDim).Render("v0.8.0") +
		"    " +
		lipgloss.NewStyle().Foreground(theme.TextDim).Render("[q] quit")

	// Stack: world map as background texture, then logo + auth below
	block := strings.Join([]string{
		dimMap,
		"",
		logo,
		subtitle,
		"",
		"",
		statusLine,
		"",
		"",
		bottom,
	}, "\n")

	return lipgloss.Place(width, height, lipgloss.Center, lipgloss.Center, block)
}

// --- OAuth flow ---

func startOAuthFlow() tea.Cmd {
	return func() tea.Msg {
		stateBytes := make([]byte, 32)
		if _, err := rand.Read(stateBytes); err != nil {
			return AuthResult{Err: fmt.Errorf("failed to generate state: %w", err)}
		}
		csrfState := hex.EncodeToString(stateBytes)
		resultCh := make(chan AuthResult, 1)

		mux := http.NewServeMux()
		server := &http.Server{Addr: fmt.Sprintf(":%d", authPort), Handler: mux}

		mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
			q := r.URL.Query()
			if q.Get("state") != csrfState {
				w.WriteHeader(403)
				return
			}
			if errStr := q.Get("error"); errStr != "" {
				resultCh <- AuthResult{Err: fmt.Errorf("%s", errStr)}
				return
			}
			token := q.Get("token")
			if token == "" {
				resultCh <- AuthResult{Err: fmt.Errorf("no token received")}
				return
			}

			config := &api.AuthConfig{
				Auth: api.AuthInfo{
					Token: token, TokenType: "clerk",
					UserID: q.Get("userId"), Email: q.Get("email"),
					SessionID: q.Get("sessionId"),
					ExpiresAt: float64(time.Now().Add(7 * 24 * time.Hour).UnixMilli()),
				},
			}
			saveAuthConfig(config)

			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(200)
			fmt.Fprint(w, `<!DOCTYPE html><html><head><title>LTF1</title><style>*{margin:0;padding:0}body{background:#0A0A0A;color:#F9FAFB;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh}.c{text-align:center}h1{margin:.5rem 0}p{color:#9CA3AF}</style></head><body><div class="c"><h1>Authenticated</h1><p>Return to terminal.</p></div></body></html>`)
			resultCh <- AuthResult{Config: config}
		})

		go server.ListenAndServe()

		callbackURL := fmt.Sprintf("http://localhost:%d/callback", authPort)
		authURL := fmt.Sprintf("%s/cli-auth?state=%s&redirectUri=%s",
			webAppURL, url.QueryEscape(csrfState), url.QueryEscape(callbackURL))
		openBrowser(authURL)

		select {
		case result := <-resultCh:
			server.Close()
			return result
		case <-time.After(5 * time.Minute):
			server.Close()
			return AuthResult{Err: fmt.Errorf("timed out")}
		}
	}
}

func saveAuthConfig(config *api.AuthConfig) error {
	path := api.GetConfigPath()
	if path == "" {
		return fmt.Errorf("no config path")
	}
	dir := path[:strings.LastIndex(path, "/")]
	os.MkdirAll(dir, 0755)
	data, _ := json.MarshalIndent(config, "", "  ")
	return os.WriteFile(path, data, 0600)
}

func openBrowser(u string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", u)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", u)
	default:
		cmd = exec.Command("xdg-open", u)
	}
	cmd.Start()
}
