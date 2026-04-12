// Package releasecmd implements the `ltf1 release` command group.
package releasecmd

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "release",
		Short: "Release management commands",
	}
	cmd.AddCommand(newNotesCmd())
	return cmd
}

func newNotesCmd() *cobra.Command {
	var (
		version string
		format  string
	)
	cmd := &cobra.Command{
		Use:   "notes",
		Short: "Generate release notes from git commits",
		RunE: func(cmd *cobra.Command, args []string) error {
			rangeArg := "HEAD"
			if version != "" {
				rangeArg = version + "..HEAD"
			}
			out, err := exec.Command("git", "log", rangeArg, "--pretty=format:%s").Output()
			if err != nil {
				return fmt.Errorf("git log: %w", err)
			}
			lines := strings.Split(strings.TrimSpace(string(out)), "\n")

			features, fixes, other := []string{}, []string{}, []string{}
			for _, line := range lines {
				switch {
				case strings.HasPrefix(line, "feat"):
					features = append(features, line)
				case strings.HasPrefix(line, "fix"):
					fixes = append(fixes, line)
				default:
					other = append(other, line)
				}
			}

			if format == "txt" {
				printPlainSection("Features", features)
				printPlainSection("Fixes", fixes)
				printPlainSection("Other", other)
			} else {
				output.Header("Release Notes")
				printMarkdownSection("Features", features)
				printMarkdownSection("Fixes", fixes)
				printMarkdownSection("Other", other)
			}
			return nil
		},
	}
	cmd.Flags().StringVar(&version, "version", "", "previous version tag")
	cmd.Flags().StringVar(&format, "format", "md", "output format (md/txt)")
	return cmd
}

func printMarkdownSection(title string, items []string) {
	if len(items) == 0 {
		return
	}
	fmt.Printf("\n## %s\n", title)
	for _, item := range items {
		fmt.Printf("- %s\n", item)
	}
}

func printPlainSection(title string, items []string) {
	if len(items) == 0 {
		return
	}
	fmt.Printf("\n%s\n", title)
	for _, item := range items {
		fmt.Printf("  • %s\n", item)
	}
}
