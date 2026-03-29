# Research: Unified Cadence System

## Flagged Items
- Q1: plan API accepts start/end=0 but writing `null` would serialize as `"null"` string → parsed to 0 on read (fragile edge)
- Q10: PlanCard (vision page) does NOT handle all-day events — renders 0,0 as "12:00am–12:00am" and always puts them in pastBlocks. DayView DOES handle them. These two surfaces treat the same data differently.
- Q6: Checkin has morning/afternoon split but NO evening window — afternoon covers noon onward. No evening-specific flow exists.

## Findings

### Q1: Plan API validation on start/end
- **Answer**: POST checks `start !== undefined && end !== undefined` only. Zero, empty string, and any non-undefined value pass. `upsertPlanEntry` serializes directly. `readPlan` uses `parseFloat(...) || 0`, so empty/null → 0 on read.
- **Confidence**: high
- **Evidence**: `app/app/api/plan/route.ts:7-8`, `app/app/lib/csv.ts:339-347` (writePlan), `csv.ts:322` (parseFloat fallback)
- **Conflicts**: none
- **Open**: null would pass the check and write as `"null"` string → 0 on read. Fragile but works.

### Q2: DayView all-day event handling
- **Answer**: Explicit partition: `timedEvents` = entries where NOT (start=0 AND end=0), `allDayEvents` = start=0 AND end=0. All-day renders in a purple "All Day" section with no time label. Timed renders via PlanBlock with time. No distinction between intentional all-day and corrupt/missing data.
- **Confidence**: high
- **Evidence**: `DayView.tsx:45-46` (partition), `DayView.tsx:139-159` (all-day render), `DayView.tsx:214-257` (timed render)
- **Conflicts**: The 0,0 convention is implicit and undocumented.
- **Open**: none

