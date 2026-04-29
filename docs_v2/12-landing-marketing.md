# Landing Page & Marketing Analysis — ltf1-pm

## Current Positioning

### Primary Message
> "Your repo is the source of truth. Tasks update themselves when you push code. Story points estimated from your diff. Velocity measured from actual shipping data."

### Target Audience
Developers who:
- Write code daily and hate context-switching to update tickets
- Prefer terminal workflows over browser-based tools
- Work in small-to-medium teams (2-20 devs)
- Use GitHub as their primary development platform
- Value open source and transparency

### Brand Identity
**Dark brutalist terminal** — aggressive, monospace-heavy, high-contrast design that signals "built by devs, for devs." The aesthetic is a deliberate anti-pattern to the clean, friendly, corporate designs of Jira, Asana, and even Linear.

---

## Landing Page Structure

### Section-by-Section Breakdown

#### 1. Hero Section
**Headline**: "Your repo is the source of truth"
**Sub**: Tasks update themselves when you push code. Story points estimated from your diff. Velocity measured from actual shipping data.
**CTAs**: "Get Started Free" (primary) + "See Features" (secondary)
**Visual**: Animated terminal demo (HeroTerminal) showing git operations triggering automatic task updates

**Assessment**: 4.5/5 — Strong opening. The terminal animation is compelling. Could add agent messaging.

#### 2. Problem Section
**Concept**: "Without LTF1" (8 manual steps) vs "With LTF1" (2 dev steps + automated engine)
**Background**: Line grid pattern

**Assessment**: 5/5 — Effective problem framing. The before/after is clear and compelling.

#### 3. How It Works Section
**Flow**: Commit → Pull Request → Merge → Git Log (converts to velocity)
**Background**: Dot grid pattern

**Assessment**: 4/5 — Clear workflow. Could expand to show agent interactions in the flow.

#### 4. App Showcase Section
**Content**: 3-tab preview (Dashboard, Tasks, Sprint) showing actual UI screenshots/components
**Pattern**: Interactive tab switcher

**Assessment**: 4/5 — Good social proof of product maturity. Screenshots need to stay updated.

#### 5. Features Preview Section
**Highlighted Features**:
- PR-Driven Updates (0 manual updates needed)
- Git-Based Velocity (23% faster cycle times)
- AI Estimates (94% estimation accuracy)

**Assessment**: 4/5 — Strong stats. Should add agent/triage as a 4th featured capability.

#### 6. Pricing Preview Section
**3 Tiers**: Open Source (Free), Pro ($15/user/month), Enterprise (Custom)
**Note**: "All features free during early access"

**Assessment**: 4/5 — Clear and honest. Early access messaging is good.

#### 7. Final CTA Section
**Headline**: "Ready to ship faster?"
**Visual**: ASCII art
**CTAs**: "Get Started Free" + "See Features"

**Assessment**: 3.5/5 — Could be stronger. Consider adding social proof (user count, GitHub stars).

#### 8. Footer
**Sections**: Newsletter signup, product links, company links, developer links, legal links
**Visual**: Particle field animation with X-Wing flyby
**Social**: GitHub, Twitter/X, Discord

**Assessment**: 4/5 — Comprehensive. X-Wing animation is a nice personality touch.

---

## Feature Pages (8 Features)

Each feature has its own detail page at `/features/:slug` with:
- ASCII art visualization
- Remotion video animation (960x540, 30fps, auto-playing)
- Feature description and benefits
- Category accent color

| Feature | Slug | Category | Accent |
|---------|------|----------|--------|
| PR-Driven Updates | pr-driven-updates | Git Integration | Green |
| Git-Based Velocity | git-based-velocity | Analytics | Purple |
| Code Complexity Estimates | complexity-estimates | Intelligence | Amber |
| Tech Debt Surfacing | tech-debt | Quality | Red |
| Sprint Planning | sprint-planning | Planning | Cyan |
| Team Management | team-management | Collaboration | Pink |
| Terminal-First | terminal-first | Developer Experience | Bright Green |
| Open Source | open-source | Open Source | White |

**Assessment**: 4/5 — Well-organized, consistent design. Remotion animations recently fixed for overflow/overlap issues.

---

## Pricing Page

### Tiers

| Feature | Open Source | Pro | Enterprise |
|---------|-----------|-----|------------|
| Price | Free forever | $15/user/month | Custom |
| Members | 5 | Unlimited | Custom |
| AI Credits | 100/month | Unlimited | Custom |
| Git Integration | Yes | Yes | Yes |
| PR-Driven Updates | Yes | Yes | Yes |
| Slack/Discord | Yes | Yes | Yes |
| Sprints | Yes | Yes | Yes |
| CLI/TUI | Yes | Yes | Yes |
| Chat | No | Yes | Yes |
| Meetings | No | Yes | Yes |
| Whiteboard | No | Yes | Yes |
| Time Tracking | No | Yes | Yes |
| Custom Fields | No | Yes | Yes |
| Advanced RBAC | No | Yes | Yes |
| Custom Webhooks | No | Yes | Yes |
| Tech Debt Insights | No | Yes | Yes |
| Advanced Analytics | No | Yes | Yes |
| SSO/SCIM | No | No | Yes |
| On-Premise | No | No | Yes |
| Dedicated Support | No | No | Yes |

**Assessment**: 3.5/5 — Needs updating for agent-first vision. Agent features (triage, skills, planning, diff viewer) should be prominent differentiators between tiers.

---

## Messaging Audit

