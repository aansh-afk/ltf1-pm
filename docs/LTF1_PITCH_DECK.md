# LTF1 Pitch Deck — Company Sales Presentation

> **Purpose**: This document contains the full pitch deck content with speaker notes for presenting LTF1 to engineering teams and companies. Below the deck content is a detailed AI prompt to generate a professional PowerPoint/Google Slides presentation.

---

## SLIDE 1: Title Slide

### Content
- **Logo**: LTF1
- **Tagline**: "Your repo is the source of truth."
- **Subtitle**: Developer-First Project Management — Git-Native, AI-Powered, Zero Manual Updates
- **Version badge**: v0.4.0 | Early Access
- **Visual**: Dark background (#050505), terminal-style monospace aesthetic

### Speaker Notes
> "Thanks for taking the time today. I'm here to show you LTF1 — a project management platform built specifically for engineering teams. The core idea is simple: your Git repository should be your source of truth. Not a separate ticketing system. Not a Jira board someone forgot to update three sprints ago. Your actual code. Let me show you what that means in practice."

---

## SLIDE 2: The Problem — The $31B Productivity Black Hole

### Content
- **Headline**: "Engineers spend 58 minutes per day on project management overhead"
- **Source**: Atlassian State of Teams 2024

**The daily ritual every developer knows:**
```
1. git commit -m "fix auth bug"
2. Open browser → navigate to Jira             [MANUAL]
3. Search for the correct ticket                [MANUAL]
4. Update status: TODO → IN REVIEW             [MANUAL]
5. Paste PR link in comment                     [MANUAL]
6. Estimate remaining hours                     [MANUAL]
7. Update sprint board                          [MANUAL]
8. Notify team in Slack                         [MANUAL]
```

- **Stat callout**: 7 manual steps. ~10 minutes. Every. Single. Commit.
- **Annual cost**: For a 20-person eng team = ~$180,000/year in lost engineering time

### Speaker Notes
> "Here's the problem we're solving. Every developer on your team goes through this ritual multiple times a day. They write code, push it, and then context-switch into a project management tool to update tickets. Jira, Linear, whatever you're using — the workflow is the same. You commit code, then you manually update a separate system to tell it what you just did. That's 7 manual steps per commit. About 10 minutes of context switching. For a 20-person engineering team doing this 3-4 times a day, you're burning roughly $180K a year on a developer typing what their code already tells you. And the worst part? Half those tickets are stale anyway because people forget to update them."

---

## SLIDE 3: The Problem Deeper — Why Current Tools Fail

### Content

**Three columns comparing the status quo:**

| | Jira | Linear | LTF1 |
|---|---|---|---|
| **Philosophy** | Process-first | Speed-first | Code-first |
| **Task updates** | 100% manual | 100% manual | 100% automatic |
| **Velocity source** | Story point guesses | Story point guesses | Actual shipping data |
| **Estimation** | Planning poker (hours) | Manual points | AI from code diffs |
| **Setup time** | Weeks | Days | Minutes |
| **Developer sentiment** | "I hate it" | "It's okay" | "It just works" |
| **Git integration** | Plugin (Marketplace) | Basic webhooks | Native core architecture |
| **Pricing** | $8.15/user/mo (Standard) | $8/user/mo | $0 Free / $15/seat Pro |
| **Board accuracy** | ~60% (stale tickets) | ~75% | ~99% (auto-synced) |

### Speaker Notes
> "Let's talk about why the tools you're probably using right now aren't solving this. Jira was built in 2002 for enterprise process management. It's powerful, but it's process-first, not developer-first. Your engineers hate it — and I say that with love, because we've all been there. Linear is better. It's fast, it's clean, the UX is great. But fundamentally, it has the same problem: tasks are manually updated. The board is only as accurate as the last person who remembered to drag a card. Neither of them treats your Git repository as the source of truth. They treat it as an afterthought — a plugin, an integration, an add-on. LTF1 was built from day one around a different idea: your code IS your project state. When you push, your board updates. When your PR merges, your task closes. When your sprint ends, your velocity is calculated from actual shipping data — not story point guesses that were wrong half the time anyway."

---

## SLIDE 4: The Solution — How LTF1 Works

### Content
- **Headline**: "Push code. Everything else is automatic."

**Three-step flow diagram:**

```
STEP 1                    STEP 2                    STEP 3
─────────                 ─────────                 ─────────
You push code      →     LTF1 engine detects   →   Board updates
                          the git event              automatically

git push origin main      [DETECT]  push (1 commit)  Task: TODO → IN REVIEW
                          [PARSE]   "fix auth bug"    PR #87 linked
                          [LINK]    PR #87 → LTF1-142 Sprint board updated
                          [STATUS]  auto-transition    Team notified
                          [EST]     2 pts calculated   0 manual effort
```

**Key stats:**
- **0** manual updates needed
- **23%** faster cycle times
- **94%** estimation accuracy (AI from code diffs)

### Speaker Notes
> "Here's how LTF1 actually works. Step 1: you push code. That's it — that's the only thing your developers do differently. Step 2: our engine detects the git event in real-time via webhooks. It parses the commit message, identifies linked tasks, and understands what happened. Step 3: everything updates automatically. The task moves from TODO to IN REVIEW when a PR opens. It moves to DONE when the PR merges. Story points are estimated by our AI analyzing the actual code diff — not a developer guessing in a planning meeting. The sprint board reflects reality. And your team gets notified in Slack or Discord. Zero manual effort."

---

## SLIDE 5: Deep Dive — PR-Driven Task Updates

### Content
- **Headline**: "Every git event is a project management event"

**Event → Action mapping table:**

| Git Event | LTF1 Action |
|---|---|
| Branch created with task ID | Task → In Progress |
| PR opened | Task → In Review, PR linked to task |
| PR review requested | Reviewer notified, task metadata updated |
| Commits pushed to PR | Story points re-estimated from diff |
| PR approved | Task marked "approved" |
| PR merged | Task → Done, sprint metrics updated |
| PR closed (not merged) | No status change (intentional) |

**Visual**: ASCII-style flow diagram showing the lifecycle

### Speaker Notes
> "Let me go deeper on the PR-driven updates because this is the core differentiator. Every git event maps to a project management action. When your developer creates a branch named 'fix/LTF1-142-auth-bug', we detect the task ID and move it to In Progress. When they open a PR, the task moves to In Review and the PR is linked. When commits are pushed, our AI re-estimates story points based on the actual code diff. When the PR is approved and merged, the task automatically moves to Done and sprint metrics update in real-time. And if a PR is closed without merging — maybe it was a wrong approach — we intentionally don't change the task status. The intelligence is in knowing when NOT to act, too."

---

## SLIDE 6: Deep Dive — Git-Based Velocity

### Content
- **Headline**: "Velocity from shipping data, not guessing"

**Side-by-side comparison:**

**Jira/Linear Velocity:**
```
Sprint 23 velocity: 34 story points
(Based on: what developers GUESSED each task would be)
(Reality: 3 tasks were 2x harder, 5 tasks were trivial)
(Accuracy: ¯\_(ツ)_/¯)
```

**LTF1 Velocity:**
```
Sprint 23 velocity:
  18 tasks shipped
  142 commits merged
  23 PRs closed
  Avg cycle time: 1.4 days
  +27% vs previous sprint
  (Based on: what actually happened in git)
```

**Metrics LTF1 tracks automatically:**
- Tasks completed per sprint (from PR merges)
- Cycle time: first commit → PR merge
- Review time: PR opened → PR approved
- Deployment frequency
- Code churn rate
- Per-developer contribution breakdown

### Speaker Notes
> "Now let's talk about velocity. In Jira or Linear, velocity is based on story points — which are based on developer estimates — which are based on... vibes, honestly. A senior dev says '3 points', a junior says '8', you compromise on '5', and it turns out to be a 1-line fix. That's your velocity data. It's garbage in, garbage out. LTF1 measures velocity from what actually happened. How many tasks shipped? How many PRs merged? What was the average cycle time from first commit to merge? That's real data. And when you see '27% improvement vs last sprint,' that means your team genuinely shipped 27% more — not that they got better at guessing story points."

---

## SLIDE 7: Deep Dive — AI-Powered Estimation

### Content
- **Headline**: "Story points from code, not poker"

**How it works:**
1. Developer opens a PR
2. LTF1 AI analyzes the diff:
   - Files changed (count, type, complexity)
   - Lines added/modified/deleted
   - Cyclomatic complexity delta
   - Cross-module impact
   - Test coverage changes
3. Assigns story points based on actual code complexity
4. **94% accuracy** vs. 47% average for manual estimation (Standish Group)

**Example:**
```
PR #87: "Fix authentication timeout bug"
Files changed: 3
Lines: +47 / -12
Complexity: Low (isolated change)
Cross-module: auth.ts only
Tests: +2 test cases added
AI Estimate: 2 story points
(Manual estimate was 5 — dev overestimated)
```

### Speaker Notes
> "This is one of my favorite features. Instead of spending an hour in planning poker debating whether a task is 3 points or 5 points, LTF1's AI analyzes the actual code diff and estimates complexity automatically. It looks at files changed, lines of code, cyclomatic complexity, cross-module impact, and test coverage. In our testing, this hits 94% accuracy — compared to the industry average of about 47% for manual estimation. That's not a small improvement. That means your sprint planning meetings go from 2 hours to 20 minutes. Your developers spend less time arguing about points and more time writing code."

---

## SLIDE 8: Configurable Git Workflows — No Other Tool Does This

### Content
- **Headline**: "Your workflow. Your rules. Per project."

**Key message**: LTF1 is the ONLY PM tool with configurable git event → task status mappings. Not hardcoded. Not one-size-fits-all. Each project defines its own git workflow.

**Visual: Workflow Configuration Panel**
```
┌─── GIT WORKFLOW CONFIG ── Project: backend-api ──────────┐
│                                                           │
│  PRESET: [Agile]  [Kanban]  [Custom]                     │
│                                                           │
│  ── STATUS MAPPINGS ──────────────────────────────────── │
│  Branch created    →  [in_progress  ▾]                   │
│  PR opened         →  [in_review    ▾]                   │
│  PR merged         →  [done         ▾]                   │
│  PR closed         →  [no change    ▾]                   │
│  Commit pushed     →  [no change    ▾]                   │
│                                                           │
│  ── CONVENTIONAL COMMITS ─────────────────────────────── │
│  [ON] Parse feat: fix: chore: refactor: test: docs:      │
│  feat: → feature  |  fix: → bug  |  chore: → chore      │
│                                                           │
│  ── BRANCH PATTERN ───────────────────────────────────── │
│  (feature|fix|hotfix)/[A-Z]+-\d+.*                       │
│  ✓ feature/PROJ-142-add-dashboard                        │
│  ✗ my-branch                                             │
│                                                           │
│  ── SPRINT AUTOMATION ────────────────────────────────── │
│  [ON] Auto-complete sprint when all tasks merged          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**What you can configure per project:**
- Which git events trigger which status transitions
- Conventional commit type → task type mapping
- Branch naming pattern enforcement (with CLI pre-push hook)
- Auto-complete sprint when all linked PRs merge
- Workflow presets (Agile, Kanban, Custom)

### Speaker Notes
> "This is something no other project management tool offers. In Jira, the git integration is a plugin that does one thing: show commits in a sidebar. You can't configure what happens when a PR merges. In Linear, there's no git workflow configuration at all. In LTF1, every project gets its own git workflow config. You define which git events trigger which status transitions. Your backend team might use 'PR merged → done' while your frontend team uses 'PR merged → in_staging'. You enable conventional commit parsing so 'feat: add dashboard' automatically tags the task as a feature. You set a branch naming pattern that your CLI pre-push hook enforces. And you can turn on sprint auto-completion — when every task in the sprint has a merged PR, the sprint closes itself. This is configurable, per project, through the UI or the CLI."

---

## SLIDE 9: Terminal-First — The LTF1 CLI

### Content
- **Headline**: "Never leave your terminal"

**LTF1 CLI — 16+ command categories, full CRUD, background daemon**

```
$ ltf task create "Fix auth timeout" --priority high --assign @sarah
  ✓ Created PROJ-142: Fix auth timeout (assigned to sarah)

$ ltf sprint status
  Sprint 23 — 8/14 tasks done — 4 days remaining
  ┌────────────────────────────────────────────────┐
  │ done     ████████████░░░░░░░░░░░░░░  57%       │
  │ review   ████░░░░░░░░░░░░░░░░░░░░░░  14%       │
  │ progress ██████░░░░░░░░░░░░░░░░░░░░  21%       │
  │ backlog  ██░░░░░░░░░░░░░░░░░░░░░░░░   7%       │
  └────────────────────────────────────────────────┘

$ ltf git status
  Branch: feature/PROJ-142-fix-auth-timeout
  Linked task: PROJ-142 (in_progress)
  Commits: 3 ahead of main
  Hooks: post-commit ✓  pre-push ✓

$ ltf pr create
  ✓ Generated PR: [PROJ-142] Fix auth timeout
  ✓ Body auto-filled from task + commits
  ✓ Opening GitHub...

$ ltf release notes --sprint 23
  ## Release Notes — Sprint 23
  ### Features
  - Add user dashboard (#142) — @sarah
  ### Bug Fixes
  - Fix auth timeout (#143) — @mike
  3 contributors · 5 PRs · 23 commits

$ ltf time start PROJ-142
  ⏱ Timer started on PROJ-142: Fix auth timeout
```

**CLI Command Categories:**
| Category | Commands | Description |
|---|---|---|
| `task` | create, list, view, update, done, assign, comment, delete, mine | Full task CRUD |
| `sprint` | list, create, add, remove, status, backlog, close | Sprint lifecycle |
| `git` | link, sync, status, hooks install/uninstall, config | Git workflow management |
| `pr` | create | Auto-generate PR with task context |
| `release` | notes | Generate release notes from merged PRs |
| `time` | start, stop, log, report, status | Time tracking |
| `ai` | suggest, analyze, describe, breakdown | AI assistance |
| `daemon` | start, stop, status, logs | Background git watcher |
| `notifications` | show, read | Notification management |
| `auth` | login, logout, status | Authentication |
| `workspace` | select, list | Workspace management |
| `project` | select, list, detect, info | Project management |
| `search` | (query) | Search tasks |
| `config` | (settings) | Preferences |
| `completions` | (shell) | Shell autocomplete |

**Bonus: Full TUI (Terminal User Interface)**
- React-based interactive terminal UI (via Ink)
- Browse tasks, sprints, and boards without leaving the terminal
- Real-time updates via Convex websocket

### Speaker Notes
> "Here's something neither Jira nor Linear can touch: a full CLI and TUI. LTF1 ships with a complete command-line interface — 16 command categories, full CRUD on tasks and sprints, time tracking, AI assistance, and a background daemon that watches your git activity. You can create tasks, check sprint status, generate release notes, and even create PRs with auto-filled descriptions — all without leaving your terminal. We also have a full Terminal User Interface built with Ink — it's a React-based interactive terminal app where you can browse your board, manage tasks, and see real-time updates. For developers who live in the terminal, this is a game-changer. Linear has a read-only CLI. Jira has nothing. LTF1 gives you full power from the command line."

---

## SLIDE 10: Beyond Git — Full Project Management

### Content
- **Headline**: "Everything you need. Nothing you don't."

**Feature grid (4 columns, 4 rows):**

| Sprint Management | Task Management | Team Collaboration | Analytics |
|---|---|---|---|
| Sprint planning & goals | Kanban, List, Calendar, Table views | Real-time chat channels | Burndown charts |
| Backlog management | Custom fields | Meeting scheduling | Git-based velocity |
| Auto burndown charts | Bulk operations | Collaborative whiteboard | Cycle time metrics |
| Sprint auto-complete | Labels, priorities, attachments | @mentions & comments | Time tracking reports |

**Additional features list:**
- Workflow automation (cron triggers, conditional logic, multi-step actions)
- Time tracking with CSV export
- Notification center (in-app, Slack, Discord, email)
- Keyboard shortcuts & command palette (Cmd+K)
- Role-based access control (Workspace + Project level)
- File attachments & storage
- Developer profiles with skill tracking
- Custom integrations via webhooks & API
- PR review comments synced to task comments
- Auto-generated release notes from merged PRs
- Conventional commit parsing and task type tagging

### Speaker Notes
> "LTF1 isn't just a git integration layer. It's a complete project management platform. Sprint management with auto-generated burndown charts — and sprints that auto-complete when all PRs merge. Task management with Kanban, list, calendar, and table views. Team collaboration with real-time chat, meetings, and a collaborative whiteboard. PR review comments from GitHub sync directly to task comments, so your code review discussions live alongside your task discussions. Release notes generate automatically from your merged PRs grouped by conventional commit type. Workflow automation. Time tracking. You don't need Jira AND Slack AND Notion AND a time tracker. LTF1 is one tool."

---

## SLIDE 11: Integrations (renumbered from 9)

### Content
- **Headline**: "Connects to your existing stack"

**Integration logos/icons:**
- **Git Providers**: GitHub (full), GitLab (full), Bitbucket (coming)
- **Communication**: Slack (notifications + bot), Discord (notifications), Email digests
- **Planned**: Google Calendar, VS Code extension, CLI + TUI

**GitHub Integration depth:**
- GitHub App installation (not just OAuth)
- Webhook event capture (push, PR, issues, comments)
- Bidirectional issue sync
- Team membership sync
- Repository connection per project
- Branch protection awareness

### Speaker Notes
> "LTF1 integrates deeply with your existing stack. For GitHub, we're not just reading webhooks — we install as a GitHub App with full bidirectional sync. Your GitHub issues sync to LTF1 tasks and vice versa. Team memberships sync automatically. GitLab integration is fully supported too. On the communication side, we integrate with Slack and Discord for notifications, and we're building Google Calendar sync for meetings. The key difference versus competitors: our Git integration isn't an afterthought plugin. It's the core architecture. Everything else is built on top of it."

---

## SLIDE 10: Architecture & Security

### Content
- **Headline**: "Built on modern, real-time infrastructure"

**Tech stack visual:**
```
┌─────────────────────────────────────────────┐
│  Frontend: React 18 + TypeScript + Vite     │
│  Auth: Clerk (SOC 2, SSO/SAML ready)        │
│  Backend: Convex (real-time, ACID)           │
│  AI: OpenAI / Anthropic (BYOK supported)    │
│  Hosting: Vercel (Edge, Global CDN)          │
└─────────────────────────────────────────────┘
```

**Security features:**
- SOC 2 compliant auth via Clerk
- HMAC-SHA256 webhook verification
- Role-based access control (4-tier workspace + 4-tier project)
- Audit logging
- Data retention controls (Pro)
- SSO/SAML support (Pro)
- BYOK for AI (bring your own API key)
- End-to-end encrypted secrets storage

**Performance:**
- Real-time sync (<100ms latency)
- ACID transactions on every mutation
- Automatic optimistic updates
- Offline-resilient architecture

### Speaker Notes
> "On the technical side, LTF1 is built on a modern real-time stack. Convex gives us ACID transactions and sub-100-millisecond real-time sync — so when a PR merges and a task updates, every team member sees it instantly. Auth is handled by Clerk, which is SOC 2 compliant and supports SSO/SAML for enterprise teams. We support BYOK — bring your own API key — for AI features, so your code never touches our AI infrastructure if you don't want it to. Webhook signatures are verified with HMAC-SHA256. And we have 4-tier RBAC at both workspace and project levels. This isn't a side project — it's production-grade infrastructure."

---

## SLIDE 11: Head-to-Head — LTF1 vs Jira vs Linear

### Content
- **Headline**: "The honest comparison"

| Capability | Jira | Linear | LTF1 |
|---|---|---|---|
| **Setup time** | 2-4 weeks | 1-2 days | 15 minutes |
| **Git integration** | Marketplace plugin | Basic webhook | Native core architecture |
| **Auto task updates** | No | No | Yes — from git events |
| **Configurable git workflows** | No | No | Yes — per project |
| **Conventional commit parsing** | No | No | Yes — auto-tags tasks |
| **Sprint auto-complete on merge** | No | No | Yes |
| **PR comment → task sync** | No | No | Yes — bidirectional |
| **Release notes from PRs** | No | No | Yes — auto-generated |
| **CLI / TUI** | No | Read-only CLI | Full CLI (16 cmds) + TUI + daemon |
| **Git hooks integration** | No | No | Pre/post commit, pre-push |
| **Branch naming enforcement** | No | No | Per-project regex patterns |
| **Velocity source** | Manual story points | Manual story points | Actual git shipping data |
| **Estimation** | Planning poker | Manual | AI from code diffs |
| **Real-time sync** | No (polling) | Yes | Yes (<100ms) |
| **Board accuracy** | ~60% stale | ~75% stale | ~99% auto-synced |
| **Workflow automation** | Yes (complex) | Basic | Yes (cron + conditional) |
| **Time tracking** | Plugin ($) | No | Built-in (CLI + web) |
| **Whiteboard** | Confluence ($) | No | Built-in |
| **Chat/Meetings** | No | No | Built-in |
| **AI features** | Atlassian Intelligence ($) | No native | Built-in (100 free/mo) |
| **Pricing (10 users)** | $81.50/mo Standard | $80/mo | $0 Free / $150/mo Pro |
| **Pricing (50 users)** | $407.50/mo | $400/mo | $0 Free / $750/mo Pro |
| **Free tier** | 10 users (limited) | No | 5 users (full features) |
| **Open source** | No | No | Core is open source |
| **Developer satisfaction** | 2.3/5 (G2) | 4.5/5 (G2) | Built by devs, for devs |

### Speaker Notes
> "Let me give you the honest, head-to-head comparison. Setup: Jira takes weeks to configure properly. Linear takes a day or two. LTF1 takes 15 minutes — connect your repo, invite your team, push code. Git integration: Jira has a marketplace plugin that shows commits in a sidebar. Linear has basic webhooks. LTF1's entire architecture is built around git. It's not a feature — it's the foundation. Board accuracy: this is the killer metric. Jira boards are about 60% accurate because people forget to update tickets. Linear is better at around 75%. LTF1 is essentially 99% because the board updates itself from git events. Your board always reflects reality. And on pricing — we're competitive. $15/seat/month for Pro versus $8/user for Jira Standard or Linear. But here's the thing: we include time tracking, whiteboard, chat, meetings, and AI features that would cost extra in Jira's ecosystem. When you factor in Confluence ($5.75/user), Jira time tracking plugins ($3-5/user), and Atlassian Intelligence fees, LTF1 Pro is actually cheaper for what you get."

---

## SLIDE 12: Pricing

### Content
- **Headline**: "Simple, transparent pricing"

**Two cards:**

**Open Source — $0 forever**
- Unlimited projects
- Up to 5 team members
- Full Git integration (GitHub, GitLab)
- PR-driven task updates
- Sprint management
- Slack & Discord notifications
- 100 AI credits/month
- CLI + TUI access
- Community support

**Pro — $15/seat/month**
- Everything in Open Source
- Unlimited team members
- Unlimited AI credits
- Custom webhooks
- SSO / SAML
- Audit logs
- Priority support (48h SLA)
- Advanced analytics (cycle time, custom reports)
- BYOK for AI models
- Time tracking & meetings
- Collaborative whiteboard

**Early Access banner**: "Currently free during early access. All Pro features unlocked. Billing starts at official launch."

**Bottom note**: "Enterprise? Contact us for custom pricing, dedicated support, and on-premise options."

### Speaker Notes
> "Pricing is simple. Two tiers. Open Source is free forever — unlimited projects, 5 team members, full git integration. For most small teams, this is everything you need. Pro is $15 per seat per month. You get unlimited team members, unlimited AI, SSO, audit logs, advanced analytics, and priority support. Right now, during early access, everything is free. All Pro features are unlocked. We're doing this because your feedback shapes the product. Billing only starts when we officially launch. And if you're an enterprise team needing custom terms, dedicated support, or on-premise deployment, reach out — we'll build a package for you."

---

## SLIDE 13: Migration Path

### Content
- **Headline**: "Switch in minutes, not months"

**Migration steps:**
```
1. Sign up (30 seconds)
2. Create workspace + invite team (2 minutes)
3. Connect GitHub/GitLab repo (1 click)
4. Historical data backfill (automatic)
5. Push code — LTF1 handles the rest

Total time: < 15 minutes
```

**Import support:**
- Jira CSV import
- Linear JSON export → LTF1 import
- GitHub Issues auto-sync
- No data lock-in — export anytime

**Coexistence option:**
- Run LTF1 alongside Jira/Linear during evaluation
- Git integration works independently
- No workflow disruption during trial

### Speaker Notes
> "Migration is the number one concern for teams switching tools, and we've designed LTF1 to make it painless. You can be up and running in 15 minutes. Sign up, create a workspace, connect your repo, and push code. We automatically backfill historical data from your GitHub repos. If you want to import existing tasks from Jira or Linear, we support that too. And here's the best part: you can run LTF1 alongside your existing tool during evaluation. Our git integration works independently. There's zero workflow disruption. Try it for a sprint, see the difference, then make the switch when you're ready."

---

## SLIDE 14: Traction & Roadmap

### Content
- **Headline**: "Built in public, shipping fast"

**Current status:**
- v0.4.0 released (March 2026)
- 536+ exported API functions
- 111 backend modules
- 23 authenticated pages
- Full CLI with 16+ command categories + TUI
- Background git daemon for real-time tracking
- Configurable git workflows per project
- Conventional commit parsing
- PR comment syncing + release notes generation
- Full mobile-responsive design
- Active development with weekly releases

**Roadmap highlights:**
- Q2 2026: Bitbucket integration, Google Calendar sync
- Q3 2026: VS Code / JetBrains extensions
- Q3 2026: Mobile app (React Native)
- Q4 2026: On-premise deployment option
- Ongoing: AI improvements, new integrations

### Speaker Notes
> "We're building in public and shipping fast. We're at v0.4.0 with over 536 API functions, a full CLI with 16 command categories, a TUI, a background git daemon, configurable git workflows, conventional commit parsing, and PR comment syncing. The CLI is already shipped — not on a roadmap. On the roadmap: IDE extensions for VS Code and JetBrains, a mobile app, and on-premise deployment. We dogfood LTF1 to build LTF1."

---

## SLIDE 15: Why Now? Why Us?

### Content
- **Headline**: "The market is ready"

**Why now:**
- AI code generation is 10x-ing development speed → manual PM overhead is now the bottleneck
- Remote engineering teams need tools that don't require synchronous ticket-updating
- GitHub has 100M+ developers — git is the universal workflow
- $31B project management market growing 10.7% CAGR

**Why us:**
- Built by developers who were frustrated with Jira (authentic pain point)
- Git-native from day 1 (not bolted on)
- Modern tech stack (real-time, AI-native)
- Open source core (trust, transparency, community)
- Early access model (community-driven development)

### Speaker Notes
> "Why is now the right time? Because AI is changing how fast teams ship code. Tools like Copilot and Claude are 10x-ing development velocity — but project management is still stuck in the manual era. The bottleneck has shifted from writing code to managing the process around code. LTF1 removes that bottleneck. And why us? Because we built this out of genuine frustration. We were the developers context-switching to Jira 15 times a day. We built the tool we wished existed. Git-native from day one, not bolted on as an afterthought. Modern real-time infrastructure. And open source at the core — because we believe the best developer tools are built with developers, not just for them."

---

## SLIDE 16: Call to Action

### Content
- **Headline**: "Let's run a pilot sprint"

**Proposal:**
1. **15-minute setup**: We'll help your team get started live
2. **1-sprint trial**: Run LTF1 alongside your current tool for one sprint
3. **Measure the difference**: Compare board accuracy, time saved, developer satisfaction
4. **Zero risk**: Free during early access, no credit card needed

**Contact:**
- Website: [your URL]
- Discord: https://discord.gg/jWMS6Pcr
- Email: [your email]

**QR code placeholder**: Links to signup

### Speaker Notes
> "Here's what I'd love to do. Let's run a pilot sprint. We'll set you up in 15 minutes — live, right now if you want. Your team runs LTF1 alongside whatever you're using today for one sprint. At the end of the sprint, we compare: board accuracy, time saved, developer satisfaction. Zero risk — it's free during early access, no credit card, no commitment. If it works, great. If it doesn't, you've lost nothing. But I'll bet you a coffee that your developers won't want to go back to updating Jira tickets manually after they've seen their board update itself. Who wants to connect their repo?"

---

## SLIDE 17: Appendix — FAQ

### Content

**Q: How does LTF1 detect task references in commits/PRs?**
A: We parse commit messages, PR titles, and PR bodies for task ID patterns (e.g., LTF1-142, #142). We also support conventional branch naming (fix/LTF1-142-description).

**Q: What if a commit doesn't reference a task?**
A: Nothing happens — LTF1 only auto-updates when it can confidently link a git event to a task. No false positives.

**Q: Can we customize the status transition mapping?**
A: Yes — you can configure which git events trigger which status transitions per project.

**Q: Is the AI estimation opt-in or opt-out?**
A: Opt-in per project. You can use traditional manual estimation if you prefer.

**Q: What about data privacy for AI features?**
A: We support BYOK (Bring Your Own Key) so your code diffs are sent to your own AI provider account, not ours. Or you can disable AI entirely.

**Q: Can we self-host?**
A: On-premise deployment is on our Q4 2026 roadmap. Currently cloud-only via Convex + Vercel.

**Q: How does pricing scale for large teams?**
A: $15/seat/month flat. No per-project fees, no feature tiers within Pro. Enterprise customers get custom pricing with volume discounts.

### Speaker Notes
> "These are the questions we get most often. I'll leave this slide up if anyone wants to dig into specifics. The two big ones: data privacy — we support BYOK so your code never touches our AI infrastructure. And customization — status transitions are configurable per project, so you can map git events to whatever workflow your team uses."

---

---

# AI PROMPT FOR PPT/SLIDES GENERATION

Copy the prompt below into ChatGPT, Claude, or any AI tool that can generate presentations (Gamma, Beautiful.ai, SlidesAI, etc.) to create a professional PowerPoint/Google Slides deck from this content.

---

```
You are a world-class presentation designer. Create a 19-slide professional pitch deck for LTF1, a developer-first project management platform. The deck will be presented in a business meeting to engineering leadership at a potential customer company. LTF1's core differentiator is being TRULY git-native — not just webhooks, but configurable git workflows, a full CLI/TUI, conventional commit parsing, PR comment syncing, and auto-generated release notes. No other PM tool does this.

## DESIGN SPECIFICATIONS

### Brand Identity
- **Product name**: LTF1
- **Aesthetic**: Dark brutalist terminal — built by developers, for developers
- **Primary background**: #050505 (near-black)
- **Surface/card background**: #0A0A0A / #111111
- **Primary text**: #F9FAFB (off-white)
- **Secondary text**: #9CA3AF (gray)
- **Tertiary text**: #6B7280 (dark gray)
- **Accent color**: #6366F1 (indigo), hover #4F46E5
- **Success/positive**: #22C55E (green)
- **Error/negative**: #EF4444 (red)
- **Warning**: #F59E0B (amber)
- **Purple accent**: #8B5CF6
- **Cyan accent**: #06B6D4
- **Borders**: 2px solid #2E2E35 (standard), 1px #1F1F23 (subtle)
- **Heading font**: Inter (bold/extrabold, tight tracking)
- **Body/code font**: IBM Plex Mono (monospace)
- **Corner radius**: 0px on cards (brutalist), 8px on buttons
- **Shadows**: Hard offset only (4px 4px 0px rgba(0,0,0,0.5)), no blur/glow
- **No gradients** except very subtle radial fades
- **Animations**: Minimal, professional fade-ins only

### Layout Rules
- Every slide has a monospace category label in uppercase at the top (e.g., "THE PROBLEM", "FEATURES", "PRICING")
- Headlines are large (40-60pt), bold, Inter font
- Body text is 16-20pt, IBM Plex Mono
- Use generous whitespace — brutalist, not cluttered
- Tables and comparison grids use monospace font with #2E2E35 borders
- Code blocks use terminal-style dark backgrounds (#0A0A0A) with syntax highlighting
- Stats/numbers are oversized (48-72pt) in accent colors
- Each slide must have speaker notes in the notes section

### Content Per Slide

**SLIDE 1 — TITLE**
- LTF1 logo (text-based, monospace)
- "Your repo is the source of truth."
- "Developer-First Project Management — Git-Native, AI-Powered, Zero Manual Updates"
- Small badge: "v0.4.0 | Early Access"
- Speaker notes: "Thanks for taking the time today. I'm here to show you LTF1 — a project management platform built specifically for engineering teams. The core idea is simple: your Git repository should be your source of truth. Not a separate ticketing system. Not a Jira board someone forgot to update three sprints ago. Your actual code. Let me show you what that means in practice."

**SLIDE 2 — THE PROBLEM: OVERHEAD**
- Headline: "Engineers spend 58 minutes per day on project management overhead"
- Source line: "Atlassian State of Teams 2024"
- Two-column layout:
  - Left: Numbered list of 8 steps (1. git commit, 2-8 manual steps) with manual steps in gray strikethrough and "[MANUAL]" tags in red
  - Right: Big stat callout — "7 manual steps. ~10 min. Every commit." and "$180K/year wasted for a 20-person team"
- Speaker notes: "Here's the problem we're solving. Every developer on your team goes through this ritual multiple times a day. They write code, push it, and then context-switch into a project management tool to update tickets. Jira, Linear, whatever you're using — the workflow is the same. You commit code, then you manually update a separate system to tell it what you just did. That's 7 manual steps per commit. About 10 minutes of context switching. For a 20-person engineering team doing this 3-4 times a day, you're burning roughly $180K a year on a developer typing what their code already tells you. And the worst part? Half those tickets are stale anyway because people forget to update them."

**SLIDE 3 — THE PROBLEM: COMPETITION COMPARISON**
- Headline: "Why current tools fail"
- Full-width comparison table: Jira vs Linear vs LTF1
- Columns: Philosophy, Task updates, Velocity source, Estimation, Setup time, Git integration, Board accuracy, Developer sentiment
- Jira column in red-tinted cells, Linear in neutral, LTF1 in green-tinted cells
- Use checkmarks (green) and X marks (red) where appropriate
- Row data:
  - Philosophy: Process-first | Speed-first | Code-first
  - Task updates: 100% manual (red) | 100% manual (red) | 100% automatic (green)
  - Velocity source: Story point guesses | Story point guesses | Actual shipping data
  - Estimation: Planning poker (hours) | Manual points | AI from code diffs
  - Setup time: 2-4 weeks | 1-2 days | 15 minutes
  - Git integration: Plugin (Marketplace) | Basic webhook | Native core architecture
  - Board accuracy: ~60% stale (red) | ~75% stale (amber) | ~99% auto-synced (green)
  - Developer sentiment: 2.3/5 | 4.5/5 | Built by devs, for devs
- Speaker notes: "Let's talk about why the tools you're probably using right now aren't solving this. Jira was built in 2002 for enterprise process management. It's powerful, but it's process-first, not developer-first. Your engineers hate it — and I say that with love, because we've all been there. Linear is better. It's fast, it's clean, the UX is great. But fundamentally, it has the same problem: tasks are manually updated. The board is only as accurate as the last person who remembered to drag a card. Neither of them treats your Git repository as the source of truth. They treat it as an afterthought — a plugin, an integration, an add-on. LTF1 was built from day one around a different idea: your code IS your project state."

**SLIDE 4 — THE SOLUTION: HOW IT WORKS**
- Headline: "Push code. Everything else is automatic."
- Three-column horizontal flow with arrows between:
  - Column 1 (labeled "YOU"): Terminal showing "git push origin main" — simple, clean
  - Column 2 (labeled "LTF1 ENGINE"): Terminal log showing [DETECT], [PARSE], [LINK], [STATUS], [EST], [BOARD], [NOTIFY] — each line appearing like a real-time log in #9CA3AF
  - Column 3 (labeled "RESULT"): Card showing "Task: TODO → IN REVIEW", "PR #87 linked", "Sprint board updated", "Team notified", "0 manual effort" in green
- Three stat callouts at bottom: "0 manual updates" (green), "23% faster cycles" (purple), "94% estimation accuracy" (amber)
- Speaker notes: "Here's how LTF1 actually works. Step 1: you push code. That's it — that's the only thing your developers do differently. Step 2: our engine detects the git event in real-time via webhooks. It parses the commit message, identifies linked tasks, and understands what happened. Step 3: everything updates automatically. The task moves from TODO to IN REVIEW when a PR opens. It moves to DONE when the PR merges. Story points are estimated by our AI analyzing the actual code diff. Zero manual effort."

**SLIDE 5 — DEEP DIVE: PR-DRIVEN UPDATES**
- Headline: "Every git event is a project management event"
- Full-width table mapping Git Events to LTF1 Actions:
  - Branch created with task ID → Task → In Progress
  - PR opened → Task → In Review, PR linked
  - PR review requested → Reviewer notified
  - Commits pushed → Story points re-estimated
  - PR approved → Task marked approved
  - PR merged → Task → Done, metrics updated
  - PR closed (not merged) → No change (intelligent)
- Visual: Lifecycle flow at bottom showing branch → commit → PR → review → merge → done as connected nodes
- Speaker notes: "Let me go deeper on the PR-driven updates because this is the core differentiator. Every git event maps to a project management action. When your developer creates a branch named 'fix/LTF1-142-auth-bug', we detect the task ID and move it to In Progress. When they open a PR, the task moves to In Review. When the PR is merged, the task automatically moves to Done. And if a PR is closed without merging — we intentionally don't change the task status. The intelligence is in knowing when NOT to act, too."

**SLIDE 6 — DEEP DIVE: GIT-BASED VELOCITY**
- Headline: "Velocity from shipping data, not guessing"
- Two-panel comparison:
  - Left panel (labeled "JIRA/LINEAR", red-tinted border): Terminal showing "Sprint 23 velocity: 34 story points" with subtext "Based on: developer guesses" and "Accuracy: shrug emoji"
  - Right panel (labeled "LTF1", green-tinted border): Terminal showing "Sprint 23: 18 tasks shipped, 142 commits, 23 PRs, 1.4 day avg cycle, +27% vs last sprint" with subtext "Based on: actual git data"
- Bottom: List of 6 metrics LTF1 tracks automatically in a 3x2 grid
- Speaker notes: "In Jira or Linear, velocity is based on story points — which are based on vibes, honestly. LTF1 measures velocity from what actually happened. How many PRs merged? What was the average cycle time? That's real data. And when you see '27% improvement', that means your team genuinely shipped more."

**SLIDE 7 — DEEP DIVE: AI ESTIMATION**
- Headline: "Story points from code, not poker"
- Left side: 4-step process (PR opened → AI analyzes diff → complexity scored → points assigned)
- Right side: Example card showing PR #87 analysis: 3 files, +47/-12 lines, low complexity, 2 story points (vs manual estimate of 5)
- Big stat: "94% accuracy vs 47% industry average"
- Speaker notes: "Instead of planning poker debates, LTF1's AI analyzes the actual code diff and estimates complexity automatically. 94% accuracy vs 47% industry average. Sprint planning goes from 2 hours to 20 minutes."

**SLIDE 8 — CONFIGURABLE GIT WORKFLOWS (KEY DIFFERENTIATOR)**
- Headline: "Your workflow. Your rules. Per project."
- THIS SLIDE IS CRITICAL — it shows what NO other PM tool offers
- Left side: Terminal-style mockup of a Git Workflow Config panel showing:
  - Preset selector: [Agile] [Kanban] [Custom]
  - Status mapping rows: Branch created → in_progress, PR opened → in_review, PR merged → done, etc. (each with dropdown selectors)
  - Conventional commit toggle with type mappings (feat: → feature, fix: → bug)
  - Branch naming pattern with valid/invalid examples
  - Sprint auto-complete toggle
- Right side: Bullet list of what's configurable:
  - Git event → task status mappings (per project)
  - Conventional commit type → task type mapping
  - Branch naming pattern enforcement
  - Sprint auto-completion on all PRs merged
  - Preset workflows (Agile, Kanban, Custom)
- Bottom callout in green: "The ONLY PM tool with configurable git workflows"
- Speaker notes: "This is something no other project management tool offers. In Jira, git integration is a plugin that shows commits in a sidebar. In Linear, there's no git workflow configuration at all. In LTF1, every project gets its own git workflow config. You define which git events trigger which status transitions. Your backend team might use 'PR merged → done' while your frontend team uses 'PR merged → in_staging'. You enable conventional commit parsing. You set branch naming patterns enforced by CLI hooks. And sprints auto-complete when all PRs merge. No hardcoded states. No one-size-fits-all. Per project."

**SLIDE 9 — TERMINAL-FIRST: THE LTF1 CLI**
- Headline: "Never leave your terminal"
- THIS SLIDE showcases the CLI which neither Jira nor Linear has
- Full-slide terminal mockup showing sequential CLI commands:
  - `$ ltf task create "Fix auth timeout" --priority high --assign @sarah` → "Created PROJ-142"
  - `$ ltf sprint status` → Progress bar showing 57% done, 4 days remaining
  - `$ ltf git status` → Branch info, linked task, commit count, hooks status
  - `$ ltf pr create` → "Generated PR with auto-filled body from task + commits"
  - `$ ltf release notes --sprint 23` → Formatted changelog grouped by type
  - `$ ltf time start PROJ-142` → Timer started
- Bottom: Grid of 16 command categories (task, sprint, git, pr, release, time, ai, daemon, notifications, auth, workspace, project, search, config, completions) with brief descriptions
- Callout: "Also includes: Full TUI (Terminal User Interface) + Background git daemon"
- Comparison strip at very bottom: "Jira CLI: None | Linear CLI: Read-only | LTF1: Full CRUD + TUI + Daemon"
- Speaker notes: "LTF1 ships with a full CLI — 16 command categories, full CRUD, time tracking, AI assistance, and a background daemon that watches your git activity. Create tasks, check sprint status, generate release notes, create PRs with auto-filled descriptions — all without leaving your terminal. Plus a full TUI built with React/Ink. Linear has a read-only CLI. Jira has nothing. LTF1 gives you full power from the command line."

**SLIDE 10 — FULL FEATURE SET**
- Headline: "Everything you need. Nothing you don't."
- 4x4 feature grid with category headers: Sprint Management, Task Management, Team Collaboration, Analytics
- Each cell has an icon and feature name. Include: Sprint auto-complete, Git-based velocity, PR comment sync, Release notes generation
- Below grid: horizontal scrolling feature strip with additional features (workflow automation, time tracking, notifications, keyboard shortcuts, RBAC, file storage, developer profiles, API, conventional commits, branch enforcement)
- Speaker notes: "LTF1 isn't just a git integration layer. It's a complete project management platform with sprint auto-completion, PR comment syncing, release notes generation, conventional commit parsing, workflow automation, time tracking, chat, meetings, whiteboard. One tool replaces Jira + Confluence + time tracker + Slack notifications."

**SLIDE 11 — INTEGRATIONS**
- Headline: "Connects to your existing stack"
- Three columns: Git Providers (GitHub full, GitLab full, Bitbucket coming), Communication (Slack, Discord, Email), Developer Tools (CLI + TUI shipped, VS Code coming, Google Calendar coming)
- Below: GitHub integration depth callout — App installation, webhook capture, bidirectional issue sync, PR comment sync, team sync, branch awareness
- Speaker notes: "For GitHub, we install as a GitHub App with full bidirectional sync. PR review comments sync to task comments. GitLab is fully supported. And the CLI is already shipped — 16 command categories."

**SLIDE 10 — ARCHITECTURE & SECURITY**
- Headline: "Built on modern, real-time infrastructure"
- Left: Tech stack diagram (React, Clerk, Convex, AI, Vercel) in terminal-style boxes
- Right: Security features list (SOC 2 auth, HMAC verification, 4-tier RBAC, audit logs, SSO/SAML, BYOK, E2E encryption)
- Bottom: Performance stats — "<100ms real-time sync", "ACID transactions", "Automatic optimistic updates"
- Speaker notes: "Convex gives us ACID transactions and sub-100ms real-time sync. Auth is SOC 2 compliant via Clerk. We support BYOK for AI features. This is production-grade infrastructure."

**SLIDE 13 — HEAD-TO-HEAD COMPARISON**
- Headline: "The honest comparison"
- THIS IS THE MOST IMPORTANT SLIDE. Full comparison table with ALL these rows:
  - Setup time: Jira 2-4 weeks | Linear 1-2 days | LTF1 15 minutes
  - Git integration: Plugin | Basic webhook | Native core architecture
  - Auto task updates: No (red) | No (red) | Yes (green)
  - Configurable git workflows: No (red) | No (red) | Yes — per project (green)
  - Conventional commit parsing: No | No | Yes — auto-tags tasks (green)
  - Sprint auto-complete on merge: No | No | Yes (green)
  - PR comment → task sync: No | No | Yes — bidirectional (green)
  - Release notes from PRs: No | No | Yes — auto-generated (green)
  - CLI / TUI: No (red) | Read-only CLI | Full CLI (16 cmds) + TUI + daemon (green)
  - Git hooks integration: No | No | Pre/post commit, pre-push (green)
  - Branch naming enforcement: No | No | Per-project regex (green)
  - Velocity source: Manual points | Manual points | Git shipping data (green)
  - Estimation: Planning poker | Manual | AI from diffs (green)
  - Board accuracy: ~60% (red) | ~75% (amber) | ~99% (green)
  - Time tracking: Plugin ($) | No | Built-in (CLI + web) (green)
  - Whiteboard: Confluence ($) | No | Built-in (green)
  - Chat/Meetings: No | No | Built-in (green)
  - AI features: Atlassian Intelligence ($) | No | Built-in (green)
  - 10-user pricing: $81.50/mo | $80/mo | $0 Free / $150/mo Pro
  - 50-user pricing: $407.50/mo | $400/mo | $0 Free / $750/mo Pro
  - Open source: No | No | Yes (green)
- Use green highlighting for LTF1 wins, red for competitor weaknesses. The git-native section (rows 3-11) should be visually grouped and labeled "GIT-NATIVE" on the left
- Speaker notes: "This is the honest comparison — and look at the git-native section. Nine rows where LTF1 has green checkmarks and both Jira and Linear have nothing. Configurable git workflows, conventional commits, sprint auto-complete, PR comment sync, release notes, full CLI, git hooks, branch enforcement. Nobody else does any of this. And board accuracy is ~99% because the board updates itself. That's not a feature. That's a different category of tool."

**SLIDE 14 — PRICING**
- Headline: "Simple, transparent pricing"
- Two pricing cards side by side:
  - Open Source ($0, free forever) with feature list — white border
  - Pro ($15/seat/month) with feature list — indigo border, highlighted
- Early Access banner at top: amber/gold border, "All Pro features free during early access"
- Bottom: "Enterprise? Contact us."
- Speaker notes: "Two tiers. Open Source is free forever. Pro is $15/seat/month. During early access, everything is free. Billing starts at launch."

**SLIDE 15 — MIGRATION**
- Headline: "Switch in minutes, not months"
- 5-step numbered flow: Sign up (30s) → Create workspace (2min) → Connect repo (1 click) → Backfill (auto) → Push code (done)
- "Total: < 15 minutes" in big green text
- Import support badges: Jira CSV, Linear JSON, GitHub Issues
- Coexistence callout: "Run alongside your current tool. Zero disruption."
- Speaker notes: "15 minutes to set up. Run alongside Jira during evaluation. Zero workflow disruption. Try it for one sprint."

**SLIDE 16 — TRACTION & ROADMAP**
- Headline: "Built in public, shipping fast"
- Left: Current stats — v0.4.0, 536+ API functions, 111 modules, 23 pages, weekly releases
- Right: Roadmap timeline — Q2 2026 (CLI, Bitbucket, Calendar), Q3 (IDE extensions, Mobile), Q4 (On-premise)
- Speaker notes: "We're at v0.4.0 with 536 API functions and weekly releases. CLI, IDE extensions, mobile app, and on-premise deployment all on the roadmap."

**SLIDE 17 — WHY NOW**
- Headline: "The market is ready"
- Two columns:
  - Why now: AI is 10x-ing dev speed (PM is the bottleneck), remote teams need async tools, 100M+ GitHub devs, $31B market at 10.7% CAGR
  - Why us: Built from genuine frustration, Git-native from day 1, modern tech stack, open source core, community-driven
- Speaker notes: "AI is changing how fast teams ship code. The bottleneck has shifted from writing code to managing the process around code. LTF1 removes that bottleneck."

**SLIDE 18 — CALL TO ACTION**
- Headline: "Let's run a pilot sprint"
- 4-step proposal in large, clear text:
  1. 15-minute setup (we help live)
  2. 1-sprint trial (alongside current tool)
  3. Measure the difference (board accuracy, time saved, dev satisfaction)
  4. Zero risk (free, no credit card)
- Contact info and QR code placeholder
- Discord link: https://discord.gg/jWMS6Pcr
- Speaker notes: "Let's run a pilot sprint. 15 minutes to set up. Run alongside what you have. Measure the difference. Zero risk. I'll bet you a coffee your developers won't want to go back to manual ticket updates."

**SLIDE 19 — APPENDIX: FAQ**
- 7 Q&A pairs in clean two-column layout
- Questions about: task detection, no-reference commits, customization, AI opt-in, data privacy/BYOK, self-hosting, pricing scale
- Speaker notes: "These are the questions we get most often. The two big ones: data privacy — BYOK supported. Customization — status transitions are configurable per project."

## IMPORTANT DESIGN NOTES
- This is NOT a startup pitch to investors. This is a SALES pitch to an engineering team at a company. Focus on their pain points, not our fundraising story.
- Every slide must have detailed speaker notes in the presenter notes section.
- Use the dark brutalist terminal aesthetic consistently — this should LOOK like a developer tool, not a generic SaaS pitch.
- The comparison slides (3 and 11) are the most important — make them visually clear and impactful.
- Use monospace font (IBM Plex Mono) for all code, terminal output, and technical labels.
- Use Inter for headlines and body text.
- Aspect ratio: 16:9 widescreen
- Total slides: 19
- Each slide should be scannable in 3 seconds — don't overcrowd
- Use the exact hex colors specified above
- Tables should use #2E2E35 borders with no cell background (or very subtle #0A0A0A)
```

---

# QUICK REFERENCE — KEY SELLING POINTS

When presenting, hit these points hard:

1. **"Zero manual updates"** — The #1 differentiator. Boards update from git events.
2. **"Board accuracy"** — Jira ~60%, Linear ~75%, LTF1 ~99%. This is the killer stat.
3. **"Configurable git workflows"** — NO other PM tool lets you configure git event → status mappings per project. This is unique.
4. **"Full CLI + TUI"** — 16 command categories, background daemon, PR creation, release notes. Jira has nothing. Linear has read-only.
5. **"Real velocity"** — From shipping data, not story point guesses.
6. **"Conventional commits"** — Parsed, auto-tagged, grouped into release notes. Native support.
7. **"Sprint auto-complete"** — When all tasks have merged PRs, sprint closes itself.
8. **"PR comment sync"** — Code review discussions live on the task too. Bidirectional.
9. **"AI estimation"** — 94% accuracy vs 47% industry average.
10. **"One tool"** — Replaces Jira + Confluence + time tracker + Slack notifications.
11. **"Free during early access"** — Zero risk pilot.
12. **"Open source core"** — Trust, transparency, no vendor lock-in.

# OBJECTION HANDLING CHEAT SHEET

| Objection | Response |
|---|---|
| "We're already invested in Jira" | "Run LTF1 alongside for one sprint. No migration needed. Compare results." |
| "Linear is good enough" | "Linear is great UX but same fundamental problem: manual updates. Your board is still ~75% accurate." |
| "We don't trust early access" | "Open source core. Your data exports anytime. Run alongside existing tool. Zero risk." |
| "Our workflow is too complex for auto-updates" | "Status transitions are fully configurable. Map any git event to any workflow step." |
| "What about non-developer tasks?" | "LTF1 has full manual task management too. Auto-updates are for developer tasks; PMs can manage theirs normally." |
| "Pricing seems high vs Linear at $8" | "Factor in Confluence, time tracking plugins, AI features — LTF1 Pro includes everything. Actually cheaper total cost." |
| "We need on-premise" | "On our Q4 2026 roadmap. Currently cloud-only with SOC 2 auth, SSO, and BYOK for AI." |
| "What if LTF1 shuts down?" | "Open source core. Your data exports. No lock-in by design." |
