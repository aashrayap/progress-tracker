---
name: checkin
description: Guided daily, weekly, monthly, or quarterly check-in that captures habits, intentions, feelings, and reflections into canonical CSVs and vision.json. Single CLI entry point for all writes — absorbs former /plan skill actions.
---

# Check-in

Structured ritual that reads current state, shows where you stand in a human-friendly briefing, asks only what's needed, and writes everything to canonical CSVs.

## Date & Day-of-Week

Never guess the current date or day of week. Run `date '+%Y-%m-%d %A'` at the start of every check-in to get the actual date and weekday from the system clock.

## Commands

- `/checkin` — show check-in status and let the user pick which to run
- `/checkin daily` — force daily check-in
- `/checkin weekly` — force weekly check-in
- `/checkin monthly` — force monthly check-in
- `/checkin quarterly` — force quarterly check-in (full vision.json rebuild)
- `/checkin add <item> <time>` — quick-add a plan block (inline command)
- `/checkin done <item>` — mark a plan block done + auto-signal (inline command)
- `/checkin move <item> <new-time>` — move a plan block (inline command)
- `/checkin intention [text]` — set or view daily intention (inline command)
- `/checkin show` — show today's plan + context (inline command)

## Auto-Detection (when user runs `/checkin` with no argument)

1. Read `daily_signals.csv` for today's logged habits
2. Present status and let the user choose:

```
┌─ Check-ins ──────────────────────────────────────────┐
│ Daily      earlier today (gym, sleep, weed -- 5 open)│
│ Weekly     Sundays only (last: Feb 23)               │
│ Monthly    last Sun of month (last: never)           │
│ Quarterly  every 3 months (last: never)              │
└──────────────────────────────────────────────────────┘
```

Then ask: "Want to update today's habits?"

3. Wait for user to choose. Do NOT auto-run anything.
4. If only one is actionable, suggest it but still confirm.

### Daily re-entry

The `checkin_daily` flag means "at least one check-in happened today" -- it does NOT block re-entry. When the flag already exists:
- Show today's current state (what's logged, what's still open)
- Offer to fill gaps or update habits
- Do NOT write a second `checkin_daily` flag -- one per day is enough

### Schedule rules

- **Weekly**: Sundays only. On other days, show when the last weekly was but do not prompt or nag.
- **Monthly**: Last Sunday of the month only. On other days, show when the last monthly was but do not prompt.

## Completion Flags

Append to `daily_signals.csv` after each check-in:

| Check-in | Signal | Value | Period |
|----------|--------|-------|--------|
| Daily | `checkin_daily` | `1` | Per day |
| Weekly | `checkin_weekly` | `1` | Per calendar week (Mon-Sun) |
| Monthly | `checkin_monthly` | `1` | Per calendar month |
| Quarterly | `checkin_quarterly` | `1` | Per quarter |

## Canonical Files Read

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/vision.json` (via GET /api/vision — weekly+ cadences)

## Canonical Files Written

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/vision.json` (via PATCH /api/vision for weekly/monthly, PUT for quarterly)

---

## Daily Check-in

### Pre-Menu (always, in order)

#### 1. State Scan

Run `node scripts/precompute-checkin.js` and parse the JSON output.

Display `display.card1` verbatim, then display `display.card2` verbatim. No prose outside the cards.

The `digest` object contains structured data for AI reasoning in subsequent steps:
- `digest.mood_arc` — last 7 days of feeling/energy
- `digest.habit_misses` — habits not yet logged today
- `digest.streak_breaks` — recent streaks that broke (habit, streak length, date)
- `digest.stale_todos` — open todos older than 7 days
- `digest.weekly_goals` — current week's goals
- `digest.weekly_intention` — current week's mantra (or null)
- `digest.daily_intention` — today's intention (or null)
- `digest.rollover_items` — yesterday's incomplete plan items with roll count
- `digest.recent_reflections` — last 14 days of reflections
- `digest.last_workout` — last gym date/day and next workout day

After both cards, go straight to the menu. No pre-menu gates.

### Menu

Present all options immediately after cards. No time-of-day gating — user picks freely. Labels are guidance, not auto-detected gates.

