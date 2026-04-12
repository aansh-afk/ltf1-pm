package timecmd

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStartCmd() *cobra.Command {
	var description string
	cmd := &cobra.Command{
		Use:   "start <task-id>",
		Short: "Start tracking time on a task",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if existing := loadTimer(); existing != nil {
				return fmt.Errorf("timer already running on %s — run: ltf1 time stop", existing.TaskID)
			}
			t := &timerState{
				TaskID:      args[0],
				Description: description,
				StartedAt:   time.Now().UnixMilli(),
			}
			if err := saveTimer(t); err != nil {
				return err
			}
			output.Successf("started timer on %s", args[0])
			return nil
		},
	}
	cmd.Flags().StringVarP(&description, "description", "d", "", "what you're working on")
	return cmd
}
