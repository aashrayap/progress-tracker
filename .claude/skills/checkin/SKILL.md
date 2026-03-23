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

After both cards, **ask about sleep before showing the menu**.

#### 2. Sleep (always first, before the menu)

Sleep is today's cornerstone habit — going to bed on time last night sets up today for success. It is ALWAYS logged on today's date and asked FIRST, before the menu appears.

- If today's `sleep` is missing: "Did you sleep on time last night?"
- Write to `daily_signals.csv` with today's date immediately.
- Sleep is NEVER part of yesterday's backfill. If the user mentions sleep while listing yesterday's habits, log it on TODAY's date and clarify if needed.
- Once sleep is answered, proceed to the daily intention check (if needed), then show the menu.

#### 3. Daily Intention (only if not set today)

If `digest.daily_intention` is null (not yet set today):

1. Show weekly context if available: "This week: *{digest.weekly_intention}*"
2. Ask: "What's today's intention in mantra form? (e.g., 'bounce back clean', not 'go to gym')"
3. If the user gives a task-style answer, ask for a concise mantra rewrite.
4. Do NOT auto-copy the weekly intention — weekly guides daily, different granularity.
5. Infer `domain` from the final intention.
6. Write to `daily_signals.csv`:
   - `signal=intention`
   - `value=<domain>`
   - `context=<mantra text>`
   - `category=<domain>`
7. Allow skip: if user says `skip`, move on without writing.

If `digest.daily_intention` is already set, skip this section entirely and go to the menu.

### Menu

After sleep + intention are handled, present all options. No time-of-day gating — user picks freely. Labels are guidance, not auto-detected gates.

```
What do you want to do?

── Morning ──
  1. Log             (8 open today)
  2. Anchor
  3. Today's plan

── Evening ──
  4. Decompress
  5. Reflect on today
  6. Set tomorrow

── Anytime ──
  7. Brain state
```

Rules:
- Show counts from current state where applicable
- Options with nothing to do still appear but show "(done)" or "(0 items)"
- User can pick any option in any order regardless of time of day
- User can pick the same option again (re-enterable)
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

**Today** — ask about today's habits that are missing:

Note: Sleep is handled BEFORE the menu (see Pre-Menu section above). It is NOT part of Option 1.

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

### Option 2: Anchor

A mirror, not therapy. Reads the user's own pre-committed words back at the moment of decision. Target: ~2 minutes.

#### Step 1: NAME IT

Ask: "What's pulling you right now?"

Accept free text. Store the response for use in subsequent steps.

#### Step 2: STATE CHECK

Ask two questions:
- "Energy right now?" (depleted / ok / good)
- "Clarity right now?" (foggy / clear)

If depleted + foggy:
> "You're in a low-reliability state. Decisions made here tend to serve the old identity."

#### Step 3: IDENTITY LENS

Surface from vision.json (read via `cat data/vision.json` — do NOT use API):

1. **Core traits + decision style**: `identityScript.coreTraits` and `identityScript.decisionStyle`
2. **Anti-vision**: `antiVision` (full text)
3. **Matched trigger replacements**: scan `distractions.triggerReplacements` for keyword overlap with the user's "pull" from step 1. Show matches.
4. **Matched destructive habits**: scan `habitAudit.destructive` for keyword overlap with the pull. Show matches.
5. **Relevant recent reflections**: grep `data/reflections.csv` for keyword overlap with the pull (last 30 days). Show up to 3 matches with date and lesson.

Present all surfaced content, then ask:

> "Does the person you're becoming do this? Or does this serve who you used to be?"

Keep it LEAN. Do NOT surface ABT(H) domains, becoming, timeline, or habits arrays.

#### Step 4: DECIDE + LOG

Wait for user's decision statement. Then:

- Classify as: `chose_new` (aligned with identity), `chose_old` (served old patterns), or `chose_middle` (compromise/unclear)
- Confirm classification with user: "I'd call that chose_new — sound right?"

Write to `daily_signals.csv`:
```
date,signal,value,unit,context,source,capture_id,category
<today>,crossroads,<chose_new|chose_old|chose_middle>,,<pull description> → <decision description>,chat,,personal_growth
```

Return to menu.

---

### Option 3: Today's Plan

Surfaces existing drafts, assigns times, adds new blocks, handles rollover. Absorbs former /plan skill quick actions.

#### 3.1 Surface Existing Drafts

Read today's plan entries from `data/plan.csv` where `start=0` and `end=0`.

If drafts exist:
```
Today's drafts (unscheduled):
  1. "Deep work block" — assign time? (e.g., 9-10:30am)
  2. "Gym session" — assign time?
  3. "Weekly team sync" — assign time?

  → assign times, skip, or add more
```

