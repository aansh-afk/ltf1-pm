package taskcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newMineCmd() *cobra.Command {
	var (
		status  string
		jsonOut bool
	)
	cmd := &cobra.Command{
		Use:     "mine",
		Aliases: []string{"my"},
		Short:   "Show tasks assigned to me",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			callArgs := map[string]any{"workspaceId": cfg.Context.WorkspaceID}
			if status != "" {
				callArgs["status"] = []string{status}
			}
			raw, err := client.Query("tasks/queries:getMyTasks", callArgs)
			if err != nil {
				return err
			}
			tasks, err := parseTasks(raw)
			if err != nil {
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
	cmd.Flags().StringVarP(&status, "status", "s", "", "filter by status")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