### What Works
1. **"Your repo is the source of truth"** — Instantly communicates the git-native philosophy
2. **"0 manual updates needed"** — Quantified value proposition
3. **Before/after comparison** — Problem section clearly shows the pain point
4. **Terminal demo** — Shows don't tell, animated proof of product
5. **Early access messaging** — Creates urgency without pressure

### What Needs Updating

#### 1. No Agent Messaging
The landing page doesn't mention AI agents, triage, skills, or autonomous task management. In the post-Linear-Next world, this is a significant gap.

**Recommended additions**:
- Hero subtitle: "Your repo is the source of truth. **Your agent handles the rest.**"
- New feature card: "AI Triage — Every new issue categorized, prioritized, and assigned in seconds"
- New feature card: "Skills — Codify your team's workflows. Run them with a slash command."
- How-it-works step 5: "Agent triages and assigns automatically"

#### 2. No Terminal-First Positioning
The terminal/CLI is mentioned as one of 8 features but isn't positioned as the primary differentiator. Given that no competitor has a TUI, this should be front and center.

**Recommended changes**:
- Add a dedicated section showing the TUI in action
- Position as: "The PM tool that lives where you already work"
- Show side-by-side: browser workflow vs terminal workflow
- Feature the `ltf` command prominently in the hero

#### 3. Missing Social Proof
No user count, GitHub stars, testimonials, or case studies. Even for early-stage products, showing traction matters.

**Recommended additions**:
- GitHub stars badge in hero
- "Used by X teams" counter (even if small)
- 1-2 developer testimonials (can be from beta users)
- Discord community member count

#### 4. Pricing Doesn't Reflect Vision
Current pricing highlights meetings, whiteboard, time tracking — features being recommended for deprecation. Agent features should be the Pro tier differentiators.

**Recommended pricing restructure**:

| | Free | Pro | Enterprise |
|---|---|---|---|
| **Agent features** | Basic triage | Full agent suite | Custom agents |
| **Skills** | 3 built-in | Unlimited custom | + marketplace |
| **Diff Viewer** | No | Yes | Yes + custom |
| **Git Integration** | Full | Full + advanced | Full + enterprise |
| **CLI/TUI** | Full | Full | Full |
| **Meetings** | No | Basic | Full |

---

## Conversion Flow Analysis

### Current Flow
```
Landing → Features/Pricing → Sign Up (Clerk) → Onboarding (3 steps) → Dashboard
                                     │
                                     └── Waitlist (for Pro features)
```

### Bottlenecks
1. **No product demo**: Users must sign up to see the product. Consider an interactive demo or sandbox.
2. **Waitlist friction**: Pro features gated behind waitlist may deter early adopters
3. **CLI not in signup flow**: Onboarding doesn't mention CLI installation
4. **No GitHub import**: New users start from scratch, no migration path from existing tools

### Recommended Improvements
1. Add interactive product tour (no signup required)
2. Add `npm install -g @vvg-ltf1/cli` to onboarding step 3
3. Add GitHub repo import during project creation
4. Add Jira/Linear import tool for migration
5. Show CLI installation in hero section alongside web CTA

---

## SEO & Discoverability

### Current Keywords
- Project management
- Git integration
- Developer tools
- Sprint planning
- Task management

### Recommended Additional Keywords
- AI project management
- Agent-native development
- Terminal project management
- CLI task management
- Git-native PM
- Developer workflow automation
- Open source project management

### Content Strategy
1. Blog posts about git-native PM philosophy
2. CLI/TUI comparison articles (vs GitHub CLI, vs Linear)
3. Developer workflow optimization guides
4. Agent-first development workflow tutorials
5. Migration guides from Jira/Linear/Asana

---

## Competitive Messaging

### vs Linear
> "Linear is building agents for PMs in browsers. LTF1 is building agents for devs in terminals. Same vision, different user."

### vs Jira
> "Jira was designed when teams updated tickets manually. LTF1 was designed when code updates tickets automatically."

### vs GitHub Issues
> "GitHub Issues tracks what you file. LTF1 tracks what you ship."

### vs Plane
> "Plane is open source Jira. LTF1 is the next generation."

---

## Recommended Landing Page Structure (v2)

1. **Hero**: "Your repo is the source of truth. Your agent handles the rest." + Terminal demo + "Get Started Free"
2. **Problem**: Before/after showing manual PM vs automated PM
3. **Terminal Section** (NEW): Full-width TUI showcase. "The PM tool that lives in your terminal."
4. **Agent Section** (NEW): Triage, skills, smart assignment. "AI that works from your project context."
5. **How It Works**: Git push → Auto-update → Agent triage → Sprint planned
6. **App Showcase**: Dashboard, Tasks, Sprint, Agent triage view
7. **Features Grid**: 8 features with updated agent features
8. **Social Proof** (NEW): GitHub stars, team count, testimonials
9. **Pricing**: Updated with agent tier differentiation
10. **Final CTA**: "Stop managing tickets. Start shipping code."
11. **Footer**: Newsletter, links, community

---

## Changelog Strategy

**File**: `apps/web/src/pages/ChangelogPage.tsx`

Current: 5 versions documented (v0.1.0 through v0.5.0)

**Recommendations**:
1. When shipping agent features, add prominent changelog entries
2. Use type: "feat" for new agent capabilities
3. Add platform: "agent" for agent-specific entries
4. Version the agent features as v0.6.0 milestone
5. Pin major announcements (agent launch) at top of changelog
