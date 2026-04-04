package api

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// AuthConfig holds the CLI auth and project config.
// Mirrors the CLIConfig interface from apps/cli/src/lib/config.ts.
// The `conf` npm package stores nested JSON objects.
type AuthConfig struct {
	Auth    AuthInfo    `json:"auth"`
	Context ProjectInfo `json:"context"`
}

// AuthInfo holds authentication details.
type AuthInfo struct {
	Token     string  `json:"token"`
	TokenType string  `json:"tokenType"`
	UserID    string  `json:"userId"`
	Email     string  `json:"email"`
	ExpiresAt float64 `json:"expiresAt"`
	SessionID string  `json:"sessionId"`
}

// ProjectInfo holds the selected workspace/project context.
type ProjectInfo struct {
	WorkspaceID   string `json:"workspaceId"`
	WorkspaceName string `json:"workspaceName"`
	ProjectID     string `json:"projectId"`
	ProjectKey    string `json:"projectKey"`
	ProjectName   string `json:"projectName"`
}

// configPath returns the full path to the ltf config file.
// Priority: LTF_CONFIG_PATH env var > platform default.
func configPath() (string, error) {
	if p := os.Getenv("LTF_CONFIG_PATH"); p != "" {
		return p, nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	switch runtime.GOOS {
	case "darwin":
		return filepath.Join(home, "Library", "Application Support", "ltf-nodejs", "config.json"), nil
	default:
		return filepath.Join(home, ".config", "ltf-nodejs", "config.json"), nil
	}
}

// GetConfigPath returns the config file path (exported for settings page logout).
func GetConfigPath() string {
	p, err := configPath()
	if err != nil {
		return ""
	}
	return p
}

// LoadAuthConfig reads and parses the CLI config file.
// Returns nil and an error if the file doesn't exist or can't be parsed.
func LoadAuthConfig() (*AuthConfig, error) {
	path, err := configPath()
	if err != nil {
		return nil, fmt.Errorf("config path: %w", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	var cfg AuthConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	return &cfg, nil
}

// IsAuthenticated checks if the token exists and has not expired.
func IsAuthenticated(cfg *AuthConfig) bool {
	if cfg == nil || cfg.Auth.Token == "" {
		return false
	}
	if cfg.Auth.ExpiresAt == 0 {
		// API tokens don't have expiry — treat as valid.
		return true
	}
	// ExpiresAt is in milliseconds since epoch (JS Date.now()).
	return time.Now().UnixMilli() < int64(cfg.Auth.ExpiresAt)
}

// HasProjectContext checks if a workspace and project are selected.
func HasProjectContext(cfg *AuthConfig) bool {
	if cfg == nil {
		return false
	}
	return cfg.Context.WorkspaceID != "" && cfg.Context.ProjectID != ""
}

// GetToken returns the JWT token from the config.
func GetToken(cfg *AuthConfig) string {
	if cfg == nil {
		return ""
	}
	return cfg.Auth.Token
}

// CanRefreshSession reports whether the stored auth can mint a fresh Clerk JWT.
func CanRefreshSession(cfg *AuthConfig) bool {
	if cfg == nil {
		return false
	}
	return cfg.Auth.TokenType == "clerk" && cfg.Auth.SessionID != ""
}

// HasUsableAuth reports whether the app has enough auth state to start and
// either call the API immediately or silently refresh before retrying.
func HasUsableAuth(cfg *AuthConfig) bool {
	if cfg == nil {
		return false
	}
	if cfg.Auth.Token == "" && !CanRefreshSession(cfg) {
		return false
	}
	return IsAuthenticated(cfg) || CanRefreshSession(cfg)
}

// SaveAuthConfig writes the full auth config to disk.
func SaveAuthConfig(cfg *AuthConfig) error {
	if cfg == nil {
		return fmt.Errorf("nil config")
	}

	path, err := configPath()
	if err != nil {
		return fmt.Errorf("config path: %w", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create config dir: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write config: %w", err)
	}

	return nil
}

// SaveContext merges workspace/project context into the existing config file and returns the updated config.
func SaveContext(ctx ProjectInfo) (*AuthConfig, error) {
	cfg, err := LoadAuthConfig()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	cfg.Context = ctx

	if err := SaveAuthConfig(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
