package components

import (
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
	"github.com/muesli/ansi"
	"github.com/muesli/reflow/truncate"
)

// PlaceOverlay composites fg on top of bg at position (x, y).
// This preserves the background content on both sides of the overlay,
// using ANSI-aware string operations so styled text isn't corrupted.
// Borrowed from OpenCode / lipgloss PR #102.
func PlaceOverlay(x, y int, fg, bg string) string {
	fgLines, fgWidth := getLines(fg)
	bgLines, bgWidth := getLines(bg)
	bgHeight := len(bgLines)
	fgHeight := len(fgLines)

	if fgWidth >= bgWidth && fgHeight >= bgHeight {
		return fg
	}

	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	if x > bgWidth-fgWidth {
		x = bgWidth - fgWidth
	}
	if y > bgHeight-fgHeight {
		y = bgHeight - fgHeight
	}

	var b strings.Builder
	for i, bgLine := range bgLines {
		if i > 0 {
			b.WriteByte('\n')
		}
		if i < y || i >= y+fgHeight {
			b.WriteString(bgLine)
			continue
		}

		// Left portion of background
		if x > 0 {
			left := truncate.String(bgLine, uint(x))
			b.WriteString(left)
			leftW := ansi.PrintableRuneWidth(left)
			if leftW < x {
				b.WriteString(strings.Repeat(" ", x-leftW))
			}
		}

		// Foreground line
		fgLine := fgLines[i-y]
		b.WriteString(fgLine)

		// Right portion of background
		pos := x + ansi.PrintableRuneWidth(fgLine)
		if pos < bgWidth {
			right := cutLeft(bgLine, pos)
			rightW := ansi.PrintableRuneWidth(right)
			if rightW < bgWidth-pos {
				b.WriteString(strings.Repeat(" ", bgWidth-pos-rightW))
			}
			b.WriteString(right)
		}
	}

	return b.String()
}

// OverlayModal renders a modal box centered on top of background content.
// The background is fully preserved and visible around the modal.
func OverlayModal(background, modalContent string, width, height int, borderColor color.Color) string {
	if width < 10 {
		width = 10
	}
	if height < 5 {
		height = 5
	}

	// Modal sizing
	modalW := width * 2 / 3
	if modalW < 40 {
		modalW = 40
	}
	if modalW > 80 {
		modalW = 80
	}

	// Cap content height
	maxContentH := height - 6
	if maxContentH < 5 {
		maxContentH = 5
	}
	contentLines := strings.Split(modalContent, "\n")
	if len(contentLines) > maxContentH {
		contentLines = contentLines[:maxContentH]
		contentLines = append(contentLines, theme.TextDimStyle.Render("..."))
	}
	modalContent = strings.Join(contentLines, "\n")

	// Render modal box
	box := lipgloss.NewStyle().
		Background(theme.BgElevated).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(borderColor).
		Padding(1, 2).
		Width(modalW).
		Render(modalContent)

	boxH := lipgloss.Height(box)
	boxW := lipgloss.Width(box)

	// Ensure background fills full dimensions
	bgLines := strings.Split(background, "\n")
	for len(bgLines) < height {
		bgLines = append(bgLines, "")
	}
	if len(bgLines) > height {
		bgLines = bgLines[:height]
	}
	// Pad each bg line to full width
	for i, line := range bgLines {
		w := ansi.PrintableRuneWidth(line)
		if w < width {
			bgLines[i] = line + strings.Repeat(" ", width-w)
		}
	}
	background = strings.Join(bgLines, "\n")

	// Center the modal
	col := (width - boxW) / 2
	row := (height - boxH) / 2

	return PlaceOverlay(col, row, box, background)
}

// getLines splits string into lines and returns the widest line width.
func getLines(s string) ([]string, int) {
	lines := strings.Split(s, "\n")
	widest := 0
	for _, l := range lines {
		w := ansi.PrintableRuneWidth(l)
		if w > widest {
			widest = w
		}
	}
	return lines, widest
}

// cutLeft cuts printable characters from the left of a string.
func cutLeft(s string, cutWidth int) string {
	var (
		pos    int
		isAnsi bool
		ab     strings.Builder
		result strings.Builder
	)

	for _, c := range s {
		if c == '\x1b' {
			isAnsi = true
			ab.Reset()
			ab.WriteRune(c)
			continue
		}
		if isAnsi {
			ab.WriteRune(c)
			if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') {
				isAnsi = false
				if pos >= cutWidth {
					result.WriteString(ab.String())
				}
			}
			continue
		}

		if pos >= cutWidth {
			result.WriteRune(c)
		}
		pos++
	}

	return result.String()
}

// ModalModel holds modal state.
type ModalModel struct {
	Title    string
	Status   string
	Priority string
	Meta     [][2]string
	Body     string
	Hints    string
	Visible  bool
}

func NewModal() ModalModel {
	return ModalModel{}
}

func (m *ModalModel) Show(title, body, hints string) {
	m.Title = title
	m.Body = body
	m.Hints = hints
	m.Visible = true
}

func (m *ModalModel) ShowDetail(title, status, priority, body string, meta [][2]string, hints string) {
	m.Title = title
	m.Status = status
	m.Priority = priority
	m.Meta = meta
	m.Body = body
	m.Hints = hints
	m.Visible = true
}

func (m *ModalModel) Hide() {
	m.Visible = false
	m.Status = ""
	m.Priority = ""
	m.Meta = nil
}

func (m ModalModel) View(width, height int) string {
	if !m.Visible {
		return ""
	}

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render(strings.ToUpper(m.Title)))

	if m.Status != "" || m.Priority != "" {
		var statusLine string
		if m.Status != "" {
			statusLine = StatusBadge(m.Status)
		}
		if m.Priority != "" {
			if statusLine != "" {
				statusLine += theme.TextDimStyle.Render(" "+theme.SymBullet+" ")
			}
			statusLine += PriorityBadgePlain(m.Priority)
		}
		lines = append(lines, statusLine)
	}

	if len(m.Meta) > 0 || m.Body != "" {
		lines = append(lines, "")
	}

	for _, kv := range m.Meta {
		lines = append(lines, theme.TextMutedStyle.Render(kv[0]+": ")+theme.TextPrimaryStyle.Render(kv[1]))
	}

	if m.Body != "" {
		if len(m.Meta) > 0 {
			lines = append(lines, "")
		}
		lines = append(lines, theme.TextSecondaryStyle.Render(m.Body))
	}

	if m.Hints != "" {
		lines = append(lines, "")
		lines = append(lines, m.Hints)
	}

	return OverlayModal("", strings.Join(lines, "\n"), width, height, theme.BorderDefault)
}
