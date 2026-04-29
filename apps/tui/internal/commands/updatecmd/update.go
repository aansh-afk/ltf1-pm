// Package updatecmd implements the `ltf1 update` command.
package updatecmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

const Version = "0.2.5"
const npmPackage = "@vvg-ltf1/cli"

func NewCommand() *cobra.Command {
	var checkOnly bool
	cmd := &cobra.Command{
		Use:   "update",
		Short: "Check for and install CLI updates",
		RunE: func(cmd *cobra.Command, args []string) error {
			output.Infof("current version: %s", Version)

			latest, err := fetchLatestVersion()
			if err != nil {
				return fmt.Errorf("failed to check for updates: %w", err)
			}

			if latest == Version {
				output.Successf("already up to date")
				return nil
			}

			output.Infof("new version available: %s", latest)

			if checkOnly {
				return nil
			}

			output.Infof("updating...")
			install := exec.Command("npm", "install", "-g", fmt.Sprintf("%s@%s", npmPackage, latest))
			install.Stdout = cmd.OutOrStdout()
			install.Stderr = cmd.ErrOrStderr()
			if err := install.Run(); err != nil {
				return fmt.Errorf("update failed: %w\n  try manually: npm install -g %s@latest", err, npmPackage)
			}

			output.Successf("updated to %s", latest)
			return nil
		},
	}
	cmd.Flags().BoolVar(&checkOnly, "check", false, "check only, don't install")
	return cmd
}

func fetchLatestVersion() (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(fmt.Sprintf("https://registry.npmjs.org/%s/latest", npmPackage))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("npm registry returned %d", resp.StatusCode)
	}

	var pkg struct {
		Version string `json:"version"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&pkg); err != nil {
		return "", err
	}
	return pkg.Version, nil
}
