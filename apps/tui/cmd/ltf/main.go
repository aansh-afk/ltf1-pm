// Package main is the entry point for the ltf CLI binary.
package main

import (
	"fmt"
	"os"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/commands"
)

// defaultConvexURL is set at build time via:
//
//	go build -ldflags "-X main.defaultConvexURL=https://your-deployment.convex.cloud"
var defaultConvexURL string

func main() {
	commands.DefaultConvexURL = defaultConvexURL
	if err := commands.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
