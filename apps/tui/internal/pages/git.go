package pages

import (
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- data types ---

type fileStatus struct {
	Status string // M, A, D, ?, R, C, U
	Path   string
	Staged bool
}

type gitInfo struct {
	Branch    string
	Remote    string
	TaskKey   string
	Staged    []fileStatus
	Unstaged  []fileStatus
}

// --- messages ---

type gitStatusMsg struct {
	info gitInfo
}

type gitErrMsg struct {
	err error
}

type gitActionDoneMsg struct {
	action string
}

type gitCommitInputMsg struct {
	active bool
}

// --- model ---

// GitModel is the git status page with green accent.
type GitModel struct {
	info         gitInfo
	cursor       int
	width        int
	height       int
	loading      bool
	err          error
	client       *api.ConvexClient
	focusPanel   int // 0=staged, 1=unstaged
	commitMode   bool
	commitMsg    string
	allFiles     []fileStatus // combined view for navigation
}

func NewGitModel(client *api.ConvexClient) *GitModel {
	return &GitModel{
		loading: true,
		client:  client,
	}
}

// --- PageModel interface ---

func (m *GitModel) Init() tea.Cmd {
	return m.loadGitStatus()
}

func (m *GitModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case gitStatusMsg:
		m.info = msg.info
		m.loading = false
		m.rebuildFileList()
		return m, nil

	case gitErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case gitActionDoneMsg:
		m.commitMode = false
		m.commitMsg = ""
		return m, m.loadGitStatus()

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}

		// Commit message input mode
		if m.commitMode {
			switch msg.String() {
			case "enter":
				if m.commitMsg != "" {
					return m, m.doCommit(m.commitMsg)
				}
			case "esc":
				m.commitMode = false
				m.commitMsg = ""
			case "backspace":
				if len(m.commitMsg) > 0 {
					m.commitMsg = m.commitMsg[:len(m.commitMsg)-1]
				}
			default:
				if len(msg.String()) == 1 {
					m.commitMsg += msg.String()
				} else if msg.String() == "space" {
					m.commitMsg += " "
				}
			}
			return m, nil
		}

		// Normal mode
		switch msg.String() {
		case "j", "down":
			if m.cursor < len(m.allFiles)-1 {
				m.cursor++
			}
		case "k", "up":
			if m.cursor > 0 {
				m.cursor--
			}
		case "tab":
			m.focusPanel = (m.focusPanel + 1) % 2
			// Jump cursor to start of focused panel
			if m.focusPanel == 0 {
				m.cursor = 0
			} else {
				m.cursor = len(m.info.Staged)
			}
		case " ":
			// Stage/unstage selected file
			if m.cursor < len(m.allFiles) {
				f := m.allFiles[m.cursor]
				if f.Staged {
					return m, m.unstageFile(f.Path)
				}
				return m, m.stageFile(f.Path)
			}
		case "a":
			return m, m.stageAll()
		case "c":
			if len(m.info.Staged) > 0 {
				m.commitMode = true
				m.commitMsg = ""
			}
		case "R":
			m.loading = true
			m.err = nil
			return m, m.loadGitStatus()
		}
	}

	return m, nil
}

func (m *GitModel) View(width, height int) string {
	m.width = width
	m.height = height

	green := lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true)
	muted := lipgloss.NewStyle().Foreground(theme.TextMuted)
	secondary := lipgloss.NewStyle().Foreground(theme.TextSecondary)

	if m.loading {
		return green.Render("GIT") + "\n\n" +
			secondary.Render("  Loading git status...")
	}

	if m.err != nil {
		return green.Render("GIT") + "\n\n" +
			theme.ErrorStyle.Render("  Error: "+m.err.Error()) + "\n" +
			muted.Render("  Press R to retry")
	}

	contentWidth := width - 4
	if contentWidth < 50 {
		contentWidth = 60
	}

	var b strings.Builder

	// Header
	b.WriteString(green.Render("GIT"))
	b.WriteString("  ")
	b.WriteString(muted.Render("repository status"))
	b.WriteString("\n\n")

	// Branch info
	b.WriteString(m.viewBranch(contentWidth))
	b.WriteString("\n\n")

	// Staged files
	b.WriteString(m.viewStaged(contentWidth))
	b.WriteString("\n\n")

	// Unstaged files
	b.WriteString(m.viewUnstaged(contentWidth))

	// Commit input
	if m.commitMode {
		b.WriteString("\n\n")
		b.WriteString(m.viewCommitInput(contentWidth))
	}

	// Footer hints
	b.WriteString("\n\n")
	keyStyle := lipgloss.NewStyle().Foreground(theme.GreenColor)
	b.WriteString(muted.Render("  "))
	b.WriteString(keyStyle.Render("j/k"))
	b.WriteString(muted.Render(" navigate  "))
	b.WriteString(keyStyle.Render("space"))
	b.WriteString(muted.Render(" stage/unstage  "))
	b.WriteString(keyStyle.Render("a"))
	b.WriteString(muted.Render(" stage all  "))
	b.WriteString(keyStyle.Render("c"))
	b.WriteString(muted.Render(" commit  "))
	b.WriteString(keyStyle.Render("R"))
	b.WriteString(muted.Render(" refresh"))

	return b.String()
}

