package sprintcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newCloseCmd() *cobra.Command {
	var force bool
	cmd := &cobra.Command{
		Use:   "close [sprint-id]",
		Short: "Close a sprint",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			var sprintID string
			if len(args) == 1 {
				sprintID = args[0]
			} else {
				raw, err := client.Query("sprints/queries:getCurrentSprint", map[string]any{"projectId": cfg.Context.ProjectID})
				if err != nil {
					return err
				}
				var sprint map[string]any
				if err := unmarshalAny(raw, &sprint); err != nil {
					return err
				}
				if sprint == nil {
					return fmt.Errorf("no active sprint")
				}
				sprintID = asString(sprint["_id"])
			}
			if !force {
				return fmt.Errorf("pass --force to confirm")
			}
			if _, err := client.Mutation("sprints/mutations:updateSprint", map[string]any{
				"sprintId": sprintID,
				"status":   "completed",
			}); err != nil {
				return err
			}
			output.Successf("sprint closed")
			return nil
		},
	}
	cmd.Flags().BoolVar(&force, "force", false, "skip confirmation")
	return cmd
}