```
What do you want to do?

  1. Log             (8 open today)
  2. Process          (anchor / decompress / reflect / reframe)
  3. Plan             (today / tomorrow / week)
  4. Wind Down        (end-of-day close)
```

Rules:
- Show counts from current state where applicable
- Options with nothing to do still appear but show "(done)" or "(0 items)"
- User can pick any option in any order regardless of time of day
- User can pick the same option again (re-enterable)
- User can specify a target with Option 3: "3 tomorrow", "3 thursday", "3 week"
- After completing an option, ask "What next?" with the updated menu
- When user says "done" or stops, write `checkin_daily=1` if not already written today

### Option 1: Log

**Single-round logging.** Present one card with everything unlogged for the target day. User answers in one shot via speech-to-text or typing.

#### Day detection

- **Morning (before 2pm)**: default to yesterday. Today's habits aren't done yet.
- **Evening (2pm+)**: default to today.
- User can override: "log today" or "log yesterday".
- If the non-default day also has gaps, offer it after the first day is done: "Yesterday has gaps too — want to log those?"

#### The card

Show a single card with two columns — addiction on the left, habits on the right. Only show unlogged signals for the target day.

```
┌─ Wed Mar 25 ──────────────────────────────┐
│ Addiction       │ Habits                   │
│ · Weed          │ · Sleep                  │
│ · League        │ · Gym                    │
│ · Poker         │ · Deep work              │
│ · Clarity       │ · Meditate               │
│                 │ · Ate clean              │
│ Clean from      │ · Wim Hof AM             │
│ all? (y/n/      │ · Wim Hof PM             │
│ except X)       │ · AM review              │
│                 │ · Mid review             │
│                 │ · PM review              │
│                 │ · Intention              │
│                 │                          │
│                 │ Which did you hit?        │
└─────────────────┴──────────────────────────┘
```

Sleep is logged on TODAY's date regardless of which day is being logged (it reflects last night's sleep). If today's sleep is already logged, omit it from the card.

Intention: if not yet set today, include it in the habits column. If the user provides one, infer domain and write as `signal=intention, value=<domain>, context=<mantra text>, category=<domain>`. Show weekly intention as context: "This week: *{weekly_intention}*". If intention is already set, omit from card.

#### Parsing the response

Accept natural language in one message. Examples:
- "clean all, hit gym meditate ate clean, intention is stay present"
- "clean except league, gym and meditate"
- "all clean, everything except deep work"

Rules:
- Addiction signals are non-skippable. If user doesn't address addiction, re-prompt once: "Need the addiction check — clean from all?"
- Habits not mentioned = not logged (skip). Do NOT ask follow-ups for unmentioned habits.
- "not yet" / "later" for a specific habit = don't write a row.
- Parse "all" / "everything" as all habits hit. Parse "except X" as exclusions.
- Write all signals to `daily_signals.csv` immediately after parsing.

#### Signal reference

Addiction signals (value: 1=clean, 0=used):
`weed`, `lol`, `poker`, `clarity`

Habit signals (value: 1=done, 0=not done):
`sleep`, `gym`, `deep_work`, `meditate`, `ate_clean`, `wim_hof_am`, `wim_hof_pm`, `morning_review`, `midday_review`, `evening_review`

---

### Option 2: Process

Delegate to the **process** agent. Do NOT perform this inline — spawn the agent and present its output.

Ask: **"What's on your mind?"** — the agent auto-detects the branch:
- **Pull** (temptation/vice keywords) → crossroads flow with identity lens
- **Feeling** (emotion words) → capture feeling + opportunistic depth
- **Reflection** (backward-looking) → win/lesson/change/system-adjustment
- **Lag/Stuck** (stagnation words) → Abrada lag reframe

The agent handles re-entry ("Anything else?") internally. After it returns, resume the menu.

---

### Option 3: Plan

Delegate to the **plan** agent. Do NOT perform this inline — spawn the agent and present its output.

The agent detects target from user input:
- `3` or `3 today` → manage today's plan (assign times, add/move/done blocks)
- `3 tomorrow` → set tomorrow's priorities as draft blocks
- `3 thursday` (any day name) → set that day's priorities
- `3 week` → sketch the whole week

