---
name: checkin
description: Guided daily, weekly, or monthly check-in that captures habits, intentions, feelings, and reflections into canonical CSVs.
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

## Auto-Detection (when user runs `/checkin` with no argument)

1. Read `daily_signals.csv` for today's logged habits
2. Present status and let the user choose:

```
┌─ Check-ins ──────────────────────────────────────────┐
│ Daily     earlier today (gym, sleep, weed -- 5 open) │
│ Weekly    Sundays only (last: Feb 23)                │
│ Monthly   last Sun of month (last: never)            │
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

## Canonical Files Read

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/code-todos.csv`
- `~/Documents/2026/tracker/data/inbox.csv`
- **GitHub Issues** — `aashrayap/progress-tracker` open issues (synced live during inbox triage)

## Canonical Files Written

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/inbox.csv` (status updates during triage)

---

## Daily Check-in

### Time Windows

- **Morning** (`before 12:00 PM`): yesterday backfill + today setup
- **Afternoon** (`12:00 PM or later`): yesterday backfill if missing + today progress + today adjustment

### State Scan

Read ALL data sources and present two cards. No prose outside the cards.

**Data sources:**
- `daily_signals.csv` — habits, addiction, feelings, intentions
- `inbox.csv` — unprocessed voice notes, ideas, shipped PRs
- `todos.csv` — open life todos
- `code-todos.csv` — open code todos
- `plan.csv` — today's scheduled blocks, yesterday's incomplete blocks
- `reflections.csv` — whether yesterday's reflection exists
- `workouts.csv` — last workout (to show next workout day)

**Card 1 — Habits** (same as before, unchanged):

```
┌─ Sat Mar 7 ──────────────────────────┐
│ YESTERDAY          │ TODAY            │
│ ✓ Gym (Day F)      │ ✗ Sleep          │
│ ✓ Deep work        │ Feel: determined │
│ ✓ Meditate         │ · Gym            │
│ ✓ Ate clean        │ · Deep work      │
│ ✗ Sleep            │ · Meditate       │
│ ✗ Weed (relapse)   │ · Ate clean      │
│ ✗ League (relapse) │ · Weed           │
│ ✓ Poker            │ · League         │
│ ✓ Clarity          │ · Poker          │
│ All logged.        │ · Clarity        │
│                    │ 8 open.          │
└────────────────────┴──────────────────┘
```

Formatting rules:
- ✓ done, ✗ missed, · not logged. Addiction uses substance name directly: ✓ Weed = clean, ✗ Weed (relapse) = relapsed. No "No weed" double negatives.
- Side-by-side: YESTERDAY left, TODAY right. One signal per line.
- Max box width ~40 chars to avoid terminal wrapping.
- Collapse completed side ("All logged. ✓"). Detail goes on the side with gaps.
- End with gap/open count. Feeling/intention on TODAY side, abbreviated.

**Card 2 — Actions:**

```
┌─ On Your Plate ──────────────────────────────────────┐
│ Inbox        3 unprocessed                           │
│               • neuroscience talk (4d old)           │
│               • As A Man Thinketh (4d old)           │
│               • poker hand note (garbled)            │
│ Shipped      2 auto-PRs                              │
│               • Meditation card — PR #63             │
│               • Vision tab redesign — PR #84         │
│ Todos        5 open (oldest: Buy ring, 28d)          │
│ Reflection   yesterday — missing                     │
│ Plan         nothing scheduled today                 │
│ Last gym     Day F (Thu) → next: Day A               │
└──────────────────────────────────────────────────────┘
```

Formatting rules:
- Show unprocessed inbox items (status=logged or needs_review), capped at 3 with count
- Show shipped auto-PRs (status=shipped) that haven't been reviewed in checkin yet
- Show open todo count with age of oldest
- Show reflection status for yesterday
- Show plan status for today
- Show last workout + next workout day
- If a section has 0 items, omit it entirely

After both cards, present the menu.

### Menu

After the state scan, present options with live counts. The user picks what to do. After each option completes, writes happen immediately, then show the menu again with updated counts. When the user stops picking (or says "done"), the checkin ends.

```
What do you want to do?

