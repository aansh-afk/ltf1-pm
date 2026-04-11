package sprintcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newAddCmd() *cobra.Command {
	var sprintID string
	cmd := &cobra.Command{
		Use:   "add <task-id>",
		Short: "Add task to sprint",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			target := sprintID
			if target == "" {
				// Get current active sprint
				raw, err := client.Query("sprints/queries:getCurrentSprint", map[string]any{"projectId": cfg.Context.ProjectID})
				if err != nil {
					return err
				}
				var sprint map[string]any
				if err := unmarshalAny(raw, &sprint); err != nil {
					return err
				}
				if sprint == nil {
					return fmt.Errorf("no active sprint. Specify --sprint <id>")
				}
				target = asString(sprint["_id"])
			}
			if _, err := client.Mutation("sprints/mutations:addTasksToSprint", map[string]any{
				"sprintId": target,
				"taskIds":  []string{args[0]},
			}); err != nil {
				return err
			}
			output.Successf("added to sprint")
			return nil
		},
	}
	cmd.Flags().StringVar(&sprintID, "sprint", "", "sprint ID (defaults to active)")
	return cmd
}

func unmarshalAny(raw []byte, v any) error {
	if len(raw) == 0 || string(raw) == "null" {
		return nil
	}
	return jsonUnmarshal(raw, v)
}
