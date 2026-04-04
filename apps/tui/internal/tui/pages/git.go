package pages

import (
	"fmt"
	"image/color"
	"os"
	"os/exec"
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type gitRefreshTickMsg struct{}

// --- Data types ---

type gitFile struct {
	Status string
	Path   string
	Staged bool
}

type gitCommit struct {
	Hash    string
	Message string
	Author  string
	Time    string
}

type gitStash struct {
	Index   int
	Message string
}

type gitBranch struct {
	Name      string
	IsCurrent bool
	IsRemote  bool
}

// --- Messages ---

type gitDataMsg struct {
	Branch       string
	RemoteBranch string
	Ahead, Behind int
	Files        []gitFile
	Commits      []gitCommit
	Stashes      []gitStash
	Remotes      []string
	Branches     []gitBranch
	GitRoot      string
	NoGit        bool
	Err          error
}

// Separate message for GitHub data (loaded async after git data)
type githubDataMsg struct {
	PRs    []api.GitHubPR
	Issues []api.GitHubIssue
	Repo   *api.GitHubRepo
	Err    error
}

type gitActionMsg struct {
	Action string
	Err    error
}

// --- Modal modes ---

type gitModalMode int

const (
	gitModalNone gitModalMode = iota
	gitModalCommit
	gitModalBranch
	gitModalConfirm
	gitModalPRCreate
	gitModalPRList
)

// --- Panel focus ---

type gitPanel int

const (
	gitPanelFiles gitPanel = iota
	gitPanelCommits
	gitPanelPRs
)

// --- Page model ---

type gitPage struct {
	width, height int
	// Git data
	branch       string
	remoteBranch string
	ahead, behind int
	files        []gitFile
	commits      []gitCommit
	stashes      []gitStash
	remotes      []string
	branches     []gitBranch
	// Navigation
	cursor       int
	commitCursor int
	branchCursor int
	activePanel  gitPanel
	// State
	loading  bool
	noGit    bool
	cwd      string
	gitRoot  string
	// GitHub
	ghRepo   *api.GitHubRepo
	ghPRs    []api.GitHubPR
	ghIssues []api.GitHubIssue
	prCursor int
	// Modal
	modalMode    gitModalMode
	commitInput  components.InputModel
	prTitleInput components.InputModel
	prBaseBranch string // base branch for PR creation
	confirmMsg   string
	confirmCmd   tea.Cmd
	hasGhCLI     bool
}

func NewGitPage() PageModel {
	commitInput := components.NewInput("Commit message...")
	prInput := components.NewInput("PR title...")
	cwd, _ := os.Getwd()
	// Check if gh CLI is available
	_, ghErr := exec.LookPath("gh")
	return &gitPage{
		loading:      true,
		commitInput:  commitInput,
		prTitleInput: prInput,
		cwd:          cwd,
		hasGhCLI:     ghErr == nil,
	}
}

func (p *gitPage) Init() tea.Cmd {
	return tea.Batch(p.fetchGitData(), p.scheduleRefresh())
}

func (p *gitPage) scheduleRefresh() tea.Cmd {
	return tea.Tick(10*time.Second, func(time.Time) tea.Msg {
		return gitRefreshTickMsg{}
	})
}

// --- Data fetching ---

func (p *gitPage) fetchGitData() tea.Cmd {
	return func() tea.Msg {
		var data gitDataMsg

		// Check if we're in a git repo
		out, err := exec.Command("git", "rev-parse", "--is-inside-work-tree").Output()
		if err != nil || strings.TrimSpace(string(out)) != "true" {
			data.NoGit = true
			return data
		}

		// Git root
		out, _ = exec.Command("git", "rev-parse", "--show-toplevel").Output()
		data.GitRoot = strings.TrimSpace(string(out))

		// Current branch
		out, _ = exec.Command("git", "branch", "--show-current").Output()
		data.Branch = strings.TrimSpace(string(out))

		// Remote tracking
		out, _ = exec.Command("git", "rev-parse", "--abbrev-ref", data.Branch+"@{upstream}").Output()
		data.RemoteBranch = strings.TrimSpace(string(out))

		// Ahead/behind
		if data.RemoteBranch != "" {
			out, _ = exec.Command("git", "rev-list", "--left-right", "--count", data.Branch+"..."+data.RemoteBranch).Output()
			parts := strings.Fields(strings.TrimSpace(string(out)))
			if len(parts) == 2 {
				fmt.Sscanf(parts[0], "%d", &data.Ahead)
				fmt.Sscanf(parts[1], "%d", &data.Behind)
			}
		}

		// Status
		out, _ = exec.Command("git", "status", "--porcelain").Output()
		for _, line := range strings.Split(string(out), "\n") {
			if len(line) < 4 {
				continue
			}
			staged := line[0] != ' ' && line[0] != '?'
			status := strings.TrimSpace(line[:2])
			path := strings.TrimSpace(line[3:])
			data.Files = append(data.Files, gitFile{Status: status, Path: path, Staged: staged})
		}

		// Commits (last 15)
		out, _ = exec.Command("git", "log", "--oneline", "--format=%h|%s|%an|%ar", "-15").Output()
		for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
			if line == "" {
				continue
			}
			parts := strings.SplitN(line, "|", 4)
			if len(parts) < 4 {
				continue
			}
			data.Commits = append(data.Commits, gitCommit{Hash: parts[0], Message: parts[1], Author: parts[2], Time: parts[3]})
		}

		// Stash
		out, _ = exec.Command("git", "stash", "list", "--format=%gd|%gs").Output()
		for i, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
			if line == "" {
				continue
			}
			parts := strings.SplitN(line, "|", 2)
			msg := line
			if len(parts) == 2 {
				msg = parts[1]
			}
			data.Stashes = append(data.Stashes, gitStash{Index: i, Message: msg})
		}

		// Remotes
		out, _ = exec.Command("git", "remote", "-v").Output()
		seen := map[string]bool{}
		for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
			if line == "" {
				continue
			}
			fields := strings.Fields(line)
			if !seen[fields[0]] {
				seen[fields[0]] = true
				url := ""
				if len(fields) >= 2 {
					url = fields[1]
				}
				data.Remotes = append(data.Remotes, fields[0]+" "+url)
			}
		}

		// Branches (local + remote)
		out, _ = exec.Command("git", "branch", "-a", "--format=%(refname:short)|%(HEAD)").Output()
		for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
			if line == "" {
				continue
			}
			parts := strings.SplitN(line, "|", 2)
			name := parts[0]
			isCurrent := len(parts) > 1 && strings.TrimSpace(parts[1]) == "*"
			isRemote := strings.HasPrefix(name, "origin/")
			data.Branches = append(data.Branches, gitBranch{Name: name, IsCurrent: isCurrent, IsRemote: isRemote})
		}

		return data
	}
}

