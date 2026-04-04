package pages

import (
	"fmt"
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

		out, err := exec.Command("git", "branch", "--show-current").Output()
		if err != nil {
			data.Err = err
			return data
		}
		data.Branch = strings.TrimSpace(string(out))

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
	return components.KeyHints(
		components.KeyHint("space", "stage/unstage"),
		components.KeyHint("c", "commit"),
		components.KeyHint("r", "refresh"),
	)
}

func (p *gitPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "c", " "}
}

func (p *gitPage) View() string {
	if p.loading {
		return components.EmptyState("Loading git status...", p.width, p.height)
	}

	contentW := p.width - 2
	if contentW < 20 {
		contentW = 20
	}

	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("GIT STATUS") + "\n\n")

	if len(p.files) == 0 {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymCheck+" Working tree clean") + "\n")
		return b.String()
	}

	// Split layout: left = file lists, right = diff preview
	leftW := int(float64(contentW) * 0.5)
	rightW := contentW - leftW - 3

	// Build left side: staged + unstaged
	leftContent := p.renderFileList(leftW)

	// Build right side: diff preview
	rightContent := p.renderDiffPreview(rightW)

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, leftContent, "   ", rightContent))

	// Commit input placeholder
	b.WriteString("\n\n")
	inputStyle := lipgloss.NewStyle().
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(theme.Indigo).
		Width(contentW - 4).
		Padding(0, 1)
	prompt := theme.AccentTextStyle.Render("> ") + theme.TextDimStyle.Render("Enter commit message...")
	b.WriteString("  " + inputStyle.Render(prompt))

	return b.String()
}

func (p *gitPage) renderFileList(width int) string {
	var b strings.Builder

	staged := 0
	unstaged := 0
	for _, f := range p.files {
		if f.Staged {
			staged++
		} else {
			unstaged++
		}
	}

	// Staged files
	b.WriteString(theme.SectionHeader.Render(fmt.Sprintf("STAGED CHANGES (%d)", staged)) + "\n\n")
	hasStagedFiles := false
	for i, f := range p.files {
		if !f.Staged {
			continue
		}
		hasStagedFiles = true
		check := theme.SuccessTextStyle.Render(theme.SymCheck)
		meta := theme.SuccessTextStyle.Render("Enabled")
		title := check + " " + f.Path
		b.WriteString(components.RenderListItem(title, meta, i == p.cursor, width) + "\n")
	}
	if !hasStagedFiles {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No staged files") + "\n")
	}
	b.WriteString("\n")

	// Unstaged files
	b.WriteString(theme.SectionHeader.Render(fmt.Sprintf("UNSTAGED CHANGES (%d)", unstaged)) + "\n\n")
	hasUnstagedFiles := false
	for i, f := range p.files {
		if f.Staged {
			continue
		}
		hasUnstagedFiles = true
		meta := theme.TextMutedStyle.Render("Disabled ") + theme.TextMutedStyle.Render(theme.SymDotEmpty)
		b.WriteString(components.RenderListItem(f.Path, meta, i == p.cursor, width) + "\n")
	}
	if !hasUnstagedFiles {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No unstaged files") + "\n")
	}

	return b.String()
}

func (p *gitPage) renderDiffPreview(width int) string {
	// Get the currently selected file's path
	selectedPath := ""
	if p.cursor >= 0 && p.cursor < len(p.files) {
		selectedPath = p.files[p.cursor].Path
	}

	if selectedPath == "" {
		return components.BorderedSection("DIFF", theme.TextMutedStyle.Render("Select a file to preview"), width)
	}

	// Try to get diff for the selected file
	diffContent := p.getDiff(selectedPath)
	if diffContent == "" {
		diffContent = theme.TextMutedStyle.Render("No diff available")
	}

	header := fmt.Sprintf("DIFF: %s", selectedPath)
	return components.BorderedSection(header, diffContent, width)
}

func (p *gitPage) getDiff(path string) string {
	// Try unstaged diff first, then staged
	out, err := exec.Command("git", "diff", "--", path).Output()
	if err != nil || len(out) == 0 {
		out, err = exec.Command("git", "diff", "--cached", "--", path).Output()
		if err != nil || len(out) == 0 {
			return ""
		}
	}

	// Syntax color the diff output
	lines := strings.Split(string(out), "\n")
	maxLines := 20
	if len(lines) > maxLines {
		lines = lines[:maxLines]
	}

	var colored []string
	for _, line := range lines {
		switch {
		case strings.HasPrefix(line, "+++ ") || strings.HasPrefix(line, "--- "):
			colored = append(colored, theme.TextMutedStyle.Render(line))
		case strings.HasPrefix(line, "@@"):
			colored = append(colored, theme.AccentTextStyle.Render(line))
		case strings.HasPrefix(line, "+"):
			colored = append(colored, theme.SuccessTextStyle.Render(line))
		case strings.HasPrefix(line, "-"):
			colored = append(colored, theme.ErrorTextStyle.Render(line))
		default:
			colored = append(colored, theme.TextDimStyle.Render(line))
		}
	}

	return strings.Join(colored, "\n")
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
