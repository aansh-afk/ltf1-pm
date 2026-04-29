package timecmd

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStopCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the active timer",
		RunE: func(cmd *cobra.Command, args []string) error {
			t := loadTimer()
			if t == nil {
				return fmt.Errorf("no timer running")
			}
			elapsed := time.Now().UnixMilli() - t.StartedAt

			_, client, err := loadAuthClient()
			if err == nil {
				// Backend map: timeEntries:createManualEntry (single-file module).
				_, _ = client.Mutation("timeEntries:createManualEntry", map[string]any{
					"taskId":      t.TaskID,
					"duration":    elapsed,
					"description": t.Description,
				})
			}

			if err := clearTimer(); err != nil && !isNotExist(err) {
				return err
			}

			if jsonOut {
				return output.JSON(map[string]any{
					"taskId":   t.TaskID,
					"duration": elapsed,
				})
			}
			fmt.Printf("stopped timer on %s after %s\n", t.TaskID, formatElapsed(t.StartedAt))
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func isNotExist(err error) bool {
	return err != nil && (err.Error() == "no such file or directory" || err.Error() == "The system cannot find the file specified.")
}