// --- GitHub fetching ---

func fetchGitHubData() tea.Cmd {
	return func() tea.Msg {
		repo, err := api.ParseGitHubRepo()
		if err != nil {
			return githubDataMsg{Err: err}
		}

		token := api.GetGitHubToken()
		gh := api.NewGitHubClient(token)

		prs, _ := gh.ListPRs(repo)
		issues, _ := gh.ListIssues(repo)

		return githubDataMsg{PRs: prs, Issues: issues, Repo: repo}
	}
}

// --- Git actions ---

func runGitCmd(action string, args ...string) tea.Cmd {
	return func() tea.Msg {
		out, err := exec.Command("git", args...).CombinedOutput()
		if err != nil {
			msg := strings.TrimSpace(string(out))
			if msg == "" {
				msg = err.Error()
			}
			return gitActionMsg{Action: action, Err: fmt.Errorf("%s", msg)}
		}
		return gitActionMsg{Action: action}
	}
}

func gitStageFile(path string) tea.Cmd  { return runGitCmd("staged "+path, "add", path) }
func gitUnstageFile(path string) tea.Cmd { return runGitCmd("unstaged "+path, "reset", "HEAD", path) }
func gitStageAll() tea.Cmd              { return runGitCmd("staged all", "add", "-A") }
func gitUnstageAll() tea.Cmd            { return runGitCmd("unstaged all", "reset", "HEAD") }

func gitCommitChanges(message string) tea.Cmd {
	return runGitCmd("committed", "commit", "-m", message)
}

func gitPush() tea.Cmd    { return runGitCmd("pushed", "push") }
func gitPull() tea.Cmd    { return runGitCmd("pulled", "pull") }
func gitFetch() tea.Cmd   { return runGitCmd("fetched", "fetch", "--all") }

func gitCheckout(branch string) tea.Cmd {
	localBranch := strings.TrimPrefix(branch, "origin/")
	return runGitCmd("switched to "+localBranch, "checkout", localBranch)
}

func runGhCmd(action string, args ...string) tea.Cmd {
	return func() tea.Msg {
		out, err := exec.Command("gh", args...).CombinedOutput()
		if err != nil {
			msg := strings.TrimSpace(string(out))
			if msg == "" {
				msg = err.Error()
			}
			return gitActionMsg{Action: action, Err: fmt.Errorf("%s", msg)}
		}
		return gitActionMsg{Action: action}
	}
}

func ghCreatePR(title string) tea.Cmd {
	return runGhCmd("PR created", "pr", "create", "--title", title, "--fill")
}

func ghCreatePRWithBase(title, base string) tea.Cmd {
	if base != "" {
		return runGhCmd("PR created", "pr", "create", "--title", title, "--base", base, "--fill")
	}
	return runGhCmd("PR created", "pr", "create", "--title", title, "--fill")
}

func ghCheckoutPR(number int) tea.Cmd {
	return runGhCmd(fmt.Sprintf("checked out PR #%d", number), "pr", "checkout", fmt.Sprintf("%d", number))
}

func ghViewPR(number int) tea.Cmd {
	return runGhCmd(fmt.Sprintf("opened PR #%d", number), "pr", "view", fmt.Sprintf("%d", number), "--web")
}

func ghMergePR(number int) tea.Cmd {
	return runGhCmd(fmt.Sprintf("merged PR #%d", number), "pr", "merge", fmt.Sprintf("%d", number), "--merge")
}

// --- Update ---

func (p *gitPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case gitRefreshTickMsg:
		// Auto-refresh every 10s, but only if no modal is open
		if p.modalMode == gitModalNone && !p.noGit {
			return p, tea.Batch(p.fetchGitData(), p.scheduleRefresh())
		}
		return p, p.scheduleRefresh()

	case gitDataMsg:
		p.loading = false
		if msg.NoGit {
			p.noGit = true
			return p, nil
		}
		p.noGit = false
		p.gitRoot = msg.GitRoot
		p.branch = msg.Branch
		p.remoteBranch = msg.RemoteBranch
		p.ahead = msg.Ahead
		p.behind = msg.Behind
		p.files = msg.Files
		p.commits = msg.Commits
		p.stashes = msg.Stashes
		p.remotes = msg.Remotes
		p.branches = msg.Branches
		// Trigger GitHub data fetch in background
		return p, fetchGitHubData()

	case githubDataMsg:
		if msg.Err == nil {
			p.ghRepo = msg.Repo
			p.ghPRs = msg.PRs
			p.ghIssues = msg.Issues
		}

	case gitActionMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Git: " + msg.Err.Error(), IsError: true}
			}
		}
		action := msg.Action
		return p, tea.Batch(
			p.fetchGitData(),
			func() tea.Msg { return ShowToastMsg{Message: "Git: " + action} },
		)

	case tea.KeyMsg:
		return p.handleKey(msg)
	}

	// Forward to input if in text input modal
	if p.modalMode == gitModalCommit {
		var cmd tea.Cmd
		p.commitInput, cmd = p.commitInput.Update(msg)
		return p, cmd
	}
	if p.modalMode == gitModalPRCreate {
		var cmd tea.Cmd
		p.prTitleInput, cmd = p.prTitleInput.Update(msg)
		return p, cmd
	}

	return p, nil
}