1. Log habits       (8 open today)
2. Emotional check
3. Reflect on yesterday
4. Inbox triage     (3 items + 2 shipped PRs)
5. Plan today       (includes intention)
```

Rules:
- Show counts from current state
- Options with nothing to do still appear but show "(done)" or "(0 items)"
- User can pick any option in any order
- User can pick the same option again (re-enterable)
- After completing an option, ask "What next?" with the updated menu
- When user says "done" or stops, write `checkin_daily=1` if not already written today

---

### Option 1: Log Habits

Ask ONLY about habits/addiction not yet logged for the relevant day.

**Yesterday backfill** — ask only if yesterday has gaps:

Addiction (non-skippable -- must answer):

| Signal | Question |
|--------|----------|
| `weed` | Clean from weed yesterday? |
| `lol` | Clean from League yesterday? |
| `poker` | Clean from poker yesterday? |
| `clarity` | Clean from Clarity yesterday? |

Habits (skippable):

| Signal | Question |
|--------|----------|
| `gym` | Did you work out yesterday? |
| `deep_work` | Deep work done yesterday? |
| `meditate` | Did you meditate yesterday? |
| `ate_clean` | Eat clean yesterday? |

If all signals for a category are already logged, skip with a quick note: "Yesterday's addiction habits are all logged -- moving on."

**Today** — behavior depends on time of day:

Sleep (always today's date -- "last night's sleep"):
- If today's `sleep` is missing: "Did you sleep on time last night?"

**Morning mode**: only ask sleep. All other today habits (lifestyle AND addiction) aren't knowable yet — do NOT ask about weed/lol/poker/gym/etc for today in the morning. If the user volunteers a today signal, accept and log it, but don't prompt for it.

**Afternoon mode**: ask about today's habits that are missing:

| Signal | Question |
|--------|----------|
| `gym` | Work out today? |
| `deep_work` | Deep work today? |
| `meditate` | Meditate today? |
| `ate_clean` | Eating clean today? |
| `weed` | Clean from weed today? |
| `lol` | Clean from League today? |
| `poker` | Clean from poker today? |
| `clarity` | Clean from Clarity today? |

Accept "not yet" / "in progress" -- do not write a row for unknowns.

Write signals to `daily_signals.csv` immediately after this option completes.

---

### Option 2: Emotional Check

Ask: "How are you feeling right now? Anything unresolved you're carrying?"

- Accept free text
- If the user shares something substantive, write to `daily_signals.csv`:
  - `signal=feeling`, `value=<1-word summary>`, `context=<their words>`, `category=mental`
- If "fine" / "good" / nothing notable, skip -- don't write empty feelings

**Mind capture (opportunistic, not forced):**

If the user shares something substantive (not "fine"/"good"):
1. Follow up conversationally: "Was there a specific trigger?" (only if natural)
2. If trigger shared: "What thought came up?" (only if conversation flows there)
3. If thought shared: "What did you do about it?" (only if natural)

If any trigger was identified, write a single `signal=mind` row to `daily_signals.csv`:
- `value` = trigger keyword (infer from their words, e.g. `work_pressure`, `isolation`)
- `context` = pipe-delimited: `thought: <X> | action: <Y> | circumstance: <Z>` (any subset -- not all fields required)
- `category` = `mental` or `addiction` (infer from content)
- `source` = `chat`

Do NOT force the deeper questions. If user gives a feeling and moves on, just log the feeling signal. The mind capture is opportunistic -- no "mind" completion flag.

Write immediately after this option completes.

---

### Option 3: Reflect on Yesterday

Check `reflections.csv` for yesterday. If no row exists:

1. "Quick win from yesterday?"
2. "Anything you learned?"
3. "What would you do differently?"

Infer domain from answers. Write one row to `reflections.csv` immediately.

If reflection exists, say: "Yesterday's reflection is already captured." and offer to view it.

---

### Option 4: Inbox Triage

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
- Items processed here may create new todos that appear in Option 5 (Plan).
- Write inbox status updates immediately per item.

---

### Option 5: Plan Today

Goal: turn check-in context into executable plan blocks. Includes daily intention.

#### 5.1 Intention (mantra, not a task)

Ask:
"What's today's intention in mantra form? (e.g., 'bounce back clean', not 'go to gym')"

- If the user gives a task-style answer, ask for a concise mantra rewrite.
- Infer `domain` from the final intention.
- Write to `daily_signals.csv`:
  - `signal=intention`
  - `value=<domain>`
  - `context=<mantra text>`
  - `category=<domain>`

Allow skip: if user says `skip`, leave intention unchanged for today.

#### 5.2 Rollover incomplete items from yesterday (skippable)

Read yesterday's `plan.csv` rows where `done != 1`.

If any exist, present them one by one:
- "Keep this today, defer it, or drop it?"
- Allowed responses: `keep`, `defer`, `drop`, `skip` (skip = stop rollover and leave remaining items untouched)

For each choice:
- `keep`:
  - Ask: "What time should this happen today?"
  - Accept either a range (`1:00-2:00`) or start + duration (`1pm for 45m`)
  - Write a new `plan.csv` row for today with that time slot
- `defer`:
  - Ask: "What date should this move to?" (allow skip)
  - If date provided, write a `plan.csv` row on that date with a placeholder time (`0,0`) unless user gives a time
- `drop`:
  - Do not write a new plan row

If none are incomplete, say: "No incomplete plan items from yesterday."

#### 5.3 Context-aware surfacing from todos/reflections/signals (skippable)

Read:
- open `todos.csv` items (life todos)
- open `code-todos.csv` items (code todos — file paths, line numbers, type)
- recent `reflections.csv` rows (last 7-14 days)
- recent `daily_signals.csv` patterns (especially misses, streak breaks, and today's gaps)
- user's emotional context from Option 2 (if completed)

Use LLM reasoning over all of the above (not keyword matching) to propose up to 3 high-relevance candidate actions for today.

**When code todos exist**, show them separately:

```
Code todos (2 open):
  1. Refactor auth flow — app/lib/auth.ts:42-67 (3 days old)
  2. Fix CSV write race — app/lib/csv.ts:120 (1 day old)
