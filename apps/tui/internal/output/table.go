package output

import (
	"fmt"
	"strings"
)

// Column defines a table column.
type Column struct {
	Header string
	Width  int // 0 = auto-size
}

// Table renders a simple ASCII table.
type Table struct {
	Columns []Column
	Rows    [][]string
}

// NewTable creates a new table with the given column headers.
func NewTable(headers ...string) *Table {
	cols := make([]Column, len(headers))
	for i, h := range headers {
		cols[i] = Column{Header: h}
	}
	return &Table{Columns: cols}
}

// AddRow appends a row to the table.
func (t *Table) AddRow(values ...string) {
	t.Rows = append(t.Rows, values)
}

// Render returns the table as a string.
func (t *Table) Render() string {
	if len(t.Columns) == 0 {
		return ""
	}

	// Calculate column widths
	widths := make([]int, len(t.Columns))
	for i, c := range t.Columns {
		widths[i] = visibleLen(c.Header)
		if c.Width > widths[i] {
			widths[i] = c.Width
		}
	}
	for _, row := range t.Rows {
		for i, cell := range row {
			if i >= len(widths) {
				continue
			}
			l := visibleLen(cell)
			if l > widths[i] {
				widths[i] = l
			}
		}
	}

	var sb strings.Builder

	// Header row
	for i, c := range t.Columns {
		sb.WriteString(Colorize(Bold, padRight(c.Header, widths[i])))
		if i < len(t.Columns)-1 {
			sb.WriteString("  ")
		}
	}
	sb.WriteString("\n")

	// Separator
	for i, w := range widths {
		sb.WriteString(Colorize(Gray, strings.Repeat("─", w)))
		if i < len(widths)-1 {
			sb.WriteString("  ")
		}
	}
	sb.WriteString("\n")

	// Data rows
	for _, row := range t.Rows {
		for i, cell := range row {
			if i >= len(widths) {
				break
			}
			sb.WriteString(padRight(cell, widths[i]))
			if i < len(t.Columns)-1 {
				sb.WriteString("  ")
			}
		}
		sb.WriteString("\n")
	}

	return sb.String()
}

// Print renders and prints the table.
func (t *Table) Print() {
	fmt.Print(t.Render())
}

// padRight pads s with spaces on the right to the given visible width.
// Accounts for ANSI color codes that don't take up visible space.
func padRight(s string, width int) string {
	visible := visibleLen(s)
	if visible >= width {
		return s
	}
	return s + strings.Repeat(" ", width-visible)
}

// visibleLen returns the visible length of s, ignoring ANSI escape sequences.
func visibleLen(s string) int {
	count := 0
	inEscape := false
	for _, r := range s {
		if inEscape {
			if r == 'm' {
				inEscape = false
			}
			continue
		}
		if r == '\033' {
			inEscape = true
			continue
		}
		count++
	}
	return count
}