func (m *GitModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *GitModel) ShortHelp() string {
	if m.commitMode {
		return "enter: confirm | esc: cancel"
	}
	return "j/k: navigate | space: stage/unstage | a: stage all | c: commit | R: refresh"
}

// --- view helpers ---

func (m *GitModel) viewBranch(contentWidth int) string {
	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.GreenColor).
		Padding(0, 1).
		Width(contentWidth)

	header := lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true).Render("BRANCH")
	branchIcon := lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u2299") // ⊙

	branchName := lipgloss.NewStyle().Foreground(theme.TextColor).Bold(true).Render(m.info.Branch)

	var taskLink string
	if m.info.TaskKey != "" {
		taskLink = "   \u2192 " + lipgloss.NewStyle().Foreground(theme.AmberColor).Render(m.info.TaskKey)
	}

	line1 := fmt.Sprintf("  %s %s%s", branchIcon, branchName, taskLink)

	var line2 string
	if m.info.Remote != "" {
		repoIcon := lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u2299")
		remote := lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(m.info.Remote)
		line2 = fmt.Sprintf("\n  %s Repo: %s", repoIcon, remote)
	}

	return box.Render(header + "\n" + line1 + line2)
}

func (m *GitModel) viewStaged(contentWidth int) string {
	borderColor := theme.BorderColor
	if m.focusPanel == 0 {
		borderColor = theme.GreenColor
	}

	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(borderColor).
		Padding(0, 1).
		Width(contentWidth)

	header := lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true).
		Render(fmt.Sprintf("STAGED (%d)", len(m.info.Staged)))

	if len(m.info.Staged) == 0 {
		empty := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No staged files")
		return box.Render(header + "\n" + empty)
	}

	var rows strings.Builder
	rows.WriteString(header)
	rows.WriteString("\n")

	for i, f := range m.info.Staged {
		cursor := "  "
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("> ")
		}

		statusChar := fileStatusStyle(f.Status)
		path := lipgloss.NewStyle().Foreground(theme.TextColor).Render(f.Path)

		rows.WriteString(fmt.Sprintf("%s%s  %s", cursor, statusChar, path))
		if i < len(m.info.Staged)-1 {
			rows.WriteString("\n")
		}
	}

	return box.Render(rows.String())
}

func (m *GitModel) viewUnstaged(contentWidth int) string {
	borderColor := theme.BorderColor
	if m.focusPanel == 1 {
		borderColor = theme.GreenColor
	}

	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(borderColor).
		Padding(0, 1).
		Width(contentWidth)

	header := lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true).
		Render(fmt.Sprintf("UNSTAGED (%d)", len(m.info.Unstaged)))

	if len(m.info.Unstaged) == 0 {
		empty := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No unstaged changes")
		return box.Render(header + "\n" + empty)
	}

	var rows strings.Builder
	rows.WriteString(header)
	rows.WriteString("\n")

	offset := len(m.info.Staged)
	for i, f := range m.info.Unstaged {
		cursor := "  "
		if i+offset == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("> ")
		}

		statusChar := fileStatusStyle(f.Status)
		path := lipgloss.NewStyle().Foreground(theme.TextColor).Render(f.Path)

		rows.WriteString(fmt.Sprintf("%s%s  %s", cursor, statusChar, path))
		if i < len(m.info.Unstaged)-1 {
			rows.WriteString("\n")
		}
	}

	return box.Render(rows.String())
}

func (m *GitModel) viewCommitInput(contentWidth int) string {
	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.GreenColor).
		Padding(0, 1).
		Width(contentWidth)

	header := lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true).Render("COMMIT MESSAGE")
	prompt := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("> ")
	msg := lipgloss.NewStyle().Foreground(theme.TextColor).Render(m.commitMsg)
	cursor := lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u2588") // █

	hint := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  enter: confirm  esc: cancel")

	return box.Render(fmt.Sprintf("%s\n  %s%s%s\n%s", header, prompt, msg, cursor, hint))
}

