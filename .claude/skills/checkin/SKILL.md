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
- `~/Documents/2026/tracker/data/inbox.csv`
- `~/Documents/2026/tracker/data/experiments.csv`
- `~/Documents/2026/tracker/data/vision.json` (via GET /api/vision — weekly+ cadences)
- **GitHub Issues** — `aashrayap/progress-tracker` open issues (synced live during inbox triage)

## Canonical Files Written

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/inbox.csv` (status updates during triage)
- `~/Documents/2026/tracker/data/experiments.csv` (conclude expired, create new)
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
```

Rules:
- Show counts from current state where applicable
- Options with nothing to do still appear but show "(done)" or "(0 items)"
- User can pick any option in any order regardless of time of day
- User can pick the same option again (re-enterable)
- User can specify a target with Option 3: "3 tomorrow", "3 thursday", "3 week"
- After completing an option, ask "What next?" with the updated menu
- When user says "done" or stops, write `checkin_daily=1` if not already written today

### Conclude Expired Experiments (before or after menu, agent's choice)

If expired experiments were surfaced in Card 2, prompt for each one before or after the menu loop:

```
─── EXPERIMENT EXPIRED ──────────────────────────────────
  "Morning meditation before gym" (7 days, health)

  Verdict: kept / dropped / extended?
  What did you learn? (one line)
```

For each expired experiment:
- **kept**: Update row in `experiments.csv` — set `status=concluded`, `verdict=kept`, `reflection=<answer>`.
- **dropped**: Update row in `experiments.csv` — set `status=concluded`, `verdict=dropped`, `reflection=<answer>`.
- **extended**: Update old row — set `status=concluded`, `verdict=extended`, `reflection=<answer>`. Then append a NEW row with same `name`, `hypothesis`, `domain`, `start_date=today`, `duration_days=7` (ask if different duration wanted), `status=active`, empty `verdict`, empty `reflection`.
- **"I'll decide later"**: Skip — leave the row as `status=active`. It will surface again next checkin.

Row identification: match on both `name` AND `start_date` (handles extended experiments with the same name but different start dates).

Write updates to `experiments.csv` immediately after each experiment is concluded.

---

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

## Weekly Check-in

Run on **Sundays only** (or `/checkin weekly` to force on demand).

### Data Sources

Run `node ~/Documents/2026/tracker/scripts/precompute-weekly.js` and parse the JSON output. Store the full output for use in Phases 1-7.

Additional sources read directly by AI for interactive phases:
- `docs/vision.md` — domain "Now" goals for grounding reflections

### Phase 1: Quantitative Score Card (auto-generated, no user input)

Display `display.score_card` **verbatim** — do not reformat, re-compute, or summarize it. The script handles all score computation, bar charts, streaks, execution stats, and briefing feedback.

### Phase 2: Mood & Trigger Arc (auto-generated, no user input)

Use `digest.mood_arc` and `digest.triggers` from the script output. Do not re-read raw CSVs for this phase.

**Mood arc:** If `digest.mood_arc` has 3+ entries, present the emotional arc and detect patterns (correlation between mood shifts and habit misses/relapses, comparison to prior weeks). If fewer than 3, note "Not enough mood data this week."

**Triggers:** If `digest.triggers` is non-empty, present triggers and detect patterns (time, circumstance, recurring patterns across prior 2-4 weeks). Flag recurring patterns explicitly.

### Phase 3: Domain Spotlight (2-3 domains, data-selected, interactive)

Use `digest.domain_spotlight_candidates` from the script output to select 2-3 domains. The script pre-computes candidates using: biggest decline, biggest improvement, stalled (3+ weeks flat), and vision-misaligned. AI picks the final 2-3 from the candidates.

Use `digest.habit_by_domain` for per-domain habit breakdowns when presenting each spotlight.

**For each spotlighted domain, show:**

```
─── HEALTH (biggest improvement) ──────────────────────────
  This week: Gym 6/7, Sleep 5/7, Ate clean 5/7
  Last week: Gym 5/7, Sleep 6/7, Ate clean 4/7

  Vision (Now): "hit planned gym sessions, protein-first meals,
                 prioritize sleep quality"

  1. What went well this week in health?
  2. What would you do differently?
  3. How long before you know if your current approach is working?
     (Feedback loop audit — shrink the lag if too long)
  4. One small experiment for next week?
```

Rules:
- Pull the domain's "Now" horizon goal from `docs/vision.md` to ground reflection
- 3 questions per domain, max 3 domains = 9 questions worst case
- Accept short answers — this isn't journaling
- Write each domain's reflection to `reflections.csv`: `domain=<domain>`, `win=<Q1 answer>`, `lesson=<Q2 answer>`, `change=<Q3 answer>`
- Spotlighted domains are natural candidates for the experiment in Phase 5, but don't force it

### Phase 4: Social Contact Check (one question, always asked)

```
SOCIAL
  Did you have meaningful social contact this week?
  If yes: with who / what?
```

