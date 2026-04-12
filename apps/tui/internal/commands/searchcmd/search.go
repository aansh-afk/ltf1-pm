// Package searchcmd implements the `ltf1 search` command.
package searchcmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	var (
		entityType string
		limit      int
		jsonOut    bool
	)
	cmd := &cobra.Command{
		Use:   "search <query>",
		Short: "Global search across tasks, projects, sprints",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil {
				return fmt.Errorf("not authenticated")
			}
			url := api.GetConvexURL(cfg)
			if url == "" {
				return fmt.Errorf("CONVEX_URL not set")
			}
			client := api.NewClient(url, cfg)

			query := strings.Join(args, " ")
			callArgs := map[string]any{"query": query, "limit": limit}
			if entityType != "" {
				callArgs["type"] = entityType
			}
			raw, err := client.Query("search:globalSearch", callArgs)
			if err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(raw)
			}
			output.Header("Search Results")
			fmt.Println(string(raw))
			return nil
		},
	}
	cmd.Flags().StringVarP(&entityType, "type", "t", "", "filter by entity type")
	cmd.Flags().IntVarP(&limit, "limit", "l", 20, "max results")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