The agent runs `node scripts/precompute-plan.js`, shows the target day's state, accepts a single free-form response, writes everything, and shows the final plan.

Two rounds max. After the agent returns, resume the menu.

---

### Option 4: Wind Down

**Single-round end-of-day close.** One card, four questions, one natural-language response. Target: under 60 seconds of user time.

#### The card

Show a single card:

```
┌─ Wind Down ──────────────────────────────────────┐
│                                                   │
│  1. What went well today?                         │
│  2. What are you grateful for right now?           │
│  3. What's tomorrow's one priority?                │
│  4. How are you feeling?                           │
│                                                   │
│  Answer all at once.                               │
└───────────────────────────────────────────────────┘
```

#### Parsing the response

Accept natural language in one message. Examples:
- "gym was solid, grateful for basia being here, tomorrow finish the PR, feeling tired but good"
- "got deep work done, grateful for the quiet morning, priority is gym, feeling calm"

Parse each answer to its destination:

| Question | Destination | Fields |
|----------|------------|--------|
| Q1 (win) | `reflections.csv` | `date=today, domain=<inferred>, win=<text>, lesson=, change=, archived=` |
| Q2 (gratitude) | `daily_signals.csv` | `signal=gratitude, value=<text>, category=personal_growth` |
| Q3 (tomorrow priority) | `plan.csv` | `date=<tomorrow>, start=0, end=0, item=<text>, done=, notes=, domain=<inferred>` |
| Q4 (feeling) | `daily_signals.csv` | `signal=feeling, value=<text>, category=health` |

Rules:
- Infer domain from content for Q1 and Q3. Default to `personal_growth` if unclear.
- Q3 writes a draft block (start=0, end=0) for the next calendar day.
- All writes happen immediately after parsing.
- After writes, confirm briefly: "Logged. Night." — no elaboration.
- Return to menu with "What next?" (same as other options).

---

## Weekly Check-in

Run on **Sundays only** (or `/checkin weekly` to force on demand).

### Step 1: Generate Weekly Report

```bash
node ~/Documents/2026/tracker/scripts/precompute-weekly.js --html
```

The script writes `data/artifacts/weekly-report-YYYY-MM-DD.html` — a self-contained HTML report with score card, trajectory deltas, streak momentum, domain balance, identity-action gap, plan accuracy, and reflection coverage.

Print the path. Tell the user: **"Open your weekly report, read it, then type 'continue'."** Wait for "continue" before proceeding.

### Step 2: Delegate to weekly-reflect agent

Spawn the **weekly-reflect** agent. It self-fetches data (runs `precompute-weekly.js`, reads `vision.json`), then runs the interactive reflection phases:

- Domain Spotlight (2-3 data-selected domains → `reflections.csv`)
- Feedback Loop Audit ("where is lag longest?")
- Belief × Action × Duration check ("which multiplier is broken?")
- Inversion Quick-Scan (failure playbook per pillar, using anti-vision)
- Social Contact (`daily_signals.csv`)

After it returns, continue.

### Step 3: Delegate to weekly-vision agent

Spawn the **weekly-vision** agent. It self-fetches data, then runs:

- Review last week's goals (mark ✓/✗/~ → `daily_signals.csv`)
- Set this week's goals, 1-3 (`daily_signals.csv`)
- Set weekly intention / mantra (`daily_signals.csv`)
- ABT(H) Update per pillar — actual + habits (`vision.json` via PATCH)

After it returns, continue.

### Step 4: Delegate to plan agent (week mode)

Spawn the **plan** agent with week mode (`3 week`). It shows weekly goals as context, accepts natural language priorities per day, and writes draft blocks to `plan.csv`. After it returns, continue.

### Step 5: Close

Write to `daily_signals.csv`:
`date=<today>, signal=checkin_weekly, value=1, unit=, context=, source=chat, capture_id=, category=`

Print: **"Weekly check-in complete."**

---

## Monthly Check-in

Run on the **last Sunday of the month** (or `/checkin monthly` to force on demand).

### Step 1: Read Last 30 Days

Aggregate signals, reflections, insights.

### Step 2: Present Month Summary

Present as a trajectory report.

