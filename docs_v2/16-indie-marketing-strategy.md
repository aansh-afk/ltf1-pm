# Indie Marketing Strategy — LTF1 (Solo Dev Edition)

A zero-budget, solo-friendly playbook for getting LTF1 in front of the right developers. Optimized for **time scarcity**, **no marketing team**, and **no ad spend**.

---

## TL;DR — The Plan

1. **Stop selling a PM tool.** Sell a manifesto: *"Your repo is the source of truth."* Devs already hate Jira. You're giving them ammunition.
2. **Pick one wedge: the TUI.** No competitor has it. It's the meme. Lead with it everywhere.
3. **Build in public on one channel** (X or Bluesky) + **GitHub** + **Discord**. Three is plenty. Don't fragment yourself.
4. **Ship one launch, then a steady drumbeat.** One Show HN, one Product Hunt, one Reddit r/programming post — spaced out. Then weekly devlog forever.
5. **Make the product its own marketing.** A `ltf1 share` command that posts a velocity card, a public changelog, OSS-friendly tier — your users become the megaphone.

Expected first-90-days outcome with consistent effort: 500–2,000 GitHub stars, 100–300 Discord members, 50–150 active teams. Anything above that is a bonus.

---

## 1. Positioning

You are not competing with Jira. You are competing with **"the way devs already work"** — sticky notes, inbox zero, GitHub Issues, ad-hoc spreadsheets. Reframe the category.

### The one-liner (use everywhere)
> **LTF1 — git-native project management. Your tasks update when you push code.**

### The 30-second pitch
> Most PM tools make developers stop coding to update tickets. LTF1 inverts it: push code, and the board updates itself. Story points come from your diffs, velocity from actual shipping data, and the whole thing runs in your terminal. Built by a developer who got tired of dragging cards.