func (p *gitPage) handleKey(msg tea.KeyMsg) (PageModel, tea.Cmd) {
	key := msg.String()

	// --- Modal handlers ---
	switch p.modalMode {
	case gitModalCommit:
		switch key {
		case "enter":
			message := strings.TrimSpace(p.commitInput.Value())
			if message == "" {
				return p, nil
			}
			p.modalMode = gitModalNone
			p.commitInput.Blur()
			p.commitInput.SetValue("")
			return p, gitCommitChanges(message)
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

	case gitModalBranch:
		switch key {
		case "j", "down":
			if p.branchCursor < len(p.branches)-1 {
				p.branchCursor++
			}
		case "k", "up":
			if p.branchCursor > 0 {
				p.branchCursor--
			}
		case "enter":
			if p.branchCursor >= 0 && p.branchCursor < len(p.branches) {
				br := p.branches[p.branchCursor]
				if !br.IsCurrent {
					p.modalMode = gitModalNone
					return p, gitCheckout(br.Name)
				}
			}
		case "esc":
			p.modalMode = gitModalNone
		}
		return p, nil

	case gitModalConfirm:
		switch key {
		case "y", "enter":
			p.modalMode = gitModalNone
			if p.confirmCmd != nil {
				cmd := p.confirmCmd
				p.confirmCmd = nil
				return p, cmd
			}
		case "n", "esc":
			p.modalMode = gitModalNone
			p.confirmCmd = nil
		}
		return p, nil

	case gitModalPRCreate:
		switch key {
		case "enter":
			title := strings.TrimSpace(p.prTitleInput.Value())
			if title == "" {
				return p, nil
			}
			p.modalMode = gitModalNone
			p.prTitleInput.Blur()
			p.prTitleInput.SetValue("")
			base := p.prBaseBranch
			return p, ghCreatePRWithBase(title, base)
		case "tab":
			// Cycle through local branches as base
			localBranches := p.localBranchNames()
			if len(localBranches) > 0 {
				idx := 0
				for i, b := range localBranches {
					if b == p.prBaseBranch {
						idx = i + 1
						break
					}
				}
				if idx >= len(localBranches) {
					idx = 0
				}
				p.prBaseBranch = localBranches[idx]
			}
			return p, nil
		case "esc":
			p.modalMode = gitModalNone
			p.prTitleInput.Blur()
			p.prTitleInput.SetValue("")
			return p, nil
		default:
			var cmd tea.Cmd
			p.prTitleInput, cmd = p.prTitleInput.Update(msg)
			return p, cmd
		}

	case gitModalPRList:
		switch key {
		case "j", "down":
			if p.prCursor < len(p.ghPRs)-1 {
				p.prCursor++
			}
		case "k", "up":
			if p.prCursor > 0 {
				p.prCursor--
			}
		case "enter": // Checkout PR branch
			if p.prCursor >= 0 && p.prCursor < len(p.ghPRs) {
				p.modalMode = gitModalNone
				return p, ghCheckoutPR(p.ghPRs[p.prCursor].Number)
			}
		case "o": // Open in browser
			if p.prCursor >= 0 && p.prCursor < len(p.ghPRs) {
				return p, ghViewPR(p.ghPRs[p.prCursor].Number)
			}
		case "m": // Merge
			if p.prCursor >= 0 && p.prCursor < len(p.ghPRs) {
				pr := p.ghPRs[p.prCursor]
				p.confirmMsg = fmt.Sprintf("Merge PR #%d \"%s\"?", pr.Number, pr.Title)
				p.confirmCmd = ghMergePR(pr.Number)
				p.modalMode = gitModalConfirm
			}
		case "esc":
			p.modalMode = gitModalNone
		}
		return p, nil
	}

	if p.noGit {
		return p, nil
	}

	// --- Normal mode ---
	switch key {
	case "tab":
		switch p.activePanel {
		case gitPanelFiles:
			p.activePanel = gitPanelCommits
		case gitPanelCommits:
			if len(p.ghPRs) > 0 {
				p.activePanel = gitPanelPRs
			} else {
				p.activePanel = gitPanelFiles
			}
		case gitPanelPRs:
			p.activePanel = gitPanelFiles
		}
	case "j", "down":
		switch p.activePanel {
		case gitPanelFiles:
			if p.cursor < len(p.files)-1 {
				p.cursor++
			}
		case gitPanelCommits:
			if p.commitCursor < len(p.commits)-1 {
				p.commitCursor++
			}
		case gitPanelPRs:
			if p.prCursor < len(p.ghPRs)-1 {
				p.prCursor++
			}
		}
	case "k", "up":
		switch p.activePanel {
		case gitPanelFiles:
			if p.cursor > 0 {
				p.cursor--
			}
		case gitPanelCommits:
			if p.commitCursor > 0 {
				p.commitCursor--
			}
		case gitPanelPRs:
			if p.prCursor > 0 {
				p.prCursor--
			}
		}
	case " ": // Stage/unstage
		if p.activePanel == gitPanelFiles && p.cursor >= 0 && p.cursor < len(p.files) {
			f := p.files[p.cursor]
			if f.Staged {
				return p, gitUnstageFile(f.Path)
			}
			return p, gitStageFile(f.Path)
		}
	case "a": // Stage all
		return p, gitStageAll()
	case "A": // Unstage all
		return p, gitUnstageAll()
	case "c": // Commit
		hasStaged := false
		for _, f := range p.files {
			if f.Staged {
				hasStaged = true
				break
			}
		}
		if !hasStaged {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Nothing to commit — stage files first with [space] or [a]", IsError: true}
			}
		}
		p.modalMode = gitModalCommit
		p.commitInput.SetValue("")
		return p, p.commitInput.Focus()
	case "b": // Branch switch
		p.modalMode = gitModalBranch
		p.branchCursor = 0
		// Set cursor to current branch
		for i, br := range p.branches {
			if br.IsCurrent {
				p.branchCursor = i
				break
			}
		}
	case "P": // Push (uppercase)
		if p.ahead == 0 && p.remoteBranch != "" {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Nothing to push — already up to date"}
			}
		}
		p.confirmMsg = fmt.Sprintf("Push %s to %s?", p.branch, p.remoteBranch)
		if p.remoteBranch == "" {
			p.confirmMsg = fmt.Sprintf("Push %s to origin? (no upstream set, will use --set-upstream)", p.branch)
			p.confirmCmd = runGitCmd("pushed", "push", "--set-upstream", "origin", p.branch)
		} else {
			p.confirmCmd = gitPush()
		}
		p.modalMode = gitModalConfirm
	case "p": // Pull
		if p.behind == 0 && p.remoteBranch != "" {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Nothing to pull — already up to date"}
			}
		}
		return p, gitPull()
	case "f": // Fetch
		return p, gitFetch()
	case "R": // Create PR (requires gh)
		if !p.hasGhCLI {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "gh CLI not installed. Install from https://cli.github.com", IsError: true}
			}
		}
		// Default base branch: main, then master, then first non-current branch
		p.prBaseBranch = p.defaultBaseBranch()
		p.modalMode = gitModalPRCreate
		p.prTitleInput.SetValue("")
		return p, p.prTitleInput.Focus()
	case "enter":
		// Open PR detail modal when PR panel is focused
		if p.activePanel == gitPanelPRs && p.prCursor >= 0 && p.prCursor < len(p.ghPRs) {
			p.modalMode = gitModalPRList
		}
	case "O": // Open PR list modal
		if len(p.ghPRs) > 0 {
			p.modalMode = gitModalPRList
			p.prCursor = 0
		}
	case "o": // Open selected PR in browser
		if p.activePanel == gitPanelPRs && p.prCursor >= 0 && p.prCursor < len(p.ghPRs) {
			return p, ghViewPR(p.ghPRs[p.prCursor].Number)
		}
	}
	return p, nil
}

