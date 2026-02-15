# LTF1 Marketing Playbook

## Product Positioning

**One-liner:** Git-native project management that updates itself when you push code.

**Elevator pitch:** LTF1 is the project management tool that treats your repo as the source of truth. When you push code, tasks update themselves. Story points are estimated from your diff, not guessed in meetings. Velocity is measured from actual shipping data. Free, open source, and terminal-first.

**Category:** Developer tools / Project management

**Key differentiators:**
1. Tasks auto-update from git activity (push, PR, merge)
2. Full CLI + TUI — never leave your terminal
3. AI estimates complexity from code diffs
4. Free open-source tier with unlimited projects
5. Built for developers, not project managers

---

## Target Audience

### Primary: Engineering teams at startups (3-25 devs)
- Tech leads frustrated with Jira overhead
- Small teams that want automation over process
- GitHub/GitLab daily users
- Ship fast, hate updating tickets

### Secondary: Indie hackers and open-source maintainers
- Solo devs managing side projects
- Open-source project leads tracking contributors
- Freelancers managing multiple client projects

### Anti-personas (not a fit):
- Non-technical teams (marketing, HR, ops)
- Enterprise with strict compliance requirements (yet)
- Teams not using Git
- People who want Notion-style docs + tasks hybrid

---

## Messaging Framework

### Pain points to hit:
- "I just merged a PR but forgot to update the ticket"
- "Story point estimation meetings are theater"
- "Jira is bloated, Linear is expensive, Trello goes stale"
- "I live in my terminal — why do I need a browser tab for PM?"
- "Our velocity metrics are fiction because nobody updates tickets"

### Value props by audience:

**For tech leads:**
- "Your team's velocity is real because it comes from git, not ticket updates"
- "Onboard in 5 minutes — connect GitHub, tasks auto-create from PRs"
- "Free for teams up to 5, no credit card required"

**For individual devs:**
- "Push code, task updates itself. That's it."
- "Full CLI — create tasks, manage sprints, track time without leaving terminal"
- "AI estimates complexity from your actual diff, not your gut"

**For engineering managers:**
- "See what your team actually ships, not what they say they'll ship"
- "Git-based velocity eliminates estimation theater"
- "Free tier means no budget approval needed to try it"

---

## Channel Strategy

### Tier 1: High-impact, zero cost

#### Hacker News
- **Format:** "Show HN: LTF1 — open-source, git-native project management (tasks update when you push code)"
- **When:** Tuesday-Thursday, 9-11am ET
- **Prep:** Fast landing page, clear README, working demo, be online to answer comments for 6+ hours
- **Tips:** Be genuine, lead with the technical story ("I was frustrated that..."), don't be salesy
- **Expected:** 50-200 sign-ups from a front-page post

#### Product Hunt
- **Prep needed:** Maker profile, 5+ screenshots, 30-sec GIF demo, tagline, first comment ready
- **Tagline options:**
  - "Tasks update themselves when you push code"
  - "Git-native project management — free and open source"
  - "The PM tool that reads your commits, not your mind"
- **When:** Launch at 12:01am PT on a Tuesday or Wednesday
- **Tips:** Rally Discord community for early upvotes, respond to every comment

#### Reddit
- **Subreddits:** r/programming, r/webdev, r/selfhosted, r/devops, r/SaaS, r/sideproject, r/opensource
- **Format:** "I built a PM tool that auto-updates tasks from git pushes — here's what I learned" (story-driven)
- **Cadence:** 2-3 organic posts per month, answer questions in PM tool threads daily
- **Rules:** Never spam. Add genuine value. Share learnings, not just links.

#### Dev.to / Hashnode
- Cross-post blog content (see Blog Strategy below)
- Tag: #productivity, #webdev, #opensource, #github
- Expected: 500-2K views per well-written post

#### GitHub
- Star-worthy README with GIF demos
- Add to "awesome-project-management" lists
- Open-source the CLI as a standalone package
- Create a "Made with LTF1" badge for user projects
- Sponsor/contribute to related open-source tools

#### Twitter/X
- Post 3-5 times per week
- Content mix: 40% product updates, 30% dev culture/opinions, 20% tips, 10% memes
- Use GIFs/videos of the terminal UI heavily — they stop the scroll
- Engage with dev tool influencers and PM critics
- Thread ideas:
  - "Why story points are fiction (and what to measure instead)"
  - "I replaced Jira with a git push. Here's how."
  - "The 5 things developers actually want from a PM tool"

