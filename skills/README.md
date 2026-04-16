# LTF1 Skills

AI agent skills for the LTF1 project management platform. These let Claude (and other AI coding agents) interact with LTF1 directly during coding sessions — creating tasks, marking them done, viewing sprints, all from inside the AI's tool loop.

## Available Skills

| Skill | Description |
|-------|-------------|
| [`ltf-pm`](./ltf-pm/) | Use the `ltf1` CLI to manage tasks, sprints, and projects from inside a coding session |

## Installation

### Via `npx skills add` (any agent)

```bash
npx skills add https://github.com/aansh-afk/ltf1-pm --skill ltf-pm
```

This installs the skill to whichever AI agent directory you select (Claude Code, Cursor, Cline, Codex, etc.).

### Via Claude Code plugin marketplace

```bash
/plugin marketplace add aansh-afk/ltf1-pm
/plugin install ltf-pm@ltf1-skills
```

### Manual install

Copy the `ltf-pm/` folder into your agent's skills directory:

| Agent | Skills Path |
|-------|------------|
| Claude Code | `~/.claude/skills/ltf-pm/` |
| Cursor | `.cursor/skills/ltf-pm/` |
| Cline | `.cline/skills/ltf-pm/` |
| Universal | `.agents/skills/ltf-pm/` |

## Prerequisites

1. Install the `ltf1` CLI globally:
   ```bash
   npm install -g @vvg-ltf1/cli
   ```

2. Authenticate (one-time):
   ```bash
   ltf1 auth login
   ```

3. Select a project (per repo):
   ```bash
   ltf1 project select
   # or auto-detect from git remote:
   ltf1 project detect --set
   ```

After that, your AI agent will be able to use `ltf1` commands during any coding session in that repo.

## How It Works

When you ask Claude (or another agent with this skill installed) to do work in a project that uses LTF1, the agent will:

1. Detect that the user has LTF1 installed and a project selected
2. Create a task for the work it's about to do (`ltf1 task create`)
3. Move the task into progress (`ltf1 task update -s in_progress`)
4. Implement the code
5. Comment on the task with what it did (`ltf1 task comment`)
6. Mark the task done (`ltf1 task done`)

The result: your team's board reflects everything the AI is building, in real time, without you having to manually file tickets.

## Skill Format

Each skill is a self-contained folder with a `SKILL.md` file. The frontmatter has two required fields:

```yaml
---
name: skill-name
description: When and why Claude should use this skill
---
```

The body is markdown instructions for the agent. See [`ltf-pm/SKILL.md`](./ltf-pm/SKILL.md) for a full example.

## Contributing

To add a new LTF1 skill:

1. Create a new folder under `skills/` with your skill name
2. Add a `SKILL.md` file with frontmatter and instructions
3. Update this README's "Available Skills" table
4. Open a PR

## License

AGPL-3.0 — same as the rest of LTF1.
