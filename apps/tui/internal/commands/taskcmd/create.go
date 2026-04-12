package taskcmd

import (
	"encoding/json"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newCreateCmd() *cobra.Command {
	var (
		description string
		taskType    string
		priority    string
		labels      string
		estimate    float64
		dueDate     string
		assign      string
		jsonOut     bool
	)
	cmd := &cobra.Command{
		Use:     "create <title>",
		Aliases: []string{"new", "add"},
		Short:   "Create a new task",
		Args:    cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}

			title := strings.Join(args, " ")
			callArgs := map[string]any{
				"projectId": cfg.Context.ProjectID,
				"title":     title,
				"type":      defaultIfEmpty(taskType, "task"),
			}
			if description != "" {
				callArgs["description"] = description
			}
			if priority != "" {
				callArgs["priority"] = priority
			}
			if labels != "" {
				callArgs["labels"] = strings.Split(labels, ",")
			}
			if estimate > 0 {
				callArgs["estimate"] = estimate
			}
			if assign != "" {
				callArgs["assigneeIds"] = []string{assign}
			}

			raw, err := client.Mutation("tasks/mutations:createTask", callArgs)
			if err != nil {
				return err
			}

			var taskID string
			_ = json.Unmarshal(raw, &taskID)

			if jsonOut {
				return output.JSON(map[string]string{"taskId": taskID})
			}
			output.Successf("created task: %s", title)
			return nil
		},
	}
	cmd.Flags().StringVarP(&description, "description", "d", "", "task description")
	cmd.Flags().StringVarP(&taskType, "type", "t", "", "task type (feature/bug/improvement/task/epic)")
	cmd.Flags().StringVarP(&priority, "priority", "p", "", "priority (urgent/high/medium/low)")
	cmd.Flags().StringVarP(&labels, "labels", "l", "", "comma-separated labels")
	cmd.Flags().Float64VarP(&estimate, "estimate", "e", 0, "story point estimate")
	cmd.Flags().StringVar(&dueDate, "due-date", "", "due date (YYYY-MM-DD)")
	cmd.Flags().StringVar(&assign, "assign", "", "assign to user ID")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func defaultIfEmpty(s, def string) string {
	if s == "" {
		return def
	}
	return s
}
