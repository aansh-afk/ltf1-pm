package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
	baseURL string
	token   string
	http    *http.Client
}

// NewClient creates a new Convex HTTP client.
func NewClient(deploymentURL, token string) *ConvexClient {
	if deploymentURL == "" {
		deploymentURL = os.Getenv("CONVEX_URL")
	}
	if deploymentURL == "" {
		deploymentURL = defaultDeploymentURL
	}
	return &ConvexClient{
		baseURL: deploymentURL,
		token:   token,
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
	Status    string          `json:"status"`
	Value     json.RawMessage `json:"value"`
	ErrorMsg  string          `json:"errorMessage"`
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

	url := c.baseURL + "/api/" + endpoint
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var result convexResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if result.Status == "error" {
		return nil, fmt.Errorf("convex error: %s", result.ErrorMsg)
	}

	return result.Value, nil
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
}

// BaseURL returns the configured deployment URL.
func (c *ConvexClient) BaseURL() string {
	return c.baseURL
}
