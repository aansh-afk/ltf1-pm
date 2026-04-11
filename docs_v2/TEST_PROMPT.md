# LTF1 AI Test Prompt

Copy everything below the `---` line and paste it as the first message to a fresh Claude Code instance running in a **completely empty folder** (no git repo, no files, nothing).

---

You are testing the AI suite of LTF1 — a git-native project management platform. Your job is to verify every AI feature works end-to-end and produce a detailed test report.

You are running in a **completely empty folder**. No git repo. No files. You are responsible for bootstrapping the entire test environment yourself: initializing git, creating directory structure, setting up any prerequisites, and running every test.

## Context

LTF1 is a project management platform with web app, terminal TUI, and CLI surfaces, all backed by a Convex backend. The full codebase lives at `/home/aansh/LTF1/iceberg-L`. Documentation for everything you need is at `/home/aansh/LTF1/iceberg-L/docs_v2/`.

**Required reading before you start** (in order):
1. `/home/aansh/LTF1/iceberg-L/docs_v2/00-executive-summary.md` — what LTF1 is
2. `/home/aansh/LTF1/iceberg-L/docs_v2/06-backend-api.md` — every Convex function (focus on the AI section)
3. `/home/aansh/LTF1/iceberg-L/docs_v2/07-cli-tui.md` — CLI commands you'll use
4. `/home/aansh/LTF1/iceberg-L/docs_v2/15-ai-test-suite.md` — the test guide context

Do NOT skim these. Read them. Take notes on the AI function names, argument shapes, and expected return types.

## Test Environment

- **Test folder**: the current working directory (empty when you start)
- **LTF1 deployment**: `https://upbeat-mouse-967.convex.cloud`
- **CLI binary**: `ltf` — you must verify it's installed; if not, install it via `npm install -g @vvg-ltf1/cli`
- **Auth**: you must verify the user is authenticated; if not, STOP and ask them to run `ltf1 auth login` themselves (it opens a browser and requires user interaction — you cannot run it autonomously)
- **Project**: you must verify a project is selected; if not, try `ltf1 project detect --set` first, otherwise STOP and ask the user to run `ltf1 project select`

## What You Are Building

This is not a one-shot test runner. You are building a **reproducible test suite** that the user (or another agent) can re-run later. The deliverables are:

1. **Real shell scripts** — one per test, executable, idempotent where possible
2. **Reusable helper library** — token extraction, Convex API call wrapper, assertion helpers
3. **A master runner** — `run-all.sh` that executes every test in order
4. **Per-test result files** — markdown documenting what happened on this run
5. **Raw outputs** — JSON/text dumps of every API response
6. **A final report** — `TEST_REPORT.md` with pass/fail and overall verdict

The user should be able to: clone the test repo on another machine, run `./run-all.sh`, and get the same coverage you produced — without ever talking to an AI.

## Final Repository Structure

By the time you finish, the test folder should look like this:

```
ltf1-ai-test/
├── README.md                          # what this repo is, prerequisites, how to run
├── SETUP.md                           # state found at bootstrap
├── TEST_REPORT.md                     # final pass/fail report (backend + CLI)
├── MANUAL_UI_CHECKLIST.md             # 11 manual checks for the user to walk through in their browser
├── BLOCKED.md                         # only if you got blocked (otherwise omit)
├── .gitignore
├── run-all.sh                         # master runner — runs every backend/CLI test in order
├── lib/
│   ├── auth.sh                        # token extraction + auth check helpers
│   ├── api.sh                         # convex_query / convex_mutation / convex_action wrappers
│   └── assert.sh                      # assert_eq, assert_contains, assert_json_path helpers
├── tests/                             # Backend/CLI tests (bash scripts) — 33 tests
│   ├── 01-prerequisites/
│   │   ├── 01-auth-status.sh
│   │   ├── 02-project-info.sh
│   │   └── ...
│   ├── 02-core-generation/
│   ├── 03-task-intelligence/
│   ├── 04-sprint-analysis/
│   ├── 05-insights-crud/
│   ├── 06-sessions-feedback/
│   ├── 07-usage-stats/
│   ├── 08-byok/
│   ├── 09-agent/
│   └── 10-error-handling/
├── results/                           # Per-test markdown results (mirror of tests/)
│   ├── 01-prerequisites/...
│   ├── ...
│   └── 10-error-handling/...
└── outputs/                           # Raw API responses
    ├── 06-simple-prompt.json
    ├── 09-task-generation.json
    └── ...
```

