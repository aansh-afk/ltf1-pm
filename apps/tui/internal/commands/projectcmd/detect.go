package projectcmd

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newDetectCmd() *cobra.Command {
	var setActive bool
	cmd := &cobra.Command{
		Use:   "detect",
		Short: "Auto-detect project from git remote",
		RunE: func(cmd *cobra.Command, args []string) error {
			remote, err := getGitRemote()
			if err != nil {
				return fmt.Errorf("not in a git repo: %w", err)
			}
			output.Infof("git remote: %s", remote)

			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}

			wsRaw, err := client.Query("workspaces/queries:getUserWorkspaces", nil)
			if err != nil {
				return err
			}
			ws, err := parseWorkspaces(wsRaw)
			if err != nil {
				return err
			}

			needle := strings.ToLower(extractRepoName(remote))
			for _, w := range ws {
				projsRaw, err := client.Query("projects/queries:getWorkspaceProjects", map[string]any{"workspaceId": w.ID})
				if err != nil {
					continue
				}
				projs, _ := parseProjects(projsRaw)
				for _, p := range projs {
					if strings.Contains(strings.ToLower(p.Name), needle) || strings.Contains(strings.ToLower(p.Key), needle) {
						output.Successf("found %s — %s in %s", p.Key, p.Name, w.Name)
						if setActive {
							ctx := api.ProjectInfo{
								WorkspaceID:   w.ID,
								WorkspaceName: w.Name,
								ProjectID:     p.ID,
								ProjectKey:    p.Key,
								ProjectName:   p.Name,
							}
							if _, err := api.SaveContext(ctx); err != nil {
								return err
							}
							output.Successf("set as active project")
						}
						_ = cfg
						return nil
					}
				}
			}
			return fmt.Errorf("no matching project found for %s", needle)
		},
	}
	cmd.Flags().BoolVar(&setActive, "set", false, "set as active project after detection")
	return cmd
}

func getGitRemote() (string, error) {
	out, err := exec.Command("git", "remote", "get-url", "origin").Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

func extractRepoName(remote string) string {
	remote = strings.TrimSuffix(remote, ".git")
	if idx := strings.LastIndex(remote, "/"); idx >= 0 {
		return remote[idx+1:]
	}
	return remote
}
