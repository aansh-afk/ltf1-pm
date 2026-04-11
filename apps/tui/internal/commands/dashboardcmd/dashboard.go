// Package dashboardcmd implements the `ltf1 dashboard` command, which launches the TUI.
package dashboardcmd

import (
	_ "embed"
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui"
)

//go:embed worldmap.txt
var worldMap string

// NewCommand returns the `dashboard` command.
func NewCommand(getDefaultConvexURL func() string) *cobra.Command {
	return &cobra.Command{
		Use:     "dashboard",
		Aliases: []string{"d", "tui"},
		Short:   "Launch the interactive TUI dashboard",
		RunE: func(cmd *cobra.Command, args []string) error {
			return Launch(getDefaultConvexURL())
		},
	}
}

// Launch starts the Bubble Tea TUI program.
func Launch(defaultConvexURL string) error {
	if defaultConvexURL != "" && os.Getenv("CONVEX_URL") == "" && os.Getenv("VITE_CONVEX_URL") == "" {
		os.Setenv("CONVEX_URL", defaultConvexURL)
	}

	tui.WorldMapArt = worldMap

	config, _ := api.LoadAuthConfig()

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
		return fmt.Errorf("tui error: %w", err)
	}
	return nil
}