func fileStatusStyle(status string) string {
	switch status {
	case "A":
		return lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true).Render("A")
	case "M":
		return lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true).Render("M")
	case "D":
		return lipgloss.NewStyle().Foreground(theme.RedColor).Bold(true).Render("D")
	case "R":
		return lipgloss.NewStyle().Foreground(theme.CyanColor).Bold(true).Render("R")
	case "?":
		return lipgloss.NewStyle().Foreground(theme.TextMuted).Render("?")
	default:
		return lipgloss.NewStyle().Foreground(theme.TextMuted).Render(status)
	}
}

// --- internal helpers ---

func (m *GitModel) rebuildFileList() {
	m.allFiles = nil
	for _, f := range m.info.Staged {
		m.allFiles = append(m.allFiles, f)
	}
	for _, f := range m.info.Unstaged {
		m.allFiles = append(m.allFiles, f)
	}
	if m.cursor >= len(m.allFiles) && len(m.allFiles) > 0 {
		m.cursor = len(m.allFiles) - 1
	}
}

// --- commands ---

func (m *GitModel) loadGitStatus() tea.Cmd {
	return func() tea.Msg {
		branch, err := gitCmd("branch", "--show-current")
		if err != nil {
			// Fallback: might not be a git repo
			return gitStatusMsg{info: sampleGitInfo()}
		}

		remote, _ := gitCmd("remote", "get-url", "origin")

		porcelain, err := gitCmd("status", "--porcelain")
		if err != nil {
			return gitErrMsg{err: fmt.Errorf("git status: %w", err)}
		}

		staged, unstaged := parseGitPorcelain(porcelain)
		taskKey := extractTaskKey(branch)

		return gitStatusMsg{info: gitInfo{
			Branch:   strings.TrimSpace(branch),
			Remote:   strings.TrimSpace(remote),
			TaskKey:  taskKey,
			Staged:   staged,
			Unstaged: unstaged,
		}}
	}
}

func (m *GitModel) stageFile(path string) tea.Cmd {
	return func() tea.Msg {
		_, err := gitCmd("add", path)
		if err != nil {
			return gitErrMsg{err: fmt.Errorf("git add %s: %w", path, err)}
		}
		return gitActionDoneMsg{action: "staged"}
	}
}

func (m *GitModel) unstageFile(path string) tea.Cmd {
	return func() tea.Msg {
		_, err := gitCmd("restore", "--staged", path)
		if err != nil {
			return gitErrMsg{err: fmt.Errorf("git unstage %s: %w", path, err)}
		}
		return gitActionDoneMsg{action: "unstaged"}
	}
}

func (m *GitModel) stageAll() tea.Cmd {
	return func() tea.Msg {
		_, err := gitCmd("add", "-A")
		if err != nil {
			return gitErrMsg{err: fmt.Errorf("git add -A: %w", err)}
		}
		return gitActionDoneMsg{action: "staged all"}
	}
}

func (m *GitModel) doCommit(message string) tea.Cmd {
	return func() tea.Msg {
		_, err := gitCmd("commit", "-m", message)
		if err != nil {
			return gitErrMsg{err: fmt.Errorf("git commit: %w", err)}
		}
		return gitActionDoneMsg{action: "committed"}
	}
}

// --- git helpers ---

func gitCmd(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	out, err := cmd.Output()
	return string(out), err
}

var taskKeyRe = regexp.MustCompile(`[A-Z]+-\d+`)

func extractTaskKey(branch string) string {
	match := taskKeyRe.FindString(branch)
	return match
}

func parseGitPorcelain(output string) (staged, unstaged []fileStatus) {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	for _, line := range lines {
		if len(line) < 4 {
			continue
		}
		x := string(line[0]) // index status
		y := string(line[1]) // working tree status
		path := strings.TrimSpace(line[3:])

		// Staged changes (index column)
		if x != " " && x != "?" {
			staged = append(staged, fileStatus{
				Status: x,
				Path:   path,
				Staged: true,
			})
		}

		// Unstaged changes (working tree column)
		if y != " " {
			status := y
			if x == "?" {
				status = "?" // untracked
			}
			unstaged = append(unstaged, fileStatus{
				Status: status,
				Path:   path,
				Staged: false,
			})
		}
	}
	return
}

// --- sample data ---

func sampleGitInfo() gitInfo {
	return gitInfo{
		Branch:  "feature/PROJ-123-add-auth",
		Remote:  "aansh-afk/ltf1-pm",
		TaskKey: "PROJ-123",
		Staged: []fileStatus{
			{Status: "M", Path: "src/auth/login.ts", Staged: true},
			{Status: "A", Path: "src/auth/oauth.ts", Staged: true},
		},
		Unstaged: []fileStatus{
			{Status: "M", Path: "src/components/Header.tsx", Staged: false},
			{Status: "M", Path: "src/pages/Dashboard.tsx", Staged: false},
			{Status: "?", Path: "src/utils/helpers.ts", Staged: false},
		},
	}
}
