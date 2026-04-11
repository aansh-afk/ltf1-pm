package taskcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newDeleteCmd() *cobra.Command {
	var force bool
	cmd := &cobra.Command{
		Use:     "delete <id>",
		Aliases: []string{"rm"},
		Short:   "Delete a task",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if !force {
				return fmt.Errorf("pass --force to confirm deletion")
			}
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			if _, err := client.Mutation("tasks/mutations:deleteTask", map[string]any{"taskId": args[0]}); err != nil {
				return err
			}
			output.Successf("deleted task")
			return nil
		},
	}
	cmd.Flags().BoolVarP(&force, "force", "f", false, "skip confirmation")
	return cmd
}
