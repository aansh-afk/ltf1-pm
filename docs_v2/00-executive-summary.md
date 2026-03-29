# Executive Summary — ltf1-pm (LTF1)

## What This Is

ltf1-pm is a **git-native, agent-ready project management platform** built for developers who ship code, not developers who update tickets. The platform spans three surfaces — web app, terminal TUI, and CLI — unified by a real-time Convex backend, Clerk authentication, and a dark brutalist design language.

**Version**: 0.5.0 (Early Access Beta)
**License**: AGPL-3.0 (open source, self-hostable)
**Stack**: React 18 + Vite + Convex + Clerk + Tailwind + Ink (TUI)

---

## Current State

### What's Built

| Surface | Status | Quality |
|---------|--------|---------|
| **Web App** | 47 pages, 122 feature components, 20 themes | Production-ready (8.5/10) |
| **CLI/TUI** | 14 command groups, 7 TUI pages, daemon | Production-ready (8/10) |
| **Convex Backend** | 60+ tables, 200+ queries/mutations, 8 cron jobs | Production-ready (8/10) |
| **GitHub Integration** | Bi-directional sync, webhooks, team mapping | Production-ready (9/10) |
| **AI Features** | Task suggestions, insights, developer matching | Functional (6/10) |
| **Landing/Marketing** | 8-section landing, features, pricing, legal pages | Production-ready (8.5/10) |

### Core Value Proposition

> "Your repo is the source of truth. Tasks update themselves when you push code. Story points estimated from your diff. Velocity measured from actual shipping data."

### Key Differentiators

1. **Terminal-First**: Full TUI with dashboard, task management, sprint planning, git integration — no competitor has this
2. **Git-Native**: Commits, PRs, and branches are first-class events that drive task lifecycle automatically
3. **Dark Brutalist Design**: #050505 backgrounds, 2px borders, IBM Plex Mono, zero border-radius — memorable identity
4. **Real-Time**: Convex provides true reactive queries, not polling-based sync
5. **Open Source**: AGPL-3.0 with self-hosting support

---

## The Gap: Where Linear Next Changes Everything

Linear announced their "Next" vision on March 24, 2026 — a fundamental shift from issue tracking to **"a shared product system that turns context into execution."** Three architectural layers:

- **Context Layer**: Plans, specs, decisions, summaries, code — unified
- **Rules Layer**: Skills (codified workflows), automations, permissions
- **Agent Layer**: Autonomous workers that create issues, write code, triage, review

**Their stats**: 75% of enterprise workspaces have coding agents. Agents author 25% of new issues. Agent work grew 5x in 3 months.

### What This Means for LTF1

Linear is building for **PM-driven teams in browsers**. LTF1 can own **developer-driven teams in terminals**. But the agent architecture is non-negotiable — without it, LTF1 is a traditional PM tool competing with Linear's agent-augmented platform.

**The play**: Agent-native dev workspace that lives in your terminal. Linear owns the browser. We own the terminal. The agent layer fills the moat.

---

## Strategic Priorities

### P0: Agent Architecture
Build the context → rules → agent pipeline into Convex. Triage incoming work. Auto-categorize, prioritize, assign. Skills system for codified team workflows.

### P1: TUI as Agent Interface
`ltf agent triage`, `ltf agent suggest`, `ltf skill run`. Make the terminal THE place where developers interact with AI agents for project management.

### P2: Code Intelligence
Connect to repositories beyond tracking. Index code, understand functions, link code entities to tasks. Enable agents to answer "what does X do?" from within LTF1.

### P3: Sharpen the Product
Cut features that add overhead (meetings scheduler, time tracking reports). Lean into automation over process. The promise is "zero manual updates" — every feature should reduce friction, not add it.

---

## Document Index

| Document | Contents |
|----------|----------|
| [01-strategic-vision.md](01-strategic-vision.md) | Product vision, market positioning, agent-first future |
| [02-product-audit.md](02-product-audit.md) | Complete audit of every feature across all surfaces |
| [03-architecture.md](03-architecture.md) | Technical architecture, data flow, system design |
| [04-design-system.md](04-design-system.md) | Design system v2 — colors, typography, motion, components |
| [05-frontend-audit.md](05-frontend-audit.md) | Web app component-by-component quality assessment |
| [06-backend-api.md](06-backend-api.md) | Complete Convex API reference (queries, mutations, actions) |
| [07-cli-tui.md](07-cli-tui.md) | CLI commands, TUI pages, architecture, auth flow |
| [08-integrations.md](08-integrations.md) | GitHub, Slack, AI, billing integrations |
| [09-feature-roadmap.md](09-feature-roadmap.md) | Agent-first roadmap with phases and milestones |
| [10-competitive-analysis.md](10-competitive-analysis.md) | Linear Next deep dive, competitive positioning |
| [11-security-audit.md](11-security-audit.md) | Security findings, vulnerabilities, recommendations |
| [12-landing-marketing.md](12-landing-marketing.md) | Marketing positioning, messaging, conversion analysis |
| [13-tui-v2-vision.md](13-tui-v2-vision.md) | TUI redesign vision, architecture, design language |