// --- Layout ---

func (p *gitPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *gitPage) ShortHelp() string {
	return ""
}

func (p *gitPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "c", " ", "tab", "a", "A", "b", "P", "p", "f", "o", "O", "R", "enter"}
}

func (p *gitPage) HasModal() bool { return p.modalMode != gitModalNone
}

// --- btop-style key hint helper ---
// Renders the first letter of the action in a highlight color, rest in muted.
// Example: colorKey("s", "tage") => colored "s" + muted "tage"
func colorKey(key string, rest string, keyColor color.Color) string {
	return lipgloss.NewStyle().Foreground(keyColor).Bold(true).Render(key) +
		theme.TextMutedStyle.Render(rest)
}

func (p *gitPage) renderActionBar() string {
	hints := []string{
		colorKey("s", "tage", theme.Green),
		colorKey("a", "ll", theme.Green),
		colorKey("c", "ommit", theme.Amber),
		colorKey("b", "ranch", theme.Indigo),
		colorKey("p", "ull", theme.Cyan),
		colorKey("P", "ush", theme.Purple),
		colorKey("f", "etch", theme.TextSecondary),
	}
	if p.hasGhCLI {
		hints = append(hints,
			colorKey("R", " PR", theme.Green),
			colorKey("O", " PRs", theme.Amber),
		)
	}
	return strings.Join(hints, "  ")
}

// --- View ---

func (p *gitPage) View() string {
	if p.loading {
		return components.EmptyState("Loading git status...", p.width, p.height)
	}

	if p.noGit {
		return p.renderNoGit()
	}

	bg := p.renderGitPanels()

	switch p.modalMode {
	case gitModalCommit:
		return p.viewCommitModal(bg)
	case gitModalBranch:
		return p.viewBranchModal(bg)
	case gitModalConfirm:
		return p.viewConfirmModal(bg)
	case gitModalPRCreate:
		return p.viewPRCreateModal(bg)
	case gitModalPRList:
		return p.viewPRListModal(bg)
	}

	return bg
}

func (p *gitPage) renderNoGit() string {
	cwd := p.cwd
	if cwd == "" {
		cwd, _ = os.Getwd()
	}

	contentW := p.width - 4
	if contentW < 30 {
		contentW = 30
	}

	var lines []string
	lines = append(lines, theme.ErrorTextStyle.Render(theme.SymCross+" No git repository found"))
	lines = append(lines, "")
	lines = append(lines, theme.TextMutedStyle.Render("Current directory:"))
	lines = append(lines, theme.TextPrimaryStyle.Render("  "+cwd))
	lines = append(lines, "")
	lines = append(lines, theme.TextSecondaryStyle.Render("Run ltf1 from inside a git repository:"))
	lines = append(lines, "")
	lines = append(lines, theme.AccentTextStyle.Render("  cd /path/to/your/project && ltf1"))
	lines = append(lines, "")
	lines = append(lines, theme.TextDimStyle.Render("Or initialize a new repository:"))
	lines = append(lines, theme.AccentTextStyle.Render("  git init"))

	content := strings.Join(lines, "\n")

	var b strings.Builder
	b.WriteString("\n\n")
	b.WriteString(components.BorderedSection("GIT STATUS", content, contentW))
	return b.String()
}

