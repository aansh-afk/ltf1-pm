package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const defaultDeploymentURL = "https://tangible-butterfly-366.convex.cloud"

// GetConvexURL returns the Convex deployment URL from config or env.
func GetConvexURL(config *AuthConfig) string {
	if u := os.Getenv("CONVEX_URL"); u != "" {
		return u
	}
	return defaultDeploymentURL
}

// ConvexClient is an HTTP client for the Convex API.
type ConvexClient struct {
	baseURL        string
	token          string
	auth           *AuthConfig
	http           *http.Client
	mu             sync.Mutex
	lastJWTRefresh time.Time
}

// NewClient creates a new Convex HTTP client.
func NewClient(deploymentURL string, config *AuthConfig) *ConvexClient {
	if deploymentURL == "" {
		deploymentURL = os.Getenv("CONVEX_URL")
	}
	if deploymentURL == "" {
		deploymentURL = defaultDeploymentURL
	}
	token := ""
	if config != nil {
		token = config.Auth.Token
	}
	return &ConvexClient{
		baseURL: deploymentURL,
		token:   token,
		auth:    config,
		http: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// convexRequest is the JSON body sent to the Convex HTTP API.
type convexRequest struct {
	Path string                 `json:"path"`
	Args map[string]interface{} `json:"args"`
}

// convexResponse wraps the Convex API response.
type convexResponse struct {
	Status   string          `json:"status"`
	Value    json.RawMessage `json:"value"`
	ErrorMsg string          `json:"errorMessage"`
}

// call makes an HTTP POST to the Convex API.
func (c *ConvexClient) call(endpoint, path string, args map[string]interface{}) (json.RawMessage, error) {
	if args == nil {
		args = map[string]interface{}{}
	}

	body, err := json.Marshal(convexRequest{Path: path, Args: args})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	respBody, statusCode, err := c.doRequest(endpoint, body)
	if err != nil {
		return nil, err
	}

	if (statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden) && c.canRefreshToken() {
		if err := c.refreshToken(); err != nil {
			return nil, err
		}

		respBody, statusCode, err = c.doRequest(endpoint, body)
		if err != nil {
			return nil, err
		}
	}

	if statusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", statusCode, string(respBody))
	}

	var result convexResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if result.Status == "error" {
		if c.canRefreshToken() && isAuthError(result.ErrorMsg) {
			if err := c.refreshToken(); err != nil {
				return nil, err
			}

			respBody, statusCode, err = c.doRequest(endpoint, body)
			if err != nil {
				return nil, err
			}
			if statusCode != http.StatusOK {
				return nil, fmt.Errorf("HTTP %d: %s", statusCode, string(respBody))
			}
			if err := json.Unmarshal(respBody, &result); err != nil {
				return nil, fmt.Errorf("parse response: %w", err)
			}
			if result.Status != "error" {
				return result.Value, nil
			}
		}
		return nil, fmt.Errorf("convex error: %s", result.ErrorMsg)
	}

	return result.Value, nil
}

func (c *ConvexClient) doRequest(endpoint string, body []byte) ([]byte, int, error) {
	url := c.baseURL + "/api/" + endpoint
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, 0, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, fmt.Errorf("read response: %w", err)
	}

	return respBody, resp.StatusCode, nil
}

func (c *ConvexClient) canRefreshToken() bool {
	return c != nil && CanRefreshSession(c.auth)
}

func (c *ConvexClient) refreshToken() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.canRefreshToken() {
		return fmt.Errorf("session expired; run ltf auth login")
	}

	if time.Since(c.lastJWTRefresh) < 5*time.Second {
		return nil
	}

	siteURL, err := c.siteURL()
	if err != nil {
		return err
	}

	payload, err := json.Marshal(map[string]string{"sessionId": c.auth.Auth.SessionID})
	if err != nil {
		return fmt.Errorf("marshal refresh request: %w", err)
	}

	req, err := http.NewRequest("POST", siteURL+"/api/cli-refresh", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create refresh request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("refresh auth token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read refresh response: %w", err)
	}

	var result struct {
		Token string `json:"token"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("parse refresh response: %w", err)
	}

	if resp.StatusCode != http.StatusOK || result.Token == "" {
		if result.Error != "" {
			return fmt.Errorf("%s", result.Error)
		}
		return fmt.Errorf("refresh failed: HTTP %d", resp.StatusCode)
	}

	c.token = result.Token
	c.auth.Auth.Token = result.Token
	c.auth.Auth.ExpiresAt = float64(time.Now().Add(7 * 24 * time.Hour).UnixMilli())
	c.lastJWTRefresh = time.Now()

	if err := SaveAuthConfig(c.auth); err != nil {
		return fmt.Errorf("save refreshed auth: %w", err)
	}

	return nil
}

func (c *ConvexClient) siteURL() (string, error) {
	if strings.Contains(c.baseURL, ".convex.site") {
		return c.baseURL, nil
	}
	if strings.Contains(c.baseURL, ".convex.cloud") {
		return strings.Replace(c.baseURL, ".convex.cloud", ".convex.site", 1), nil
	}
	return "", fmt.Errorf("unable to derive Convex site URL from %q", c.baseURL)
}

func isAuthError(message string) bool {
	lower := strings.ToLower(message)
	return strings.Contains(lower, "unauth") ||
		strings.Contains(lower, "auth") ||
		strings.Contains(lower, "token") ||
		strings.Contains(lower, "expired") ||
		strings.Contains(lower, "forbidden")
}

// Query executes a Convex query function.
func (c *ConvexClient) Query(path string, args map[string]interface{}) (json.RawMessage, error) {
	return c.call("query", path, args)
}

// Mutation executes a Convex mutation function.
func (c *ConvexClient) Mutation(path string, args map[string]interface{}) (json.RawMessage, error) {
	return c.call("mutation", path, args)
}

// Action executes a Convex action function.
func (c *ConvexClient) Action(path string, args map[string]interface{}) (json.RawMessage, error) {
	return c.call("action", path, args)
}

// SetToken updates the auth token on the client.
func (c *ConvexClient) SetToken(token string) {
	c.token = token
	if c.auth != nil {
		c.auth.Auth.Token = token
	}
}

// BaseURL returns the configured deployment URL.
func (c *ConvexClient) BaseURL() string {
	return c.baseURL
}
