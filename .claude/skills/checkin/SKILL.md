---
name: checkin
description: Guided daily, weekly, or monthly check-in that captures signals, intentions, feelings, and reflections into canonical CSVs.
---

# Check-in

Structured ritual that reads current state, shows where you stand in a human-friendly briefing, asks only what's needed, and writes everything to canonical CSVs.

## Commands

- `/checkin` — show check-in status and let the user pick which to run
- `/checkin daily` — force daily check-in
- `/checkin weekly` — force weekly check-in
- `/checkin monthly` — force monthly check-in

## Auto-Detection (when user runs `/checkin` with no argument)

1. Read `daily_signals.csv` for today's logged signals
2. Present status and let the user choose:

```
┌─ Check-ins ──────────────────────────────────────────┐
│ Daily     earlier today (gym, sleep, weed -- 5 open) │
│ Weekly    Sundays only (last: Feb 23)                │
│ Monthly   last Sun of month (last: never)            │
└──────────────────────────────────────────────────────┘
```

Then ask: "Want to update today's signals?"

3. Wait for user to choose. Do NOT auto-run anything.
4. If only one is actionable, suggest it but still confirm.

### Daily re-entry

The `checkin_daily` flag means "at least one check-in happened today" -- it does NOT block re-entry. When the flag already exists:
- Show today's current state (what's logged, what's still open)
- Offer to fill gaps or update signals
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

## Canonical Files Written

- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`

---

## Daily Check-in

### Time Windows

- **Morning** (`before 12:00 PM`): yesterday backfill + today setup
- **Afternoon** (`12:00 PM or later`): yesterday backfill if missing + today progress + today adjustment

### Phase 0: State Scan

Read signals for yesterday and today. Present inside a single compact box. No prose outside the box — just the box, then proceed.

**Morning example:**

```
┌─ Thu Mar 6 ──────────────────────────┐
│ YESTERDAY          │ TODAY           │
│ ✓ Gym              │ · Sleep         │
│ ✓ Sleep            │                 │
│ ✓ No weed          │ No plan yet.    │
│ ✓ No League        │ No reflection.  │
│ ✗ Deep work        │                 │
│ · Meditate         │                 │
│ · Ate clean        │                 │
│ · Poker  · Clarity │                 │
│ 3 gaps.            │                 │
└────────────────────┴─────────────────┘
```

**Afternoon example:**

```
┌─ Thu Mar 6 ──────────────────────────┐
│ YESTERDAY          │ TODAY           │
│ All logged. ✓      │ ✓ No weed      │
│                    │ ✗ Sleep         │
│                    │ · Gym           │
│                    │ · Deep work     │
│                    │ · Meditate      │
│                    │ · Ate clean     │
│                    │ · League        │
│                    │ · Poker         │
│                    │ · Clarity       │
│                    │ 7 open.         │
│                    │                 │
│ Reflection: done   │ Feel: uncertain │
│                    │ Intent: health  │
└────────────────────┴─────────────────┘
```

Formatting rules:
- ✓ done, ✗ missed, · not logged. Addiction named positively ("No weed").
- Side-by-side: YESTERDAY left, TODAY right. One signal per line.
- Max box width ~40 chars to avoid terminal wrapping.
- Collapse completed side ("All logged. ✓"). Detail goes on the side with gaps.
- End with gap/open count. Feeling/intention/reflection on TODAY side, abbreviated.
- The box IS the state scan. No additional prose before proceeding to Phase 1.

### Phase 1: Yesterday Backfill

Ask ONLY about signals missing for yesterday. Group by category.

**Addiction signals** (non-skippable -- must answer):

| Signal | Question |
|--------|----------|
| `weed` | Clean from weed yesterday? |
| `lol` | Clean from League yesterday? |
| `poker` | Clean from poker yesterday? |
| `clarity` | Clean from Clarity yesterday? |

**Habit signals** (skippable):

| Signal | Question |
|--------|----------|
| `gym` | Did you work out yesterday? |
| `deep_work` | Deep work done yesterday? |
| `meditate` | Did you meditate yesterday? |
| `ate_clean` | Eat clean yesterday? |

If all signals for a category are already logged, skip with a quick note: "Yesterday's addiction signals are all logged -- moving on."

### Phase 2: Today Signals

**Sleep** (always today's date -- "last night's sleep"):
- If today's `sleep` is missing: "Did you sleep on time last night?"

**Morning mode**: only ask sleep. All other today signals (habits AND addiction) aren't knowable yet — do NOT ask about weed/lol/poker/gym/etc for today in the morning. If the user volunteers a today signal, accept and log it, but don't prompt for it.

**Afternoon mode**: ask about today's signals that are missing:

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

### Phase 3: Emotional Check

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

### Phase 4: Yesterday Reflection (if missing)

Check `reflections.csv` for yesterday. If no row exists:

1. "Quick win from yesterday?"
2. "Anything you learned?"
3. "What would you do differently?"

Infer domain from answers. Write one row to `reflections.csv`.

If reflection exists, skip: "Yesterday's reflection is already captured."

### Phase 5: Plan Integration + Daily Intention

Goal: turn check-in output into executable plan blocks without requiring a separate Plan session.

#### 5.1 Rollover incomplete items from yesterday (skippable)

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

#### 5.2 Context-aware surfacing from todos/reflections/signals (skippable)

Read:
- open `todos.csv` items
- recent `reflections.csv` rows (last 7-14 days)
- recent `daily_signals.csv` patterns (especially misses, streak breaks, and today's gaps)
- user's emotional context from Phase 3

Use LLM reasoning over all of the above (not keyword matching) to propose up to 3 high-relevance candidate actions for today.

For each suggestion:
- show a 1-line reason tied to intention/feeling/state
- ask: "Add this to today, keep as todo, or skip?"
- if "add to today", ask "what time?" and write to `plan.csv`
- if "keep as todo", leave in `todos.csv`
- if "skip", ignore

Allow global skip: "skip suggestions" keeps everything unchanged.

#### 5.3 Daily intention (mantra, not a task)

Ask:
"What's today's intention in mantra form? (e.g., 'move with discipline', not 'finish API migration')"

- If the user gives a task-style answer, ask for a concise mantra rewrite.
- Infer `domain` from the final intention.
- Write to `daily_signals.csv`:
  - `signal=intention`
  - `value=<domain>`
  - `context=<mantra text>`
  - `category=<domain>`

Allow skip: if user says `skip`, leave intention unchanged for today.

#### 5.4 Confirm today's block plan (skippable)

Show today's plan including:
- existing today's blocks
- kept/deferred items that were scheduled today
- any surfaced actions added in 5.2

Ask: "Anything else to adjust, or lock this in?"
- If user adjusts timing/items, write updates to `plan.csv`.
- If user says `skip`, keep current plan as-is.

### Phase 6: Write & Confirm

1. Batch all signal writes to `daily_signals.csv`
2. Write reflection row if captured
3. Write/update plan rows if changed
4. Write completion flag `checkin_daily=1` only if not already written today
5. Print a compact confirmation box:

```
┌─ Logged ─────────────────────────────┐
│ YESTERDAY          │ TODAY           │
│ ✓ Deep work (miss) │ ✓ Sleep        │
│ ✓ Meditate         │ Feel: stressed │
│ ✓ Ate clean        │ Intent: career │
│ Reflect: auth flow │                │
│  / timebox better  │                │
└────────────────────┴── checkin ✓ ───┘
```

---

## Weekly Check-in

Run on **Sundays only** (or `/checkin weekly` to force on demand).

### Step 1: Read Last 7 Days

Read `daily_signals.csv`, `reflections.csv`, `plan.csv`, `todos.csv`.

### Step 2: Present Week Summary

Present as a coach recap, not a spreadsheet.

```
WEEK IN REVIEW -- Feb 24 to Mar 2