- Always ask — vision says "reduce isolation with deliberate weekly social contact"
- Write to `daily_signals.csv`:
  - `signal=social_contact`
  - `value=0|1`
  - `context=<details if provided>`
  - `category=relationships`
  - `date` = Sunday (week-end date)

### Phase 4.5: Inbox Triage

#### GitHub Issue Sync (always run first)

Before reading `inbox.csv`, ALWAYS fetch open issues from GitHub:

```
gh api repos/aashrayap/progress-tracker/issues --paginate -q '.[] | select(.pull_request == null)'
```

Or use `mcp__github__list_issues` with `owner=aashrayap`, `repo=progress-tracker`, `state=OPEN`.

**Sync logic:**
1. Fetch all open issues from GitHub
2. Compare against `inbox.csv` — any issue ID not present in `inbox.csv` is NEW
3. For new issues:
   - Read the issue body/title to determine content
   - Auto-discard empty issues (no body or garbled)
   - Add substantive issues to `inbox.csv` with `status=logged`
   - Classify `suggested_destination` (workouts, todos, idea, reflection, question, etc.)
4. For issues already in `inbox.csv` but still open on GitHub:
   - If `status=discarded` or `status=archived` in CSV but issue is still open on GitHub, note the mismatch but don't resurface — the CSV status is canonical
5. Present the merged view (CSV + newly synced) for triage

This ensures voice notes that created GitHub issues but weren't written to `inbox.csv` are never missed.

#### Triage Sections

Read `inbox.csv` (now synced) and present items in two sections.

#### Section 1: Shipped PRs (review)

Show inbox items with `status=shipped` that the user hasn't reviewed yet. These are auto-PRs created from voice ideas.

```
Shipped from your voice ideas:

PR #63: Meditation stats card on Hub
  voice-62: "want to add meditation aspect to the app..."
  → merged? working? need changes?

PR #84: Vision tab redesign
  voice-83: "vision tab to align with direction..."
  → merged? working? need changes?
```

For each: user can say "looks good" (mark reviewed), "need changes" (note what), or "skip".

#### Section 2: Unprocessed Items

Show items with `status=logged` or `status=needs_review`, excluding empty/garbled notes (auto-discard those).

```
Unprocessed:
1. neuroscience talk (voice, Mar 3)
   "Talk through habit/reward/fitness/eating goal neuroscience"
   → process / discuss now / defer / discard

2. As A Man Thinketh (voice, Mar 3)
   "Transcribe and add quotes page to app"
   → process / discuss now / defer / discard
```

Actions per item:
- **process** — move to appropriate destination (todo, reflection, idea). Write to target CSV, update inbox status.
- **discuss now** — talk through the item right here. After discussion, decide: process, defer, or discard.
- **defer** — leave as-is for next checkin
- **discard** — set `status=discarded` in inbox.csv

Rules:
- Cap at 5 items per triage round. If more exist, show count and offer "more" or "skip".
- Auto-discard empty voice notes (empty raw_text) — never show these to the user.
- Items processed here may create new todos.
- Write inbox status updates immediately per item.

### Phase 5: Experiment Loop

**Step 1: Catch unconcluded experiments**

Read `experiments.csv` for `status=active` where `today >= start_date + duration_days`. If any exist, run the conclude flow:

```
─── EXPERIMENT EXPIRED ──────────────────────────────────
  "<name>" (<duration> days, <domain>)

  Verdict: kept / dropped / extended?
  What did you learn? (one line)
```

- **kept**: Update row — `status=concluded`, `verdict=kept`, `reflection=<answer>`.
- **dropped**: Update row — `status=concluded`, `verdict=dropped`, `reflection=<answer>`.
- **extended**: Update old row as above with `verdict=extended`. Append NEW row: same `name`, `hypothesis`, `domain`, `start_date=today`, `duration_days=7` (ask if different), `status=active`, empty `verdict`, empty `reflection`.
- **"I'll decide later"**: Skip — leave as active.
- Match rows on `name` + `start_date`.

If no expired experiments, skip step 1.

**Step 2: Start new experiment**

```
─── NEW EXPERIMENT ──────────────────────────────────────
  Want to start a new experiment?

  If yes:
  • Name (short label)
  • Hypothesis (what you expect)
  • Domain (infer from content, confirm)
  • Duration (default 7 days)
```

- Write new row to `experiments.csv`: `name`, `hypothesis`, `start_date=today`, `duration_days`, `domain`, `status=active`, empty `verdict`, empty `reflection`.
- Allow skip.

**Note:** Historical `weekly_experiment` and `experiment_result` signals in `daily_signals.csv` are preserved. New experiments use `experiments.csv` exclusively. Phase 5 no longer reads or writes those signals.

### Phase 6: Weekly Goals & Intention (vision-connected)

**Review last week's goals first:**

Use `digest.goals_last_week` from the precompute script output. Each entry has `goal` and `domain`.