func (p *gitPage) renderGitPanels() string {
	contentW := p.width - 2
	if contentW < 30 {
		contentW = 30
	}

	leftW := int(float64(contentW) * 0.5)
	rightW := contentW - leftW - 3

	var b strings.Builder

	// Row 1: Branch + Remotes
	branchBox := components.BorderedSection("BRANCH", p.renderBranchInfo(), leftW)
	remoteBox := components.BorderedSection("REMOTES", p.renderRemotes(), rightW)
	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, branchBox, "   ", remoteBox))
	b.WriteString("\n")

	// Row 2: Files + Diff
	filesHeader := "FILES"
	if p.activePanel == gitPanelFiles {
		filesHeader = "FILES"
	}
	filesBox := components.BorderedSection(filesHeader, p.renderFileList(leftW-4), leftW)
	diffBox := components.BorderedSection("DIFF", p.renderDiffPreview(rightW-4), rightW)
	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, filesBox, "   ", diffBox))
	b.WriteString("\n")

	// Row 3: Commits + Stash
	commitsHeader := "COMMITS"
	commitsBox := components.BorderedSection(commitsHeader, p.renderCommits(leftW-4), leftW)
	stashBox := components.BorderedSection("STASH", p.renderStash(rightW-4), rightW)
	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, commitsBox, "   ", stashBox))

	// Row 4: PRs + Issues (GitHub)
	if p.ghRepo != nil {
		b.WriteString("\n")
		prHeader := fmt.Sprintf("PULL REQUESTS (%d)", len(p.ghPRs))
		if p.activePanel == gitPanelPRs {
			prHeader += " " + theme.SymArrowRight
		}
		prBox := components.BorderedSection(
			prHeader,
			p.renderPRs(leftW-4),
			leftW,
		)
		issueBox := components.BorderedSection(
			fmt.Sprintf("ISSUES (%d)", len(p.ghIssues)),
			p.renderIssues(rightW-4),
			rightW,
		)
		b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, prBox, "   ", issueBox))
	}

	// Action bar
	b.WriteString("\n\n")
	b.WriteString("  " + p.renderActionBar())

	return b.String()
}

// --- Panel renderers ---

func (p *gitPage) renderBranchInfo() string {
	var lines []string
	lines = append(lines, theme.SuccessBoldStyle.Render(theme.SymDot+" "+p.branch))

	if p.remoteBranch != "" {
		lines = append(lines, theme.TextMutedStyle.Render("tracking ")+theme.TextSecondaryStyle.Render(p.remoteBranch))
		var sync []string
		if p.ahead > 0 {
			sync = append(sync, theme.SuccessTextStyle.Render(fmt.Sprintf("%d ahead", p.ahead)))
		}
		if p.behind > 0 {
			sync = append(sync, theme.ErrorTextStyle.Render(fmt.Sprintf("%d behind", p.behind)))
		}
		if len(sync) == 0 {
			sync = append(sync, theme.TextMutedStyle.Render("up to date"))
		}
		lines = append(lines, strings.Join(sync, "  "+theme.TextDimStyle.Render(theme.SymBullet)+"  "))
	} else {
		lines = append(lines, theme.TextMutedStyle.Render("no remote tracking"))
	}

	// Show local branch count
	localCount := 0
	for _, br := range p.branches {
		if !br.IsRemote {
			localCount++
		}
	}
	if localCount > 1 {
		lines = append(lines, theme.TextDimStyle.Render(fmt.Sprintf("%d local branches", localCount)))
	}

	return strings.Join(lines, "\n")
}

func (p *gitPage) renderRemotes() string {
	if len(p.remotes) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No remotes configured")
	}

	var lines []string
	for _, r := range p.remotes {
		parts := strings.SplitN(r, " ", 2)
		name := parts[0]
		url := ""
		if len(parts) > 1 {
			url = parts[1]
		}
		lines = append(lines, theme.AccentTextStyle.Render(name)+"  "+theme.TextMutedStyle.Render(url))
	}
	return strings.Join(lines, "\n")
}

func (p *gitPage) renderFileList(innerW int) string {
	if len(p.files) == 0 {
		return theme.SuccessTextStyle.Render(theme.SymCheck + " Working tree clean")
	}

	// Max visible file lines
	maxVisible := (p.height / 3) - 2
	if maxVisible < 5 {
		maxVisible = 5
	}

	total := len(p.files)
	cursor := p.cursor
	if p.activePanel != gitPanelFiles {
		cursor = -1
	}

	// Viewport window centered on cursor
	start := 0
	if total > maxVisible && cursor >= 0 {
		start = cursor - maxVisible/2
		if start < 0 {
			start = 0
		}
		if start+maxVisible > total {
			start = total - maxVisible
		}
	}
	end := start + maxVisible
	if end > total {
		end = total
	}

	// Count staged/unstaged
	stagedCount := 0
	unstagedCount := 0
	for _, f := range p.files {
		if f.Staged {
			stagedCount++
		} else {
			unstagedCount++
		}
	}

	// Build visible lines with right-side scrollbar
	var contentLines []string

	// Headers
	if stagedCount > 0 {
		contentLines = append(contentLines, theme.SuccessBoldStyle.Render(fmt.Sprintf("Staged (%d)", stagedCount)))
	}

	// Track if we've printed unstaged header
	printedUnstagedHeader := false
	prevWasStaged := true

	// Scroll up indicator
	if start > 0 {
		contentLines = append(contentLines, theme.TextDimStyle.Render(fmt.Sprintf("  %s %d more above", theme.SymArrowDown, start)))
	}

	selBg := lipgloss.NewStyle().Background(theme.BgHighlight).Bold(true)

	for i := start; i < end; i++ {
		f := p.files[i]

		// Print unstaged header at the transition point
		if !f.Staged && prevWasStaged && !printedUnstagedHeader {
			contentLines = append(contentLines, "")
			contentLines = append(contentLines, theme.ErrorTextStyle.Render(fmt.Sprintf("Unstaged (%d)", unstagedCount)))
			printedUnstagedHeader = true
		}
		prevWasStaged = f.Staged

		isSelected := cursor == i
		if f.Staged {
			icon := theme.SuccessTextStyle.Render(theme.SymCheck)
			label := gitStatusLabel(f.Status)
			line := "  " + icon + " " + f.Path + "  " + theme.TextMutedStyle.Render(label)
			if isSelected {
				line = selBg.Render(icon+" "+theme.ListItemTitleSelectedStyle.Render(f.Path)+"  "+theme.SuccessTextStyle.Render(label))
			}
			contentLines = append(contentLines, line)
		} else {
			sc := gitStatusColor(f.Status)
			icon := theme.ColorTextStyle(sc).Render(theme.SymDot)
			label := gitStatusLabel(f.Status)
			line := "  " + icon + " " + f.Path + "  " + theme.TextMutedStyle.Render(label)
			if isSelected {
				line = selBg.Render(icon+" "+theme.ListItemTitleSelectedStyle.Render(f.Path)+"  "+theme.ColorTextStyle(sc).Render(label))
			}
			contentLines = append(contentLines, line)
		}
	}

	// Scroll down indicator
	if end < total {
		contentLines = append(contentLines, theme.TextDimStyle.Render(fmt.Sprintf("  %s %d more below", theme.SymArrowDown, total-end)))
	}

	// If scrollable, add a right-side scrollbar track to each content line
	if total > maxVisible {
		trackH := len(contentLines)
		if trackH < 1 {
			trackH = 1
		}
		thumbPos := 0
		thumbSize := trackH * maxVisible / total
		if thumbSize < 1 {
			thumbSize = 1
		}
		if cursor >= 0 && total > 1 {
			thumbPos = cursor * (trackH - thumbSize) / (total - 1)
		}
		if thumbPos+thumbSize > trackH {
			thumbPos = trackH - thumbSize
		}
		if thumbPos < 0 {
			thumbPos = 0
		}

		for i := range contentLines {
			scrollChar := theme.TextDimStyle.Render("░")
			if i >= thumbPos && i < thumbPos+thumbSize {
				scrollChar = theme.AccentTextStyle.Render("█")
			}
			// Pad line to innerW then append scroll char
			visW := lipgloss.Width(contentLines[i])
			pad := innerW - visW - 2
			if pad < 0 {
				pad = 0
			}
			contentLines[i] = contentLines[i] + strings.Repeat(" ", pad) + scrollChar
		}
	}

	return strings.Join(contentLines, "\n")
}

