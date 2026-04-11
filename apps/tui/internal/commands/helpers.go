package commands

import (
	"fmt"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

// LoadConfigOrError returns the loaded auth config or a friendly error.
func LoadConfigOrError() (*api.AuthConfig, error) {
	cfg, err := api.LoadAuthConfig()
	if err != nil {
		return nil, fmt.Errorf("not authenticated. Run: ltf auth login")
	}
	if !api.IsAuthenticated(cfg) && !api.CanRefreshSession(cfg) {
		return nil, fmt.Errorf("session expired. Run: ltf auth login")
	}
	return cfg, nil
}

// RequireProject returns an error if no project is selected.
func RequireProject(cfg *api.AuthConfig) error {
	if !api.HasProjectContext(cfg) {
		return fmt.Errorf("no project selected. Run: ltf project select")
	}
	return nil
}

// NewClient creates an authenticated Convex client from the loaded config.
func NewClient(cfg *api.AuthConfig) (*api.ConvexClient, error) {
	url := api.GetConvexURL(cfg)
	if url == "" {
		return nil, fmt.Errorf("CONVEX_URL not configured")
	}
	return api.NewClient(url, cfg), nil
}
