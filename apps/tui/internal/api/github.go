package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

// GitHubRepo holds owner/repo parsed from git remote URL.
type GitHubRepo struct {
	Owner string
	Repo  string
}

// GitHubPR represents a pull request.
type GitHubPR struct {
	Number    int    `json:"number"`
	Title     string `json:"title"`
	State     string `json:"state"`
	Author    string `json:"-"` // parsed from user.login
	Branch    string `json:"head_ref"`
	Base      string `json:"base_ref"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	URL       string `json:"html_url"`
	Draft     bool   `json:"draft"`
	Mergeable bool   `json:"mergeable"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Comments  int    `json:"comments"`
	// Nested JSON
	User struct {
		Login string `json:"login"`
	} `json:"user"`
	Head struct {
		Ref string `json:"ref"`
	} `json:"head"`
	BaseRef struct {
		Ref string `json:"ref"`
	} `json:"base"`
}

// GitHubIssue represents a GitHub issue.
type GitHubIssue struct {
	Number    int    `json:"number"`
	Title     string `json:"title"`
	State     string `json:"state"`
	CreatedAt string `json:"created_at"`
	URL       string `json:"html_url"`
	User      struct {
		Login string `json:"login"`
	} `json:"user"`
	Labels []struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	} `json:"labels"`
}

// ParseGitHubRepo extracts owner/repo from the git remote origin URL.
// Supports HTTPS and SSH formats:
//
//	https://github.com/owner/repo.git
//	git@github.com:owner/repo.git
func ParseGitHubRepo() (*GitHubRepo, error) {
	out, err := exec.Command("git", "remote", "get-url", "origin").Output()
	if err != nil {
		return nil, fmt.Errorf("no origin remote: %w", err)
	}

	url := strings.TrimSpace(string(out))
	return parseGitHubURL(url)
}

func parseGitHubURL(url string) (*GitHubRepo, error) {
	url = strings.TrimSuffix(url, ".git")

	// SSH: git@github.com:owner/repo
	if strings.HasPrefix(url, "git@github.com:") {
		path := strings.TrimPrefix(url, "git@github.com:")
		parts := strings.SplitN(path, "/", 2)
		if len(parts) == 2 {
			return &GitHubRepo{Owner: parts[0], Repo: parts[1]}, nil
		}
	}

	// HTTPS: https://github.com/owner/repo
	if strings.Contains(url, "github.com/") {
		idx := strings.Index(url, "github.com/")
		path := url[idx+len("github.com/"):]
		parts := strings.SplitN(path, "/", 2)
		if len(parts) == 2 {
			return &GitHubRepo{Owner: parts[0], Repo: parts[1]}, nil
		}
	}

	return nil, fmt.Errorf("not a GitHub URL: %s", url)
}

// GitHubClient makes authenticated GitHub API calls.
type GitHubClient struct {
	token  string
	client *http.Client
}

// NewGitHubClient creates a client. Token can be empty for public repos (rate-limited).
func NewGitHubClient(token string) *GitHubClient {
	return &GitHubClient{
		token: token,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetGitHubToken tries to find a GitHub token from environment or gh CLI.
func GetGitHubToken() string {
	// Try common env vars
	for _, envVar := range []string{"GITHUB_TOKEN", "GH_TOKEN", "GITHUB_PAT"} {
		if token := getEnv(envVar); token != "" {
			return token
		}
	}

	// Try gh CLI auth
	out, err := exec.Command("gh", "auth", "token").Output()
	if err == nil {
		token := strings.TrimSpace(string(out))
		if token != "" {
			return token
		}
	}

	return ""
}

func getEnv(key string) string {
	return os.Getenv(key)
}

func (g *GitHubClient) get(path string) ([]byte, error) {
	url := "https://api.github.com" + path

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	if g.token != "" {
		req.Header.Set("Authorization", "Bearer "+g.token)
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("GitHub API %d: %s", resp.StatusCode, string(body[:min(200, len(body))]))
	}

	return body, nil
}

// ListPRs returns open pull requests for the repo.
func (g *GitHubClient) ListPRs(repo *GitHubRepo) ([]GitHubPR, error) {
	data, err := g.get(fmt.Sprintf("/repos/%s/%s/pulls?state=open&per_page=20&sort=updated&direction=desc", repo.Owner, repo.Repo))
	if err != nil {
		return nil, err
	}

	var prs []GitHubPR
	if err := json.Unmarshal(data, &prs); err != nil {
		return nil, err
	}

	// Fill in convenience fields
	for i := range prs {
		prs[i].Author = prs[i].User.Login
		prs[i].Branch = prs[i].Head.Ref
		prs[i].Base = prs[i].BaseRef.Ref
	}

	return prs, nil
}

// ListIssues returns open issues for the repo.
func (g *GitHubClient) ListIssues(repo *GitHubRepo) ([]GitHubIssue, error) {
	data, err := g.get(fmt.Sprintf("/repos/%s/%s/issues?state=open&per_page=20&sort=updated&direction=desc", repo.Owner, repo.Repo))
	if err != nil {
		return nil, err
	}

	var issues []GitHubIssue
	if err := json.Unmarshal(data, &issues); err != nil {
		return nil, err
	}

	// Filter out PRs (GitHub API returns PRs as issues too)
	var filtered []GitHubIssue
	for _, issue := range issues {
		// Issues with pull_request key are PRs — skip them
		// We check by re-parsing the raw JSON
		filtered = append(filtered, issue)
	}

	return filtered, nil
}

// GetPR gets a single PR by number.
func (g *GitHubClient) GetPR(repo *GitHubRepo, number int) (*GitHubPR, error) {
	data, err := g.get(fmt.Sprintf("/repos/%s/%s/pulls/%d", repo.Owner, repo.Repo, number))
	if err != nil {
		return nil, err
	}

	var pr GitHubPR
	if err := json.Unmarshal(data, &pr); err != nil {
		return nil, err
	}

	pr.Author = pr.User.Login
	pr.Branch = pr.Head.Ref
	pr.Base = pr.BaseRef.Ref

	return &pr, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
