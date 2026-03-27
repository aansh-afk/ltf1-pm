# Strategic Vision — ltf1-pm

## The Shift

The project management industry is undergoing a phase transition. Linear's "Next" announcement (March 2026) is the signal: **the era of manual issue tracking is ending**. The next generation of PM tools will be agent-native — systems where AI agents autonomously create, triage, assign, and resolve work alongside human developers.

ltf1-pm was built with the right instincts: git-native, developer-first, terminal-accessible. But the product must now evolve from **"automated PM tool"** to **"agent-native dev workspace."**

---

## Vision Statement

> LTF1 is the agent-native dev workspace where your terminal, your code, and your AI work from the same context to ship software without overhead.

### What This Means

1. **Agent-native**: AI agents are not bolted on — they are architectural. The system is designed for agents to read context, make decisions, and take actions autonomously.
2. **Dev workspace**: Not a PM tool. Not a ticketing system. A workspace where developers do their actual work — plan, code, review, ship.
3. **Terminal + code + AI**: Three surfaces (TUI, web, agent) sharing the same real-time backend. The terminal is a first-class citizen, not an afterthought.
4. **Same context**: One unified context layer — tasks, code, decisions, specs — that both humans and agents consume.
5. **Ship without overhead**: Every feature must reduce friction. If a feature adds process, it doesn't ship.

---

## Market Position

### The Landscape (March 2026)

| Tool | Primary User | Interface | Agent Strategy | Weakness |
|------|-------------|-----------|---------------|----------|
| **Linear** | PMs + Devs | Browser | Agent-first (native agent, skills, automations) | No CLI/TUI, premium pricing |
| **Jira** | PMs + Enterprise | Browser | Bolt-on AI (Atlassian Intelligence) | Heavy, slow, enterprise overhead |
| **GitHub Issues/Projects** | Devs | Browser + CLI | Copilot integration | Minimal PM features, no sprint mgmt |
| **Plane** | Devs | Browser | Basic AI | No CLI, limited agent vision |
| **Shortcut** | Small teams | Browser | Minimal AI | No dev tooling |
| **LTF1** | Devs who ship | Terminal + Browser | Agent-native (building) | Early stage, small team |

### Where LTF1 Wins

**Position**: The agent-native PM for developers who live in terminals.

Linear is building for teams where PMs drive the process through a browser. LTF1 is building for teams where developers drive the process through their terminal and their code.

| Linear's World | LTF1's World |
|---------------|----------------|
| PM creates issues in browser | Dev pushes code, issues update themselves |
| Agent works through Linear UI | Agent works through terminal + git hooks |
| Skills triggered via slash commands in app | Skills triggered via `ltf skill run` in terminal |
| Code review in Linear's diff viewer | Code review in terminal with agent context |
| Browser-first, no CLI | Terminal-first, browser as dashboard |

---

## Three Pillars

### Pillar 1: Context Layer

Everything that matters about a project lives in one unified system that both humans and agents can read:

- **Tasks**: Status, priority, assignees, dependencies, time tracked, code linked
- **Code**: Commits, branches, PRs, diffs, file changes — indexed and searchable
- **Decisions**: Why something was built a certain way (captured in docs/comments)
- **Specs**: What needs to be built (documents, descriptions, acceptance criteria)
- **Velocity**: How fast the team ships (from actual git data, not estimates)
- **Team**: Who knows what, who's available, who's best for this task

**Current state**: LTF1 has tasks, code (via GitHub), and team data. Missing: decisions as first-class entities, spec-to-task linking, code indexing beyond commit parsing.

### Pillar 2: Rules Layer

Teams codify their workflows as reusable patterns that agents follow:

- **Skills**: Named workflow templates triggered by slash command or auto-applied
  - `/skill bug-triage` → categorize, prioritize, assign to on-call, notify Slack
  - `/skill deploy-checklist` → create 5 linked verification tasks
  - `/skill sprint-plan` → AI suggests sprint from backlog priorities
