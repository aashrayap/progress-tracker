---
name: plan
description: Fast plan mutations: add/done/move blocks, show day, sketch week
---

# Plan

Fast, non-interactive plan editing. One action per invocation — no full checkin flow.

## Date & Day-of-Week

Run `date '+%Y-%m-%d %A'` at the start to get the actual date and weekday.

## Canonical Files

- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/daily_signals.csv`

## CSV Schemas

**plan.csv**: `date,start,end,item,done,notes,domain`
**daily_signals.csv**: `date,signal,value,unit,context,source,capture_id,category`

## Supported Commands

### `/plan` (bare) — show today + context

1. Read today's `plan.csv` rows, format as time-sorted block list
2. Read current week's `weekly_goal` signals from `daily_signals.csv` (find latest week start with `weekly_goal` entries)
3. Read latest `weekly_intention` and today's `daily_intention` (signal=intention) from `daily_signals.csv`
4. Present:
   ```
   ┌─ Today's Plan ─────────────────────────────┐
   │ 9:00-10:00  Deep work              · open  │
   │ 10:00-11:00 Gym                    ✓ done  │
   │ 14:00-15:30 Code review            · open  │
   └─────────────────────────────────────────────┘
   Weekly goals: 4 gym sessions, ship auth refactor
   Intention: reclaim the midweek
   ```
4a. If no daily intention is set for today (signal=intention not found for today's date):
    - Read latest `weekly_intention` from `daily_signals.csv`
    - Prompt: "No daily intention set. This week: *{weekly_intention}*. Want to set one? (or skip)"
    - If weekly_intention is null: "No daily intention set. Want to set one? (or skip)"
    - If user provides a mantra: write to daily_signals.csv (signal=intention, value=domain, context=mantra, category=domain)
    - If user says skip: continue to step 5
5. Ask: "What do you want to do?" and wait for user input.

### `/plan add <item> <time>` — write plan block

- Parse item and time. Accept formats: `3pm`, `15:00`, `3-4pm`, `3pm for 1h`
- Convert to decimal hours for start/end (e.g., 9:30am = 9.5)
- Default block duration: 1 hour if no end time given
- All-day items (no time given): use start=0, end=0
- Append to `plan.csv`: `date=today, start=X, end=Y, item=<item>, done="", notes="", domain=""`
- Confirm: "Added: [item] at [time]"

### `/plan done <item>` — mark block done + signal if applicable

1. Read today's `plan.csv`, find matching block (case-insensitive substring match on item)
2. If no match found, tell user and exit
3. Mark `done="1"` via upsert (read file, find matching row, update done field, write back)
4. **Signal mapping** (keyword map — matches `router.ts` logic):
   - `gym` → write `gym=1` to daily_signals.csv
   - `sleep` → write `sleep=1`
   - `meditate` → write `meditate=1`
   - `deep work` → write `deep_work=1`
   - Match is case-insensitive substring of the plan item against these keywords
5. If item does NOT match any keyword → ask: "Does this correspond to a trackable signal? (gym/sleep/meditate/deep_work/ate_clean/weed/lol/poker/clarity, or skip)"
   - If user names a signal, write it
   - If skip, no signal written
6. Confirm: "Done: [item]" + "Logged: [signal]=1" if signal written

### `/plan move <item> <new-time>` — update time slot

1. Find matching block in today's `plan.csv` (case-insensitive substring)
2. Parse new time into decimal start/end
3. Read file, find the matching row, update start/end fields, write back
4. Confirm: "Moved: [item] → [new-time]"

### `/plan show` — alias for bare `/plan`

Same behavior as `/plan` with no arguments.

### `/plan intention [text]` — set today's daily intention

**With argument** (`/plan intention "bounce back clean"`):
1. Use the quoted text as the mantra.
2. Infer `domain` from the mantra.
3. Write to `daily_signals.csv`:
   - `signal=intention`
   - `value=<domain>`
   - `context=<mantra text>`
   - `category=<domain>`
4. Confirm: "Intention set: *{mantra}*"

**Without argument** (`/plan intention`):
1. Read today's `intention` signal from `daily_signals.csv`.
2. If already set: show it and ask "Want to change it?"
3. If not set:
   a. Read latest `weekly_intention` from `daily_signals.csv`.
   b. If weekly exists: "This week: *{mantra}*. What's today's intention?"
   c. If no weekly: "What's today's intention in mantra form?"
4. Accept mantra, infer domain, write to `daily_signals.csv` (same fields as above).
5. Allow skip: if user says `skip`, exit without writing.

### `/plan week` — sketch the week

1. Read current week's `weekly_goal` signals
2. Show: "Weekly goals: [goals]. What does this week look like?"
3. Accept multi-day input like "gym MWF 9am, deep work daily 10-12"
4. Parse into individual `plan.csv` rows for each specified day:
   - `M` = Monday, `T` = Tuesday, `W` = Wednesday, `R` = Thursday, `F` = Friday, `S` = Saturday, `U` = Sunday
   - `daily` = all 7 days, `weekdays` = Mon-Fri
5. Append all rows to `plan.csv`
6. Confirm: "Planned [N] blocks across [days]"

## Rules

- All time parsing produces decimal hours (9:30am = 9.5, 2:15pm = 14.25)
- Default block duration: 1 hour if no end time given
- All-day items: start=0, end=0
- Append-only writes to plan.csv
- Signal writes append to daily_signals.csv (same pattern as /log skill)
- Do not start a full checkin flow — /plan is fast and exits after one action
- Do not modify router.ts or any code files
- Accept natural language time ("morning" = 9am, "afternoon" = 2pm, "evening" = 7pm)
