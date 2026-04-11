package timecmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newLogCmd() *cobra.Command {
	var (
		hours   float64
		minutes float64
		date    string
	)
	cmd := &cobra.Command{
		Use:   "log <task-id>",
		Short: "Manually log time to a task",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			durationMs := int64((hours*60+minutes)*60*1000)
			if durationMs == 0 {
				return cmd.Help()
			}
			callArgs := map[string]any{
				"taskId":   args[0],
				"duration": durationMs,
			}
			if date != "" {
				callArgs["date"] = date
			}
			if _, err := client.Mutation("timeEntries/mutations:createManualEntry", callArgs); err != nil {
				return err
			}
			output.Successf("logged %.1fh", hours+minutes/60)
			return nil
		},
	}
	cmd.Flags().Float64VarP(&hours, "hours", "H", 0, "hours")
	cmd.Flags().Float64VarP(&minutes, "minutes", "M", 0, "minutes")
	cmd.Flags().StringVarP(&date, "date", "d", "", "date (YYYY-MM-DD)")
	return cmd
}
