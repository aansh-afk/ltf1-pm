package taskcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newAssignCmd() *cobra.Command {
	var (
		to    string
		clear bool
	)
	cmd := &cobra.Command{
		Use:   "assign <id>",
		Short: "Assign task to user",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			callArgs := map[string]any{"taskId": args[0]}
			if clear {
				callArgs["assigneeIds"] = []string{}
			} else if to == "me" {
				convexID, err := resolveCurrentUserID(client)
				if err != nil {
					return err
				}
				callArgs["assigneeIds"] = []string{convexID}
			} else if to != "" {
				callArgs["assigneeIds"] = []string{to}
			}
			if _, err := client.Mutation("tasks/mutations:updateTask", callArgs); err != nil {
				return err
			}
			output.Successf("updated assignment")
			return nil
		},
	}
	cmd.Flags().StringVar(&to, "to", "", "user ID or 'me'")
	cmd.Flags().BoolVar(&clear, "clear", false, "clear all assignees")
	return cmd
}
