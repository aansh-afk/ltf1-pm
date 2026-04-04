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

type gitActionMsg struct {
	Action string
	Err    error
}

type gitModalMode int

const (
	gitModalNone gitModalMode = iota
	gitModalCommit
)

type gitPage struct {
	width, height int
	branch        string
	files         []gitFile
	cursor        int
	loading       bool
	modalMode     gitModalMode
	commitInput   components.InputModel
}

func NewGitPage() PageModel {
	input := components.NewInput("Commit message...")
	return &gitPage{loading: true, commitInput: input}
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

func stageFile(path string) tea.Cmd {
	return func() tea.Msg {
		err := exec.Command("git", "add", path).Run()
		return gitActionMsg{Action: "staged", Err: err}
	}
}

func unstageFile(path string) tea.Cmd {
	return func() tea.Msg {
		err := exec.Command("git", "reset", "HEAD", path).Run()
		return gitActionMsg{Action: "unstaged", Err: err}
	}
}

func commitChanges(message string) tea.Cmd {
	return func() tea.Msg {
		err := exec.Command("git", "commit", "-m", message).Run()
		return gitActionMsg{Action: "committed", Err: err}
	}
}

func (p *gitPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case gitDataMsg:
		p.branch = msg.Branch
		p.files = msg.Files
		p.loading = false

	case gitActionMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Git " + msg.Action + " failed: " + msg.Err.Error(), IsError: true}
			}
		}
		action := msg.Action
		return p, tea.Batch(
			p.fetchGitStatus(),
			func() tea.Msg { return ShowToastMsg{Message: "Git: " + action} },
		)

	case tea.KeyMsg:
		return p.handleKey(msg)
	}

	// Forward to commit input if in modal
	if p.modalMode == gitModalCommit {
		var cmd tea.Cmd
		p.commitInput, cmd = p.commitInput.Update(msg)
		return p, cmd
	}

	return p, nil
}

func (p *gitPage) handleKey(msg tea.KeyMsg) (PageModel, tea.Cmd) {
	key := msg.String()

	// Commit modal
	if p.modalMode == gitModalCommit {
		switch key {
		case "enter":
			message := strings.TrimSpace(p.commitInput.Value())
			if message == "" {
				return p, nil
			}
			p.modalMode = gitModalNone
			p.commitInput.Blur()
			p.commitInput.SetValue("")
			return p, commitChanges(message)
		case "esc":
			p.modalMode = gitModalNone
			p.commitInput.Blur()
			p.commitInput.SetValue("")
			return p, nil
		default:
			var cmd tea.Cmd
			p.commitInput, cmd = p.commitInput.Update(msg)
			return p, cmd
		}
	}

	// Normal mode
	switch key {
	case "j", "down":
		if p.cursor < len(p.files)-1 {
			p.cursor++
		}
	case "k", "up":
		if p.cursor > 0 {
			p.cursor--
		}
	case " ":
		if p.cursor >= 0 && p.cursor < len(p.files) {
			f := p.files[p.cursor]
			if f.Staged {
				return p, unstageFile(f.Path)
			}
			return p, stageFile(f.Path)
		}
	case "c":
		// Check if there are staged files
		hasStaged := false
		for _, f := range p.files {
			if f.Staged {
				hasStaged = true
				break
			}
		}
		if !hasStaged {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "No staged files to commit", IsError: true}
			}
		}
		p.modalMode = gitModalCommit
		p.commitInput.SetValue("")
		return p, p.commitInput.Focus()
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

	// Commit modal
	if p.modalMode == gitModalCommit {
		return p.viewCommitModal()
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

	leftContent := p.renderFileList(leftW)
	rightContent := p.renderDiffPreview(rightW)

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, leftContent, "   ", rightContent))

	return b.String()
}

func (p *gitPage) viewCommitModal() string {
	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("COMMIT CHANGES"))
	lines = append(lines, "")

	// Show staged files
	for _, f := range p.files {
		if f.Staged {
			lines = append(lines, theme.SuccessTextStyle.Render(theme.SymCheck+" "+f.Path))
		}
	}
	lines = append(lines, "")
	lines = append(lines, p.commitInput.View())
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "commit"),
		components.KeyHint("esc", "cancel"),
	))

	content := strings.Join(lines, "\n")
	modalW := p.width / 2
	if modalW < 45 {
		modalW = 45
	}
	if modalW > 70 {
		modalW = 70
	}

	box := lipgloss.NewStyle().
		Background(theme.BgElevated).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(theme.Green).
		Padding(1, 2).
		Width(modalW).
		Render(content)

	return lipgloss.Place(p.width, p.height, lipgloss.Center, lipgloss.Center, box)
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

	b.WriteString(theme.SectionHeader.Render(fmt.Sprintf("STAGED CHANGES (%d)", staged)) + "\n\n")
	hasStagedFiles := false
	for i, f := range p.files {
		if !f.Staged {
			continue
		}
		hasStagedFiles = true
		check := theme.SuccessTextStyle.Render(theme.SymCheck)
		title := check + " " + f.Path
		meta := theme.SuccessTextStyle.Render("Staged")
		b.WriteString(components.RenderListItem(title, meta, i == p.cursor, width) + "\n")
	}
	if !hasStagedFiles {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No staged files") + "\n")
	}
	b.WriteString("\n")

	b.WriteString(theme.SectionHeader.Render(fmt.Sprintf("UNSTAGED CHANGES (%d)", unstaged)) + "\n\n")
	hasUnstagedFiles := false
	for i, f := range p.files {
		if f.Staged {
			continue
		}
		hasUnstagedFiles = true
		statusColor := gitStatusColor(f.Status)
		meta := theme.ColorBoldStyle(statusColor).Render(f.Status)
		b.WriteString(components.RenderListItem(f.Path, meta, i == p.cursor, width) + "\n")
	}
	if !hasUnstagedFiles {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No unstaged files") + "\n")
	}

	return b.String()
}

func (p *gitPage) renderDiffPreview(width int) string {
	selectedPath := ""
	if p.cursor >= 0 && p.cursor < len(p.files) {
		selectedPath = p.files[p.cursor].Path
	}

	if selectedPath == "" {
		return components.BorderedSection("DIFF", theme.TextMutedStyle.Render("Select a file to preview"), width)
	}

	diffContent := p.getDiff(selectedPath)
	if diffContent == "" {
		diffContent = theme.TextMutedStyle.Render("No diff available")
	}

	header := fmt.Sprintf("DIFF: %s", selectedPath)
	return components.BorderedSection(header, diffContent, width)
}

func (p *gitPage) getDiff(path string) string {
	out, err := exec.Command("git", "diff", "--", path).Output()
	if err != nil || len(out) == 0 {
		out, err = exec.Command("git", "diff", "--cached", "--", path).Output()
		if err != nil || len(out) == 0 {
			return ""
		}
	}

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