func (p *gitPage) renderDiffPreview(innerW int) string {
	if p.activePanel != gitPanelFiles || p.cursor < 0 || p.cursor >= len(p.files) {
		return theme.TextMutedStyle.Render("Select a file to preview diff")
	}

	path := p.files[p.cursor].Path
	diff := p.getDiff(path)
	if diff == "" {
		return theme.TextMutedStyle.Render("No diff for " + path)
	}
	return diff
}

func (p *gitPage) renderCommits(innerW int) string {
	if len(p.commits) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No commits")
	}

	total := len(p.commits)
	maxVisible := (p.height / 3) - 2
	if maxVisible < 5 {
		maxVisible = 5
	}

	cursor := p.commitCursor
	if p.activePanel != gitPanelCommits {
		cursor = -1
	}

	start := 0
	if total > maxVisible && cursor >= 0 {
		start = cursor - maxVisible/2
		if start < 0 {
			start = 0
		}
		if start+maxVisible > total {
			start = total - maxVisible
		}
	}
	end := start + maxVisible
	if end > total {
		end = total
	}

	var lines []string

	if start > 0 {
		lines = append(lines, theme.TextDimStyle.Render(fmt.Sprintf("  %s %d more above", theme.SymArrowDown, start)))
	}

	for i := start; i < end; i++ {
		c := p.commits[i]
		isSelected := p.activePanel == gitPanelCommits && i == p.commitCursor

		hash := theme.AccentTextStyle.Render(c.Hash)
		msg := c.Message
		if len(msg) > 40 {
			msg = msg[:39] + theme.SymEllipsis
		}
		timeStr := theme.TextDimStyle.Render(c.Time)

		line := hash + " " + theme.TextSecondaryStyle.Render(msg) + "  " + timeStr
		if isSelected {
			selBg := lipgloss.NewStyle().Background(theme.BgHighlight).Bold(true)
			line = selBg.Render(hash + " " + theme.ListItemTitleSelectedStyle.Render(msg) + "  " + timeStr)
		}
		lines = append(lines, line)
	}

	if end < total {
		lines = append(lines, theme.TextDimStyle.Render(fmt.Sprintf("  %s %d more below", theme.SymArrowDown, total-end)))
	}

	// Right-side scrollbar
	if total > maxVisible {
		trackH := len(lines)
		if trackH < 1 {
			trackH = 1
		}
		thumbSize := trackH * maxVisible / total
		if thumbSize < 1 {
			thumbSize = 1
		}
		thumbPos := 0
		if cursor >= 0 && total > 1 {
			thumbPos = cursor * (trackH - thumbSize) / (total - 1)
		}
		if thumbPos < 0 {
			thumbPos = 0
		}
		if thumbPos+thumbSize > trackH {
			thumbPos = trackH - thumbSize
		}

		for i := range lines {
			sc := theme.TextDimStyle.Render("░")
			if i >= thumbPos && i < thumbPos+thumbSize {
				sc = theme.AccentTextStyle.Render("█")
			}
			visW := lipgloss.Width(lines[i])
			pad := innerW - visW - 2
			if pad < 0 {
				pad = 0
			}
			lines[i] = lines[i] + strings.Repeat(" ", pad) + sc
		}
	}

	return strings.Join(lines, "\n")
}

func (p *gitPage) renderStash(innerW int) string {
	if len(p.stashes) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No stashes")
	}

	var lines []string
	for _, s := range p.stashes {
		idx := theme.AccentTextStyle.Render(fmt.Sprintf("stash@{%d}", s.Index))
		lines = append(lines, idx+" "+theme.TextSecondaryStyle.Render(s.Message))
	}
	return strings.Join(lines, "\n")
}

// --- GitHub panels ---