```

For each suggestion:
- show a 1-line reason tied to intention/feeling/state
- ask: "Add this to today, keep as todo, or skip?"
- if "add to today", ask "what time?" and write to `plan.csv`
- if "keep as todo", leave in `todos.csv`
- if "skip", ignore

Allow global skip: "skip suggestions" keeps everything unchanged.

#### 5.4 Confirm today's block plan (skippable)

Show today's plan including:
- existing today's blocks
- kept/deferred items that were scheduled today
- any surfaced actions added in 5.3

Ask: "Anything else to adjust, or lock this in?"
- If user adjusts timing/items, write updates to `plan.csv`.
- If user says `skip`, keep current plan as-is.

Write plan rows immediately.

---

## Weekly Check-in

Run on **Sundays only** (or `/checkin weekly` to force on demand).

### Data Sources

Read ALL of these before presenting anything:
- `daily_signals.csv` — habits, addiction, feelings, triggers, intentions, experiments, goals
- `reflections.csv` — daily reflections
- `plan.csv` — scheduled blocks and completion
- `todos.csv` — open life todos
- `code-todos.csv` — open code todos
- `inbox.csv` — pipeline stats
- `briefing_feedback.csv` — briefing quality signal
- `docs/vision.md` — domain "Now" goals for grounding reflections

### Phase 1: Quantitative Score Card (auto-generated, no user input)

Compute and display. User just reads.

```
WEEK IN REVIEW — Mar 3 to Mar 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HABIT SCORE
  Total:    38/56 (68%)
  Trend:    ↑ from 31/56 last week (55%)
  Best day: Monday 8/8
  Worst day: Thursday 3/8

DAILY BREAKDOWN
  This Week              Last Week
  Mon  ████████  8/8     Mon  █████░░░  5/8
  Tue  ██████░░  6/8     Tue  ████░░░░  4/8
  Wed  █████░░░  5/8     Wed  ████░░░░  4/8
  Thu  ███░░░░░  3/8     Thu  █████░░░  5/8
  Fri  █████░░░  5/8     Fri  ████░░░░  4/8
  Sat  ██████░░  6/8     Sat  █████░░░  5/8
  Sun  █████░░░  5/8     Sun  ████░░░░  4/8

HABIT DETAIL
  This Week              Last Week
  Gym         6/7  ↑     Gym         5/7
  Sleep       5/7  ↓     Sleep       6/7
  Ate clean   5/7  ↑     Ate clean   4/7
  Deep work   4/7  ↓     Deep work   5/7
  Meditate    3/7  ↑     Meditate    2/7
  Weed        7/7  ━     Weed        7/7 ✓
  League      5/7  ↓ ⚠   League      7/7 ✓
  Poker       7/7  ━     Poker       7/7 ✓
  Clarity     7/7  ━     Clarity     7/7 ✓

STREAKS
  Now                    Last Week
  Weed 34d               Weed 27d
  Poker 34d              Poker 27d
  Clarity 34d            Clarity 27d
  League 0d (broke Thu)  League 7d

EXECUTION
  Plan: 12/15 blocks (80%) · Todos: 4 open, 6 done · Inbox: 3 processed, 2 shipped
  Check-ins: 6/7 daily — missed Thursday
```

**Score computation** (matches hub logic):
- Weed is gatekeeper: if weed=0 for the day, score=0
- 5 habit points: gym, sleep, meditate, deep_work, ate_clean (+1 each if true)
- 3 vice adjustments: lol, poker, clarity (+1 if clean, -1 if relapse)
- Daily score = max(0, habit_sum + vice_adjustments), range 0-8
- Week total = sum of 7 daily scores, max 56
- Pull prior week's data for trend comparison
- Streak = consecutive days with value=1, counting backward from today
- Use █ for filled, ░ for empty in bar chart (8 chars wide = 8 max score)

**Briefing feedback** (if any this week):
- Show good/bad count, extract recurring themes
- End with one-line actionable takeaway (prefixed with →)
- Omit section entirely if no feedback this week

### Phase 2: Mood & Trigger Arc (auto-generated, no user input)

Only show sections that have data.

```
EMOTIONAL ARC
  Mon: determined · Tue: focused · Wed: anxious
  Thu: frustrated · Fri: flat · Sat: hopeful

  Pattern: energy dropped after League relapse Thursday.
           Same midweek dip as last 2 weeks.
