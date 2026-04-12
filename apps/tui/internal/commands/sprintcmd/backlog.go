package sprintcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newBacklogCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "backlog",
		Aliases: []string{"bl"},
		Short:   "Show backlog tasks (not in any sprint)",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			raw, err := client.Query("sprints/queries:getBacklogTasks", map[string]any{"projectId": cfg.Context.ProjectID})
			if err != nil {
				return err
			}
			var tasks []api.Task
			if err := jsonUnmarshal(raw, &tasks); err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(tasks)
			}
			t := output.NewTable("STATUS", "PRIORITY", "TITLE")
			for _, task := range tasks {
				t.AddRow(
					output.StatusIcon(task.Status)+" "+output.FormatStatus(task.Status),
					output.FormatPriority(task.Priority),
					output.Truncate(task.Title, 70),
				)
			}
			t.Print()
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