func (p *gitPage) renderPRs(innerW int) string {
	if len(p.ghPRs) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No open pull requests")
	}

	var lines []string
	max := 8
	if len(p.ghPRs) < max {
		max = len(p.ghPRs)
	}

	for i := 0; i < max; i++ {
		pr := p.ghPRs[i]
		number := theme.AccentTextStyle.Render(fmt.Sprintf("#%d", pr.Number))

		title := pr.Title
		if len(title) > 35 {
			title = title[:34] + theme.SymEllipsis
		}

		// Status indicator
		stateIcon := theme.SuccessTextStyle.Render(theme.SymDot) // open = green
		if pr.Draft {
			stateIcon = theme.TextMutedStyle.Render(theme.SymDotEmpty) // draft = muted
		}

		author := theme.TextMutedStyle.Render(pr.User.Login)
		branch := theme.TextDimStyle.Render(pr.Head.Ref)

		isSelected := p.activePanel == gitPanelPRs && i == p.prCursor
		if isSelected {
			selBg := lipgloss.NewStyle().Background(theme.BgHighlight).Bold(true)
			line := stateIcon + " " + number + " " + theme.ListItemTitleSelectedStyle.Render(title)
			lines = append(lines, selBg.Render(line))
			lines = append(lines, "    "+branch+" "+theme.TextDimStyle.Render(theme.SymArrowRight)+" "+theme.TextMutedStyle.Render(pr.BaseRef.Ref)+"  "+author)
		} else {
			lines = append(lines, "  "+stateIcon+" "+number+" "+theme.TextSecondaryStyle.Render(title)+"  "+author)
		}
	}

	return strings.Join(lines, "\n")
}

func (p *gitPage) renderIssues(innerW int) string {
	if len(p.ghIssues) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No open issues")
	}

	var lines []string
	max := 8
	if len(p.ghIssues) < max {
		max = len(p.ghIssues)
	}

	for i := 0; i < max; i++ {
		issue := p.ghIssues[i]
		number := theme.AccentTextStyle.Render(fmt.Sprintf("#%d", issue.Number))

		title := issue.Title
		if len(title) > 35 {
			title = title[:34] + theme.SymEllipsis
		}

		stateIcon := theme.SuccessTextStyle.Render(theme.SymDot)
		author := theme.TextMutedStyle.Render(issue.User.Login)

		// Labels
		var labelParts []string
		for _, l := range issue.Labels {
			labelParts = append(labelParts, theme.TextDimStyle.Render(l.Name))
		}
		labels := ""
		if len(labelParts) > 0 {
			labels = "  " + strings.Join(labelParts, " ")
		}

		lines = append(lines, "  "+stateIcon+" "+number+" "+theme.TextSecondaryStyle.Render(title)+"  "+author+labels)
	}

	return strings.Join(lines, "\n")
}

// --- Diff ---

func (p *gitPage) getDiff(path string) string {
	out, err := exec.Command("git", "diff", "--", path).Output()
	if err != nil || len(out) == 0 {
		out, err = exec.Command("git", "diff", "--cached", "--", path).Output()
		if err != nil || len(out) == 0 {
			return ""
		}
	}

	maxLineW := (p.width / 2) - 10
	if maxLineW < 20 {
		maxLineW = 20
	}

	maxLines := (p.height / 3) - 2
	if maxLines < 5 {
		maxLines = 5
	}

	lines := strings.Split(string(out), "\n")
	total := len(lines)
	if total > maxLines {
		lines = lines[:maxLines]
	}

	var colored []string
	for _, line := range lines {
		if len(line) > maxLineW {
			line = line[:maxLineW-1] + theme.SymEllipsis
		}
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

	if total > maxLines {
		colored = append(colored, theme.TextDimStyle.Render(fmt.Sprintf("  %s %d more lines", theme.SymArrowDown, total-maxLines)))
	}

	return strings.Join(colored, "\n")
}

// --- Modals ---

func (p *gitPage) viewCommitModal(bg string) string {
	// Set input width to fit inside modal (modal is 2/3 width, minus padding/border)
	inputW := (p.width * 2 / 3) - 10
	if inputW < 30 {
		inputW = 30
	}
	if inputW > 70 {
		inputW = 70
	}
	p.commitInput.SetWidth(inputW)

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("COMMIT CHANGES"))
	lines = append(lines, "")

	// Show max 8 staged files, summarize the rest
	stagedFiles := 0
	shown := 0
	for _, f := range p.files {
		if f.Staged {
			stagedFiles++
			if shown < 8 {
				lines = append(lines, theme.SuccessTextStyle.Render(theme.SymCheck+" "+f.Path))
				shown++
			}
		}
	}
	if stagedFiles > 8 {
		lines = append(lines, theme.TextDimStyle.Render(fmt.Sprintf("  ... and %d more files", stagedFiles-8)))
	}

	lines = append(lines, "")
	lines = append(lines, p.commitInput.View())
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "commit"),
		components.KeyHint("esc", "cancel"),
	))
	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Green)
}

func (p *gitPage) viewBranchModal(bg string) string {
	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("SWITCH BRANCH"))
	lines = append(lines, "")

	// Local branches first, then remote
	localLabel := false
	remoteLabel := false
	for i, br := range p.branches {
		if !br.IsRemote && !localLabel {
			lines = append(lines, theme.SuccessBoldStyle.Render("Local"))
			localLabel = true
		}
		if br.IsRemote && !remoteLabel {
			lines = append(lines, "")
			lines = append(lines, theme.AccentTextStyle.Render("Remote"))
			remoteLabel = true
		}

		isSelected := i == p.branchCursor
		prefix := "  "
		nameStyle := theme.TextSecondaryStyle
		suffix := ""

		if br.IsCurrent {
			suffix = "  " + theme.SuccessTextStyle.Render(theme.SymDot+" current")
		}

		if isSelected {
			prefix = theme.SidebarSelectedMarkerStyle.Render(theme.SymBar) + " "
			nameStyle = theme.ListItemTitleSelectedStyle
			line := prefix + nameStyle.Render(br.Name) + suffix
			lines = append(lines, theme.ListItemSelected.Render(line))
		} else {
			lines = append(lines, prefix+nameStyle.Render(br.Name)+suffix)
		}
	}

	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "checkout"),
		components.KeyHint("esc", "cancel"),
	))

	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Indigo)
}

