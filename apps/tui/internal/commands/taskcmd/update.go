package taskcmd

import (
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newUpdateCmd() *cobra.Command {
	var (
		title       string
		description string
		status      string
		priority    string
		taskType    string
		labels      string
		estimate    float64
		dueDate     string
		clearDue    bool
		jsonOut     bool
	)
	cmd := &cobra.Command{
		Use:     "update <id>",
		Aliases: []string{"edit"},
		Short:   "Update a task",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}

			callArgs := map[string]any{"taskId": args[0]}
			if title != "" {
				callArgs["title"] = title
			}
			if description != "" {
				callArgs["description"] = description
			}
			if status != "" {
				callArgs["status"] = status
			}
			if priority != "" {
				callArgs["priority"] = priority
			}
			if taskType != "" {
				callArgs["type"] = taskType
			}
			if labels != "" {
				callArgs["labels"] = strings.Split(labels, ",")
			}
			if estimate > 0 {
				callArgs["estimate"] = estimate
			}

			if _, err := client.Mutation("tasks/mutations:updateTask", callArgs); err != nil {
				return err
			}

			if jsonOut {
				return output.JSON(map[string]string{"taskId": args[0]})
			}
			output.Successf("updated task")
			return nil
		},
	}
	cmd.Flags().StringVar(&title, "title", "", "new title")
	cmd.Flags().StringVarP(&description, "description", "d", "", "new description")
	cmd.Flags().StringVarP(&status, "status", "s", "", "new status")
	cmd.Flags().StringVarP(&priority, "priority", "p", "", "new priority")
	cmd.Flags().StringVarP(&taskType, "type", "t", "", "new type")
	cmd.Flags().StringVarP(&labels, "labels", "l", "", "comma-separated labels")
	cmd.Flags().Float64VarP(&estimate, "estimate", "e", 0, "estimate")
	cmd.Flags().StringVar(&dueDate, "due-date", "", "due date (YYYY-MM-DD)")
	cmd.Flags().BoolVar(&clearDue, "clear-due-date", false, "clear due date")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
