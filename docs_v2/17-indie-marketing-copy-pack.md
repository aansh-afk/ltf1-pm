# Indie Marketing Copy Pack — LTF1

Companion to `16-indie-marketing-strategy.md`. Drop-in copy for launches, posts, and DMs. Edit lightly to fit your voice — don't rewrite from scratch.

---

## 1. Hero One-Liners (rotate across surfaces)

- Git-native project management. Your tasks update when you push code.
- The PM tool that lives in your terminal.
- Stop dragging cards. Start shipping code.
- Your repo is the source of truth. LTF1 is the interface.
- Project management for developers who write code, not developers who update tickets.

---

## 2. README Hero Rewrite (drop-in)

```markdown
# LTF1

**Git-native project management. Your tasks update when you push code.**

![LTF1 TUI demo](docs/hero.gif)

LTF1 is the PM tool for developers who'd rather ship than update tickets.
Push code → the board updates. Merge a PR → the task closes. Plan a sprint
without leaving your terminal.

```bash
npm install -g @vvg-ltf1/cli
ltf1 auth login
ltf
```

[Quickstart](#quick-start) · [Discord](https://discord.gg/jWMS6Pcr) · [Website](https://ltf1.dev)
```

---

## 3. Show HN Post

**Title** (80 char limit, no emoji, no exclamation):
> Show HN: LTF1 – Git-native project management with a terminal UI

**Body**:
> Hi HN — I'm a solo developer and I built LTF1 because every PM tool I tried made me stop coding to update a ticket.
>
> LTF1 inverts that: you push code, and the board updates itself. Story points are estimated from your diff size, velocity is measured from actual shipped commits, and the whole thing has a real TUI so you don't have to leave your editor.
>
> Three surfaces, one backend:
> - Web app (dashboard, kanban, sprints)
> - Full TUI (`ltf` — keyboard-driven, vim bindings)
> - CLI (14 command groups, scriptable)
>
> Bi-directional GitHub sync, AGPL-licensed, self-hostable. Built on Convex for real-time queries.
>
> It's early — open-source tier is free for 5 seats. I'd love feedback on the TUI especially, since that's the part I haven't seen anyone else build.
>
> Repo: https://github.com/aansh-afk/ltf1-pm
> Site: https://ltf1.dev
>
> Happy to answer anything about the architecture, design choices, or how the git → task linking works under the hood.

**Comment-ready answers** (paste these as replies to common questions):

*"How does it differ from Linear?"*
> Linear is browser-first and closed-source. LTF1 is terminal-first and AGPL. Linear is building agents for PMs; I'm building agents for devs. The TUI is the main wedge — it's the experience I always wanted Linear to have.

*"Why AGPL?"*
> I want self-hosting to be a real option, not a tease. AGPL means you can run LTF1 on your own infra, but if you turn it into a SaaS, you have to share your changes. Same as Plane and Mastodon.

*"What about offline?"*
> The CLI works offline for read operations against a local cache. Writes queue and sync when you reconnect. Real offline-first is on the roadmap.

---

## 4. Product Hunt Launch

**Tagline** (60 char):
> Git-native PM. Tasks update when you push code.

**Description**:
> LTF1 is project management for developers who write code, not developers who update tickets.
>
> Push code → the board updates. Story points come from diffs. Velocity comes from shipped commits. Manage your sprint from a real terminal UI without leaving your editor.
>
> ▸ Web app, TUI, and CLI — one backend
> ▸ Bi-directional GitHub sync
> ▸ AI sprint health, smart assignment, AI estimates (BYOK)
> ▸ 20 themes including Tokyo Night, Catppuccin, Gruvbox
> ▸ Open source (AGPL) — self-host or use the cloud
>
> Built solo. Free for 5 seats. Pro at $10/user.

**First comment** (post this yourself when you go live):
> Maker here 👋. I built LTF1 because I'm a developer and I hate updating tickets. The TUI is the part I'm proudest of — happy to answer anything about how it works, or about going from idea to launch as a solo dev. AMA.

---

## 5. Reddit Posts

### r/programming

**Title**: I built a PM tool that updates tickets when you push code

**Body**:
> Three years of dragging cards in Jira pushed me to build the opposite: a PM tool where the board is downstream of git. You push code, the task updates. You merge a PR, it closes. Story points come from the diff, velocity from actual commits.
>
> The interesting bit is that it ships with a full TUI — dashboard, sprint planning, task management, all keyboard-driven. I haven't seen any other PM tool ship a real terminal UI.
>
> Open source (AGPL), built on Convex + React + Ink for the TUI. Free tier for 5 seats.
>
> I'd love feedback on whether this resonates or if I'm solving a problem only I have.
>
> Repo: github.com/aansh-afk/ltf1-pm

