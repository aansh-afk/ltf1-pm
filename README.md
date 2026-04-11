# LTF1

**Git-native project management for developers who ship code, not developers who update tickets.**

Your tasks update when you push code. Story points estimated from your diffs. Velocity measured from actual shipping data. A full terminal TUI so you never leave your editor.

[Website](https://ltf1.dev) | [Discord](https://discord.gg/jWMS6Pcr) | [Changelog](https://ltf1.dev/changelog)

---

## What is this

LTF1 is a project management platform built for developers. Instead of manually dragging cards and updating statuses, your git activity drives the board. Push code, merge PRs, close issues — LTF1 handles the rest.

Three surfaces, one backend:
- **Web app** — Dashboard, kanban boards, sprint planning, team management
- **Terminal TUI** — Full interactive app in your terminal with keyboard-driven workflows
- **CLI** — 14 command groups for scripting and CI/CD integration

### Key features

- **Git-native**: Commits, PRs, and branches are first-class events. Tasks update automatically from git activity.
- **Terminal-first**: A real TUI with dashboard, task management, sprint planning, and git integration. No other PM tool has this.
- **Bi-directional GitHub sync**: Issues, PRs, teams, and developer stats sync both ways.
- **AI-powered**: Task suggestions from commits, smart assignment based on developer expertise, sprint health analysis.
- **Real-time**: Built on Convex for true reactive queries, not polling.
- **20 themes**: Obsidian, VS Code, Monokai, Solarized, Nord, Tokyo Night, Catppuccin, Gruvbox, and more.
- **BYOK AI**: Bring your own API keys for Gemini, Groq, or Cerebras.

---

## Quick start

### Prerequisites
- Node.js 18+
- pnpm 8+
- [Convex](https://convex.dev) account
- [Clerk](https://clerk.com) account

### Setup

```bash
git clone https://github.com/aansh-afk/ltf1-pm.git
cd ltf1-pm
pnpm install
```

Create `.env` with your credentials:

```bash
CONVEX_DEPLOYMENT=your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key
```

Start the backend and frontend:

```bash
npx convex dev        # Start Convex backend
cd apps/web && pnpm dev  # Start web app
```

### CLI

```bash
npm install -g @vvg-ltf1/cli

ltf1 auth login        # Authenticate
ltf1 project select    # Pick your project
ltf                   # Launch the TUI
```

---

## Architecture

```
apps/
  web/          React + Vite + Tailwind (47 pages, 122 components)
  cli/          Commander.js + Ink TUI (14 command groups, 7 TUI pages)
  mobile/       Expo React Native (early stage)
convex/         Convex backend (60+ tables, 200+ functions)
docs_v2/        Documentation
docs_design/    Design system reference
```

### Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Remotion
- **Backend**: Convex (real-time serverless database)
- **Auth**: Clerk (GitHub OAuth, email)
- **Design**: Custom brutalist component system (BrutalButton, BrutalCard, BrutalModal, etc.)
- **CLI/TUI**: Commander.js, Ink (React for terminal)
- **AI**: Gemini, Groq, Cerebras (multi-provider with BYOK)
- **Integrations**: GitHub (bi-directional), Slack, Resend (email), PostHog (analytics)

---

## Features

### Task management
4 view modes (board, list, calendar, table), multi-assignee, subtasks, dependencies with critical path, labels, estimates (points + hours), time tracking, bulk operations, advanced filtering with saved presets.

### Sprint management
Full sprint lifecycle (planning, active, completed), burndown charts, velocity tracking from git data, AI sprint health analysis, backlog management.

### GitHub integration
OAuth + GitHub App installation, bi-directional issue sync, commit-to-task linking via branch name parsing (`feature/PROJ-123-description`), PR tracking, team sync from GitHub orgs, developer stats, release notes generation.

### Terminal TUI
Full-screen interactive terminal app with:
- Dashboard with sprint summary, task overview, workspace stats
- Task management with create/edit/delete/move/assign/comment
- Sprint planning with backlog management
- Git status with staging, committing, and task linking
- Search, notifications, and help pages
- All keyboard-driven (vim-style j/k navigation)

### AI features
- Task suggestions from commits and PRs
- Smart assignment based on developer expertise and availability
- Sprint health analysis with risk detection
- Natural language task creation
- Project insights (risks, recommendations, opportunities)
- Multi-provider support with usage tracking and credit system

### Documents
BlockNote-based editor with slash commands, drag-and-drop blocks, collaborative presence indicators, auto-save.

### Design system
Dark brutalist terminal aesthetic. #050505 backgrounds, 2px borders, zero border-radius, IBM Plex Mono for labels, hard offset shadows. 20 themes including Obsidian, VS Code, Monokai, Solarized, Nord, Tokyo Night, Catppuccin, Gruvbox, and Vercel variants.

---

## CLI commands

```
ltf                          Launch interactive TUI
ltf1 task list                List tasks
ltf1 task create <title>      Create task
ltf1 task done <id>           Mark task done
ltf1 sprint status            Current sprint status
ltf1 git status               Git + task linking status
ltf1 git hooks                Install git hooks
ltf1 ai suggest               AI task suggestions
ltf1 search <query>           Global search
ltf1 daemon start             Start background watcher
```

Run `ltf1 --help` for the full command reference.

---

## Documentation

Detailed documentation is in [`docs_v2/`](docs_v2/):

| Doc | Contents |
|-----|----------|
| [Executive Summary](docs_v2/00-executive-summary.md) | Project overview and direction |
| [Strategic Vision](docs_v2/01-strategic-vision.md) | Product vision and market position |
| [Product Audit](docs_v2/02-product-audit.md) | Feature-by-feature quality assessment |
| [Architecture](docs_v2/03-architecture.md) | System design and data flow |
| [Design System](docs_v2/04-design-system.md) | Colors, typography, components, motion |
| [Frontend Audit](docs_v2/05-frontend-audit.md) | Component quality matrix |
| [Backend API](docs_v2/06-backend-api.md) | Complete Convex API reference |
| [CLI/TUI](docs_v2/07-cli-tui.md) | CLI commands and TUI documentation |
| [Integrations](docs_v2/08-integrations.md) | GitHub, AI, email, billing |
| [Feature Roadmap](docs_v2/09-feature-roadmap.md) | Development roadmap |
| [Marketing](docs_v2/12-landing-marketing.md) | Landing page and positioning |

Design system reference is in [`docs_design/`](docs_design/).

---

## Contributing

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[AGPL-3.0](LICENSE) — You can use, modify, and self-host LTF1. If you modify and deploy it as a service, you must share your source code.
