package projectcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newListCmd() *cobra.Command {
	var (
		workspaceID string
		all         bool
		jsonOut     bool
	)
	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List projects in current or specified workspace",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}

			targetWorkspace := workspaceID
			if targetWorkspace == "" {
				targetWorkspace = cfg.Context.WorkspaceID
			}

			if all || targetWorkspace == "" {
				wsRaw, err := client.Query("workspaces/queries:getUserWorkspaces", nil)
				if err != nil {
					return err
				}
				ws, err := parseWorkspaces(wsRaw)
				if err != nil {
					return err
				}
				if jsonOut {
					return output.JSON(ws)
				}
				output.Header("All Projects")
				for _, w := range ws {
					projsRaw, err := client.Query("projects/queries:getWorkspaceProjects", map[string]any{"workspaceId": w.ID})
					if err != nil {
						continue
					}
					projs, _ := parseProjects(projsRaw)
					if len(projs) == 0 {
						continue
					}
					output.Println(output.Bold, w.Name)
					for _, p := range projs {
						output.Println("", "  "+p.Key+"  "+p.Name)
					}
				}
				return nil
			}

			projsRaw, err := client.Query("projects/queries:getWorkspaceProjects", map[string]any{"workspaceId": targetWorkspace})
			if err != nil {
				return err
			}
			projs, err := parseProjects(projsRaw)
			if err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(projs)
			}
			t := output.NewTable("KEY", "NAME", "STATUS")
			for _, p := range projs {
				t.AddRow(p.Key, p.Name, p.Status)
			}
			t.Print()
			return nil
		},
	}
	cmd.Flags().StringVarP(&workspaceID, "workspace", "w", "", "workspace ID")
	cmd.Flags().BoolVar(&all, "all", false, "list across all workspaces")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}