#### Discord Community
- Structure: #general, #feedback, #feature-requests, #show-your-setup, #cli-tips, #integrations
- Weekly office hours (voice channel, 30 min)
- Highlight power users and their workflows
- First-responder support (faster than email)

---

### Tier 2: Content engine (low cost, compounds over time)

#### Blog Strategy (SEO-focused)

Write 2-4 articles per month targeting developer search queries.

**Priority articles to write first:**

| # | Title | Target keyword | Est. monthly search volume |
|---|-------|---------------|---------------------------|
| 1 | "Best open-source project management tools for developers (2026)" | open source project management | ~2,400 |
| 2 | "Jira alternatives for small dev teams" | jira alternative | ~6,600 |
| 3 | "How to automate task updates with Git hooks and webhooks" | git hooks automation | ~1,200 |
| 4 | "Linear vs Jira vs LTF1: which PM tool for startups?" | linear vs jira | ~3,600 |
| 5 | "Why developers hate updating tickets (and how to fix it)" | developer productivity | ~1,600 |
| 6 | "Git-based project management: your repo as source of truth" | git project management | ~720 |
| 7 | "Terminal-based project management with CLI tools" | cli project management | ~480 |
| 8 | "How to estimate story points from code complexity" | story point estimation | ~1,300 |
| 9 | "Setting up GitHub webhooks for automated task tracking" | github webhooks | ~890 |
| 10 | "The case against estimation meetings" | agile estimation problems | ~590 |

**Blog SEO rules:**
- Every article needs a clear H1 with the target keyword
- Include internal links to features page and sign-up
- Add a CTA box mid-article and at the end
- Use code snippets and terminal screenshots (devs love these)
- Aim for 1,500-2,500 words per article

#### Video Content

| Video | Length | Platform | Purpose |
|-------|--------|----------|---------|
| "LTF1 in 90 seconds" | 1:30 | YouTube, Twitter, landing page | Awareness |
| "Full CLI walkthrough" | 5:00 | YouTube | Conversion |
| "GitHub integration setup" | 3:00 | YouTube | Activation |
| "Sprint planning with LTF1" | 4:00 | YouTube | Retention |
| Weekly "what shipped" clips | 0:30 | Twitter, LinkedIn | Engagement |

**Tips:** Screen recordings with terminal are cheap to produce. Use asciinema or vhs for polished terminal recordings.

#### Changelog
- Public changelog at `/changelog` — update with every release
- Format: date, version, bullet points of what changed
- Cross-post to Twitter and Discord on each release
- RSS feed for changelog subscribers

---

### Tier 3: Growth loops (build once, compounds forever)

#### Referral Program
- "Invite 3 developers, get 1 month of Pro free"
- Unique referral links per user with dashboard
- Track referral source in PostHog
- Display on settings page

#### "Powered by LTF1" in GitHub PRs
- When the LTF1 bot comments on PRs (task status updates), include a subtle "Managed by LTF1" link
- Every PR reviewer on the team sees LTF1 in action
- Viral coefficient: 1 user exposes 3-5 teammates per PR

#### "Managed with LTF1" Badge
- Offer a badge for project READMEs: `[![Managed with LTF1](https://ltf1.dev/badge.svg)](https://ltf1.dev)`
- Links back with UTM tracking
- Popular in open-source communities

#### Template Gallery
- Pre-built project templates: "React SaaS Starter", "Open Source Project", "Agency Client", "Mobile App"
- Users import a template and experience the product faster
- Each template is a content piece that can rank for "[framework] project template"

---

### Tier 4: Paid acquisition (only after organic PMF)

Start paid only when: 100+ active users, NPS > 30, free-to-paid conversion > 2%, monthly churn < 8%.

#### Google Ads
- **Keywords:** "jira alternative", "git project management", "open source project management tool", "linear alternative free", "developer task management"
- **Budget:** $500-1,000/month to start
- **Expected CPC:** $2-5 for dev tool keywords
- **Landing page:** Dedicated `/from/google` page with specific messaging

