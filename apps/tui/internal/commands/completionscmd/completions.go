// Package completionscmd implements `ltf1 completions` (shell completion scripts).
package completionscmd

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

// NewCommand returns the completions command. It needs the root command to generate completions.
func NewCommand(root *cobra.Command) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "completions",
		Short: "Generate shell completion scripts",
	}
	cmd.AddCommand(&cobra.Command{
		Use:   "bash",
		Short: "Bash completion script",
		RunE: func(cmd *cobra.Command, args []string) error {
			return root.GenBashCompletionV2(os.Stdout, true)
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "zsh",
		Short: "Zsh completion script",
		RunE: func(cmd *cobra.Command, args []string) error {
			return root.GenZshCompletion(os.Stdout)
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "fish",
		Short: "Fish completion script",
		RunE: func(cmd *cobra.Command, args []string) error {
			return root.GenFishCompletion(os.Stdout, true)
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "install",
		Short: "Show installation instructions",
		RunE: func(cmd *cobra.Command, args []string) error {
			output.Header("Shell Completion Setup")
			output.Println("", "Bash:  ltf1 completions bash > /etc/bash_completion.d/ltf1")
			output.Println("", "Zsh:   ltf1 completions zsh  > \"${fpath[1]}/_ltf1\"")
			output.Println("", "Fish:  ltf1 completions fish > ~/.config/fish/completions/ltf1.fish")
			return nil
		},
	})
	return cmd
}