```

- Source: `signal=feeling` rows from the week
- Show if ≥3 feeling entries exist; otherwise skip with "Not enough mood data this week."
- Pattern detection: look for correlation between mood shifts and habit misses/relapses
- Compare to prior 2 weeks if data exists

```
TRIGGERS
  2 this week:
  • Thu 10:30pm — boredom after work, alone → played League
  • Fri 11pm — stress from deadline → urge to smoke (resisted)

  Pattern: both after 10pm, alone. Same window as last 2 weeks.
```

- Source: `signal=mind` rows from the week
- Only show if any exist
- Pattern detection: compare time, circumstance, trigger type across prior 2-4 weeks
- Flag recurring patterns explicitly

### Phase 3: Domain Spotlight (2-3 domains, data-selected, interactive)

**Selection logic** — pick 2-3 domains using these rules in priority order:
1. **Biggest decline** — domain where habit compliance dropped most vs last week
2. **Biggest improvement** — domain where habits improved most
3. **Stalled** — domain with no movement (flat for 2+ weeks)
4. **Vision misaligned** — domain where current behavior contradicts the "Now" goal in `docs/vision.md`

**Habit-to-domain mapping:**
| Habit | Domain |
|-------|--------|
| gym, ate_clean, sleep | health |
| deep_work | career |
| meditate | personal_growth |
| weed, lol, poker, clarity | personal_growth |

Domains without direct habit signals (relationships, finances, fun, environment) can still surface via:
- Trigger data mentioning those domains
- Reflections tagged to those domains
- Stall detection (no reflections or todos touched in 2+ weeks)
- Vision "Now" goals with no corresponding activity

**For each spotlighted domain, show:**

```
─── HEALTH (biggest improvement) ──────────────────────────
  This week: Gym 6/7, Sleep 5/7, Ate clean 5/7
  Last week: Gym 5/7, Sleep 6/7, Ate clean 4/7

  Vision (Now): "hit planned gym sessions, protein-first meals,
                 prioritize sleep quality"

  1. What went well this week in health?
  2. What would you do differently?
  3. One small experiment for next week?
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

### Phase 5: Experiment Loop (review last week's + set new)

**Review last week's experiment:**

Read prior week's `signal=weekly_experiment` from `daily_signals.csv`.

If one exists:
```
─── LAST WEEK'S EXPERIMENT ────────────────────────────────
  "Do 10-min meditation immediately after gym instead of evening"

  Did it work? (yes / partial / no)
  What did you learn?
```

- Write to `daily_signals.csv`:
  - `signal=experiment_result`
  - `value=yes|partial|no`
  - `context=<what they learned>`
  - `category=<domain of the experiment>`

If none exists, skip review.

**Set this week's experiment:**

```
─── THIS WEEK'S EXPERIMENT ────────────────────────────────
  Based on what surfaced today, what's ONE small behavior
  change you want to test this week?

  (Specific and observable — "meditate before work" not "be more mindful")
```

- Write to `daily_signals.csv`:
  - `signal=weekly_experiment`
  - `value=<domain>`
  - `context=<experiment description>`
  - `category=<domain>`
- Domain inferred from content
- Allow skip

### Phase 6: Weekly Goals & Intention (vision-connected)

**Review last week's goals first:**

Read prior week's `signal=weekly_goal` rows from `daily_signals.csv`.

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

### Phase 7: Stale Review & Close

- Review stale todos: "These have been open 7+ days — keep, kill, or defer?" (ask user)
- Review stale code todos from `code-todos.csv`: "These code items are 7+ days old — still relevant?" (ask user)
- Write `checkin_weekly=1` to `daily_signals.csv`

### Weekly Phase Order Summary

```
Phase 1  Score Card           auto-gen        0 min
Phase 2  Mood & Triggers      auto-gen        0 min
Phase 3  Domain Spotlight     interactive     3-5 min
Phase 4  Social Contact       1 question      30 sec
Phase 5  Experiment Loop      review + set    2 min
Phase 6  Goals & Intention    review + set    3 min
Phase 7  Stale Review         interactive     1 min
                                         ──────────
                              Target:     ~10 min
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
3. "Does your direction still match where you want to be in 5 years?"
4. "One protocol change for this month?"

### Step 4: Write

- Flag protocol changes for `life-playbook.md` (suggest edits, confirm before writing)
- Write `checkin_monthly=1`

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
