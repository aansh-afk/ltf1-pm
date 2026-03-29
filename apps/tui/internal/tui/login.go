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
	LoginIdle    LoginState = iota
	LoginWaiting
	LoginSuccess
	LoginError
)

// AuthResult is sent when OAuth callback is received
type AuthResult struct {
	Config *api.AuthConfig
	Err    error
}

const authPort = 9876
const webAppURL = "https://ltf1.dev"

// World map ASCII art
var worldMap = `
            . _..::__:  ,-"-"._       |7       ,     _,.__
    _.___ _ _<_>'   _googl.ern  .'    ||  _._'_     _._   _
>.{     " " ,-::.._/..--"";_   |, _2(17)8-2_|8)1.  _2(googl..ern
_googl_ern_/..googl  .- .-. (.googl  '\googl  _,googl  _.googl
/googl.,googl  ,googl  (\googl  \googl  |googl  |googl
`

// Simplified clean world map
var worldMapClean = `
                  ,.   ,,  .       .                           .
             ,,   '*,  .'*,   ,   ,                          .
        _,  / '-,,   ''., '*'     '                     .
    .-'' '-, '-.  '-.    '. *.   ,.       .    .
  ,'  _,,..  '-.'.   '-.   '. ,:'    *        .
 / ,-'     '-.  '-.    '-.  ,*'  .        .        .
| /           '.   '.    .** .        .
 \|     __      '.   *. .*       .            .
  \   ,'  '-.     *. .**    .         .
   | /       '.   .***' .        .              .
   |/         |  .**       .            .
    \         / .**   .          .                  .
     '-.___.-' **         .             .
              **    .           .                .
`

// Clean LTF1 logo
var logo = `
 ██       ████████ ███████ ██
 ██          ██    ██      ██
 ██          ██    █████   ██
 ██          ██    ██      ██
 ███████     ██    ██      ██`

// renderLoginScreen renders the full login screen with dark background
func renderLoginScreen(state LoginState, errMsg string, width, height int) string {
	// World map in very dim color as background texture
	mapStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#1A1A1A"))
	renderedMap := mapStyle.Render(worldMapClean)

	// Logo in bold white
	logoStyle := lipgloss.NewStyle().
		Foreground(theme.TextPrimary).
		Bold(true)
	renderedLogo := logoStyle.Render(logo)

	// Subtitle
	subtitle := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Render("Legion Task Framework")

	// Version
	ver := lipgloss.NewStyle().
		Foreground(theme.TextDim).
		Render("v0.8.0")

	// Status message based on state
	var statusMsg string
	switch state {
	case LoginIdle:
		enter := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("[Enter]")
		statusMsg = enter + lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(" to authenticate via browser")
	case LoginWaiting:
		statusMsg = lipgloss.NewStyle().Foreground(theme.Amber).Render(theme.SymDot + " Opening browser... waiting for authentication")
	case LoginSuccess:
		statusMsg = lipgloss.NewStyle().Foreground(theme.Green).Render(theme.SymCheck + " Authenticated successfully")
	case LoginError:
		errText := lipgloss.NewStyle().Foreground(theme.Red).Render(theme.SymCross + " " + errMsg)
		retry := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  Press [Enter] to retry")
		statusMsg = errText + "\n" + retry
	}

	// Quit hint
	quitHint := lipgloss.NewStyle().
		Foreground(theme.TextDim).
		Render("[q] quit")

	// Compose content vertically
	content := strings.Join([]string{
		"",
		renderedMap,
		"",
		renderedLogo,
		"",
		subtitle + "  " + ver,
		"",
		"",
		statusMsg,
		"",
		quitHint,
	}, "\n")

	// Center content in the full terminal
	centered := lipgloss.Place(width, height, lipgloss.Center, lipgloss.Center, content)

	// Fill entire screen with dark background
	fullScreen := lipgloss.NewStyle().
		Width(width).
		Height(height).
		Background(theme.BgBase)

	return fullScreen.Render(centered)
}

// startOAuthFlow generates CSRF state, opens browser, starts callback server
func startOAuthFlow() tea.Cmd {
	return func() tea.Msg {
		stateBytes := make([]byte, 32)
		if _, err := rand.Read(stateBytes); err != nil {
			return AuthResult{Err: fmt.Errorf("failed to generate state: %w", err)}
		}
		csrfState := hex.EncodeToString(stateBytes)

		resultCh := make(chan AuthResult, 1)

		mux := http.NewServeMux()
		server := &http.Server{
			Addr:    fmt.Sprintf(":%d", authPort),
			Handler: mux,
		}

		mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
			q := r.URL.Query()

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

			if err := saveAuthConfig(config); err != nil {
				w.WriteHeader(500)
				fmt.Fprint(w, "Failed to save config")
				resultCh <- AuthResult{Err: fmt.Errorf("failed to save: %w", err)}
				return
			}

			// Success HTML page
			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(200)
			fmt.Fprint(w, `<!DOCTYPE html><html><head><title>LTF1</title>
				<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0A0A0A;color:#F9FAFB;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
				.card{text-align:center;padding:3rem}.icon{color:#22C55E;font-size:4rem;margin-bottom:1rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#9CA3AF;font-size:.875rem}</style></head>
				<body><div class="card"><div class="icon">`+theme.SymCheck+`</div><h1>Authenticated</h1><p>Return to your terminal.</p></div></body></html>`)

			resultCh <- AuthResult{Config: config}
		})

		go func() {
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				resultCh <- AuthResult{Err: fmt.Errorf("callback server: %w", err)}
			}
		}()

		callbackURL := fmt.Sprintf("http://localhost:%d/callback", authPort)
		authURL := fmt.Sprintf("%s/cli-auth?state=%s&redirectUri=%s",
			webAppURL,
			url.QueryEscape(csrfState),
			url.QueryEscape(callbackURL),
		)

		openBrowser(authURL)

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

func saveAuthConfig(config *api.AuthConfig) error {
	path := api.GetConfigPath()
	if path == "" {
		return fmt.Errorf("could not determine config path")
	}

	dir := path[:strings.LastIndex(path, "/")]
	os.MkdirAll(dir, 0755)

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

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