### r/commandline

**Title**: I built a project management TUI because I was tired of leaving my terminal to update tickets

**Body**:
> [GIF here]
>
> Vim-style bindings, full sprint/board/task management, git integration. Runs anywhere Node runs.
>
> ```bash
> npm install -g @vvg-ltf1/cli
> ltf
> ```
>
> Open source. Would love TUI nerds to tell me what's wrong with it.

### r/selfhosted

**Title**: LTF1 — self-hostable, AGPL, git-native project management with a terminal UI

**Body**:
> Built this because I wanted Linear, but open source, terminal-first, and self-hostable.
>
> Stack: Convex backend, React web app, Ink-based TUI, AGPL license. You can run the whole thing yourself or use the hosted cloud.
>
> Free for 5 seats forever. Self-hosting docs are in the repo.
>
> [GIF/screenshot]
>
> github.com/aansh-afk/ltf1-pm

---

## 6. Twitter / X Threads

### Launch thread (8 tweets)

**1**:
> i'm a solo dev and i built a project management tool because every existing one made me leave my editor to update a ticket
>
> meet LTF1 — git-native PM that updates itself when you push code
>
> [hero GIF]

**2**:
> the core idea is simple: your repo is the source of truth, not the board
>
> push code → task updates
> merge PR → task closes
> commit message links to issue → it's tracked
>
> no manual dragging. no status meetings. just shipping.

**3**:
> story points come from your diff size
> velocity comes from your shipped commits
> sprint health comes from real data, not vibes

**4**:
> the part i'm proudest of is the TUI
>
> full dashboard, kanban, sprint planning — all in your terminal, vim-bindings, real-time
>
> no other PM tool has this. it's the thing that made me start building.
>
> [TUI GIF]

**5**:
> three surfaces, one backend:
> ▸ web app
> ▸ TUI (`ltf`)
> ▸ CLI (14 command groups)
>
> built on convex for real-time queries. clerk for auth. AGPL licensed.

**6**:
> AI is BYOK — bring your own gemini/groq/cerebras key
>
> uses it for: task suggestions from commits, smart assignment, sprint health analysis, natural language task creation
>
> no AI lock-in. you own the bill.

**7**:
> free for 5 seats, forever
> pro at $10/user/month
> self-host the whole thing if you want
>
> i'm one person. i made the pricing what i'd want to pay.

**8**:
> repo: github.com/aansh-afk/ltf1-pm
> site: ltf1.dev
> discord: [link]
>
> if you've ever closed a PR and then had to go drag a card afterward, this is for you.
>
> would love a star if it resonates 🟢

### Daily devlog template

> day [N] of building LTF1 in public:
>
> shipped: [one specific thing]
> learned: [one specific thing]
> next: [one specific thing]
>
> [screenshot or GIF]

### Opinion post examples (use sparingly, 1–2 per week)

> story points are theater.
>
> the only honest measure of velocity is "did this commit ship to main?"
>
> built LTF1 to measure exactly that.

> jira charges you per seat to make your team less productive
>
> you're paying for the meetings the tool requires, not the value it provides

> the best PM tool is the one your developers don't notice

---

## 7. Hacker Newsletter / Console.dev Pitch

**Subject**: LTF1 — git-native PM with a terminal UI (solo founder)

**Body**:
> Hi [name],
>
> I'm Aansh, the solo developer behind LTF1. It's a project management tool where your tasks update when you push code, with a full terminal UI for devs who don't want to leave their editor.
>
> I think it'd fit Console because:
> - It's an indie tool by a solo dev
> - It has a real TUI (rare in PM tools)
> - It's AGPL and self-hostable
> - The hook ("PM that updates itself") is concrete and demoable in 30 seconds
>
> Repo: github.com/aansh-afk/ltf1-pm
> Site: ltf1.dev
> 30-sec demo: [GIF link]
>
> Happy to record a custom demo if it'd help. Thanks for considering.
>
> — Aansh

---

## 8. Cold DM Templates

**To friendly devs / beta testers**:
> hey [name] — i've been building LTF1, a git-native PM tool with a terminal UI. early access is open and i'd love your honest feedback (especially the bad parts). takes about 5 min to set up. no obligation, no follow-up emails. cool if i send you a link?

