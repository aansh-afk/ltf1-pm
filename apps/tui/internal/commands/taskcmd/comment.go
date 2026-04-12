package taskcmd

import (
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newCommentCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "comment <id> [message]",
		Short: "Add a comment to a task",
		Args:  cobra.MinimumNArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			content := strings.Join(args[1:], " ")
			if _, err := client.Mutation("comments/mutations:createComment", map[string]any{
				"taskId":  args[0],
				"content": content,
			}); err != nil {
				return err
			}
			output.Successf("comment added")
			return nil
		},
	}
	return cmd
}
