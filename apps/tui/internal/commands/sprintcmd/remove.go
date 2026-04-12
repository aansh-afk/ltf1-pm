package sprintcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newRemoveCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "remove <task-id>",
		Aliases: []string{"rm"},
		Short:   "Remove task from sprint",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			if _, err := client.Mutation("sprints/mutations:removeTaskFromSprint", map[string]any{
				"taskId": args[0],
			}); err != nil {
				return err
			}
			output.Successf("removed from sprint")
			return nil
		},
	}
	return cmd
}
