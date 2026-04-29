package sprintcmd

import (
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newCreateCmd() *cobra.Command {
	var (
		startDate string
		endDate   string
		goal      string
	)
	cmd := &cobra.Command{
		Use:   "create <name>",
		Short: "Create a new sprint",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}
			name := strings.Join(args, " ")
			start := parseDate(startDate, time.Now())
			end := parseDate(endDate, time.Now().AddDate(0, 0, 14))

			callArgs := map[string]any{
				"projectId": cfg.Context.ProjectID,
				"name":      name,
				"startDate": start.Format("2006-01-02"),
				"endDate":   end.Format("2006-01-02"),
			}
			if goal != "" {
				callArgs["goal"] = goal
			}
			if _, err := client.Mutation("sprints/mutations:createSprint", callArgs); err != nil {
				return err
			}
			output.Successf("created sprint: %s", name)
			return nil
		},
	}
	cmd.Flags().StringVar(&startDate, "start", "", "start date (YYYY-MM-DD)")
	cmd.Flags().StringVar(&endDate, "end", "", "end date (YYYY-MM-DD)")
	cmd.Flags().StringVar(&goal, "goal", "", "sprint goal")
	return cmd
}

func parseDate(s string, fallback time.Time) time.Time {
	if s == "" {
		return fallback
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return fallback
	}
	return t
}
