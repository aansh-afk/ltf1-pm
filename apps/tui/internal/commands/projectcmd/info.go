package projectcmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newInfoCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "info",
		Aliases: []string{"show"},
		Short:   "Show details of the active project",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if cfg.Context.ProjectID == "" {
				return fmt.Errorf("no project selected. Run: ltf1 project select")
			}

			raw, err := client.Query("projects/queries:getProject", map[string]any{"projectId": cfg.Context.ProjectID})
			if err != nil {
				return err
			}

			var project map[string]any
			if err := json.Unmarshal(raw, &project); err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(project)
			}

			output.Header("Project")
			fmt.Printf("Name:         %s\n", asString(project["name"]))
			fmt.Printf("Key:          %s\n", asString(project["key"]))
			fmt.Printf("Status:       %s\n", asString(project["status"]))
			if desc := asString(project["description"]); desc != "" {
				fmt.Printf("Description:  %s\n", desc)
			}
			return nil
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func asString(v any) string {
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}