#### Twitter/X Ads
- **Targeting:** Developer job titles, GitHub users, startup founders
- **Format:** Promoted tweets with terminal GIF demos
- **Budget:** $300-500/month
- **Best creative:** 15-sec screen recording showing git push -> task auto-update

#### Reddit Ads
- **Targeting:** r/programming, r/webdev, r/devops, r/sideproject
- **Format:** Promoted posts that look native (story-driven, not salesy)
- **Budget:** $200-400/month
- **CPC:** $1-3 (cheap compared to Google)

#### Newsletter Sponsorships
- **Priority newsletters:**
  - TLDR (1.2M+ devs, ~$3K/placement)
  - Bytes.dev (200K+ JS devs, ~$1.5K/placement)
  - Console.dev (curated dev tools, ~$500/placement)
  - Hacker Newsletter (60K+, ~$800/placement)
  - JavaScript Weekly / Node Weekly (~$1K/placement)
- **Cadence:** 1-2 placements per month
- **Budget:** $500-3,000/month depending on list

---

## Launch Sequence

### Week 1-2: Pre-launch prep
- [ ] Register `ltf1.dev` domain, configure on Vercel
- [ ] Create @ltf1dev on Twitter/X, LinkedIn, Bluesky
- [ ] Create GitHub organization `ltf1-dev`
- [ ] Set up email marketing (Resend or Loops)
- [ ] Write 3-email welcome sequence
- [ ] Polish README with GIF demos
- [ ] Record "LTF1 in 90 seconds" video
- [ ] Prep Product Hunt assets (screenshots, video, tagline)
- [ ] Prep Hacker News post draft
- [ ] Set up PostHog funnels and dashboards

### Week 3: Soft launch
- [ ] Post on Twitter announcing open beta
- [ ] Share in Discord communities (not spam — genuine "I built this")
- [ ] Post on r/sideproject and r/SaaS
- [ ] Cross-post intro article on Dev.to and Hashnode
- [ ] Invite early users from waitlist/newsletter

### Week 4: Hacker News launch
- [ ] Post "Show HN" on Tuesday-Thursday, 9-11am ET
- [ ] Be online answering comments for 6+ hours
- [ ] Have friends ready to engage authentically (not shill)
- [ ] Monitor traffic and fix any issues in real-time

### Week 5: Product Hunt launch
- [ ] Launch at 12:01am PT on Tuesday/Wednesday
- [ ] First comment ready (tell the story)
- [ ] Rally Discord community
- [ ] Respond to every comment and question

### Week 6+: Content engine
- [ ] Publish first 2 blog posts (target high-volume keywords)
- [ ] Start weekly Twitter posting cadence
- [ ] Set up changelog page
- [ ] Begin outreach to dev newsletter sponsors

---

## Content Templates

### Show HN Post Template
```
Show HN: LTF1 – Git-native project management (open source)

Hey HN, I built LTF1 because I was tired of updating Jira tickets
that never reflected reality. The core idea: your git activity IS
your project management.

When you push code, tasks update automatically. PR opens → task
moves to "In Review". PR merges → task moves to "Done". Story
points are estimated from your actual diff, not guessed in
meetings.

Key features:
- Full CLI + TUI (never leave your terminal)
- GitHub/GitLab integration
- AI-powered complexity estimation
- Sprint management with git-based velocity
- Free tier: unlimited projects, 5 team members

Stack: React, Convex, Clerk, TypeScript

Free and open source. Would love feedback.

https://ltf1.dev
```

### Twitter Launch Thread Template
```
Thread: I built a PM tool that updates itself when you push code.

No more forgetting to update tickets. No more estimation theater.
Just push code and ship.

Here's why I built it and how it works: [1/7]

[2/7] The problem: I'd merge a PR and forget to update the ticket.
Every standup, half the board was wrong. Sound familiar?

[3/7] The solution: LTF1 watches your git activity.
- git push → task updates
- PR opened → "In Review"
- PR merged → "Done"
- Complexity estimated from your diff

[4/7] It's terminal-first. Full CLI + interactive TUI.
Create tasks, manage sprints, track time — without opening a browser.
[GIF of TUI]

[5/7] AI that actually helps:
- Suggests tasks from your commit history
- Estimates complexity from code diffs
- Analyzes sprint health
100 free AI credits/month.

[6/7] Pricing: Free forever for teams up to 5.
Unlimited projects. Full git integration. CLI access.
No credit card. No trial. Just free.

[7/7] Try it now: https://ltf1.dev

It's open source. Star the repo if you think
project management should reflect reality, not fiction.
```

