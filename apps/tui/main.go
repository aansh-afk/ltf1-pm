package main

import (
	"bufio"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui"
)

//go:embed worldmap.txt
var worldMap string

// defaultConvexURL is set at build time via:
//
//	go build -ldflags "-X main.defaultConvexURL=https://your-deployment.convex.cloud"
//
// For published binaries this points to the production Convex deployment.
// For dev builds it can be left empty (reads from .env or CONVEX_URL env var).
var defaultConvexURL string

func main() {
	// Load .env from working directory (non-fatal)
	loadDotenv(".env")

	// Also try loading .env from the user's home directory
	if home, err := os.UserHomeDir(); err == nil {
		loadDotenv(filepath.Join(home, ".ltf1.env"))
	}

	// If build-time URL was set and no env var overrides it, use it
	if defaultConvexURL != "" && os.Getenv("CONVEX_URL") == "" && os.Getenv("VITE_CONVEX_URL") == "" {
		os.Setenv("CONVEX_URL", defaultConvexURL)
	}

	// Set world map for login screen
	tui.WorldMapArt = worldMap

	// Load auth config (non-fatal)
	config, _ := api.LoadAuthConfig()

	// Create Convex client only if authenticated
	var client *api.ConvexClient
	if config != nil && api.HasUsableAuth(config) {
		convexURL := api.GetConvexURL(config)
		if convexURL != "" {
			client = api.NewClient(convexURL, config)
		}
	}

	m := tui.NewModel(client, config)
	p := tea.NewProgram(m)
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

// loadDotenv reads a .env file and sets env vars that aren't already set.
func loadDotenv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
}