For each draft the user assigns a time:
- Parse time to decimal hours
- Update the row in plan.csv: set start and end to the parsed values
- Confirm: "Scheduled: [item] at [time]"

For drafts the user skips: leave as start=0, end=0.

#### 3.2 Rollover (skippable)

Use `digest.rollover_items` from the precompute output (each has `item` and `roll_count`).

If any exist, present them one by one:

**Rollover depth check:** Before presenting each item, check its `notes` field for a `[rolled:N]` tag.
- If N >= 2: present differently: "This has rolled 2+ times. Drop it, convert to a todo, or force-keep?"
  - `drop`: do not write a new plan row
  - `todo`: write to `todos.csv` (`item=<text>, done=0, created=today, domain=<infer from item>`) and do not write a plan row
  - `force-keep`: treat as regular keep (ask time, write plan row with `[rolled:N+1]` in notes)
- If N < 2 or no tag: present normally: "Keep this today, defer it, or drop it?"

Allowed responses: `keep`, `defer`, `drop`, `skip` (skip = stop rollover and leave remaining items untouched)

For each choice:
- `keep`:
  - Ask: "What time should this happen today?"
  - Accept either a range (`1:00-2:00`) or start + duration (`1pm for 45m`)
  - Write a new `plan.csv` row for today with that time slot
  - Add `[rolled:N+1]` to the notes field (N=0 if no prior tag, increment if exists)
- `defer`:
  - Ask: "What date should this move to?" (allow skip)
  - If date provided, write a `plan.csv` row on that date with a placeholder time (`0,0`) unless user gives a time
  - Add `[rolled:N+1]` to the notes field
- `drop`:
  - Do not write a new plan row

If none are incomplete, say: "No incomplete plan items from yesterday."

#### 3.3 Context-Aware Suggestions (skippable)

Use digest fields from precompute output:
- `digest.stale_todos` — open todos older than 7 days
- `digest.recent_reflections` — last 14 days of reflections
- `digest.habit_misses` and `digest.streak_breaks` — today's gaps and recent broken streaks
- user's emotional context from Option 4 (if completed)
- `digest.weekly_goals` — current week's goals
- `digest.weekly_intention` — current week's mantra

Use LLM reasoning over all of the above (not keyword matching) to propose up to 3 high-relevance candidate actions for today. Consider weekly goals alongside todos, reflections, and signals when proposing actions. If a weekly goal hasn't had blocks scheduled this week, it's a strong candidate.

Merge goal-based and context-based suggestions into one round — do NOT add a separate "goals" prompt.

For each suggestion:
- show a 1-line reason tied to intention/feeling/state with source attribution: "(from weekly goal)", "(from reflection)", or "(from todo)"
- ask: "Add this to today, keep as todo, or skip?"
- if "add to today", ask "what time?" and write to `plan.csv`
- if "keep as todo", leave in `todos.csv`
- if "skip", ignore

Allow global skip: "skip suggestions" keeps everything unchanged.

#### 3.4 Ritual Block Suggestions (morning only, skippable)

If the current time is before 12:00 PM and the user hasn't already planned ritual-aligned blocks:

1. Read `data/vision.json` via `cat` — extract `ritualBlueprint.morning.steps` and `domains[].habits`
2. Cross-reference with today's existing plan blocks
3. Suggest up to 3 time blocks that aren't already scheduled:

```
Ritual-aligned blocks (from your blueprint + habits):

1. "Wim Hof + Identity Review" — 5:45-6:15 AM (morning ritual)
   → skip / add / adjust time

2. "Deep Work Block 1" — 9:00-10:30 AM (wealth habit: 3 deep work blocks)
   → skip / add / adjust time

3. "Midday Reset" — 12:00-12:30 PM (midday ritual: walk + breathwork)
   → skip / add / adjust time
```

