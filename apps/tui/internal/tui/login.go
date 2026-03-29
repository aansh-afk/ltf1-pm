package tui

import (
	"crypto/rand"
	"encoding/hex"
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

// WorldMapArt is set by main.go from the embedded file
var WorldMapArt string

type LoginState int

const (
	LoginIdle LoginState = iota
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

// centerLine pads a string to be centered within the given width
func centerLine(s string, width int) string {
	visible := lipgloss.Width(s)
	if visible >= width {
		return s
	}
	pad := (width - visible) / 2
	return strings.Repeat(" ", pad) + s
}

// renderLoginScreen builds the login view with NO lipgloss.Place (avoids white padding)
func renderLoginScreen(state LoginState, errMsg string, width, height int) string {
	var lines []string

	// Scale world map to fit — take center portion, downsample if needed
	if WorldMapArt != "" {
		mapLines := strings.Split(WorldMapArt, "\n")

		// Vertical: take center portion if too tall
		maxMapH := height / 3
		if maxMapH < 10 {
			maxMapH = 10
		}
		if len(mapLines) > maxMapH {
			start := (len(mapLines) - maxMapH) / 2
			mapLines = mapLines[start : start+maxMapH]
		}

		// Horizontal: take every Nth char to fit width, center crop
		mapWidth := 0
		for _, l := range mapLines {
			if len(l) > mapWidth {
				mapWidth = len(l)
			}
		}

		targetW := width - 8
		if targetW < 40 {
			targetW = 40
		}

		if mapWidth > targetW {
			// Center crop each line
			for _, l := range mapLines {
				if len(l) > targetW {
					start := (len(l) - targetW) / 2
					l = l[start : start+targetW]
				}
				lines = append(lines, centerLine(theme.LoginMapStyle.Render(l), width))
			}
		} else {
			for _, l := range mapLines {
				lines = append(lines, centerLine(theme.LoginMapStyle.Render(l), width))
			}
		}
	}

	lines = append(lines, "")

	// Logo
	logo := theme.BrandTextStyle.Render("ltf1")
	lines = append(lines, centerLine(logo, width))

	// Subtitle
	sub := theme.SubtitleTextStyle.Render("Legion Task Framework")
	lines = append(lines, centerLine(sub, width))
	lines = append(lines, "")
	lines = append(lines, "")

	// Status
	var statusLine string
	switch state {
	case LoginIdle:
		key := theme.AccentTextStyle.Render("Enter")
		statusLine = theme.TextSecondaryStyle.Render("Press ") + key + theme.TextSecondaryStyle.Render(" to authenticate")
	case LoginWaiting:
		statusLine = theme.WarningTextStyle.Render(theme.SymDot + " Waiting for browser...")
	case LoginSuccess:
		statusLine = theme.SuccessTextStyle.Render(theme.SymCheck + " Authenticated")
	case LoginError:
		statusLine = theme.ErrorTextStyle.Render(theme.SymCross + " " + errMsg)
	}
	lines = append(lines, centerLine(statusLine, width))

	if state == LoginError {
		lines = append(lines, "")
		retry := theme.TextDimStyle.Render("Press Enter to retry")
		lines = append(lines, centerLine(retry, width))
	}

	lines = append(lines, "")
	lines = append(lines, "")

	// Bottom
	bottom := theme.TextDimStyle.Render("v0.8.0    [q] quit")
	lines = append(lines, centerLine(bottom, width))

	// Calculate vertical centering
	contentHeight := len(lines)
	topPad := (height - contentHeight) / 2
	if topPad < 0 {
		topPad = 0
	}
	bottomPad := height - contentHeight - topPad
	if bottomPad < 0 {
		bottomPad = 0
	}

	// Build final output — just newlines for padding, no lipgloss.Place
	var out strings.Builder
	for i := 0; i < topPad; i++ {
		out.WriteString("\n")
	}
	out.WriteString(strings.Join(lines, "\n"))
	for i := 0; i < bottomPad; i++ {
		out.WriteString("\n")
	}

	return out.String()
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
		authURL := fmt.Sprintf("%s/cli-auth?state=%s&callback=%s",
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

	// Preserve existing context (workspace/project) if re-authenticating.
	existing, err := api.LoadAuthConfig()
	if err == nil && existing != nil {
		config.Context = existing.Context
	}

	return api.SaveAuthConfig(config)
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
