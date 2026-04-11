// Package commands provides the Cobra command tree for the ltf CLI.
package commands

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/agent"
	authcmd "github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/auth"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/aicmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/completionscmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/configcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/daemoncmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/dashboardcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/gitcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/notificationscmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/prcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/projectcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/releasecmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/searchcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/skillcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/sprintcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/taskcmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/timecmd"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands/updatecmd"
)

// DefaultConvexURL is the build-time default Convex deployment URL.
// Set from cmd/ltf/main.go via ldflags.
var DefaultConvexURL string

// Global flags shared across all commands.
var (
	flagJSON    bool
	flagNoColor bool
	flagDebug   bool
)

// rootCmd is the top-level ltf command.
var rootCmd = &cobra.Command{
	Use:   "ltf",
	Short: "ltf — git-native, agent-ready project management",
	Long: `ltf is a developer-first project management CLI and TUI.
Push code, your tasks update themselves. Run skills to codify workflows.
Triage incoming work with an AI agent. Live in your terminal.`,
	SilenceUsage:  true,
	SilenceErrors: true,
	// Default action: launch the TUI.
	RunE: func(cmd *cobra.Command, args []string) error {
		return dashboardcmd.Launch(DefaultConvexURL)
	},
}

// Execute runs the root command.
func Execute() error {
	loadDotenv()
	if DefaultConvexURL != "" && os.Getenv("CONVEX_URL") == "" && os.Getenv("VITE_CONVEX_URL") == "" {
		os.Setenv("CONVEX_URL", DefaultConvexURL)
	}
	rootCmd.CompletionOptions.DisableDefaultCmd = true
	return rootCmd.Execute()
}

func init() {
	rootCmd.PersistentFlags().BoolVar(&flagJSON, "json", false, "output as JSON")
	rootCmd.PersistentFlags().BoolVar(&flagNoColor, "no-color", false, "disable colored output")
	rootCmd.PersistentFlags().BoolVar(&flagDebug, "debug", false, "enable debug logging")

	// Register all command groups.
	rootCmd.AddCommand(authcmd.NewCommand())
	rootCmd.AddCommand(projectcmd.NewCommand())
	rootCmd.AddCommand(taskcmd.NewCommand())
	rootCmd.AddCommand(sprintcmd.NewCommand())
	rootCmd.AddCommand(timecmd.NewCommand())
	rootCmd.AddCommand(gitcmd.NewCommand())
	rootCmd.AddCommand(aicmd.NewCommand())
	rootCmd.AddCommand(agent.NewCommand())
	rootCmd.AddCommand(skillcmd.NewCommand())
	rootCmd.AddCommand(daemoncmd.NewCommand())
	rootCmd.AddCommand(searchcmd.NewCommand())
	rootCmd.AddCommand(notificationscmd.NewCommand())
	rootCmd.AddCommand(configcmd.NewCommand())
	rootCmd.AddCommand(completionscmd.NewCommand(rootCmd))
	rootCmd.AddCommand(releasecmd.NewCommand())
	rootCmd.AddCommand(prcmd.NewCommand())
	rootCmd.AddCommand(updatecmd.NewCommand())
	rootCmd.AddCommand(dashboardcmd.NewCommand(getDefaultConvexURL))
}

func getDefaultConvexURL() string {
	return DefaultConvexURL
}

// IsJSON reports whether --json flag is set.
func IsJSON() bool { return flagJSON }

// IsNoColor reports whether --no-color flag is set.
func IsNoColor() bool { return flagNoColor }

// IsDebug reports whether --debug flag is set.
func IsDebug() bool { return flagDebug }

// loadDotenv loads .env from cwd and ~/.ltf1.env (non-fatal).
func loadDotenv() {
	loadEnvFile(".env")
	if home, err := os.UserHomeDir(); err == nil {
		loadEnvFile(filepath.Join(home, ".ltf1.env"))
	}
}

func loadEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
}