**To podcast hosts**:
> hi [name] — long-time listener. i'm a solo dev who just shipped LTF1 (a git-native PM tool with a terminal UI). i think your audience would resonate with: building solo, picking AGPL over MIT, and why i think the future of dev tools is in the terminal. happy to be a guest if you ever have a slot.

**To prospective hunters (Product Hunt)**:
> hey [name] — launching LTF1 on Product Hunt next week (a git-native PM tool with a terminal UI). would mean the world if you'd be a hunter or just upvote on launch day. happy to return the favor.

---

## 9. Email Newsletter (welcome + monthly)

### Welcome email

**Subject**: welcome to LTF1 — here's the 5-min setup

> hi — thanks for signing up. i'm aansh, the solo dev who built LTF1.
>
> here's the fastest path to seeing the magic:
>
> 1. install the CLI: `npm install -g @vvg-ltf1/cli`
> 2. log in: `ltf1 auth login`
> 3. launch the TUI: `ltf`
>
> if you connect a github repo, your tasks will start updating from your commits within minutes. that's the whole pitch.
>
> reply to this email if anything breaks — it goes straight to me.
>
> — aansh

### Monthly changelog email

**Subject**: LTF1 changelog — [month] [year]

> what shipped this month:
>
> ▸ [feature 1] — [one-line description]
> ▸ [feature 2] — [one-line description]
> ▸ [feature 3] — [one-line description]
>
> what's coming next:
>
> ▸ [next thing 1]
> ▸ [next thing 2]
>
> stars: [N] · users: [N] · self-hosters: [N]
>
> reply with anything you want to see. i read every email.
>
> — aansh

---

## 10. Awesome-List PR Template

When submitting LTF1 to `awesome-cli`, `awesome-tui`, `awesome-self-hosted`, etc.:

```markdown
- [LTF1](https://github.com/aansh-afk/ltf1-pm) - Git-native project management with a full terminal UI. Tasks update from commits, story points from diffs, velocity from shipped code. AGPL, self-hostable.
```

Keep it under 200 chars. Match the format of the existing list — don't add emoji or extra fields unless the list does.

---

## 11. Lobsters Submission

Lobsters dislikes self-promotion. Lead with a story or principle, not a launch.

**Title**: Building a project management tool where the git repo is the source of truth

**Body** (link to a blog post, not the homepage):
> I wrote about why I think project management tools are inverted: the board claims to be the source of truth, but the actual work happens in git. So I built LTF1 around the opposite premise. Curious what folks here think of the design tradeoffs — particularly around how to handle merge conflicts on task state.

Tag: `practices`, `programming`, or `devops` (only one).

---

## 12. The 60-Second Launch Video Script

Open: terminal at fullscreen, dark theme, IBM Plex Mono.

```
0:00 — Title card: "LTF1 — your repo is the source of truth"

0:03 — VO: "Most PM tools make you stop coding to update a ticket."

0:07 — Cut to: someone dragging a card in Jira (pixelated/sketched)

0:10 — VO: "I built the opposite."

0:12 — Cut to: terminal — `git push origin main`
        Animation: task card on board moving from "in progress" to "done"

0:18 — VO: "Push code, the board updates. Story points come from your diff."

0:25 — Cut to: TUI dashboard sweep — sprint, tasks, git log

0:32 — VO: "Three surfaces — web, terminal, CLI. One backend. Bi-directional GitHub sync."

0:42 — Cut to: install commands appearing one line at a time

0:48 — VO: "Free for 5 seats. Self-host if you want. Built solo, in public."

0:55 — End card: "ltf1.dev · open source · AGPL"

0:60 — Black.
```

Record with OBS (free). Voiceover with your phone. Ship it.

---

## 13. The "Don't Do These" List

- ❌ "Revolutionary AI-powered enterprise productivity platform"
- ❌ Any sentence with "leverage," "synergy," "frictionless," or "10x"
- ❌ Cold-DMing strangers on LinkedIn with a sales pitch
- ❌ Buying followers, stars, or upvotes (you will get found out)
- ❌ Posting the same thing across 8 platforms in one day (looks desperate)
- ❌ Replying to every Linear/Jira tweet with "@LTF1 does this better" (looks desperate)
- ❌ Adding "🚀" or "✨" anywhere

---

## 14. Quick Reference — When You Have 30 Minutes

1. Record a new 30-second GIF
2. Post on X with one-line caption
3. Cross-post to Discord `#announcements`
4. Done.

When you have 30 minutes a week, this is enough.
