package main

import (
	_ "embed"
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui"
)

//go:embed worldmap.txt
var worldMap string

func main() {
	// Set world map for login screen
	tui.WorldMapArt = worldMap

	// Load auth config (non-fatal)
	config, _ := api.LoadAuthConfig()

	// Create Convex client only if authenticated
	var client *api.ConvexClient
	if config != nil && api.IsAuthenticated(config) {
		client = api.NewClient("", api.GetToken(config))
	}

	m := tui.NewModel(client, config)
	p := tea.NewProgram(m)
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