```
FEBRUARY 2026 -- MONTH IN REVIEW

Habits:
  Sleep          25/28 days (89%)      ↑ up from 78% in Jan
  Gym            20/28 days (71%)      ━ steady
  Ate clean      21/28 days (75%)      ↑ up from 65% in Jan
  Deep work      18/28 days (64%)      ↓ down from 72% in Jan
  Meditate       14/28 days (50%)      ━ steady but low

Addiction:
  Clean all month. Weed 58d, League 58d, Poker 58d.
  No relapses. No close calls logged.

Weight:
  228 -> 224 lbs (-4 lbs). On track for March target of 224. ✓

Inbox pipeline:
  12 voice notes processed, 4 shipped as PRs, 8 discarded

Plan completion: 74% of scheduled blocks done
Check-ins: 26/28 daily, 4/4 weekly
```

Key formatting rules for the monthly summary:
- Show trend arrows (↑ ↓ ━) compared to last month
- Percentages are fine at monthly scale -- they tell a meaningful story
- Call out the narrative on addiction (clean/not, any close calls)
- Weight gets its own section with trajectory check
- Include inbox pipeline stats

### Step 3: Ask

1. "What's working in your current system?"
2. "What's not working that you keep ignoring?"
3. "What inputs are you consuming that aren't serving the target identity?" (signal-to-noise reduction)
4. "Which habits need less friction? Which destructive habits need more?" (friction engineering)
5. "Any new attention leaks since last month?" (distraction inventory)
6. "Does your direction still match where you want to be in 5 years?"
7. "One protocol change for this month?"

### Step 3b: Vision Rewrite (monthly)

Monthly is the time to rewrite identity content. Uses PATCH /api/vision.

**Identity Script rewrite:**

```
─── IDENTITY REWRITE ──────────────────────────────────
  Current identity script:
    Core traits: "The person behind all these domains: grounded,
    positive, present..."

  Based on the last month's trajectory and what you told me
  above, does this still feel right?

  Rewrite your core traits in your own words. (or keep)
```

Walk through each identityScript field:
- `coreTraits` — who you are at your core
- `nonNegotiables` — what you refuse to skip
- `languageRules` — words to use and forbid
- `physicalPresence` — how you carry yourself
- `socialFilter` — who you surround yourself with
- `decisionStyle` — how you decide under pressure

For each: show current value, ask "rewrite or keep?", accept natural language.

**Anti-Vision rewrite:**

```
─── ANTI-VISION ──────────────────────────────────────
  Current: "Smokes weed. Skips gym for any emotion or timing
  excuse. Watches porn. Isolates. Reactive. Overweight.
  Hates himself."

  Still accurate? Sharpen, expand, or keep?
```

**Intentions update:**

```
─── INTENTIONS ──────────────────────────────────────
  Set a daily mantra for the coming month:
  Set a weekly mantra for the coming month:
```

**Write:** Single PATCH request with all changed fields:
```json
{
  "identityScript": { "...updated fields" },
  "antiVision": "<updated>",
  "intentions": { "daily": "<updated>", "weekly": "<updated>" }
}
```

Only include fields that changed.

### Step 4: Write

- Flag protocol changes for `life-playbook.md` (suggest edits, confirm before writing)
- Write `checkin_monthly=1`

---

## Quarterly Check-in

Run every 3 months (or `/checkin quarterly` to force on demand).

Quarterly is a full rebuild of vision.json. Uses PUT /api/vision (full replace).

### Step 0: Strategic Orientation (preamble)

Before rebuilding the vision, orient with three questions:

```
─── STRATEGIC ORIENTATION ──────────────────────────────────
  1. Set Point Audit: "What position do you snap back to
     when you stop trying? Name the default shape."

  2. Single-Dimension Focus: "Which ONE life dimension gets
     concentrated force this quarter? (You can maintain
     others — but only ONE gets full force.)"

  3. 6 Freedoms: Rate 1-10 and identify the bottleneck.
     Distraction | Financial | Time | Location | People | Purpose
```

Record answers — they ground the ABT(H) rebuild that follows.

### Step 1: Full ABT(H) Rebuild

For each of the 4 pillars (health, wealth, love, self), walk through:

