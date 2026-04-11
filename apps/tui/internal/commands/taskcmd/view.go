package taskcmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newViewCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "view <id>",
		Aliases: []string{"show", "get"},
		Short:   "View task details",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClientWithProject()
			if err != nil {
				return err
			}

			raw, err := client.Query("tasks/queries:getTask", map[string]any{"taskId": args[0]})
			if err != nil {
				return err
			}
			var task map[string]any
			if err := json.Unmarshal(raw, &task); err != nil {
				return err
			}

			if jsonOut {
				return output.JSON(task)
			}

			output.Header("Task")
			fmt.Printf("Title:        %s\n", asString(task["title"]))
			fmt.Printf("Status:       %s\n", output.FormatStatus(asString(task["status"])))
			fmt.Printf("Priority:     %s\n", output.FormatPriority(asString(task["priority"])))
			fmt.Printf("Type:         %s\n", output.FormatType(asString(task["type"])))
			if d := asString(task["description"]); d != "" {
				fmt.Printf("Description:  %s\n", d)
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
