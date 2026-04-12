package gitcmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newHooksCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "hooks <install|uninstall|status>",
		Short: "Manage git hooks for task linking",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			gitDir, err := gitCmd("rev-parse", "--git-dir")
			if err != nil {
				return fmt.Errorf("not in a git repo: %w", err)
			}
			hookPath := filepath.Join(gitDir, "hooks", "post-commit")

			switch args[0] {
			case "install":
				script := "#!/bin/sh\nltf git hook-handler post-commit\n"
				if err := os.WriteFile(hookPath, []byte(script), 0755); err != nil {
					return err
				}
				output.Successf("installed post-commit hook")
				return nil
			case "uninstall":
				if err := os.Remove(hookPath); err != nil && !os.IsNotExist(err) {
					return err
				}
				output.Successf("uninstalled hooks")
				return nil
			case "status":
				if _, err := os.Stat(hookPath); err == nil {
					output.Successf("hooks installed")
				} else {
					output.Infof("hooks not installed")
				}
				return nil
			default:
				return fmt.Errorf("unknown subcommand: %s", args[0])
			}
		},
	}
	return cmd
}
