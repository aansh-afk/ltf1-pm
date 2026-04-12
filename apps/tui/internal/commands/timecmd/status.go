package timecmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show active timer",
		RunE: func(cmd *cobra.Command, args []string) error {
			t := loadTimer()
			if t == nil {
				output.Infof("no timer running")
				return nil
			}
			fmt.Printf("active timer: %s — %s\n", t.TaskID, formatElapsed(t.StartedAt))
			if t.Description != "" {
				fmt.Printf("description: %s\n", t.Description)
			}
			return nil
		},
	}
}