Rules:
- Only suggest in morning mode (before 12:00 PM)
- Max 3 suggestions
- Each maps to a ritual step or domain habit — show the source in parentheses
- Accept "skip suggestions" to bypass all
- For each "add": write to `plan.csv` with the suggested or adjusted time
- Infer `domain` from the source (ritual step → `personal_growth`, domain habit → that domain's canonical ID)
- Do NOT suggest blocks that overlap with existing plan items
- Do NOT suggest blocks for habits already logged today (e.g., don't suggest gym block if gym=1 already)

#### 3.5 Quick Actions

After the planning flow, or if user enters a quick command:

- **"add <item> <time>"**: Parse item and time, write plan.csv row. See Inline Commands for full spec.
- **"done <item>"**: Find matching block, mark done=1, check signal map. See Inline Commands for full spec.
- **"move <item> <new-time>"**: Find matching block, update start/end. See Inline Commands for full spec.

#### 3.6 Confirm Plan (skippable)

Show today's plan including:
- existing today's blocks
- kept/deferred items that were scheduled today
- any surfaced actions added in 3.3
- any drafts assigned times in 3.1

Ask: "Anything else to adjust, or lock this in?"
- If user adjusts timing/items, write updates to `plan.csv`.
- If user says `skip`, keep current plan as-is.

Write plan rows immediately.

---

### Option 4: Decompress

Renamed from "Emotional check". Same core flow. New name reflects evening decompression framing.

Ask: "How are you feeling right now? Anything unresolved you're carrying?"

- Accept free text
- If the user shares something substantive, write to `daily_signals.csv`:
  - `signal=feeling`, `value=<1-word summary>`, `context=<their words>`, `category=health`
- If "fine" / "good" / nothing notable, skip -- don't write empty feelings

**Mind capture (opportunistic, not forced):**

If the user shares something substantive (not "fine"/"good"):
1. Follow up conversationally: "Was there a specific trigger?" (only if natural)
2. If trigger shared: "What thought came up?" (only if conversation flows there)
3. If thought shared: "What did you do about it?" (only if natural)

If any trigger was identified, write a single `signal=mind` row to `daily_signals.csv`:
- `value` = trigger keyword (infer from their words, e.g. `work_pressure`, `isolation`)
- `context` = pipe-delimited: `thought: <X> | action: <Y> | circumstance: <Z>` (any subset -- not all fields required)
- `category` = `health` or `personal_growth` (infer from content)
- `source` = `chat`

Do NOT force the deeper questions. If user gives a feeling and moves on, just log the feeling signal. The mind capture is opportunistic -- no "mind" completion flag.

Write immediately after this option completes.

---

### Option 5: Reflect on Today

Captures reflection on TODAY. Intended for evening use but available anytime.

Check `reflections.csv` for today. If no row exists:

1. "Quick win from today?"
2. "Anything you learned?"
3. "What would you do differently?"

Infer domain from answers. Write one row to `reflections.csv` with today's date immediately.

If reflection exists, say: "Today's reflection is already captured." and offer to view it.

---

### Option 6: Set Tomorrow

Writes 2-3 draft blocks for tomorrow's date with start=0, end=0.

#### Flow:

1. Compute tomorrow's date: `date -v+1d '+%Y-%m-%d'`
2. Show tomorrow's existing plan (if any): read plan.csv for tomorrow's date
3. Ask: "What are tomorrow's 2-3 priorities?"
4. Accept natural language list. For each item:
   - Write to plan.csv: `date=<tomorrow>, start=0, end=0, item=<text>, done=, notes=, domain=<inferred>`
   - Do NOT ask for times — these are drafts. Times are assigned in the morning via Option 3.
5. Confirm: "Set [N] priorities for tomorrow."

Rules:
- Max 5 draft blocks per invocation
- If tomorrow already has drafts, show them and ask: "Add to these or replace?"
- If replace: do not delete old rows (append-only). Write new rows. Old 0,0 rows for tomorrow become orphaned drafts — acceptable.
- Infer domain from content (e.g., "gym" → health, "deep work" → career, "call mom" → relationships)

---

### Option 7: Brain State

Delegate to the `brain-state` agent. Do NOT perform this analysis inline — spawn the agent and present its output.

The agent runs `node scripts/compute-brain-state.js`, receives pre-computed JSON (streaks, habit grid, vice load, sleep pattern, dopamine balance), and returns a neuroscience-informed assessment.

No writes. Read-only analysis. Return to menu after presenting.

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
Phase 7    Stale Review         interactive     1 min
                                           ──────────
                                Target:     ~15 min
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

### Step 1: Full ABT(H) Rebuild

For each of the 4 pillars (health, wealth, love, self), walk through:

1. **Becoming** — "Where do you want to be in this pillar?" (vivid, specific, measurable)
2. **Timeline** — "By when?" (specific date)
3. **Actual** — "Where are you right now, honestly?"
4. **Habits** — "What daily actions get you from Actual to Becoming?" (3-5 statements)

Show the current values for each. Accept rewrites or keep.

### Step 2: Ritual Blueprint Overhaul

```
─── RITUAL BLUEPRINT ──────────────────────────────────
  Morning steps (current):
  1. Wake — no devices
  2. Journal
  ...

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
- If no keyword match, ask about trackable signal: "Does this correspond to a trackable signal? (gym/sleep/meditate/deep_work/ate_clean/weed/lol/poker/clarity, or skip)"
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
