package projectcmd

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newSelectCmd() *cobra.Command {
	var workspaceID string
	cmd := &cobra.Command{
		Use:     "select [key]",
		Aliases: []string{"use"},
		Short:   "Select active project",
		Args:    cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}

			// If no workspace specified, pick one
			targetWorkspace := workspaceID
			targetWorkspaceName := ""
			if targetWorkspace == "" {
				wsRaw, err := client.Query("workspaces/queries:getUserWorkspaces", nil)
				if err != nil {
					return err
				}
				ws, err := parseWorkspaces(wsRaw)
				if err != nil {
					return err
				}
				if len(ws) == 0 {
					return fmt.Errorf("no workspaces found")
				}
				if len(ws) == 1 {
					targetWorkspace = ws[0].ID
					targetWorkspaceName = ws[0].Name
				} else {
					output.Header("Select a workspace")
					for i, w := range ws {
						fmt.Printf("  %d. %s\n", i+1, w.Name)
					}
					choice := promptInt("Workspace number: ", 1, len(ws))
					targetWorkspace = ws[choice-1].ID
					targetWorkspaceName = ws[choice-1].Name
				}
			} else {
				targetWorkspaceName = cfg.Context.WorkspaceName
			}

			projsRaw, err := client.Query("projects/queries:getWorkspaceProjects", map[string]any{"workspaceId": targetWorkspace})
			if err != nil {
				return err
			}
			projs, err := parseProjects(projsRaw)
			if err != nil {
				return err
			}
			if len(projs) == 0 {
				return fmt.Errorf("no projects in this workspace")
			}

			var chosen *projectItem
			if len(args) == 1 {
				key := strings.ToUpper(args[0])
				for i, p := range projs {
					if strings.EqualFold(p.Key, key) {
						chosen = &projs[i]
						break
					}
				}
				if chosen == nil {
					return fmt.Errorf("project %q not found", args[0])
				}
			} else {
				output.Header("Select a project")
				for i, p := range projs {
					fmt.Printf("  %d. %s  %s\n", i+1, p.Key, p.Name)
				}
				choice := promptInt("Project number: ", 1, len(projs))
				chosen = &projs[choice-1]
			}

			ctx := api.ProjectInfo{
				WorkspaceID:   targetWorkspace,
				WorkspaceName: targetWorkspaceName,
				ProjectID:     chosen.ID,
				ProjectKey:    chosen.Key,
				ProjectName:   chosen.Name,
			}
			if _, err := api.SaveContext(ctx); err != nil {
				return err
			}
			output.Successf("selected %s — %s", chosen.Key, chosen.Name)
			return nil
		},
	}
	cmd.Flags().StringVarP(&workspaceID, "workspace", "w", "", "workspace ID")
	return cmd
}

func promptInt(prompt string, min, max int) int {
	for {
		fmt.Print(prompt)
		reader := bufio.NewReader(os.Stdin)
		line, _ := reader.ReadString('\n')
		n, err := strconv.Atoi(strings.TrimSpace(line))
		if err != nil || n < min || n > max {
			fmt.Printf("Please enter a number between %d and %d\n", min, max)
			continue
		}
		return n
	}
}
