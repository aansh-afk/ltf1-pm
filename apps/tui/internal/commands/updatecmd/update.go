// Package updatecmd implements the `ltf1 update` command.
package updatecmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

const Version = "0.1.0-beta.4"

func NewCommand() *cobra.Command {
	var checkOnly bool
	cmd := &cobra.Command{
		Use:   "update",
		Short: "Check for and install CLI updates",
		RunE: func(cmd *cobra.Command, args []string) error {
			output.Infof("current version: %s", Version)
			output.Infof("update via: npm install -g @vvg-ltf1/cli")
			_ = checkOnly
			return nil
		},
	}
	cmd.Flags().BoolVar(&checkOnly, "check", false, "check only")
	return cmd
}
