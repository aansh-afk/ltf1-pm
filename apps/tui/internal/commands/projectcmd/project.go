// Package projectcmd implements the `ltf project` command group.
package projectcmd

import "github.com/spf13/cobra"

// NewCommand returns the parent `project` command.
func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "project",
		Aliases: []string{"p"},
		Short:   "Project management commands",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newSelectCmd())
	cmd.AddCommand(newInfoCmd())
	cmd.AddCommand(newDetectCmd())
	return cmd
}
