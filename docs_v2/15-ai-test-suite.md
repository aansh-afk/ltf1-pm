# AI Test Suite — Quick Start

How to test every AI feature in LTF1 end-to-end by handing a prompt to another Claude Code instance.

---

## What This Tests

| Group | Features |
|-------|---------|
| **Core generation** | `ai.generate` action — raw text generation via Cerebras/Groq |
| **Task intelligence** | Generate tasks from description, smart assignment, complexity estimation |
| **Sprint analysis** | Health score, risks, recommendations, velocity prediction |
| **Insights CRUD** | Create, list, dismiss AI insights |
| **Task suggestions** | AI-generated task suggestions from commits/PRs |
| **Standup summary** | Daily activity → narrative summary |
| **Documentation gen** | PR, README, API, tech-spec, release notes |
| **Session tracking** | Every AI call logged to `aiSessions` |
| **Feedback loop** | Rate AI outputs, aggregate stats |
| **Usage stats** | Per-workspace token/cost/latency aggregations |
| **BYOK** | Save/validate/delete user's own Cerebras/Groq keys |
| **Project AI settings** | Enable/disable, set active key, model overrides |
| **CLI commands** | `ltf ai suggest`, `ltf ai analyze`, `ltf ai describe` |
| **Agent commands** | `ltf agent triage`, `ltf agent suggest`, `ltf agent status` |

**Total: ~25 tests across 14 feature groups.**

---

## Setup (one time, ~2 minutes)

```bash
# 1. Make sure ltf is installed and you're authenticated
npm install -g @vvg-ltf1/cli
ltf auth login                        # opens browser
ltf project select                    # pick your test project (or create one)

# 2. Create an EMPTY folder somewhere (no git init, no files — leave it empty)
mkdir ~/ltf1-ai-test
cd ~/ltf1-ai-test

# 3. Make sure you have either:
#    a) AI provider env vars set on your Convex deployment (CEREBRAS_API_KEY or GROQ_API_KEY)
#    b) Or a BYOK key saved via the web app at /settings → AI tab
#    Otherwise the AI tests will fail with "no key configured"
```

The test Claude will bootstrap the folder itself: `git init`, create directories, verify ltf is installed, verify auth, then start running tests.

---

## Run the Test

1. Open a **fresh** Claude Code instance in the empty `~/ltf1-ai-test` folder
2. Copy the entire contents of [`TEST_PROMPT.md`](./TEST_PROMPT.md) as the first message
3. Hit send and let Claude work through the full suite (~10–15 minutes)
4. When it finishes, read `TEST_REPORT.md` in the test folder

If any prerequisite is missing that requires your interaction (like browser auth), the test Claude will stop and write `BLOCKED.md` telling you exactly what to do. Resolve it and tell Claude to continue.

---

## What You'll Get Back

When the test Claude finishes, your test repo will have:

```
ltf1-ai-test/
├── TEST_REPORT.md          # Pass/fail per feature with timing + errors
├── tests/
│   ├── 01-generate.sh
│   ├── 02-task-generation.json
│   ├── 03-assignee-suggest.json
│   ├── 04-sprint-insights.json
│   ├── 05-standup-summary.txt
│   ├── 06-documentation.md
│   ├── 07-cli-output.txt
│   └── ... (one file per test)
├── outputs/
│   └── (raw API responses for inspection)
└── setup-data/
    └── (test workspace/project IDs created)
```

---

## Reading the Report

`TEST_REPORT.md` will look like:

```markdown
# LTF1 AI Test Report
Generated: 2026-04-12T01:23:45Z
Deployment: https://upbeat-mouse-967.convex.cloud

## Summary
Total: 25 | Passed: 22 | Failed: 2 | Skipped: 1

## Results

### ✓ Core Generation (api.ai.generate.generate)
Status: PASS | Duration: 1.2s
Model: gpt-oss-120b (cerebras)
Output preview: "The capital of France is Paris..."

### ✗ Smart Assignee Suggestions (suggestAssignees)
Status: FAIL | Duration: 0.3s
Error: No developer profiles in workspace
Fix: Run `ltf project info` and ensure at least one team member has a developer profile
```

Each failed test will tell you exactly what's broken and how to fix it.

---

## Common Failure Modes

| Symptom | Fix |
|---------|-----|
| `not authenticated` | `ltf auth login` |
| `no project selected` | `ltf project select` |
| `CONVEX_URL not configured` | `ltf config set convexUrl https://upbeat-mouse-967.convex.cloud` |
| `no key configured for cerebras/groq` | Add CEREBRAS_API_KEY/GROQ_API_KEY to Convex env, or save BYOK in web settings |
| `developer profile not found` | Web app → Profile → fill in tech stack and skills |
| `no active sprint` | Web app → Sprints → create one |
| `rate limit exceeded` | Wait a few minutes (free tier limit) |

---

## What This Doesn't Test

- **UI rendering**: Frontend components like `AIInsightsPanel`, `NaturalLanguageTaskCreator` need browser testing
- **Cron jobs**: Scheduled AI tasks (none currently scheduled)
- **Webhook-triggered AI**: Commit → task suggestion flow needs a real GitHub push
- **Cost accuracy**: We log cost, but don't verify against provider invoices
- **Concurrency**: No parallel-load testing

For UI testing, use the browser. For cron/webhook testing, use a real git push. For everything else, this suite covers it.
