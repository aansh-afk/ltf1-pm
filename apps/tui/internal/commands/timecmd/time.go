// Package timecmd implements the `ltf time` command group.
package timecmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "time",
		Aliases: []string{"tm"},
		Short:   "Time tracking commands",
	}
	cmd.AddCommand(newStartCmd())
	cmd.AddCommand(newStopCmd())
	cmd.AddCommand(newStatusCmd())
	cmd.AddCommand(newLogCmd())
	cmd.AddCommand(newReportCmd())
	return cmd
}

// Local timer state stored in ~/.config/ltf-nodejs/timer.json

type timerState struct {
	TaskID      string `json:"taskId"`
	Description string `json:"description,omitempty"`
	StartedAt   int64  `json:"startedAt"`
}

func timerFile() string {
	home, _ := os.UserHomeDir()
	if runtime.GOOS == "darwin" {
		return filepath.Join(home, "Library", "Application Support", "ltf-nodejs", "timer.json")
	}
	return filepath.Join(home, ".config", "ltf-nodejs", "timer.json")
}

func loadTimer() *timerState {
	data, err := os.ReadFile(timerFile())
	if err != nil {
		return nil
	}
	var t timerState
	if err := json.Unmarshal(data, &t); err != nil {
		return nil
	}
	return &t
}

func saveTimer(t *timerState) error {
	path := timerFile()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func clearTimer() error {
	return os.Remove(timerFile())
}

func loadAuthClient() (*api.AuthConfig, *api.ConvexClient, error) {
	cfg, err := api.LoadAuthConfig()
	if err != nil {
		return nil, nil, fmt.Errorf("not authenticated")
	}
	url := api.GetConvexURL(cfg)
	if url == "" {
		return nil, nil, fmt.Errorf("CONVEX_URL not set")
	}
	return cfg, api.NewClient(url, cfg), nil
}

func formatElapsed(start int64) string {
	d := time.Since(time.UnixMilli(start))
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60
	if hours > 0 {
		return fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
	}
	if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}