### The wedge: terminal-first
Lead with the TUI. It's:
- **Visually unique** (great screenshots and GIFs)
- **Defensible** (Linear/Jira/Asana can't follow without rewriting)
- **Self-selecting** (only your target audience cares — kills bad-fit signups)
- **Memeable** ("PM tool that runs in tmux" is a tweet)

Everything else (web app, AI, GitHub sync) is supporting evidence. Don't bury the lede.

### Anti-positioning
Be loud about who you are *not* for:
- Not for PMs who live in Slack
- Not for enterprises that need SOC 2 (yet)
- Not for "everyone" — for devs who type `git push` more than they open a browser

Anti-positioning is free differentiation. Use it.

---

## 2. Channel Strategy

Pick **three** channels max. Solo devs lose by spreading too thin.

### Tier 1 — Where you live every day

#### A) X / Bluesky (pick one, post daily)
- **Format**: build-in-public devlog. One post per day, ~5 min each.
- **Content mix** (rough rule of seven):
  - 3× shipping/dev updates (screenshot, GIF, or one-liner)
  - 2× opinion/take ("Why we should kill story points," "Jira is a tax on shipping")
  - 1× behind-the-scenes (code snippet, architecture note, bug story)
  - 1× user/community shoutout
- **Hooks that work** for dev tools: terminal GIFs, before/after diffs, "I built X in N hours," contrarian takes, screenshots of your own dogfood usage.
- **Tag carefully**: @leerob, @rauchg, @t3dotgg, @theo, @swyx, @levelsio occasionally — but only when relevant. Don't beg.

#### B) GitHub (the product *is* the marketing)
- README is your landing page for 50% of inbound. Treat it as a sales page:
  - Hero GIF in the first 3 lines
  - One-line value prop
  - 30-second quickstart
  - Screenshots/GIFs of TUI, web, CLI
  - "Why LTF1" section (the manifesto)
- **Star → conversion**: add a Discord invite + "first-time setup" CTA at the top.
- **Issues are content**: reply publicly, fast, with care. Every closed issue is a testimonial.
- Keep a **public roadmap** as a GitHub Project. Lets people feel involved without you doing more work.

#### C) Discord (your moat)
- Channels: `#announcements`, `#general`, `#help`, `#ideas`, `#showcase`, `#changelog`.
- Pin the Quickstart and a "Roadmap" post.
- Set up a `#changelog` webhook from your real changelog so it auto-populates.
- Post a weekly Friday "shipping log" — keeps the community alive without much work.

### Tier 2 — One-shot launches (do these once, deliberately)

| Channel | When | Goal | Notes |
|---|---|---|---|
| **Show HN** | After v1.0 polish, weekday 8am ET | 200+ upvotes → top 10 | Title: "Show HN: LTF1 — git-native project management with a terminal UI" |
| **Product Hunt** | A week after HN | Top 5 of the day | Need 5–10 hunters lined up beforehand. Schedule for Tue/Wed. |
| **r/programming** | Post a *story*, not a product | Front page | "I built a PM tool that updates tickets when you push code" |
| **r/commandline** | TUI-focused post | Niche but high-fit | GIF of the TUI + 2-line setup |
| **r/selfhosted** | Self-host story | Niche but high-fit | Lean into AGPL + self-host angle |
| **Lobsters** | After HN (if it does well) | Quality engagement | Tag: `practices` or `devops` |
| **Hacker News "Ask HN"** | Quarterly | Soft re-engagement | "Ask HN: how do you handle PM as a small dev team?" — answer with LTF1 in comments only if relevant |

**Rule**: don't do two big launches in the same week. Spread the wins across months so each one re-trends the others.

### Tier 3 — Slow burn (low effort, high compound)

- **YouTube short-form** (60-second TUI demos). One per month. Title like "Project management without leaving the terminal."
- **Dev.to / Hashnode** cross-posts of your best blog posts (canonical URL → ltf1.dev).
- **Awesome lists**: submit PRs to `awesome-cli`, `awesome-tui`, `awesome-self-hosted`, `awesome-developer-tools`, `awesome-opensource`.
- **GitHub topics**: tag the repo with `tui`, `cli`, `project-management`, `git-native`, `developer-tools`, `convex`, `agpl`, `self-hosted`.

---

## 3. Content Engine (sustainable for one person)

You are not running a content farm. Aim for **one substantive piece per week** — that's it.

### The four post archetypes (rotate)

1. **Manifesto post** — strong opinion, no product mention until paragraph 4.
   - "Story points are theater"
   - "Your repo is the source of truth"
   - "PM tools should be invisible"
2. **Build log** — what you shipped this week. Screenshots, GIFs, what broke.
3. **Tutorial** — "Replace your Jira workflow with LTF1 in 10 minutes," "Self-host LTF1 on a $5 VPS."
4. **Comparison** — "LTF1 vs Linear," "LTF1 vs Plane." Be honest about where you lose. Honesty earns trust.

Cross-post: your blog (canonical) → X thread → Dev.to → LinkedIn (yes, even LinkedIn — devs hire there).

### Distribution checklist (per post)
- [ ] Tweet/thread with hook + GIF
- [ ] Post in your Discord `#announcements`
- [ ] If it's evergreen: Reddit (relevant sub) and Lobsters
- [ ] Add to changelog if product-related
- [ ] Pin to repo README "Latest" section if exceptional

---

## 4. Product-Led Growth Loops

Cheapest marketing is a product that markets itself. Wire these in:

1. **`ltf1 share`** — generate a public, shareable velocity card / sprint summary URL with your branding watermark. Devs love sharing dashboards.
2. **PR comments** — when LTF1 closes a task via a PR, post a small footer: *"Closed via LTF1 — git-native PM"* (toggleable, default on, off for paid plans).
3. **Public changelog with RSS** — already have a changelog page; make sure RSS works. Indie developers subscribe to RSS far more than you think.
4. **Open source tier is *real***. 5-seat free tier with no asterisks. The free tier is your acquisition channel.
5. **Embeddable badges**: `![Powered by LTF1](https://ltf1.dev/badge/repo.svg)` for project READMEs.
6. **`/ltf` slash command in Discord/Slack** — let users run task ops without leaving chat. Every usage is a tiny ad.
7. **Referral discount on Pro**: 1 free month per referred paying team. Tracking is just a coupon code.

---

## 5. Partnerships & Communities (free reach)

- **Convex Discord** — you're built on it. Be a visible community member; they often retweet customers.
- **Clerk Discord** — same.
- **Vercel community** — the brutalist aesthetic resonates here.
- **r/neovim, r/tmux, r/vim, r/emacs** — your users live here. Don't post-and-bounce. Be a regular for a month before mentioning the product.
- **Indie Hackers** — post your milestone updates ("First 100 users," "First $1k MRR"). The community rewards transparency.
- **Hacker Newsletter / TLDR / Console.dev** — pitch them after launch. Console.dev specifically covers indie dev tools.
- **Podcasts** — DM small devtool podcasts (Devtools.fm, Maintainable, JS Party). Solo founders are great guests.

---

## 6. Analytics: Track Only What You'll Act On

Don't drown in dashboards. Track six numbers, weekly:

| Metric | Source | Target Month 1 → Month 6 |
|---|---|---|
| GitHub stars | GitHub | 100 → 2,000 |
| Discord members | Discord | 25 → 300 |
| Weekly active workspaces | PostHog | 10 → 200 |
| `ltf` CLI installs | npm + telemetry | 50 → 1,500 |
| Newsletter subs | Resend | 50 → 1,000 |
| Inbound DMs/week | X + email | 1 → 10 |

Use PostHog (you already have it). Use the free tier. Don't pay for analytics until you outgrow it.

---

## 7. The 90-Day Schedule

### Days 1–14: Foundation
- [ ] Polish README (hero GIF, one-liner, screenshots, quickstart)
- [ ] Record 3 GIFs: TUI dashboard, git push → board update, sprint planning
- [ ] Set up Discord channels + welcome flow
- [ ] Wire Discord webhook → changelog
- [ ] Create simple "Why LTF1" landing page section (manifesto)
- [ ] Post first build-in-public tweet ("Day 1: launching LTF1 in public")

### Days 15–30: Content priming
- [ ] Write 4 blog posts (one manifesto, one tutorial, one build log, one comparison)
- [ ] Daily X/Bluesky posting starts (use Buffer free tier or just Notion calendar)
- [ ] Submit to 5 awesome-* lists
- [ ] DM 10 friendly devs with early access invites — ask them for honest feedback, not endorsements

### Days 31–45: Soft launch
- [ ] Post in r/commandline + r/selfhosted (TUI angle, self-host angle)
- [ ] Lobsters submission with the manifesto post
- [ ] First "shipping log" Discord event

### Days 46–60: Show HN
- [ ] One week of polish: every link works, signup is <2 min, README is gorgeous
- [ ] Post Show HN on a Tuesday/Wednesday at 8am ET
- [ ] Be online for 8 straight hours to reply to every comment
- [ ] Cross-post to Twitter/Bluesky thread the same day

### Days 61–75: Product Hunt
- [ ] Line up 5–10 hunters (Discord regulars + indie hacker friends)
- [ ] Schedule for Tue/Wed
- [ ] Prepare 3 GIFs + 2 product images + 1 launch video (60 sec, OBS is free)
- [ ] Cross-promote to existing channels

### Days 76–90: Compound
- [ ] First "milestone post" on Indie Hackers ("First 1,000 stars")
- [ ] Pitch Console.dev + Hacker Newsletter
- [ ] First podcast appearance (DM 5 small podcasts)
- [ ] Decide whether to sustain pace or step back

---

## 8. What *Not* to Do

- **No paid ads** until you have $1k+ MRR. Ads on a cold brand burn money.
- **No SEO obsession** in year one. SEO compounds slowly; build-in-public compounds faster for indie tools.
- **No "growth hacks"** — cold-DM scripts, follower-buying, fake testimonials. Devs sniff this out instantly and screenshot it.
- **No five social channels.** Three max. Master one before adding another.
- **No premature enterprise.** SSO/SCIM/SOC 2 chases tire-kickers. Stay indie until you can hire help.
- **No "v2 in stealth"** — keep shipping in public. Stealth + solo = death.
- **Don't compete with Linear on polish.** You can't outspend them. Compete on principles (open source, terminal-native, git-native).

---

## 9. Pricing & Conversion (indie-friendly)

Current pricing is roughly right. Two tweaks:

1. **Free tier should be generous.** 5 seats / unlimited projects / unlimited tasks. Discord support only. The constraint is *seats*, not *features*. Devs hate feature-gated free tiers.
2. **Pro at $10/seat/month**, not $15. $15 reads as "we want to charge enterprise prices." $10 reads as "this is the indie price." You can raise later — discounts to early adopters lock in goodwill.
3. **Lifetime deal for early supporters**: $99 one-time for a 5-seat workspace forever. Cap at 200. AppSumo-style without AppSumo's cut. Funds your first server bills.
4. **Annual = 2 months free** (standard). Make the annual toggle the default.

---

## 10. The Indie Brand Voice

LTF1 is brutalist and developer-coded. Carry that into the marketing:
- Short sentences. Active voice.
- No "synergy," "leverage," "stakeholders," or any McKinsey-core word.
- No emojis in marketing copy (the design system already says so).
- Lowercase headlines on social. ALL CAPS for one-word emphasis.
- Show terminals, not "team meetings."
- Be a person, not a brand. Sign your name on launch posts. Reply to DMs yourself.

A solo dev's superpower is **honesty at scale**. Use it.

---

## 11. One Thing to Do This Week

If you only have a weekend: **record one 30-second GIF of `git push` → task auto-closing in the TUI**, post it on X with the caption *"My PM tool updates itself when I push code. Here's how."* Pin the tweet. Add it to the README hero. That GIF will do more for LTF1 than a month of blog posts.

Then do it again next week with a different feature. Repeat for 12 weeks. That's the strategy.