The good:
  Gym             6/7 days -- your best week this month
  Sleep           6/7 days -- solid consistency
  Ate clean       5/7 days -- strong
  Addiction       clean all week (weed 34d, League 34d, poker 34d, clarity 34d)

The gap:
  Deep work       4/7 days -- dropped off Wed and Thu
  Meditate        3/7 days -- inconsistent, skipped midweek

Pattern: You're strong Mon-Tue, then things slip midweek.
         Last week had the same shape.

Plan: 12 of 15 blocks completed (80%)
Todos: 4 open, 6 completed this week

Check-ins: 6/7 daily -- missed Thursday
```

Key formatting rules for the weekly summary:
- Split into "the good" and "the gap" -- honest, not demoralizing
- Name patterns, not just numbers ("dropped off Wed and Thu" not "4/7")
- Show addiction streaks as a single line since they're either clean or not
- Compare to last week when relevant ("your best week this month")
- End with plan and todo stats

### Step 3: Ask

1. "Biggest win this week?"
2. "What pattern do you want to change next week?"
3. "Top 3 priorities for next week?"
4. "How are you feeling about your trajectory overall?"

### Step 3.5: Set weekly intention (mantra)

Ask:
"What's the mantra for next week? (broad direction, not a task)"

- If task-like, ask for a mantra rewrite
- Infer `domain`
- Write to `daily_signals.csv`:
  - `signal=weekly_intention`
  - `value=<domain>`
  - `context=<mantra text>`
  - `category=<domain>`

Allow skip: if user says `skip`, leave weekly intention unchanged.

### Step 4: Write

- Weekly reflection to `reflections.csv`
- Weekly intention row to `daily_signals.csv` (if provided in Step 3.5)
- Review stale todos: "These have been open 7+ days -- keep, kill, or defer?" (ask user)
- Write `checkin_weekly=1`

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

Insights:
  3 active -- midweek consistency, evening routine, deep work scheduling
  1 dormant -- morning workout timing (resolved itself)
  1 resolved -- meal prep system (working well now)

Plan completion: 74% of scheduled blocks done
Check-ins: 26/28 daily, 4/4 weekly
```

Key formatting rules for the monthly summary:
- Show trend arrows (↑ ↓ ━) compared to last month
- Percentages are fine at monthly scale -- they tell a meaningful story
- Call out the narrative on addiction (clean/not, any close calls)
- Weight gets its own section with trajectory check
- Insights show lifecycle status

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
- Addiction signals: non-skippable. Re-prompt if user tries to skip.
- All other questions: accept "skip" or "pass".
- Never invent answers. Only write what the user says.
- No cheerleading. Direct tone. One observation is fine, a pep talk is not.
- Daily check-in is always re-enterable. Show current state and offer to fill gaps -- never say "already done."
- Weekly/monthly: if flag exists for current period, note it and ask if they want to redo.
- All writes are append-only.
- Keep daily check-in under 2 minutes of user time.
- Name patterns, not just numbers. "Dropped off midweek" beats "Wed: 0, Thu: 0".
- When everything in a category is done, collapse it. Don't waste the user's time reading green checkmarks.
