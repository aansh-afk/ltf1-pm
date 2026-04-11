// Package daemoncmd implements the `ltf daemon` command group.
package daemoncmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "daemon",
		Short: "Background daemon for git event monitoring",
	}
	cmd.AddCommand(newStartCmd())
	cmd.AddCommand(newStopCmd())
	cmd.AddCommand(newStatusCmd())
	cmd.AddCommand(newLogsCmd())
	return cmd
}

func daemonDir() string {
	home, _ := os.UserHomeDir()
	if runtime.GOOS == "darwin" {
		return filepath.Join(home, "Library", "Application Support", "ltf-nodejs")
	}
	return filepath.Join(home, ".config", "ltf-nodejs")
}

func pidFile() string  { return filepath.Join(daemonDir(), "daemon.pid") }
func logFile() string  { return filepath.Join(daemonDir(), "daemon.log") }

func loadPID() int {
	data, err := os.ReadFile(pidFile())
	if err != nil {
		return 0
	}
	pid, _ := strconv.Atoi(string(data))
	return pid
}

func processAlive(pid int) bool {
	if pid <= 0 {
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	return proc.Signal(syscall.Signal(0)) == nil
}

func newStartCmd() *cobra.Command {
	var (
		foreground bool
		verbose    bool
	)
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the background daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			if pid := loadPID(); processAlive(pid) {
				return fmt.Errorf("daemon already running (pid %d)", pid)
			}
			if foreground {
				output.Infof("daemon running in foreground (Ctrl+C to stop)")
				select {} // block forever
			}
			// Background: spawn self
			exe, err := os.Executable()
			if err != nil {
				return err
			}
			if err := os.MkdirAll(daemonDir(), 0755); err != nil {
				return err
			}
			logF, err := os.OpenFile(logFile(), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
			if err != nil {
				return err
			}
			child := exec.Command(exe, "daemon", "start", "--foreground")
			child.Stdout = logF
			child.Stderr = logF
			if err := child.Start(); err != nil {
				return err
			}
			if err := os.WriteFile(pidFile(), []byte(strconv.Itoa(child.Process.Pid)), 0644); err != nil {
				return err
			}
			output.Successf("daemon started (pid %d)", child.Process.Pid)
			_ = verbose
			return nil
		},
	}
	cmd.Flags().BoolVarP(&foreground, "foreground", "f", false, "run in foreground")
	cmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "verbose logging")
	return cmd
}

func newStopCmd() *cobra.Command {
	var force bool
	cmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			pid := loadPID()
			if !processAlive(pid) {
				output.Infof("daemon not running")
				_ = os.Remove(pidFile())
				return nil
			}
			proc, err := os.FindProcess(pid)
			if err != nil {
				return err
			}
			sig := syscall.SIGTERM
			if force {
				sig = syscall.SIGKILL
			}
			if err := proc.Signal(sig); err != nil {
				return err
			}
			_ = os.Remove(pidFile())
			output.Successf("daemon stopped")
			return nil
		},
	}
	cmd.Flags().BoolVarP(&force, "force", "f", false, "force kill")
	return cmd
}

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show daemon status",
		RunE: func(cmd *cobra.Command, args []string) error {
			pid := loadPID()
			if processAlive(pid) {
				output.Successf("daemon running (pid %d)", pid)
			} else {
				output.Infof("daemon not running")
			}
			return nil
		},
	}
}

func newLogsCmd() *cobra.Command {
	var (
		follow bool
		lines  int
		clear  bool
	)
	cmd := &cobra.Command{
		Use:   "logs",
		Short: "View daemon logs",
		RunE: func(cmd *cobra.Command, args []string) error {
			if clear {
				return os.Truncate(logFile(), 0)
			}
			data, err := os.ReadFile(logFile())
			if err != nil {
				output.Infof("no logs yet")
				return nil
			}
			fmt.Println(string(data))
			_ = follow
			_ = lines
			return nil
		},
	}
	cmd.Flags().BoolVarP(&follow, "follow", "f", false, "follow logs")
	cmd.Flags().IntVarP(&lines, "lines", "n", 50, "number of lines")
	cmd.Flags().BoolVar(&clear, "clear", false, "clear log file")
	return cmd
}
