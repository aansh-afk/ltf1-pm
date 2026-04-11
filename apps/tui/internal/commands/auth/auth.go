// Package auth implements the `ltf auth` command group.
package auth

import "github.com/spf13/cobra"

// NewCommand returns the parent `auth` command.
func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "auth",
		Short: "Authentication commands",
	}
	cmd.AddCommand(newLoginCmd())
	cmd.AddCommand(newLogoutCmd())
	cmd.AddCommand(newStatusCmd())
	return cmd
}
