# LTF1 Design Language — Voice, Tone & Copy

## Philosophy

LTF1 speaks like a senior engineer writing documentation at 2am: precise, direct, occasionally dry. No marketing fluff. No exclamation marks. Sentences are short. Paragraphs are shorter. If a terminal command can replace a paragraph, use the command.

---

## Voice Characteristics

### Direct
```
Yes: "Push code. Tasks update themselves."
No:  "Our innovative platform seamlessly integrates with your workflow to automatically update your task management system."
```

### Technical
```
Yes: "PR-driven task updates"
No:  "Smart automatic synchronization of your work items"
```

### Confident Without Bragging
```
Yes: "Velocity calculated from commits, PRs, and deploys — not story point guesses."
No:  "The most advanced velocity tracking system ever built!!"
```

### Dry Humor (Sparingly)
```
"End estimation theater" (CTA on complexity estimates page)
"No more planning poker debates" (feature subtitle)
"See debt before it compounds" (tech debt hero)
```

---

## Copy Hierarchy

### Hero Headlines
- 2-4 words per line
- Line breaks are intentional (`\n` in code)
- Imperative or declarative mood
- No periods

```
"Ship code.\nTasks update themselves."
"Measure what\nyou actually ship."
"Never leave\nyour terminal."
```

### Hero Subtitles
- One sentence, max two
- Explains the value prop in plain English
- Includes the "how" or "why"
- Ends with a period

```
"Connect your repos and let pull requests drive your project management.
When you push, review, or merge — tasks move automatically."
```

### Section Headlines
- `text-3xl` to `text-5xl`
- Short, punchy
- Often a directive

```
"Stop updating tickets manually"
"Built for how developers actually work"
```

### Section Body
- 1-2 sentences max
- Color: `#6B7280` (tertiary gray)
- Explains the feature benefit, not the mechanism

```
"Your git workflow is your project management workflow"
```

### CTA Text
- Verbs: "Get Started", "Join Waitlist", "View all features", "Contact Sales"
- Never "Click here" or "Learn more"
- CTA headlines are contrarian or outcome-focused:

```
"Stop updating tickets manually"
"End estimation theater"
"Stay ahead of tech debt"
"Plan sprints that actually work"
"Manage people, not just projects"
```

---

## Label Conventions

### Category Labels
- ALL CAPS
- `text-xs font-mono tracking-wider`
- Color: `#6B7280` or `#6366F1`
- Preceded by a colored dot when indicating feature category

```
GIT INTEGRATION
ANALYTICS
INTELLIGENCE
```

### Feature List Items
- Prefixed with `+` character
- Monospace font
- Sentence case, no period

```
+ Unlimited projects
+ Full Git integration
+ Slack & Discord notifications
```

### Comparison Table Values
- `+` for supported (white)
- `—` for not supported (dim gray)
- Short text values for qualified support

### Navigation Items
- Sentence case
- No abbreviations
- Max 2 words

```
Features, Pricing, Contact, Sign In, Get Started
```

---

## ASCII Art System

### Purpose
ASCII art serves three functions:
1. **Demonstration** — shows what the product does in terminal format
2. **Atmosphere** — reinforces the developer-tool identity
3. **Delight** — the X-Wing flyby, twinkling particles, typing animations

### ColoredPre Tag System
Custom markup rendered by the `ColoredPre` component:

| Tag | Color | Hex | Semantic Use |
|-----|-------|-----|-------------|
| `{g:text}` | Green | `#22C55E` | Commands, success, positive values |
| `{r:text}` | Red | `#EF4444` | Errors, critical, warnings, negative |
| `{y:text}` | Amber | `#F59E0B` | Warnings, moderate states, suggestions |
| `{c:text}` | Cyan | `#06B6D4` | Identifiers, labels, usernames |
| `{w:text}` | White | `#F9FAFB` | Important values, headers, emphasis |
| `{p:text}` | Purple | `#8B5CF6` | Numbers, metrics, data values |

### ASCII Conventions
```
Command prompt:    {g:$ command here}
Box drawing:       +-- title --+  or  +--------+
Vertical lines:    |  content  |
Arrows:            ->  or  <-  or  =>
Progress bars:     [{g:========}..........] 80%
Status markers:    [{g:*}] active, [o] todo, [{g:v}] done
Section breaks:    ---- label ----
```

### ASCII Block Styling
```css
Container: bg-[#0A0A0A], border-2 border-[#2E2E35], p-6
Font: IBM Plex Mono, text-[11px] or text-xs
Color: #6B7280 (default, colored via tags)
Line-height: leading-relaxed
White-space: pre
Select: none
```

---

## Terminal Narrative Style

The hero terminal and problem section tell stories through simulated terminal sessions:

### Command Execution Pattern
```
$ user types command
  system responds with output
  [STATUS] operation description
  result: outcome
```

### Engine Log Pattern
```
[DETECT]  what was found
[PARSE]   what was understood
[LINK]    what was connected
[STATUS]  what changed
[EST]     what was calculated
[BOARD]   what was updated
[NOTIFY]  who was told
```

### Diff Display Pattern
```
  filename.ts    +142  -38   complexity: high
  filename.ts     +67  -12   complexity: med
```

---

## Punctuation & Formatting

| Rule | Example |
|------|---------|
| No periods on headlines | `Ship code. Tasks update themselves` (exception: two-sentence heroes) |
| Periods on body text | `Your git workflow is your project management workflow.` |
| No exclamation marks | Never. Ever. |
| Em dashes for asides | `velocity — not story point guesses` |
| Sentence case everywhere | `Get Started`, not `GET STARTED` (except labels) |
| Monospace for technical terms | `git push`, `PR #142`, `TSK-38` |
| Contractions are fine | `don't`, `isn't`, `you'll` |
| Oxford comma | `commits, PRs, and deploys` |

---

## Words We Use vs. Words We Don't

| Use | Don't Use |
|-----|-----------|
| Ship | Deploy (unless literally about deployment) |
| Push | Sync |
| Track | Monitor (too corporate) |
| Velocity | Throughput |
| Sprint | Iteration (we use sprint) |
| Team | Organization |
| Tasks | Tickets, Issues (in marketing copy) |
| Git-driven | Automated (too vague) |
| Open source | Free (we say both, but lead with open source) |
| Terminal-first | CLI-based |
| Brutal | Clean, Minimal (we own the brutalism) |

---

## Copy Rules

1. **Lead with the outcome**, not the mechanism
2. **One idea per sentence** — compound sentences dilute impact
3. **Technical accuracy matters** — don't say "AI" if it's a regex
4. **Developers detect BS** — if a claim can't be demonstrated in a terminal, reconsider it
5. **Shorter is louder** — a 4-word headline hits harder than a 12-word one
6. **ASCII art is copy** — it communicates product value, not decoration
7. **Respect the reader's time** — they have 15 tabs open and a failing build
