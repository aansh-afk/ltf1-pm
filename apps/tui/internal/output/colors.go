// Package output provides terminal output utilities for the ltf1 CLI.
package output

import (
	"fmt"
	"os"
)

// ANSI color codes (no external dependencies).
const (
	Reset   = "\033[0m"
	Bold    = "\033[1m"
	Dim     = "\033[2m"
	Italic  = "\033[3m"

	Black   = "\033[30m"
	Red     = "\033[31m"
	Green   = "\033[32m"
	Yellow  = "\033[33m"
	Blue    = "\033[34m"
	Magenta = "\033[35m"
	Cyan    = "\033[36m"
	White   = "\033[37m"
	Gray    = "\033[90m"

	BoldRed     = "\033[1;31m"
	BoldGreen   = "\033[1;32m"
	BoldYellow  = "\033[1;33m"
	BoldMagenta = "\033[1;35m"
)

// noColor is set globally to disable color output.
var noColor bool

// SetNoColor disables colored output globally.
func SetNoColor(b bool) {
	noColor = b || os.Getenv("NO_COLOR") != ""
}

// Colorize wraps text with the given color code, or returns it plain if no-color is set.
func Colorize(color, text string) string {
	if noColor {
		return text
	}
	return color + text + Reset
}

// Println prints with optional color.
func Println(color, text string) {
	fmt.Println(Colorize(color, text))
}

// Successf prints a success message.
func Successf(format string, args ...any) {
	fmt.Println(Colorize(Green, "✓ ") + fmt.Sprintf(format, args...))
}

// Errorf prints an error message to stderr.
func Errorf(format string, args ...any) {
	fmt.Fprintln(os.Stderr, Colorize(Red, "✕ ")+fmt.Sprintf(format, args...))
}

// Warningf prints a warning message.
func Warningf(format string, args ...any) {
	fmt.Println(Colorize(Yellow, "! ") + fmt.Sprintf(format, args...))
}

// Infof prints an info message.
func Infof(format string, args ...any) {
	fmt.Println(Colorize(Blue, "› ") + fmt.Sprintf(format, args...))
}

// Header prints a section header.
func Header(text string) {
	fmt.Println()
	fmt.Println(Colorize(Bold, text))
	fmt.Println(Colorize(Gray, repeatStr("─", len(text))))
}

// Divider prints a horizontal line.
func Divider(width int) {
	if width <= 0 {
		width = 60
	}
	fmt.Println(Colorize(Gray, repeatStr("─", width)))
}

func repeatStr(s string, n int) string {
	if n <= 0 {
		return ""
	}
	out := ""
	for i := 0; i < n; i++ {
		out += s
	}
	return out
}
