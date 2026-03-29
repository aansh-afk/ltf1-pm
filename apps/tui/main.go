package main

import (
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui"
)

func main() {
	// Load auth config (non-fatal — TUI shows empty states if missing)
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
