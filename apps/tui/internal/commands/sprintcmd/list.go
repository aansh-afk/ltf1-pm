package sprintcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newListCmd() *cobra.Command {
	var (
		status  string
		jsonOut bool
	)
	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List sprints in current project",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			raw, err := client.Query("sprints/queries:getProjectSprints", map[string]any{"projectId": cfg.Context.ProjectID})
			if err != nil {
				return err
			}
			sprints, err := parseSprints(raw)
			if err != nil {
				return err
			}
			if status != "" {
				filtered := sprints[:0]
				for _, s := range sprints {
					if s.Status == status {
						filtered = append(filtered, s)
					}
				}
				sprints = filtered
			}
			if jsonOut {
				return output.JSON(sprints)
			}
			t := output.NewTable("STATUS", "NAME", "GOAL")
			for _, s := range sprints {
				t.AddRow(s.Status, s.Name, output.Truncate(s.Goal, 40))
			}
			t.Print()
			return nil
		},
	}
	cmd.Flags().StringVar(&status, "status", "", "filter by status (planning/active/completed)")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
