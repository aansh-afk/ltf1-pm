package timecmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newReportCmd() *cobra.Command {
	var (
		userID  string
		period  string
		jsonOut bool
	)
	cmd := &cobra.Command{
		Use:   "report",
		Short: "Show time tracking report",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			target := userID
			if target == "" {
				target = cfg.Auth.UserID
			}
			callArgs := map[string]any{"userId": target}
			if period != "" {
				callArgs["period"] = period
			}
			raw, err := client.Query("timeEntries/queries:getTimeStatsByUser", callArgs)
			if err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(raw)
			}
			output.Header("Time Report")
			output.Println("", string(raw))
			return nil
		},
	}
	cmd.Flags().StringVar(&userID, "user", "", "user ID (default: self)")
	cmd.Flags().StringVar(&period, "period", "", "period (week/month)")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