### Q3: Checkin "plan today" write behavior
- **Answer**: Times are required for `keep` (rollover). Deferred items can write timeless (0,0) rows. Ritual suggestions always include proposed times. The skill does not specify what happens if user refuses to give a time on `keep`.
- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:376-386` (defer/keep paths), `SKILL.md:432-443` (ritual suggestions)
- **Conflicts**: none
- **Open**: Behavior when user says `keep` but won't give a time.

### Q4: SchedulerModal population
- **Answer**: Receives `initialPlan` and `initialTodos` as props. Does NOT fetch from plan.csv. DayView maps `dayEvents` to PlanItem shape and fetches todos on demand before opening modal.
- **Confidence**: high
- **Evidence**: `SchedulerModal.tsx:34-36`, `DayView.tsx:92-99`, `DayView.tsx:262-274`
- **Conflicts**: none
- **Open**: none

### Q5: Checkin daily completion signals
- **Answer**: Writes `checkin_daily=1` once per day on completion. Also writes: `sleep` (before menu), `intention` (if not set), habit signals (Option 1), `feeling`/`mind` (Option 2). One flag per day max.
- **Confidence**: high
- **Evidence**: `SKILL.md:55-62` (flags table), `SKILL.md:160-161` (completion), `SKILL.md:43-46` (no duplicate), `SKILL.md:116-120` (sleep), `SKILL.md:132-136` (intention), `SKILL.md:254-258` (mind signal)
- **Conflicts**: none
- **Open**: none

### Q6: Checkin time-of-day detection
- **Answer**: Has morning (<12pm) and afternoon (>=12pm) windows. Morning skips habit questions (not knowable yet). Afternoon asks about today's missing habits. Ritual block suggestions are morning-only. NO evening window — afternoon covers everything from noon onward.
- **Confidence**: high
- **Evidence**: `SKILL.md:89-92` (time windows), `SKILL.md:217-232` (morning/afternoon behavior), `SKILL.md:414-416` (ritual morning-only)
- **Conflicts**: No evening-specific flow exists despite ritualBlueprint having an evening tab.
- **Open**: How time detection is mechanically performed (date command? system clock?).

### Q7: Relationship skill CBT flow
- **Answer**: 8-step flow: (1) Trigger, (2) Thought, (3) Feeling, (4) State Check (energy/sobriety/time/context), (5) Distortion ID (7 categories), (6) Evidence for/against, (7) Reframe, (8) Write. Writes to `data/relationship.md` (append-only) and `daily_signals.csv` (`signal=mind, category=relationships`).
- **Confidence**: high
- **Evidence**: `relationship/SKILL.md:53-118` (full flow), `SKILL.md:104-118` (write format), `SKILL.md:120-124` (signal write)
- **Conflicts**: none
- **Open**: No initialization logic for `data/relationship.md` if it doesn't exist.

### Q8: /plan week write behavior
- **Answer**: Writes one row per block per day — multiple rows with times. Parses multi-day shorthand ("gym MWF 9am, deep work daily 10-12") into individual plan.csv rows. Always includes decimal-hour times.
- **Confidence**: high
- **Evidence**: `plan/SKILL.md:96-106` (week section), `SKILL.md:100-104` (day abbreviations), `SKILL.md:107-108` (decimal hours rule)
- **Conflicts**: none
- **Open**: Behavior when no weekly goals exist.

### Q9: Vision page ritual tab auto-selection
- **Answer**: Pure hour-based on mount: `< 12` → morning, `12-16` → midday, `≥ 17` → evening. No other signals used (no hub nowWindow, no stored state).
- **Confidence**: high
- **Evidence**: `vision/page.tsx:172-177`
- **Conflicts**: DayView uses same thresholds in `getRitualPhase()` (consistent).
- **Open**: none

### Q10: PlanCard on vision page — what it shows
- **Answer**: Shows ALL entries including 0,0 (all-day) — but does NOT have all-day handling. Every entry renders via PlanBlock with time labels. 0,0 entries show as "12:00am–12:00am" and always fall into pastBlocks (since 0 <= currentHour).
- **Confidence**: high
- **Evidence**: `PlanCard.tsx:23,46-48` (sort/split), `PlanCard.tsx:62-88` (render), `PlanBlock.tsx:35` (always renders time)
- **Conflicts**: DayView handles all-day events separately; PlanCard does not. Same data, different treatment.
- **Open**: none

### Q11: precompute-checkin.js behavior
- **Answer**: Reads 5 CSVs (daily_signals, plan, todos, reflections, inbox). Outputs JSON with `display` (two ASCII table cards: yesterday/today habits + "On Your Plate" summary) and `digest` (7-day mood arc, habit misses, streak breaks, stale todos, weekly goals/intention, daily intention, rollover items with `[rolled:N]` parse, recent reflections, last workout). Rollover detection uses notes field regex `[rolled:(\d+)]`.
- **Confidence**: high
- **Evidence**: `scripts/precompute-checkin.js:1-6,51-55,76-206,210-303,319-436,440-462`
- **Conflicts**: none
- **Open**: How the skill consumes `digest` vs `display` is specified in the skill, not this script.

### Q12: Checkin rollover logic
- **Answer**: Driven by `digest.rollover_items`. Each item presented one by one. Depth check: if `[rolled:N]` where N>=2, forced to drop/todo/force-keep. If N<2 or no tag: keep/defer/drop/skip. Keep requires a time, writes `[rolled:N+1]`. Defer writes 0,0 placeholder on target date. Drop writes nothing. Skip stops rollover entirely.
- **Confidence**: high
- **Evidence**: `SKILL.md:361-389` (full rollover), `SKILL.md:363-372` (depth check), `SKILL.md:374-388` (per-choice writes)
- **Conflicts**: none
- **Open**: How precompute determines "incomplete" (done="" vs done=0).

### Q13: Core docs on plan.csv, cadence, read-only
- **Answer**:
  - **plan.csv**: Schema is `date,start,end,item,done,notes,domain`. No write constraints documented for start/end format. Domain optional.
  - **Cadence contract** (locked 2026-03-20): Daily writes daily_signals/plan/reflections only — NO vision.json. Weekly writes domains[].actual + habits + intentions.weekly. Monthly writes identityScript + antiVision + intentions. Quarterly = full PUT.
  - **Read-only**: Vision page explicitly marked read-only (decision 2026-03-18). Content authored via skills only. Surface Interaction Map: Vision = morning read + evening review, Plan = midday interactive execution.
- **Confidence**: high
- **Evidence**: `data-schemas.md:54-57`, `app-intent.md:65-76,140,44-51`, `architecture.md:77-87,16`
- **Conflicts**: none
- **Open**: start/end format constraints not documented in any core doc.

### Q14: Skill menu patterns
- **Answer**: Two patterns: (1) numbered list with live counts (checkin daily menu), (2) box-frame status table (checkin auto-detection). No formally codified standard. Single-purpose skills skip menus entirely.
- **Confidence**: high
- **Evidence**: `checkin/SKILL.md:145-153,157` (numbered menu), `SKILL.md:27-34` (box-frame), `/log`, `/plan` (no menus)
- **Conflicts**: none
- **Open**: No documented standard for new skills.

### Q15: Skill delegation patterns
- **Answer**: No programmatic skill-to-skill invocation exists. Skills share logic through shared precompute scripts (`precompute-checkin.js`, `precompute-weekly.js`, `precompute-plan.js`, `reconcile.js`). Cross-skill references are user redirects ("use /checkin weekly") or agent instructions ("Run /remove-slop"), not API calls.
- **Confidence**: high
- **Evidence**: `checkin/SKILL.md:96,466`, `weekly-review/SKILL.md:14`, `plan/SKILL.md:28,54`, `feature-interview/SKILL.md:364,432`
- **Conflicts**: none
- **Open**: Whether a formal delegation pattern should be introduced.

## Patterns Found
- **Numbered menu with counts**: `1. [action] (N open)` — checkin daily only, 1 full implementation
- **Box-frame status**: `┌─┐│└─┘` for status snapshots — checkin + relationship, 2 skills
- **Shared precompute scripts**: 3 scripts (`precompute-checkin.js`, `precompute-weekly.js`, `precompute-plan.js`) shared across checkin, weekly-review, plan skills
- **Cross-skill user-redirect**: `/weekly-review` → "use `/checkin weekly`" — 1 occurrence
- **All-day as 0,0**: plan.csv entries with start=0,end=0 treated as all-day/timeless — DayView handles, PlanCard does not
- **Inline command dispatch**: `/plan add`, `/log weight` — command parsing, no interactive menu — 5+ skills

## Core Docs Summary
- **Planning**: plan.csv = `date,start,end,item,done,notes,domain`. Side effects auto-mark done via keyword match. `/plan` is midday execution surface.
- **Cadence Contract** (locked): Daily → signals/plan/reflections only, NO vision.json. Weekly → A+H+intentions.weekly. Monthly → identityScript+antiVision+intentions. Quarterly → full rebuild.
- **Vision Page**: Read-only by locked decision (2026-03-18). Morning direction + evening review. Content via skills only.
- **Surface Routing**: Vision = daily ritual (read-only), Plan = execution (interactive), Health = on-demand, Resources = passive.
- **Architecture Rule**: Surfaces consume Intelligence; they don't define semantics.

## Open Questions
- Q1: null → "null" string edge case in plan API (fragile but functional)
- Q3: Behavior when user says `keep` but refuses to give a time
- Q6: No evening window in checkin despite evening ritual existing
- Q10: PlanCard doesn't handle all-day events — would need fixing for draft blocks
- Q12: How precompute determines "incomplete" plan items
