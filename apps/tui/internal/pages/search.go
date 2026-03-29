package pages

import (
	"fmt"
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- data types ---

type searchResultKind string

const (
	searchKindTask    searchResultKind = "task"
	searchKindBug     searchResultKind = "bug"
	searchKindSprint  searchResultKind = "sprint"
	searchKindProject searchResultKind = "project"
)

type searchResult struct {
	ID    string
	Ref   string // e.g. "PROJ-123"
	Title string
	Kind  searchResultKind
}

// --- messages ---

type searchResultsMsg struct {
	results []searchResult
}

type searchErrMsg struct {
	err error
}

// --- model ---

type searchModel struct {
	input   textinput.Model
	results []searchResult
	cursor  int
	width   int
	height  int
	loading bool
	err     error
	client  *api.ConvexClient
	config  *api.AuthConfig
}

func NewSearchPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	ti := textinput.New()
	ti.Placeholder = "Search tasks, sprints, projects..."
	ti.Focus()
	ti.CharLimit = 128
	ti.SetWidth(50)

	return &searchModel{
		input:  ti,
		client: client,
		config: config,
	}
}

// PageModel interface

func (m *searchModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m *searchModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		w := m.width - 12
		if w < 30 {
			w = 30
		}
		m.input.SetWidth(w)
		return m, nil

	case searchResultsMsg:
		m.results = msg.results
		m.loading = false
		m.cursor = 0
		return m, nil

	case searchErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			if m.input.Focused() && m.input.Value() != "" {
				m.loading = true
				m.err = nil
				return m, m.doSearch(m.input.Value())
			}
		case "tab":
			if m.input.Focused() && len(m.results) > 0 {
				m.input.Blur()
			} else {
				m.input.Focus()
			}
			return m, nil
		case "j", "down":
			if !m.input.Focused() && m.cursor < len(m.results)-1 {
				m.cursor++
			}
		case "k", "up":
			if !m.input.Focused() && m.cursor > 0 {
				m.cursor--
			}
		case "esc":
			if !m.input.Focused() {
				m.input.Focus()
				return m, nil
			}
		}
	}

	// Update text input
	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	cmds = append(cmds, cmd)

	return m, tea.Batch(cmds...)
}

func (m *searchModel) View(width, height int) string {
	header := theme.AccentStyle.Render("  SEARCH")

	contentWidth := width - 4
	if contentWidth < 40 {
		contentWidth = 60
	}

	// search input box
	searchIcon := lipgloss.NewStyle().Foreground(theme.AccentColor).Render("\u2315 ") // ⌕
	inputContent := searchIcon + m.input.View()
	inputBox := theme.SubtlePanel.Width(contentWidth).Render(inputContent)

	parts := []string{"", header, "", inputBox}

	// loading
	if m.loading {
		parts = append(parts, "", theme.MutedStyle.Render("  Searching..."))
		return lipgloss.JoinVertical(lipgloss.Left, parts...)
	}

	// error
	if m.err != nil {
		parts = append(parts, "", theme.ErrorStyle.Render("  Error: "+m.err.Error()))
		return lipgloss.JoinVertical(lipgloss.Left, parts...)
	}

	// results
	if len(m.results) > 0 {
		resultsHeader := lipgloss.NewStyle().
			Bold(true).
			Foreground(theme.TextSecondary).
			Render(fmt.Sprintf("  RESULTS (%d)", len(m.results)))

		var rows []string
		for i, r := range m.results {
			cursor := "  "
			if !m.input.Focused() && i == m.cursor {
				cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
			}

			kindStyle := searchKindStyle(r.Kind)

			icon := "\u2610" // ☐
			if r.Kind == searchKindSprint {
				icon = "\u27f3" // ⟳
			}

			ref := lipgloss.NewStyle().Foreground(theme.TextSecondary).Width(12).Render(r.Ref)
			title := lipgloss.NewStyle().Foreground(theme.TextColor).Render(r.Title)
			kindLabel := kindStyle.Render(string(r.Kind))

			rows = append(rows, fmt.Sprintf("%s%s %s %s    %s", cursor, kindStyle.Render(icon), ref, title, kindLabel))
		}

		resultBox := theme.ActivePanel.Width(contentWidth).Render(strings.Join(rows, "\n"))
		parts = append(parts, "", resultsHeader, resultBox)
	} else if m.input.Value() != "" && !m.loading {
		parts = append(parts, "", theme.MutedStyle.Render("  No results found."))
	}

	// footer hints
	hintKey := lipgloss.NewStyle().Foreground(theme.AccentColor)
	hint := theme.DimStyle
	footer := fmt.Sprintf("  %s %s  %s %s  %s %s",
		hintKey.Render("enter"), hint.Render("search"),
		hintKey.Render("tab"), hint.Render("toggle results"),
		hintKey.Render("j/k"), hint.Render("navigate"))
	parts = append(parts, "", footer)

	return lipgloss.JoinVertical(lipgloss.Left, parts...)
}

func (m *searchModel) SetSize(width, height int) {
	m.width = width
	m.height = height
	w := width - 12
	if w < 30 {
		w = 30
	}
	m.input.SetWidth(w)
}

func (m *searchModel) ShortHelp() string {
	return "enter search | tab toggle results | j/k navigate"
}

// --- helpers ---

func searchKindStyle(kind searchResultKind) lipgloss.Style {
	switch kind {
	case searchKindTask:
		return lipgloss.NewStyle().Foreground(theme.AccentColor)
	case searchKindBug:
		return lipgloss.NewStyle().Foreground(theme.RedColor)
	case searchKindSprint:
		return lipgloss.NewStyle().Foreground(theme.CyanColor)
	case searchKindProject:
		return lipgloss.NewStyle().Foreground(theme.PurpleColor)
	default:
		return lipgloss.NewStyle().Foreground(theme.TextSecondary)
	}
}

// --- commands ---

func (m *searchModel) doSearch(query string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return searchResultsMsg{results: sampleSearchResults(query)}
		}
		// Use Convex full-text search if available, otherwise fall back to sample
		// In production this would call a search endpoint
		return searchResultsMsg{results: sampleSearchResults(query)}
	}
}

func sampleSearchResults(query string) []searchResult {
	all := []searchResult{
		{ID: "1", Ref: "PROJ-123", Title: "Implement auth flow", Kind: searchKindTask},
		{ID: "2", Ref: "PROJ-145", Title: "Fix login timeout", Kind: searchKindBug},
		{ID: "3", Ref: "Sprint 3", Title: "Ship Auth Feature", Kind: searchKindSprint},
		{ID: "4", Ref: "PROJ-200", Title: "Auth middleware refactor", Kind: searchKindTask},
		{ID: "5", Ref: "LTF1-Core", Title: "Core authentication project", Kind: searchKindProject},
	}
	q := strings.ToLower(query)
	var filtered []searchResult
	for _, r := range all {
		if strings.Contains(strings.ToLower(r.Title), q) ||
			strings.Contains(strings.ToLower(r.Ref), q) {
			filtered = append(filtered, r)
		}
	}
	if len(filtered) == 0 {
		return all[:3]
	}
	return filtered
}