If any exist:
```
─── LAST WEEK'S GOALS ────────────────────────────────────
  ✓ 4 gym sessions — hit 6/7
  ✗ Call mom — didn't happen
  ~ Ship auth refactor — partial, PR open

  Score: 1/3 complete, 1 partial
```

- Ask user to mark each: ✓ (complete) / ✗ (missed) / ~ (partial)
- Write for each: `signal=weekly_goal_result`, `value=complete|missed|partial`, `context=<goal text>`, `category=<domain>`

**Set this week's goals (1-3):**

```
─── THIS WEEK'S GOALS ────────────────────────────────────
  Set 1-3 goals for the week. Each should connect to a
  domain and your current vision horizon.

  Example:
  • "4 gym sessions" (health → 90-day: stabilize training)
  • "2 social plans" (relationships → Now: reduce isolation)
  • "Ship tracker feature" (career → Now: AI fluency + deep work)
```

- For each goal, write to `daily_signals.csv`:
  - `signal=weekly_goal`
  - `value=<domain>`
  - `context=<goal text>`
  - `category=<domain>`
- Infer domain from content; confirm with user if ambiguous

**Set weekly intention (mantra):**

```
  What's the mantra for this week?
  (broad direction, not a task — e.g., "reclaim the midweek")
```

- If task-like, ask for a mantra rewrite
- Infer `domain`
- Write to `daily_signals.csv`:
  - `signal=weekly_intention`
  - `value=<domain>`
  - `context=<mantra text>`
  - `category=<domain>`
- Allow skip

### Phase 6b: Vision Update (weekly, after goals)

Update vision.json fields based on this week's reflections and progress. Uses PATCH /api/vision.

**Step 1: Update Actual (per pillar)**

For each of the 4 pillars (health, wealth, love, self), using this week's reflections and habit data:

```
─── VISION UPDATE: HEALTH ──────────────────────────────
  Current Actual: "Hit planned gym sessions, run protein-first
  meals, prioritize sleep quality and emotional regulation
  during stress."

  Based on this week: Gym 6/7, Sleep 5/7, Ate clean 5/7.

  Does this still describe where you are? Update or keep?
```

- If user says "keep" → skip
- If user provides update → PATCH `domains[].actual` for that pillar (match by domain id)
- Keep it grounded — actual = current reality, not aspiration

**Step 2: Adjust Habits (per pillar, optional)**

After reviewing actual for each pillar:

```
  Current habits:
  1. Train daily — no excuses for emotion or timing
  2. No substances
  3. Clean eating — protein-first every meal
  ...

  Any habit to add, remove, or reword? (or skip)
```

- If user adjusts → PATCH `domains[].habits` for that pillar
- Keep habits as action statements, not goals

**Step 3: Write**

Send a single PATCH request with all updated fields:
```json
{
  "domains": [
    { "id": "health", "actual": "<updated>", "habits": ["<updated>"] }
  ],
  "intentions": { "weekly": "<from Phase 6 mantra>" }
}
```

Only include pillars that changed. Always include `intentions.weekly` (set in Phase 6).

### Phase 6c: Week Sketch (draft planning)

After goals and vision update, sketch the week with draft blocks.

1. Show the goals just set in Phase 6: "You set these goals: [goals]. Let's sketch the week."
2. Ask: "What does this week look like? List priorities per day, or general items for the week."
3. Accept natural language input — e.g., "gym MWF, deep work daily, call mom Tuesday, no poker"
4. For each item:
   - Write to plan.csv: `date=<target day>, start=0, end=0, item=<text>, done=, notes=, domain=<inferred>`
   - If no specific day given, write to Monday (start of week)
   - Do NOT ask for times — these are drafts. Times assigned each morning via daily Option 3.
5. Day abbreviation mapping: M=Mon, T=Tue, W=Wed, R=Thu, F=Fri, S=Sat, U=Sun. "daily"=all 7 days, "weekdays"=Mon-Fri, "MWF"=Mon/Wed/Fri.
6. Confirm: "Sketched [N] blocks across [days]. These will show as priorities each morning."
7. Allow skip — "skip" or "I'll do it later" skips this phase entirely.

### Phase 7: Stale Review & Close

- Use `digest.stale_todos` from the precompute script output. Present items with age: "These have been open 7+ days — keep, kill, or defer?" (ask user)
- Write `checkin_weekly=1` to `daily_signals.csv`

### Weekly Phase Order Summary

```
Phase 1    Score Card           auto-gen        0 min
Phase 2    Mood & Triggers      auto-gen        0 min
Phase 3    Domain Spotlight     interactive     3-5 min
Phase 4    Social Contact       1 question      30 sec
Phase 4.5  Inbox Triage         interactive     2-3 min
Phase 5    Experiment Loop      conclude + new  2 min
Phase 6    Goals & Intention    review + set    3 min
Phase 6b   Vision Update        interactive     2-3 min
Phase 6c   Week Sketch          draft blocks    2-3 min
Phase 7    Stale Review         interactive     1 min
                                           ──────────
                                Target:     ~18 min
```

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