Note: Web UI testing is **manual**. The user clicks through the browser themselves following `MANUAL_UI_CHECKLIST.md`. No browser automation. No Playwright. No Puppeteer. No Node packages.

## Bootstrap (do this FIRST, before any tests)

1. **Initialize git**:
   ```bash
   git init
   git checkout -b main
   ```

2. **Create the directory structure**:
   ```bash
   mkdir -p lib tests outputs results
   mkdir -p tests/{01-prerequisites,02-core-generation,03-task-intelligence,04-sprint-analysis,05-insights-crud,06-sessions-feedback,07-usage-stats,08-byok,09-agent,10-error-handling}
   mkdir -p results/{01-prerequisites,02-core-generation,03-task-intelligence,04-sprint-analysis,05-insights-crud,06-sessions-feedback,07-usage-stats,08-byok,09-agent,10-error-handling}
   ```

3. **Write `.gitignore`**:
   ```
   node_modules/
   .env
   *.log
   ```

4. **Write `lib/auth.sh`** — token extraction + auth check helpers. Should expose:
   - `extract_token()` — read CLI config, return JWT
   - `assert_authenticated()` — fail if `ltf1 auth status` returns "not authenticated"
   - `get_project_id()` / `get_workspace_id()` / `get_user_id()`

5. **Write `lib/api.sh`** — Convex HTTP wrappers. Should expose:
   - `convex_query <path> <args-json>` — POST to /api/query
   - `convex_mutation <path> <args-json>` — POST to /api/mutation
   - `convex_action <path> <args-json>` — POST to /api/action
   - All return JSON to stdout, set non-zero exit on HTTP error

6. **Write `lib/assert.sh`** — assertion helpers:
   - `assert_eq <expected> <actual> <message>`
   - `assert_contains <substring> <text> <message>`
   - `assert_json_path <jq-expr> <json> <expected>` — runs jq and compares
   - `pass` / `fail <reason>` — print colored result, exit appropriately

7. **Write `run-all.sh`** — master runner. First iterates `tests/*/` and runs each `.sh` file, then runs `npx playwright test` for the UI suite. Captures pass/fail per test, writes a summary at the end. Should be re-runnable.

8. **Verify `ltf` is installed**:
   ```bash
   which ltf || npm install -g @vvg-ltf1/cli
   ```

9. **Verify auth and project context**. If anything is missing that requires user interaction, write `BLOCKED.md` and STOP:
   ```bash
   ltf1 auth status
   ltf1 project info
   ```

10. **Write `SETUP.md`** documenting what state you found:
    - ltf version
    - User email + ID
    - Workspace name + ID
    - Project name + key + ID
    - Whether keys are configured

11. **Write `README.md`** for the test repo explaining:
    - What this is
    - Prerequisites (ltf installed, authenticated, project selected)
    - How to run all tests: `./run-all.sh`
    - How to run a single test: `./tests/02-core-generation/06-simple-prompt.sh`
    - Where to find results

Only after bootstrap is complete, proceed to writing and running the tests.

## Your Tools

You have these tools at your disposal:
- `ltf` CLI commands (`ltf1 auth status`, `ltf1 task list`, `ltf1 ai suggest`, etc.)
- `curl` for hitting the Convex HTTP API directly when the CLI doesn't expose a feature
- File system to write test artifacts and the final report
- The user's auth token, which is stored in their CLI config (you can read it via `ltf1 config path` then read that file)
- `git` for committing test artifacts as you go (optional, but useful for tracking progress)

