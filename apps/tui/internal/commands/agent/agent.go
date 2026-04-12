// Package agent implements the `ltf1 agent` command group.
package agent

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "agent",
		Short: "AI agent commands",
	}
	cmd.AddCommand(newTriageCmd())
	cmd.AddCommand(newSuggestCmd())
	cmd.AddCommand(newStatusCmd())
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

func newTriageCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:   "triage",
		Short: "Show triage queue",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if !api.HasProjectContext(cfg) {
				return fmt.Errorf("no project selected")
			}
			raw, err := client.Query("agent/queries:getTriageQueue", map[string]any{"projectId": cfg.Context.ProjectID})
			if err != nil {
				return err
			}
			var suggestions []api.TriageSuggestion
			if err := json.Unmarshal(raw, &suggestions); err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(suggestions)
			}
			if len(suggestions) == 0 {
				output.Infof("triage queue is empty")
				return nil
			}
			output.Header("Triage Queue")
			for _, s := range suggestions {
				fmt.Printf("  %s  type=%s priority=%s confidence=%.2f\n", s.TaskID, s.SuggestedType, s.SuggestedPriority, s.Confidence)
				if s.Reasoning != "" {
					fmt.Printf("    %s\n", s.Reasoning)
				}
			}
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func newSuggestCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "suggest",
		Short: "Agent suggestions for current state",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if !api.HasProjectContext(cfg) {
				return fmt.Errorf("no project selected")
			}
			raw, err := client.Action("agent/actions:suggestNextActions", map[string]any{
				"projectId": cfg.Context.ProjectID,
			})
			if err != nil {
				return err
			}
			fmt.Println(string(raw))
			return nil
		},
	}
}

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show agent activity feed",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			raw, err := client.Query("agent/queries:getAgentActivityFeed", map[string]any{"workspaceId": cfg.Context.WorkspaceID})
			if err != nil {
				return err
			}
			var activities []api.AgentActivity
			if err := json.Unmarshal(raw, &activities); err != nil {
				return err
			}
			if len(activities) == 0 {
				output.Infof("no agent activity")
				return nil
			}
			output.Header("Agent Activity")
			for _, a := range activities {
				fmt.Printf("  %s  %s\n", output.RelativeTime(a.CreatedAt), a.Description)
			}
			return nil
		},
	}
}
