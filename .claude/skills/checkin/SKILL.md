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

1. Read `daily_signals.csv` for completion flags
2. Present status and let the user choose:

```
Hey -- here's where your check-ins stand:

  Daily     not done yet today (5 day streak this week)
  Weekly    due by Sunday (last done: Feb 23 -- 11 days ago)
  Monthly   done for March (completed Mar 1)

The weekly is overdue. Want to start there, or knock out the daily first?
```

3. Wait for user to choose. Do NOT auto-run anything.
4. If only one is pending, suggest it but still confirm: "Daily is the only one due. Jump in?"

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
- `~/Documents/2026/tracker/data/insights.csv`

---

## Daily Check-in

### Time Windows

- **Morning** (`before 12:00 PM`): yesterday backfill + today setup
- **Afternoon** (`12:00 PM or later`): yesterday backfill if missing + today progress + today adjustment

### Phase 0: State Scan

Read signals for yesterday and today. Present as a friendly briefing, not a data dump.

**Morning example:**

```
Good morning. It's Thursday, Mar 6.

Yesterday (Wed):
  ✓ Gym              ✓ Sleep           ✓ No weed          ✓ No League
  ✗ Deep work        · Meditate        · Ate clean         · Poker          · Clarity

  3 habits missing from yesterday.

Last night's sleep: not logged yet.
Reflection: none for yesterday.
Plan: 3 blocks scheduled for today.
```

**Afternoon example:**

```
Afternoon -- Thu Mar 6.

Yesterday (Wed):
  All logged. ✓

Today so far:
  ✓ Sleep on time    · Gym              · Deep work
  · Meditate         · Ate clean
  ✓ No weed          ✓ No League        · Poker             · Clarity

  5 habits still open for today.

Reflection: done for yesterday.
Plan: 2 of 3 blocks remaining.
```

Key formatting rules for the state scan:
- Use ✓ for done, ✗ for missed, · for not yet logged
- Show habits in a grid (not a vertical list) to keep it compact
- Name the addiction signals positively ("No weed" not "weed=1")
- End with a count of what's missing and what's next
- If everything in a category is logged, collapse it: "Yesterday: all logged. ✓"

Then say: "Let's fill in the gaps." and proceed.

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

### Phase 4: Yesterday Reflection (if missing)

Check `reflections.csv` for yesterday. If no row exists:

1. "Quick win from yesterday?"
2. "Anything you learned?"
3. "What would you do differently?"

Infer domain from answers. Write one row to `reflections.csv`.

If reflection exists, skip: "Yesterday's reflection is already captured."

### Phase 5: Daily Intention

Ask: "What's your #1 priority today?"

- Accept free text
- Parse into structured output:
  - Infer `domain` from content (e.g., "finish the API migration" -> `career`, "work through feelings about X" -> `mental`, "hit the gym and eat clean" -> `health`)
  - Write to `daily_signals.csv`: `signal=intention`, `value=<domain>`, `context=<their words>`, `category=<domain>`
- Then show today's plan:

**Morning:**
```
Here's your plan for today:
  8:00-9:30    Deep work -- API migration
  11:00-12:00  Gym -- Lift C
  1:00-2:30    Deep work -- review PRs

Anything to adjust, or does this look right?
```

**Afternoon:**
```
Here's what's left today:
  1:00-2:30    Deep work -- review PRs (not started)

How's the rest of the day looking?
```

If no plan exists: "No plan blocks set for today. Want to set 1-3 priorities?"

### Phase 6: Write & Confirm

1. Batch all signal writes to `daily_signals.csv`
2. Write reflection row if captured
3. Write/update plan rows if changed
4. Write completion flag: `checkin_daily=1`
5. Print a friendly confirmation:

```
All set. Here's what I logged:

Yesterday:
  ✓ Deep work (missed)   ✓ Meditate (done)   ✓ Ate clean (done)   ✓ Poker (clean)

Today:
  ✓ Sleep (on time)

Feeling: stressed -- work deadline pressure
Intention: career -- finish API migration
Reflection: career -- shipped auth flow / should timebox better / set timer next time

Daily check-in complete. ✓
```

---

## Weekly Check-in

Run on Sunday or on demand.

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

### Step 4: Write

- Weekly reflection to `reflections.csv`
- Update `insights.csv` if pattern qualifies (per distillation rules in app-intent.md)
- Review stale todos: "These have been open 7+ days -- keep, kill, or defer?" (ask user)
- Write `checkin_weekly=1`

---

## Monthly Check-in

Run on 1st of month or on demand.

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

- Update `insights.csv` lifecycle (active/dormant/resolved)
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
- If check-in already completed (flag exists), show status and ask if they want to redo.
- All writes are append-only.
- Keep daily check-in under 2 minutes of user time.
- Name patterns, not just numbers. "Dropped off midweek" beats "Wed: 0, Thu: 0".
- When everything in a category is done, collapse it. Don't waste the user's time reading green checkmarks.