- **Automations**: Event-driven rules that fire on triggers
  - Task created → auto-triage (categorize, prioritize, assign)
  - PR merged → move task to done, update sprint progress
  - Sprint ending → generate summary, move incomplete to backlog
- **Permissions**: Who can do what, including agent permissions
  - Agent can create tasks but not delete
  - Agent can assign but human approves
  - Agent can suggest priority but not override urgent

**Current state**: LTF1 has an automation system (trigger → action) but no skills system, no agent permissions, limited auto-triage.

### Pillar 3: Agent Layer

AI agents that operate within the context and rules to do work autonomously:

- **Triage Agent**: Every new issue gets categorized, prioritized, and routed automatically
- **Planning Agent**: Suggests sprint plans, identifies blockers, flags risks
- **Assignment Agent**: Matches tasks to developers based on skills, availability, workload
- **Code Agent**: Reviews PRs against task requirements, suggests fixes
- **Insight Agent**: Surfaces risks, anomalies, and opportunities from project data

**Current state**: LTF1 has basic AI (task suggestions, insights, developer matching). These are utility functions, not agents. They need to become autonomous workers with context awareness.

---

## Product Principles

### 1. Automation Over Process
If a human has to do it manually, the product has failed. Every action should be automatable — by a rule, a skill, or an agent.

### 2. Terminal is Primary
The web app is the dashboard. The terminal is the workspace. Features ship to TUI first, web second.

### 3. Git is Truth
The repository is the single source of truth. Tasks derive their state from git events. Velocity comes from shipping data, not estimates. Story points come from code complexity, not guesses.

### 4. Context Over Handoffs
Don't build handoff workflows (PM → Dev → QA). Build shared context that everyone (and every agent) reads from. Decisions, specs, and code live in the same system.

### 5. Reduce, Don't Add
Every feature request should be answered with: "Can an agent do this instead?" If yes, build the agent, not the UI. The best feature is one the user never has to interact with.

### 6. Open by Default
Open source. Self-hostable. Transparent. The community builds trust. The enterprise plan builds revenue.

---

## Revenue Model

### Free Tier (Open Source)
- 5 members, 100 AI credits/month
- Full git integration, PR-driven updates, CLI/TUI
- Sprint management, task automation
- Self-hosted option

### Pro Tier ($15/user/month)
- Unlimited members and AI credits
- Agent features (triage, planning, assignment, code review)
- Skills system, advanced automations
- Code intelligence, diff viewer
- Priority support

### Enterprise Tier (Custom)
- On-premise deployment
- Custom agent configurations
- SSO/SCIM, audit logs
- Dedicated support, SLA
- Custom integrations

---

## Success Metrics

### Product Metrics
- **Zero-touch rate**: % of tasks that complete their lifecycle without manual status updates
- **Agent adoption**: % of workspaces with active agents
- **TUI usage**: % of daily active users who use the terminal interface
- **Triage speed**: Time from issue creation to categorized + assigned (target: <30 seconds)

### Business Metrics
- **GitHub stars**: Community signal
- **Self-hosted deployments**: Adoption signal
- **Pro conversion**: Revenue signal
- **Enterprise pipeline**: Growth signal

---

## Timeline

### Q2 2026 (Now): Foundation
- Agent architecture in Convex (context assembly, triage pipeline)
- Skills system (define, store, trigger)
- TUI agent commands (`ltf agent triage`, `ltf skill run`)
- Triage automation on task creation

### Q3 2026: Intelligence
- Code intelligence (repository indexing, semantic search)
- Planning agent (sprint suggestions from backlog + velocity)
- Assignment agent (match tasks to devs from skills + availability)
- Code diff viewer (web + TUI)

### Q4 2026: Autonomy
- Coding agent integration (PR creation from task specs)
- Agent-to-agent collaboration (triage → assign → plan → code)
- Skills marketplace (share team workflows)
- Enterprise features (SSO, audit, on-prem)

### 2027: Platform
- Plugin system for custom agents
- Third-party integrations marketplace
- Self-hosted agent infrastructure
- Mobile agent notifications and approvals
