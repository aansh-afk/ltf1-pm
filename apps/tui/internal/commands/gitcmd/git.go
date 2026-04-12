// Package gitcmd implements the `ltf1 git` command group.
package gitcmd

import (
	"os/exec"
	"strings"

	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "git",
		Short: "Git integration commands",
	}
	cmd.AddCommand(newLinkCmd())
	cmd.AddCommand(newSyncCmd())
	cmd.AddCommand(newHooksCmd())
	cmd.AddCommand(newStatusCmd())
	cmd.AddCommand(newConfigCmd())
	cmd.AddCommand(newHookHandlerCmd())
	return cmd
}

// gitCmd runs a git command and returns trimmed stdout.
func gitCmd(args ...string) (string, error) {
	out, err := exec.Command("git", args...).Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

// currentBranch returns the active git branch.
func currentBranch() (string, error) {
	return gitCmd("rev-parse", "--abbrev-ref", "HEAD")
}

// extractTaskKey parses task keys like PROJ-123 from a string.
func extractTaskKey(s, projectKey string) string {
	if projectKey == "" {
		return ""
	}
	prefix := strings.ToUpper(projectKey) + "-"
	upper := strings.ToUpper(s)
	idx := strings.Index(upper, prefix)
	if idx < 0 {
		return ""
	}
	rest := upper[idx+len(prefix):]
	end := 0
	for end < len(rest) && rest[end] >= '0' && rest[end] <= '9' {
		end++
	}
	if end == 0 {
		return ""
	}
	return prefix + rest[:end]
}
