package main

import (
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/app"
)

func main() {
	// Load auth config (non-fatal if missing)
	config, err := api.LoadAuthConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not load auth config: %v\n", err)
		fmt.Fprintf(os.Stderr, "Run 'ltf auth login' to authenticate.\n")
	}

	// Create Convex client
	var client *api.ConvexClient
	if config != nil && api.IsAuthenticated(config) {
		client = api.NewClient("", api.GetToken(config))
	} else {
		client = api.NewClient("", "")
	}

	// Create the app model
	model := app.New(client, config)

	// Run the program
	p := tea.NewProgram(model)
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