func (p *gitPage) viewConfirmModal(bg string) string {
	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("CONFIRM"))
	lines = append(lines, "")
	lines = append(lines, theme.TextSecondaryStyle.Render(p.confirmMsg))
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("y", "yes"),
		components.KeyHint("n", "no"),
	))
	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Amber)
}

func (p *gitPage) viewPRCreateModal(bg string) string {
	inputW := (p.width * 2 / 3) - 10
	if inputW < 30 {
		inputW = 30
	}
	if inputW > 70 {
		inputW = 70
	}
	p.prTitleInput.SetWidth(inputW)

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("CREATE PULL REQUEST"))
	lines = append(lines, "")
	lines = append(lines, theme.TextMutedStyle.Render("From:  ")+theme.SuccessTextStyle.Render(p.branch))
	lines = append(lines, theme.TextMutedStyle.Render("Into:  ")+theme.AccentTextStyle.Render(p.prBaseBranch)+
		theme.TextDimStyle.Render("  [tab] to change"))
	lines = append(lines, "")
	lines = append(lines, theme.TextMutedStyle.Render("Title:"))
	lines = append(lines, p.prTitleInput.View())
	lines = append(lines, "")
	lines = append(lines, theme.TextDimStyle.Render("Body will be auto-filled from commits"))
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "create"),
		components.KeyHint("tab", "change base"),
		components.KeyHint("esc", "cancel"),
	))
	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Green)
}

func (p *gitPage) viewPRListModal(bg string) string {
	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("PULL REQUESTS"))
	lines = append(lines, "")

	if len(p.ghPRs) == 0 {
		lines = append(lines, theme.TextMutedStyle.Render(theme.SymDotEmpty+" No open pull requests"))
		lines = append(lines, "")
		lines = append(lines, components.KeyHint("esc", "close"))
		return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Indigo)
	}

	for i, pr := range p.ghPRs {
		isSelected := i == p.prCursor
		number := theme.AccentTextStyle.Render(fmt.Sprintf("#%d", pr.Number))
		title := pr.Title
		if len(title) > 50 {
			title = title[:49] + theme.SymEllipsis
		}

		stateIcon := theme.SuccessTextStyle.Render(theme.SymDot)
		stateLabel := "open"
		if pr.Draft {
			stateIcon = theme.TextMutedStyle.Render(theme.SymDotEmpty)
			stateLabel = "draft"
		}

		if isSelected {
			// Selected PR — show full detail card
			lines = append(lines, "")
			selBg := lipgloss.NewStyle().Background(theme.BgHighlight)
			headerLine := stateIcon + " " + number + " " + theme.ListItemTitleSelectedStyle.Render(title)
			lines = append(lines, selBg.Render(headerLine))
			lines = append(lines, "")

			// Branch flow
			lines = append(lines,
				"    "+theme.SuccessTextStyle.Render(pr.Head.Ref)+
					theme.TextDimStyle.Render(" "+theme.SymArrowRight+" ")+
					theme.AccentTextStyle.Render(pr.BaseRef.Ref))

			// Metadata
			author := pr.User.Login
			lines = append(lines, "    "+theme.TextMutedStyle.Render("Author:  ")+theme.TextPrimaryStyle.Render(author))
			lines = append(lines, "    "+theme.TextMutedStyle.Render("Status:  ")+theme.TextSecondaryStyle.Render(stateLabel))

			// Stats
			if pr.Additions > 0 || pr.Deletions > 0 {
				stats := theme.SuccessTextStyle.Render(fmt.Sprintf("+%d", pr.Additions)) +
					theme.TextDimStyle.Render(" / ") +
					theme.ErrorTextStyle.Render(fmt.Sprintf("-%d", pr.Deletions))
				lines = append(lines, "    "+theme.TextMutedStyle.Render("Changes: ")+stats)
			}
			if pr.Comments > 0 {
				lines = append(lines, "    "+theme.TextMutedStyle.Render("Comments: ")+theme.TextPrimaryStyle.Render(fmt.Sprintf("%d", pr.Comments)))
			}

			lines = append(lines, "")
		} else {
			author := theme.TextMutedStyle.Render(pr.User.Login)
			lines = append(lines, "  "+stateIcon+" "+number+" "+theme.TextSecondaryStyle.Render(title)+"  "+author)
		}
	}

	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "checkout branch"),
		components.KeyHint("o", "open in browser"),
		components.KeyHint("m", "merge"),
		components.KeyHint("esc", "close"),
	))
	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Indigo)
}

// --- Branch helpers ---

func (p *gitPage) localBranchNames() []string {
	var names []string
	for _, br := range p.branches {
		if !br.IsRemote {
			names = append(names, br.Name)
		}
	}
	return names
}

func (p *gitPage) defaultBaseBranch() string {
	locals := p.localBranchNames()
	for _, name := range locals {
		if name == "main" {
			return "main"
		}
	}
	for _, name := range locals {
		if name == "master" {
			return "master"
		}
	}
	for _, name := range locals {
		if name != p.branch {
			return name
		}
	}
	return "main"
}

// --- Helpers ---

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

func gitStatusLabel(status string) string {
	switch {
	case strings.Contains(status, "A"):
		return "added"
	case strings.Contains(status, "M"):
		return "modified"
	case strings.Contains(status, "D"):
		return "deleted"
	case strings.Contains(status, "R"):
		return "renamed"
	case strings.Contains(status, "?"):
		return "untracked"
	default:
		return status
	}
}