### Blog Post CTA Box (embed in articles)
```markdown
---
**Ship faster with LTF1**
Git-native project management that updates itself.
Free for teams up to 5. No credit card required.
[Get Started Free](https://ltf1.dev/sign-up) | [See Features](https://ltf1.dev/features)
---
```

### Email Welcome Sequence

**Email 1 (Immediate): Welcome + Quick Start**
- Subject: "Your command center is ready"
- Content: 3 steps to get started (create workspace, connect GitHub, create first task)
- CTA: "Open your dashboard"

**Email 2 (Day 2): CLI Introduction**
- Subject: "Never leave your terminal again"
- Content: How to install CLI, top 5 commands, TUI preview
- CTA: "Install the CLI"

**Email 3 (Day 5): Power Features**
- Subject: "3 features you probably haven't tried"
- Content: AI task generation, sprint planning, time tracking
- CTA: "Try AI task generation"

---

## Metrics to Track

### North Star Metric
**Weekly Active Projects** — projects with at least 1 task update in the last 7 days.

### Funnel Metrics (track in PostHog)

| Stage | Event | Target |
|-------|-------|--------|
| Visit | `$pageview` on landing page | — |
| Sign up | `user_created` | 5-8% of visitors |
| Activate | `project_created` | 60% of sign-ups |
| Connect | `github_account_connected` | 40% of activations |
| Engage | `task_created` (5+ tasks) | 50% of connected |
| Retain | Weekly active (7-day) | 40% of engaged |
| Convert | Pro upgrade | 3-5% of retained |

### Channel Metrics

| Channel | Metric | Monthly target |
|---------|--------|---------------|
| Organic search | Impressions, clicks, positions | 10K impressions by month 6 |
| Hacker News | Upvotes, comments, sign-ups | 1 post per quarter |
| Product Hunt | Upvotes, rank, sign-ups | 1 launch |
| Twitter/X | Followers, impressions, link clicks | 1K followers by month 6 |
| Blog | Page views, time on page, CTA clicks | 5K views/month by month 6 |
| Discord | Members, daily active, messages | 500 members by month 6 |
| Newsletter | Subscribers, open rate, click rate | 1K subs, 40% open rate |

### Revenue Metrics (once Pro launches)
- MRR (Monthly Recurring Revenue)
- Free-to-paid conversion rate (target: 3-5%)
- Monthly churn rate (target: < 5%)
- ARPU (Average Revenue Per User)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV:CAC ratio (target: > 3:1)

---

## Competitive Positioning

### When compared to Linear:
- "Linear is $8/user/month. LTF1 is free for teams up to 5."
- "Linear requires manual updates. LTF1 updates from git."
- "Linear is web-only. LTF1 has a full CLI + TUI."

### When compared to Jira:
- "Jira takes weeks to configure. LTF1 takes 5 minutes."
- "Jira measures story points you guess. LTF1 measures code you ship."
- "Jira costs $8-16/user. LTF1 is free."

### When compared to GitHub Projects:
- "GitHub Projects is basic kanban. LTF1 has sprints, AI, and analytics."
- "GitHub Projects is locked to GitHub. LTF1 works with GitLab too."
- "GitHub Projects has no CLI. LTF1 is terminal-first."

### When compared to Notion:
- "Notion is for everything. LTF1 is built specifically for dev teams."
- "Notion doesn't know what a git commit is. LTF1 runs on them."

---

## Budget Summary

| Phase | Timeline | Monthly cost |
|-------|----------|-------------|
| Foundation (domain, email, SEO) | Month 1 | $25-50 |
| Content engine (blog, video) | Month 2-3 | $200-500 |
| Community (all organic) | Month 2-6 | $0 |
| Growth loops (referral, badges) | Month 3-6 | $0-50 |
| Paid acquisition (optional) | Month 4+ | $1,500-4,000 |

**Bootstrap budget (organic only):** ~$600-2,400/year
**Growth budget (organic + content):** ~$6,000-18,000/year
**Scale budget (organic + content + paid):** ~$24,000-60,000/year