1. **Becoming** — "Where do you want to be in this pillar?" (vivid, specific, measurable)
2. **Target Shape** — "Describe this person in behavioral terms — what do they do daily, refuse to tolerate, how do they respond under pressure?" (not possessions or titles)
3. **Timeline** — "By when?" (specific date)
4. **Actual** — "Where are you right now, honestly?"
5. **Habits** — "What daily actions get you from Actual to Becoming?" (3-5 statements)

Show the current values for each. Accept rewrites or keep.

### Step 2: Ritual Blueprint Overhaul

```
─── RITUAL BLUEPRINT ──────────────────────────────────
  Morning steps (current, 8 steps):
  1. Wake — no snooze
  2. Open /plan/day (blueprint)
  3. Brush teeth + warm water
  4. Wim Hof (1 round)
  5. Journal (top priorities)
  6. Review identity script
  7. Plan day (or confirm last night's drafts)
  8. Start work

  Midday steps (current, 6 steps):
  1. Finish morning work block
  2. Walk / Gym
  3. Cold shower
  4. Short meditation (outside)
  5. Lunch
  6. Resume work

  Evening steps (current, 6 steps):
  1. Finish work — 5pm hard stop
  2. Walk Cooper
  3. Wim Hof
  4. Deep work session (personal)
  5. Set tomorrow
  6. Wind down + lights out

  Keep, rewrite, or adjust?
```

Walk through morning, midday, evening. For each:
- Show current steps and habit stacks
- Accept rewrites, additions, removals

### Step 3: Habit Audit

```
─── HABIT AUDIT ──────────────────────────────────────
  Productive: Gym, Meditation, Deep work, Clean eating, ...
  Neutral: Cooking, Walking Cooper, Reading
  Destructive: Weed, League of Legends, Poker, Porn, ...

  Any changes? Move items between categories, add, remove?
```

After the standard audit, reference the Abrada inversion playbooks (`docs/resources/daniel-abrada/the-abrada-system.md`, concept 9) — scan each pillar's failure playbook against current behavior:

```
─── INVERSION CHECK (per pillar) ──────────────────────────
  Review the failure playbook for [pillar].
  Circle any patterns that feel familiar right now.
  What's the opposite behavior?
```

### Step 3.5: Forces & Skills Audit

```
─── FORCES AUDIT ──────────────────────────────────────────
  Passive forces (shaping you by default — environment,
  people, habits you didn't choose):
  • ...

  Active forces (deliberately chosen):
  • ...

  Which passive forces need to be removed or countered?
```

```
─── SKILL STACK (Wealth pillar) ──────────────────────────
  Current skills (rate 0-100):
  • ...

  The Power Six: Writing, Sales, Marketing, Storytelling,
  Speaking, Digital/Automation

  Gaps: which skill to develop to 80% next?
```

```
─── PEER GROUP ────────────────────────────────────────────
  5 closest relationships:
  • ...

  For each: does this person pull you up or down
  across the 4 pillars?

  One upgrade action for this quarter?
```

### Step 4: Input Control

```
─── INPUT CONTROL ──────────────────────────────────────
  Mentors: Daniel Abrada
  Books: As a Man Thinketh, The Perfume of Silence
  Podcasts: (none)
  Nutrition rules: Protein-first, sustainable deficit, ...
  Purge list: (empty)

  Any updates?
```

### Step 5: Write

Assemble the complete vision.json object from all updated fields (merged with unchanged current values) and PUT to `/api/vision`.

Verify the response parses correctly. If the PUT fails, show the error and do NOT write `checkin_quarterly=1`.

Write `checkin_quarterly=1` to `daily_signals.csv`.

---

## Inline Commands

These work outside the menu flow, as direct commands. They are the absorbed /plan skill quick actions.

### `/checkin add <item> <time>`

Same behavior as former `/plan add`:
- Parse item and time. Accept: `3pm`, `15:00`, `3-4pm`, `3pm for 1h`
- Convert to decimal hours
- Default duration: 1 hour if no end time
- All-day (no time given): start=0, end=0
- Append to plan.csv
- Confirm: "Added: [item] at [time]"

### `/checkin done <item>`

