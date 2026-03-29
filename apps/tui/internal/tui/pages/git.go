package pages

import (
	"image/color"
	"os/exec"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type gitFile struct {
	Status string
	Path   string
	Staged bool
}

type gitDataMsg struct {
	Branch string
	Files  []gitFile
	Err    error
}

type gitPage struct {
	width, height int
	branch        string
	files         []gitFile
	cursor        int
	loading       bool
}

func NewGitPage() PageModel {
	return &gitPage{loading: true}
}

func (p *gitPage) Init() tea.Cmd {
	return p.fetchGitStatus()
}

func (p *gitPage) fetchGitStatus() tea.Cmd {
	return func() tea.Msg {
		var data gitDataMsg

		// Get branch
		out, err := exec.Command("git", "branch", "--show-current").Output()
		if err != nil {
			data.Err = err
			return data
		}
		data.Branch = strings.TrimSpace(string(out))

		// Get status
		out, err = exec.Command("git", "status", "--porcelain").Output()
		if err != nil {
			data.Err = err
			return data
		}

		for _, line := range strings.Split(string(out), "\n") {
			if len(line) < 4 {
				continue
			}
			staged := line[0] != ' ' && line[0] != '?'
			status := strings.TrimSpace(line[:2])
			path := strings.TrimSpace(line[3:])
			data.Files = append(data.Files, gitFile{
				Status: status,
				Path:   path,
				Staged: staged,
			})
		}

		return data
	}
}

func (p *gitPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case gitDataMsg:
		p.branch = msg.Branch
		p.files = msg.Files
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.files)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		}
	}
	return p, nil
}

func (p *gitPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *gitPage) ShortHelp() string {
	return "j/k navigate  space stage/unstage  c commit"
}

func (p *gitPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "c", " "}
}

func (p *gitPage) View() string {
	if p.loading {
		return components.EmptyState("Loading git status...", p.width, p.height)
	}

	var b strings.Builder

	// Branch info
	b.WriteString(theme.SectionHeader.Render("GIT") + "\n")
	branchStyle := lipgloss.NewStyle().Foreground(theme.Green).Bold(true)
	b.WriteString(branchStyle.Render(p.branch) + "\n\n")

	if len(p.files) == 0 {
		b.WriteString(theme.TextMutedStyle.Render("Working tree clean") + "\n")
		return b.String()
	}

	// Staged files
	b.WriteString(theme.SectionHeader.Render("STAGED") + "\n")
	hasStagedFiles := false
	for i, f := range p.files {
		if !f.Staged {
			continue
		}
		hasStagedFiles = true
		statusColor := gitStatusColor(f.Status)
		statusStyle := lipgloss.NewStyle().Foreground(statusColor).Bold(true)
		meta := statusStyle.Render(f.Status)
		b.WriteString(components.RenderListItem(f.Path, meta, i == p.cursor) + "\n")
	}
	if !hasStagedFiles {
		b.WriteString(theme.TextMutedStyle.Render("  No staged files") + "\n")
	}
	b.WriteString("\n")

	// Unstaged files
	b.WriteString(theme.SectionHeader.Render("UNSTAGED") + "\n")
	hasUnstagedFiles := false
	for i, f := range p.files {
		if f.Staged {
			continue
		}
		hasUnstagedFiles = true
		statusColor := gitStatusColor(f.Status)
		statusStyle := lipgloss.NewStyle().Foreground(statusColor).Bold(true)
		meta := statusStyle.Render(f.Status)
		b.WriteString(components.RenderListItem(f.Path, meta, i == p.cursor) + "\n")
	}
	if !hasUnstagedFiles {
		b.WriteString(theme.TextMutedStyle.Render("  No unstaged files") + "\n")
	}

	return b.String()
}

func gitStatusColor(status string) color.Color {
	switch {
	case strings.Contains(status, "A"):
		return theme.Green
	case strings.Contains(status, "M"):
		return theme.Amber
	case strings.Contains(status, "D"):
		return theme.Red
	case strings.Contains(status, "?"):
		return theme.TextMuted
	default:
		return theme.TextSecondary
	}
}
