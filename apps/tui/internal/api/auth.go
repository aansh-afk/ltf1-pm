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
type AuthConfig struct {
	Auth    AuthInfo    `json:"auth"`
	Project ProjectInfo `json:"project"`
}

// AuthInfo holds authentication details.
type AuthInfo struct {
	Token     string  `json:"token"`
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

// configDir returns the platform-specific config directory for ltf.
func configDir() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support", "ltf"), nil
	default:
		// Linux and others: ~/.config/ltf
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, ".config", "ltf"), nil
	}
}

// LoadAuthConfig reads and parses the CLI config file.
func LoadAuthConfig() (*AuthConfig, error) {
	dir, err := configDir()
	if err != nil {
		return nil, fmt.Errorf("config dir: %w", err)
	}

	data, err := os.ReadFile(filepath.Join(dir, "config.json"))
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
	// ExpiresAt is in seconds since epoch
	return time.Now().Unix() < int64(cfg.Auth.ExpiresAt)
}

// GetToken returns the JWT token from the config.
func GetToken(cfg *AuthConfig) string {
	if cfg == nil {
		return ""
	}
	return cfg.Auth.Token
}
