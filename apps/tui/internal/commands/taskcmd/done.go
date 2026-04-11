package taskcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newDoneCmd() *cobra.Command {
	return &cobra.Command{
		Use:     "done <id>",
		Aliases: []string{"complete", "finish"},
		Short:   "Mark task as done",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			if _, err := client.Mutation("tasks/mutations:updateTask", map[string]any{
				"taskId": args[0],
				"status": "done",
			}); err != nil {
				return err
			}
			output.Successf("marked done")
			return nil
		},
	}
}
