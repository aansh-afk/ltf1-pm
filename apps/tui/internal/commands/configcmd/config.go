// Package configcmd implements the `ltf1 config` command group.
package configcmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "config",
		Aliases: []string{"cfg"},
		Short:   "CLI configuration",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newGetCmd())
	cmd.AddCommand(newSetCmd())
	cmd.AddCommand(newPathCmd())
	cmd.AddCommand(newResetCmd())
	return cmd
}

func newListCmd() *cobra.Command {
	return &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "Show all config",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil {
				output.Infof("no config file")
				return nil
			}
			return output.JSON(cfg)
		},
	}
}

func newGetCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "get <key>",
		Short: "Get a config value (dot notation)",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil {
				return err
			}
			data, _ := json.Marshal(cfg)
			var generic map[string]any
			_ = json.Unmarshal(data, &generic)
			val := walkPath(generic, strings.Split(args[0], "."))
			if val == nil {
				output.Infof("key not found")
				return nil
			}
			fmt.Println(val)
			return nil
		},
	}
}

func walkPath(m map[string]any, parts []string) any {
	if len(parts) == 0 {
		return m
	}
	cur := any(m)
	for _, p := range parts {
		mp, ok := cur.(map[string]any)
		if !ok {
			return nil
		}
		cur = mp[p]
	}
	return cur
}

func newSetCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "set <key> <value>",
		Short: "Set a config value (dot notation)",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := api.LoadAuthConfig()
			if cfg == nil {
				cfg = &api.AuthConfig{}
			}
			// Limited dot-path support: convexUrl only for now
			if args[0] == "convexUrl" {
				cfg.ConvexURL = args[1]
				if err := api.SaveAuthConfig(cfg); err != nil {
					return err
				}
				output.Successf("set convexUrl")
				return nil
			}
			return fmt.Errorf("unsupported key for now: %s", args[0])
		},
	}
}

func newPathCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "path",
		Short: "Show config file path",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println(api.GetConfigPath())
			return nil
		},
	}
}

func newResetCmd() *cobra.Command {
	var force bool
	cmd := &cobra.Command{
		Use:   "reset",
		Short: "Delete config file",
		RunE: func(cmd *cobra.Command, args []string) error {
			if !force {
				return fmt.Errorf("pass --force to confirm")
			}
			if err := os.Remove(api.GetConfigPath()); err != nil && !os.IsNotExist(err) {
				return err
			}
			output.Successf("config reset")
			return nil
		},
	}
	cmd.Flags().BoolVarP(&force, "force", "f", false, "skip confirmation")
	return cmd
}
