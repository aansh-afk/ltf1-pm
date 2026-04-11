package projectcmd

import (
	"encoding/json"
	"fmt"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

// loadAuthClient is a small helper that loads config and creates a Convex client.
func loadAuthClient() (*api.AuthConfig, *api.ConvexClient, error) {
	cfg, err := api.LoadAuthConfig()
	if err != nil {
		return nil, nil, fmt.Errorf("not authenticated. Run: ltf auth login")
	}
	if !api.IsAuthenticated(cfg) && !api.CanRefreshSession(cfg) {
		return nil, nil, fmt.Errorf("session expired. Run: ltf auth login")
	}
	url := api.GetConvexURL(cfg)
	if url == "" {
		return nil, nil, fmt.Errorf("CONVEX_URL not configured")
	}
	return cfg, api.NewClient(url, cfg), nil
}

type workspaceItem struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
	Slug string `json:"slug,omitempty"`
}

type projectItem struct {
	ID          string `json:"_id"`
	Name        string `json:"name"`
	Key         string `json:"key"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
}

func parseWorkspaces(raw json.RawMessage) ([]workspaceItem, error) {
	var ws []workspaceItem
	if err := json.Unmarshal(raw, &ws); err != nil {
		return nil, err
	}
	return ws, nil
}

func parseProjects(raw json.RawMessage) ([]projectItem, error) {
	var ps []projectItem
	if err := json.Unmarshal(raw, &ps); err != nil {
		return nil, err
	}
	return ps, nil
}