Same behavior as former `/plan done`:
- Find matching block (case-insensitive substring)
- Mark done=1
- Check signal map for auto-signal: run `node scripts/precompute-plan.js` and use `digest.signal_map` for keyword matching. For each key-value pair in `signal_map`, check if the plan item contains the value (case-insensitive substring). If matched, write `{key}=1` to daily_signals.csv.
- If no keyword match, ask about trackable signal: "Does this correspond to a trackable signal? (gym/sleep/meditate/deep_work/ate_clean/wim_hof_am/wim_hof_pm/morning_review/midday_review/evening_review/weed/lol/poker/clarity, or skip)"
- If user names a signal, write it. If skip, no signal written.
- Confirm: "Done: [item]" + "Logged: [signal]=1" if signal written

### `/checkin move <item> <new-time>`

Same behavior as former `/plan move`:
- Find matching block (case-insensitive substring)
- Parse new time to decimal hours
- Update start/end in plan.csv
- Confirm: "Moved: [item] → [new-time]"

### `/checkin intention [text]`

Same behavior as former `/plan intention`:

**With argument** (`/checkin intention "bounce back clean"`):
1. Use the quoted text as the mantra.
2. Infer `domain` from the mantra.
3. Write to `daily_signals.csv`:
   - `signal=intention`
   - `value=<domain>`
   - `context=<mantra text>`
   - `category=<domain>`
4. Confirm: "Intention set: *{mantra}*"

**Without argument** (`/checkin intention`):
1. Read today's `intention` signal from `daily_signals.csv`.
2. If already set: show it and ask "Want to change it?"
3. If not set:
   a. Read latest `weekly_intention` from `daily_signals.csv`.
   b. If weekly exists: "This week: *{mantra}*. What's today's intention?"
   c. If no weekly: "What's today's intention in mantra form?"
4. Accept mantra, infer domain, write to `daily_signals.csv` (same fields as above).
5. Allow skip: if user says `skip`, exit without writing.

### `/checkin show`

Show today's plan:
1. Run `node scripts/precompute-plan.js`, display `display.today_plan`
2. Show weekly goals and intention context
3. Wait for user input

### `/checkin week`

Sketch the week:
1. Read current week's `weekly_goal` signals
2. Show: "Weekly goals: [goals]. What does this week look like?"
3. Accept multi-day input like "gym MWF 9am, deep work daily 10-12"
4. Parse into individual `plan.csv` rows for each specified day:
   - `M` = Monday, `T` = Tuesday, `W` = Wednesday, `R` = Thursday, `F` = Friday, `S` = Saturday, `U` = Sunday
   - `daily` = all 7 days, `weekdays` = Mon-Fri
5. Append all rows to `plan.csv`
6. Confirm: "Planned [N] blocks across [days]"

---

## Rules

- Read state FIRST. Never ask about something already logged.
- Present status as a friendly briefing. Use ✓ ✗ · not 0/1. Name habits positively.
- Ask the user which check-in to run -- never auto-decide.
- Ask conversationally, not as a form. Group related questions.
- Accept natural language ("yeah", "nah", "skipped it") -- parse to 0/1.
- Addiction habits: non-skippable. Re-prompt if user tries to skip.
- All other questions: accept "skip" or "pass".
- Never invent answers. Only write what the user says.
- No cheerleading. Direct tone. One observation is fine, a pep talk is not.
- Daily check-in is always re-enterable. Show current state and offer to fill gaps -- never say "already done."
- Weekly/monthly: if flag exists for current period, note it and ask if they want to redo.
- All writes are append-only.
- Keep daily check-in under 2 minutes of user time.
- Name patterns, not just numbers. "Dropped off midweek" beats "Wed: 0, Thu: 0".
- When everything in a category is done, collapse it. Don't waste the user's time reading green checkmarks.
- Writes happen immediately after each menu option completes — no batching to a final phase.
- Auto-discard empty voice notes in inbox — never surface them to the user.
- All time parsing produces decimal hours (9:30am = 9.5, 2:15pm = 14.25).
- Default block duration: 1 hour if no end time given.
- Accept natural language time ("morning" = 9am, "afternoon" = 2pm, "evening" = 7pm).
- After the check-in completes, run `node scripts/reconcile.js` to auto-mark plan items that match today's logged signals.
