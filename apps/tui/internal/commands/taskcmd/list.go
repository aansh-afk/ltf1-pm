package taskcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newListCmd() *cobra.Command {
	var (
		status   string
		priority string
		assignee string
		taskType string
		all      bool
		jsonOut  bool
	)
	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List tasks in current project",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}

			callArgs := map[string]any{"projectId": cfg.Context.ProjectID}
			if status != "" {
				callArgs["status"] = []string{status}
			}
			if assignee != "" {
				callArgs["assigneeId"] = assignee
			}

			raw, err := client.Query("tasks/queries:getProjectTasks", callArgs)
			if err != nil {
				return err
			}
			tasks, err := parseTasks(raw)
			if err != nil {
				return err
			}

			// Filter
			filtered := tasks[:0]
			for _, t := range tasks {
				if !all && (t.Status == "done" || t.Status == "cancelled") {
					continue
				}
				if priority != "" && t.Priority != priority {
					continue
				}
				if taskType != "" && t.Type != taskType {
					continue
				}
				filtered = append(filtered, t)
			}

			if jsonOut {
				return output.JSON(filtered)
			}

			if len(filtered) == 0 {
				output.Infof("no tasks match")
				return nil
			}

			t := output.NewTable("STATUS", "PRIORITY", "TYPE", "TITLE")
			for _, task := range filtered {
				t.AddRow(
					output.StatusIcon(task.Status)+" "+output.FormatStatus(task.Status),
					output.FormatPriority(task.Priority),
					output.FormatType(task.Type),
					output.Truncate(task.Title, 60),
				)
			}
			t.Print()
			return nil
		},
	}
	cmd.Flags().StringVarP(&status, "status", "s", "", "filter by status")
	cmd.Flags().StringVarP(&priority, "priority", "p", "", "filter by priority")
	cmd.Flags().StringVarP(&assignee, "assignee", "a", "", "filter by assignee")
	cmd.Flags().StringVarP(&taskType, "type", "t", "", "filter by type")
	cmd.Flags().BoolVar(&all, "all", false, "include done/cancelled tasks")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
