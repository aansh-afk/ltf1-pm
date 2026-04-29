// Package skillcmd implements the `ltf1 skill` command group.
package skillcmd

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "skill",
		Short: "Agent skills (codified workflows)",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newRunCmd())
	cmd.AddCommand(newCreateCmd())
	return cmd
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

func newListCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List available skills",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			// Backend map: skills/queries:getWorkspaceSkills.
			raw, err := client.Query("skills/queries:getWorkspaceSkills", map[string]any{
				"workspaceId": cfg.Context.WorkspaceID,
			})
			if err != nil {
				return err
			}
			var skills []api.Skill
			if err := json.Unmarshal(raw, &skills); err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(skills)
			}
			if len(skills) == 0 {
				output.Infof("no skills defined")
				return nil
			}
			t := output.NewTable("NAME", "TRIGGER", "DESCRIPTION")
			for _, s := range skills {
				t.AddRow(s.DisplayName, s.Trigger, output.Truncate(s.Description, 60))
			}
			t.Print()
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func newRunCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "run <skill-id> <task-id>",
		Short: "Run a skill against a task",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			// Backend map: skills/execution:executeSkill (action) requires
			// skillId and taskId.
			raw, err := client.Action("skills/execution:executeSkill", map[string]any{
				"skillId": args[0],
				"taskId":  args[1],
			})
			if err != nil {
				return err
			}
			output.Successf("skill executed")
			fmt.Println(string(raw))
			return nil
		},
	}
	return cmd
}

func newCreateCmd() *cobra.Command {
	var (
		description string
		trigger     string
	)
	cmd := &cobra.Command{
		Use:   "create <name>",
		Short: "Create a custom skill",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			name := strings.Join(args, " ")
			// Backend validator (convex/skills/mutations.ts createSkill)
			// requires displayName + actions in addition to name and
			// trigger. We seed an empty action list; users can edit the
			// skill afterwards in the web UI to populate actions.
			if _, err := client.Mutation("skills/mutations:createSkill", map[string]any{
				"workspaceId": cfg.Context.WorkspaceID,
				"name":        name,
				"displayName": name,
				"description": description,
				"trigger":     defaultIfEmpty(trigger, "manual"),
				"actions":     []any{},
			}); err != nil {
				return err
			}
			output.Successf("created skill: %s", name)
			return nil
		},
	}
	cmd.Flags().StringVarP(&description, "description", "d", "", "skill description")
	cmd.Flags().StringVar(&trigger, "trigger", "manual", "trigger (manual/auto/both)")
	return cmd
}

func defaultIfEmpty(s, def string) string {
	if s == "" {
		return def
	}
	return s
}
