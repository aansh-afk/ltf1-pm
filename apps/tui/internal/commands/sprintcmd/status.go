package sprintcmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStatusCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "status",
		Aliases: []string{"st"},
		Short:   "Show current active sprint",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			raw, err := client.Query("sprints/queries:getCurrentSprint", map[string]any{"projectId": cfg.Context.ProjectID})
			if err != nil {
				return err
			}
			var sprint map[string]any
			if err := json.Unmarshal(raw, &sprint); err != nil {
				return err
			}
			if sprint == nil {
				output.Infof("no active sprint")
				return nil
			}
			if jsonOut {
				return output.JSON(sprint)
			}
			output.Header("Current Sprint")
			fmt.Printf("Name:         %s\n", asString(sprint["name"]))
			fmt.Printf("Goal:         %s\n", asString(sprint["goal"]))
			fmt.Printf("Status:       %s\n", asString(sprint["status"]))
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func asString(v any) string {
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}
