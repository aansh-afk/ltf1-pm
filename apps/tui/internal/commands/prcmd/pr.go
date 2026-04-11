// Package prcmd implements the `ltf pr` command group.
package prcmd

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pr",
		Short: "Pull request commands",
	}
	cmd.AddCommand(newCreateCmd())
	return cmd
}

func newCreateCmd() *cobra.Command {
	var (
		title string
		body  string
		draft bool
	)
	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create a pull request from current branch",
		RunE: func(cmd *cobra.Command, args []string) error {
			ghArgs := []string{"pr", "create"}
			if title != "" {
				ghArgs = append(ghArgs, "--title", title)
			}
			if body != "" {
				ghArgs = append(ghArgs, "--body", body)
			}
			if draft {
				ghArgs = append(ghArgs, "--draft")
			}
			out, err := exec.Command("gh", ghArgs...).CombinedOutput()
			if err != nil {
				return fmt.Errorf("gh: %s", strings.TrimSpace(string(out)))
			}
			output.Successf("PR created")
			fmt.Println(string(out))
			return nil
		},
	}
	cmd.Flags().StringVar(&title, "title", "", "PR title")
	cmd.Flags().StringVar(&body, "body", "", "PR body")
	cmd.Flags().BoolVar(&draft, "draft", false, "create as draft")
	return cmd
}