## Convex HTTP API Reference

Convex functions are called via HTTP POST to `https://upbeat-mouse-967.convex.cloud/api/{query|mutation|action}` with body:

```json
{
  "path": "ai/generate:generate",
  "args": { "prompt": "Hello" }
}
```

Auth header: `Authorization: Bearer <jwt-token-from-config>`

You can extract the token like this:
```bash
TOKEN=$(jq -r '.auth.token' < "$(ltf1 config path)")
```

## What You Must Test

For each of the 33 tests below, you create **three things**:

1. **A shell script** at `tests/<group>/<NN>-<name>.sh` that:
   - Sources `lib/auth.sh`, `lib/api.sh`, `lib/assert.sh`
   - Sets up any needed state
   - Calls the CLI or HTTP API (use API for things the CLI doesn't expose)
   - Saves raw response to `outputs/<NN>-<name>.json`
   - Runs assertions
   - Calls `pass` or `fail "reason"` at the end
   - Is idempotent where possible (safe to re-run)

2. **A result file** at `results/<group>/<NN>-<name>.md` that the script writes when it runs, documenting:
   - Status (PASS/FAIL/SKIPPED/PARTIAL)
   - Duration
   - Function called
   - Input args
   - Output preview
   - Verification checks performed
   - Notes

3. **A raw output dump** at `outputs/<NN>-<name>.json` (or .txt for non-JSON output)

After creating each test script, **run it immediately** to populate the result file. Don't write all 33 scripts then run them at the end — write, run, write, run.

### Group 1: Prerequisites (5 tests)
1. **`ltf1 auth status`** — verify authenticated, capture user ID and email
2. **`ltf1 project info`** — verify a project is selected, capture workspace ID + project ID
3. **Token extraction** — read CLI config, extract JWT, verify it parses
4. **Convex reachability** — `curl https://upbeat-mouse-967.convex.cloud/version` should return 200
5. **AI provider key check** — call `getProviderKeys` query with the token; document which keys exist (platform CEREBRAS_API_KEY/GROQ_API_KEY presence is server-side and you can't directly check, but you can probe by calling `ai/generate:generate` and seeing if it errors with "no key configured")

### Group 2: Core Generation (3 tests)
6. **Simple prompt** — Call `ai/generate:generate` action with `{"prompt": "Reply with the single word HELLO"}`. Verify response contains "HELLO" (case insensitive). Capture model and provider.
7. **System prompt** — Call with `{"prompt": "What is 2+2?", "systemPrompt": "Reply with only a single digit, nothing else."}`. Verify response is "4" (or close).
8. **Function category routing** — Call with `{"prompt": "test", "functionCategory": "task_generation"}`. Verify it picks the low-complexity model. With `"functionCategory": "code_review"` verify it picks the high-complexity model. Compare model names in responses.

### Group 3: Task Intelligence (4 tests)
9. **Task generation from description** — Call `ai/projectInsights:generateTasksFromDescription` action with `{"projectId": "<your-project-id>", "description": "Add OAuth login with GitHub and Google providers"}`. Verify it returns 3-8 tasks each with title, description, type, priority, estimatedPoints. Save to `outputs/task-generation.json`.
10. **Smart assignee suggestions** — Call `ai/taskAssignment:suggestAssignees` action with a real `taskId` from `ltf1 task list --json` and the project ID. Verify response is an array (may be empty if no developer profiles exist; that counts as a partial pass — note it).
11. **Natural language task creation via CLI** — `ltf1 ai describe "fix the login button alignment on mobile"`. Verify it returns a description. If `--create` flag works, verify a task was actually created in the project.
12. **AI suggest CLI** — `ltf1 ai suggest`. Document what it returns.

### Group 4: Sprint Analysis (3 tests)
13. **Sprint insights generation** — Get the active sprint via `ltf1 sprint status --json`. If one exists, call `ai/projectInsights:generateProjectInsights` action with `{"projectId": "<id>", "sprintId": "<id>"}`. Verify response has `sprintHealth` (with score 0-100), `metrics`, `risks`, `recommendations`. If no active sprint, create one via `ltf1 sprint create "AI Test Sprint" --start <today> --end <today+14days>` and add a few tasks first.
14. **`ltf1 ai analyze`** — Run with the active sprint. Document output.
15. **Standup summary** — Call `ai/projectInsights:generateStandupSummary` action. Verify response has `narrative`, `keyAchievements`, `focusAreas`, `teamMood`.

### Group 5: Insights CRUD (4 tests)
16. **Create insight** — Call `ai/mutations:createAIInsight` mutation with `{"workspaceId": "...", "targetType": "project", "targetId": "<projectId>", "insightType": "recommendation", "severity": "medium", "title": "Test insight", "description": "Created by AI test suite", "recommendations": ["Test recommendation 1"]}`. Capture the returned insight ID.
17. **List active insights** — Call `ai/queries:getActiveInsights` query with `{"targetType": "project", "targetId": "<projectId>"}`. Verify the insight you just created is in the response.
18. **Dismiss insight** — Call `ai/mutations:dismissAIInsight` with the insight ID. Re-list and verify it's no longer in active insights.
19. **Insights from sprint analysis** — After running test 13, check if any new insights were auto-created via `getActiveInsights`. Document.

### Group 6: AI Sessions & Feedback (3 tests)
20. **Session was tracked** — After the calls from groups 2-4, query `ai/queries:getUserAISessions` with `{"limit": 20}`. Verify your test calls are present. Capture a session ID.
21. **Submit feedback** — Call `ai/mutations:addAIFeedback` with `{"sessionId": "<id>", "helpful": true, "rating": 5, "comment": "Test feedback from AI test suite"}`. Verify no error.
22. **Feedback summary** — Call `ai/queries:getAIFeedbackSummary` with `{"workspaceId": "<id>"}`. Verify your feedback is reflected in totals.

### Group 7: Workspace AI Stats (1 test)
23. **Usage stats aggregation** — Call `ai/queries:getWorkspaceAIStats` with `{"workspaceId": "<id>", "timeRange": "day"}`. Verify response has `totalSessions`, `totalTokens`, `totalCost`, `averageLatency`, `cacheHitRate`, `modelUsage`, `typeBreakdown`. Verify the totals reflect your test calls.

### Group 8: BYOK Key Management (4 tests)
24. **List provider keys** — Call `ai/keyManagement:getProviderKeys` query with `{"scope": "user", "scopeId": "<your-clerk-id>"}`. Document existing keys (do not assume they exist).
25. **Save dummy key** — Call `ai/keyManagement:saveProviderKey` action with `{"provider": "cerebras", "apiKey": "test-invalid-key-do-not-use", "scope": "user", "displayName": "Test key"}`. **Expected**: this should FAIL validation. Capture the error message. If it succeeds (key validation passes for an invalid key), that's a bug — flag it.
26. **Save valid key (skip if no real key available)** — If the user provided a real test key in the env var `LTF_TEST_CEREBRAS_KEY`, save it and verify success. Otherwise mark this test as SKIPPED with reason "no real test key provided".
27. **Project AI settings** — Call `ai/keyManagement:getProjectAISettings` query. If a record exists, verify shape. If not, call `ai/keyManagement:updateProjectAISettings` to enable AI for the project, then re-fetch.

### Group 9: Agent Commands (3 tests)
28. **`ltf1 agent triage`** — Run the command. Document output. **Expected**: empty queue OR a list of triage suggestions. Either is OK; document which.
29. **`ltf1 agent suggest`** — Run with active project. Document output.
30. **`ltf1 agent status`** — Run. Document any agent activity feed entries.

### Group 10: Error Handling (3 tests)
31. **Invalid project ID** — Call `ai/projectInsights:generateProjectInsights` with `{"projectId": "invalid_id_xxx"}`. Verify it errors gracefully with a meaningful message.
32. **Empty prompt** — Call `ai/generate:generate` with `{"prompt": ""}`. Document behavior (should error or return helpful message).
33. **Rate limiting** — Make 10 rapid calls to `ai/generate:generate`. Verify either all succeed or rate limiting kicks in with a clear error.

### Group 11: Web UI (manual checklist for the user — 11 checks)

The user is going to test the Web UI **themselves** by clicking through the app. Your job for this group is **NOT** to automate anything — it's to generate a clear, step-by-step manual test checklist they can follow with their own browser open.

Do NOT install Playwright. Do NOT install puppeteer. Do NOT use any browser automation. Generate a single file `MANUAL_UI_CHECKLIST.md` with explicit instructions and checkboxes the user fills in.

The web app is at `https://ltf1.dev` (or `http://localhost:3000` if `LTF_WEB_URL` env is set — check it).

Write `MANUAL_UI_CHECKLIST.md` with this structure:

```markdown
# Web UI Manual Test Checklist

Open https://ltf1.dev in your browser. Sign in if you haven't already.
Walk through each check below in order. Mark each `[ ]` → `[x]` PASS or `[F]` FAIL as you go.
For failures, jot a note about what went wrong in the "Notes" line below the check.

---

## Check 34: Dashboard loads cleanly
Navigate to: https://ltf1.dev/dashboard
- [ ] Page renders without a blank screen
- [ ] No red error overlays
- [ ] User menu (top right) is visible
- [ ] Sidebar nav is visible
- [ ] Open browser DevTools (F12) → Console tab → no red errors

**Notes**:

---

## Check 35: AI Settings tab is reachable
Navigate to: https://ltf1.dev/settings
Click the "AI" tab in the settings nav.
- [ ] AI tab exists in the settings menu
- [ ] Tab content renders
- [ ] Provider key list is visible (may be empty)
- [ ] "Add Provider Key" button is visible

**Notes**:

---

## Check 36: Add an invalid BYOK key (should be rejected)
Still in Settings → AI:
1. Click "Add Provider Key"
2. Choose provider: Cerebras
3. Paste this fake key: `invalid-key-test-do-not-use-12345`
4. Click Save / Validate

- [ ] An error message appears (validation should reject the bad key)
- [ ] No key was added to the list
- [ ] Error message is human-readable (not just "error")

**Notes**:

---

(repeat for all 11 checks)
```

Generate **all 11 checks** with this structure. Each check is one clear navigation + a few specific things to verify with checkboxes. Be precise: tell the user exactly which page, exactly which button, exactly what to look for.

**The 11 UI checks** (you fill in each with full step-by-step + checkboxes):

34. **Dashboard loads cleanly** — `/dashboard` renders, no console errors
35. **AI Settings tab reachable** — `/settings` → AI tab → key list + add button visible
36. **Add invalid BYOK key** — Cerebras key validation rejects bad key
37. **AI task creator** — `/tasks` → New Task → NaturalLanguageTaskCreator generates tasks from description
38. **AI assignee suggestions** — Open a task → click AI Suggest on assignee field → list appears (or empty state)
39. **AITaskEnhancer** — On task detail, click sparkles icon → enhancer panel opens
40. **AI Insights Panel** — `/sprints` → click into active sprint → click Generate Insights → health score + risks + recommendations appear
41. **Daily Standup Summary** — Find DailyStandupSummary on dashboard or sprint page → click generate → narrative text appears
42. **AI Analytics Dashboard** — Find AIAnalyticsDashboard (settings → AI or analytics view) → shows totalSessions / totalTokens / totalCost
43. **Triage page** — `/triage` loads, shows either queue items or empty state, no errors
44. **SmartTaskGenerator** — Find on project or task creation flow → enter "Build a notification system with email, push, in-app" → multiple tasks appear for approval

For each check, write:
- The exact URL to navigate to
- The exact buttons/links to click in order
- 3-6 explicit verification checkboxes
- A "Notes" line for the user to record observations
- Any setup steps needed (e.g., "you must have an active sprint for this check")

At the bottom of `MANUAL_UI_CHECKLIST.md`, include a summary table:
```markdown
## Summary
| Check | Description | Result |
|-------|-------------|--------|
| 34 | Dashboard loads | [ ] |
| 35 | AI Settings tab | [ ] |
| ... | ... | [ ] |

**Total**: __ / 11
**Passed**: __
**Failed**: __
```

The user fills in this summary as they complete each check.

**Important**: This file is the ONLY deliverable for Group 11. There are no `.sh` scripts, no `tests-ui/` folder, no Playwright config, no `package.json`. Just the markdown checklist.

**Total tests now: 44** (33 automated backend/CLI + 11 manual UI checks)

## Output Format

For each test, write a file `tests/<group>-<num>-<name>.md` with this structure:

```markdown
# Test 06: Simple prompt generation

**Status**: PASS | FAIL | SKIPPED | PARTIAL
**Duration**: 1.2s
**Function**: ai/generate:generate (action)

## Input
{
  "prompt": "Reply with the single word HELLO"
}

## Output
{
  "text": "HELLO",
  "model": "gpt-oss-120b",
  "provider": "cerebras"
}

## Verification
- ✓ Response contains "HELLO"
- ✓ Model field present
- ✓ Provider field present

## Notes
None.
```

For failures, include the full error and a "How to fix" section based on what you find in the docs.

## Final Report

When you've finished all 33 tests, write `TEST_REPORT.md` in the test repo root:

```markdown
# LTF1 AI Test Report

**Generated**: <ISO timestamp>
**Deployment**: https://upbeat-mouse-967.convex.cloud
**Tester user**: <email from auth status>
**Workspace**: <name>
**Project**: <name>

## Summary
| | Count |
|---|---|
| Total | 33 |
| Passed | X |
| Failed | Y |
| Skipped | Z |
| Partial | W |

## Results by Group

### Group 1: Prerequisites
- ✓ Test 01 ...
- ✓ Test 02 ...
...

(repeat for all 10 groups)

## Failures (sorted by severity)

### CRITICAL: Test XX — <name>
- **Symptom**: ...
- **Likely cause**: ...
- **Fix**: ...

### HIGH: ...

## AI Suite Health Score: X/100

(Calculate based on pass rate and severity of failures.)

## Recommendations

(Top 3-5 things the user should fix or investigate.)
```

## Rules

1. **Read the docs first.** Don't guess function names. Look them up in `docs_v2/06-backend-api.md`.
2. **Save raw outputs.** Every API response goes in `outputs/`. Don't just summarize.
3. **Don't bail on first failure.** Run every test. Failures get logged and the suite continues.
4. **Use `--json` flags on CLI commands** so output is machine-parseable.
5. **Be precise about pass/fail.** Partial passes are valid (e.g., empty array when no data exists).
6. **Don't create test data outside the user's selected project.** Use the active project from `ltf1 project info`.
7. **Don't delete anything** the user hasn't asked you to. Test data gets tagged with "AI Test Suite" in titles so it's findable later.
8. **If a test requires data that doesn't exist**, set it up first (e.g., create a sprint if there isn't one). Document what you created.
9. **Be explicit about provider/model used** in every test result.
10. **At the end, give a verdict**: is the AI suite working? Where are the gaps?

## Getting Started

Your sequence is:
1. Read the four required docs from `/home/aansh/LTF1/iceberg-L/docs_v2/`
2. Run the **Bootstrap** section above (git init, mkdir, install/verify ltf, verify auth, write SETUP.md)
3. Work through the 33 tests in order
4. Write `TEST_REPORT.md` at the end

If at any point you cannot proceed because the user needs to do something interactive (auth login, fill in a developer profile, create a project, etc.), STOP, write a clear note in `BLOCKED.md` describing what you need, and wait for the user. Do not make up data or guess.

Begin now.
