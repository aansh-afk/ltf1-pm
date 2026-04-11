// Package aicmd implements the `ltf ai` command group.
package aicmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "ai",
		Short: "AI-powered features",
	}
	cmd.AddCommand(newSuggestCmd())
	cmd.AddCommand(newAnalyzeCmd())
	cmd.AddCommand(newDescribeCmd())
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

func newSuggestCmd() *cobra.Command {
	var count int
	cmd := &cobra.Command{
		Use:   "suggest",
		Short: "Get AI task suggestions from recent activity",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if !api.HasProjectContext(cfg) {
				return fmt.Errorf("no project selected")
			}
			raw, err := client.Action("ai/actions:suggestTasks", map[string]any{
				"projectId": cfg.Context.ProjectID,
				"count":     count,
			})
			if err != nil {
				return err
			}
			output.Header("Suggestions")
			fmt.Println(string(raw))
			return nil
		},
	}
	cmd.Flags().IntVarP(&count, "count", "n", 5, "number of suggestions")
	return cmd
}

func newAnalyzeCmd() *cobra.Command {
	var sprintID string
	cmd := &cobra.Command{
		Use:   "analyze",
		Short: "AI analysis of current sprint or task",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			callArgs := map[string]any{}
			if sprintID != "" {
				callArgs["sprintId"] = sprintID
			}
			raw, err := client.Action("ai/actions:analyzeTask", callArgs)
			if err != nil {
				return err
			}
			output.Header("Analysis")
			fmt.Println(string(raw))
			return nil
		},
	}
	cmd.Flags().StringVarP(&sprintID, "sprint", "s", "", "sprint ID to analyze")
	return cmd
}

func newDescribeCmd() *cobra.Command {
	var create bool
	cmd := &cobra.Command{
		Use:   "describe <brief>",
		Short: "Generate task description from brief",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			brief := strings.Join(args, " ")
			raw, err := client.Action("ai/actions:generateDescription", map[string]any{
				"brief": brief,
			})
			if err != nil {
				return err
			}
			fmt.Println(string(raw))
			if create && api.HasProjectContext(cfg) {
				if _, err := client.Mutation("tasks/mutations:createTask", map[string]any{
					"projectId":   cfg.Context.ProjectID,
					"title":       brief,
					"description": string(raw),
					"type":        "task",
				}); err != nil {
					return err
				}
				output.Successf("created task")
			}
			return nil
		},
	}
	cmd.Flags().BoolVar(&create, "create", false, "create task with generated description")
	return cmd
}
