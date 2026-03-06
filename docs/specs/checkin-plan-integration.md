# Feature Spec: Check-in → Plan Integration

## Prompt for New Session

Copy everything below this line and paste it as your opening message in a new Claude Code session from the `~/Documents/2026/tracker` directory.

---

## Task

Design and implement the integration between the `/checkin` daily skill and the plan/todo system so that the daily check-in produces artifacts the planner consumes, closing the loop between backward reflection and forward execution.

Read `docs/feature-spec-template.md` before writing any code — your first output should be a feature spec following that template, which I'll approve before implementation begins.

## Problem Statement

The daily check-in skill (`.claude/skills/checkin/skill.md`) captures backward clarity (yesterday's signals, reflection, emotional state) and a forward intention (free-text "#1 priority"), but the intention is logged as a metadata signal in `daily_signals.csv` — it never becomes a concrete plan. The planner (`/plan` route, `data/plan.csv`) and todo backlog (`data/todos.csv`) exist independently. The user must context-switch between check-in and plan to turn intentions into time blocks.

The gap: "I want to do X today" (check-in) doesn't connect to "X is at 9am for 45min" (plan).

## What Exists Today

### Check-in Skill (`.claude/skills/checkin/skill.md`)
- Phase 0: State scan (reads signals, shows habit grid)
- Phase 1: Yesterday backfill (missing signals)
- Phase 2: Today signals (sleep in morning, all in afternoon)
- Phase 3: Emotional check
- Phase 4: Yesterday reflection (if missing)
- Phase 5: Daily intention — asks "#1 priority", writes `signal=intention` to daily_signals.csv, then SHOWS today's plan read-only
- Phase 6: Write & confirm

### Plan Surface
- `/plan` route with multi-zoom calendar (year/month/week/day)
- Day view: habits grid, plan-vs-actual (gym only), timed schedule with done/skip toggles
- `SchedulerModal.tsx`: full-screen drag-drop planner (drag todos → timeline hours)
- `data/plan.csv`: (date, start, end, item, done, notes, domain) — upsert by (date, item)
- `data/todos.csv`: (id, item, done, created, domain) — backlog with checkboxes

### Disconnections
1. Intention is metadata, not a plan entry
2. Check-in can't add/modify plan blocks — it's read-only during Phase 5
3. Todos aren't surfaced during check-in
4. Yesterday's incomplete plan items don't roll over as today's candidates
5. No capacity check (planned hours vs available hours)
6. Plan-vs-actual reconciliation only exists for gym

## Design Direction (from research)

The core principle: **check-in produces artifacts that the planner consumes.** Reflection isn't journaling for its own sake — it generates inputs (rollover tasks, energy assessment, priority signal) that make planning fast and grounded.

### Sunsama-inspired flow for Phase 5 replacement:

```
Current Phase 5:
  "What's your #1 priority?" → log signal → show plan (read-only)

Proposed Phase 5 (Morning Plan):
  1. Surface rollover: "These plan items from yesterday weren't completed: [list]. Keep, defer, or drop?"
  2. Surface stale todos: "These todos are pending: [top 5 by age/domain]. Slot any into today?"
  3. Ask intentions: "Top 1-3 priorities for today?" (keep existing)
  4. Bridge to blocks: For each intention, ask "How long?" → write draft plan.csv entries
  5. Capacity check: "You have X hours planned against ~Y available. Looks [tight/fine]."
  6. Confirm: "Here's your day: [show timeline]. Adjust anything?"
```

### Key patterns from research:
- Rollover as input (yesterday's incomplete → today's candidates)
- Time estimation as forcing function (duration makes commitment concrete)
- Visual capacity check (prevents chronic overcommitment)
- Rhythm defaults (recurring blocks pre-filled, morning planning = adjust template not build from zero)
- Keep it under 5-10 minutes of user time
- Anti-pattern: requiring too many micro-decisions, taking >15 min, starting from zero each day

## Constraints

### From Core Docs (L1-L4 Stack)
- **L3 Intent**: app-intent says "daily startup gives one clear next move without browsing multiple surfaces" — check-in output must feed Hub; no extra context-switching required
- **L2 Context**: layers must stay clean — CSV (L1) / lib+api (L2) / pages (L3). Check-in logic that computes rollover, capacity, etc. belongs in `lib/` or `api/`, not in the skill prompt
- **Flat navigation**: check-in is a skill, not a new route. No `/checkin/...` route trees
- **No new CSV files**: use existing plan.csv, todos.csv, daily_signals.csv
- **Fewer surfaces, more gravity**: this should make Plan more useful, not add another surface

### From Feature Spec Template
- Write the spec first, get approval, then implement
- Success criteria must be YES/NO verifiable
- Include invariants (what must NOT change)
- Include abort conditions
- Verification: build must pass, diff must be clean

### Guardrails
- Check-in is a CLI skill (runs in terminal via Claude Code). It's conversational, not a UI component.
- The skill writes to CSVs via append. Plan entries via the existing API or direct CSV append.
- Don't over-engineer the first iteration. The skill can write plan.csv rows directly — it doesn't need to call the Next.js API.
- Keep the check-in under 2 minutes of user interaction time. The new planning steps should add ~1-2 minutes max.
- Addiction signals remain non-skippable. Planning steps are skippable ("skip" = keep existing plan as-is).

## Acceptance Criteria (Draft — refine in your spec)

1. Running `/checkin` daily in the morning surfaces yesterday's incomplete plan items and asks keep/defer/drop
2. User's stated intentions are written as plan.csv entries with time estimates, not just signal metadata
3. A capacity summary is shown before confirming the day's plan
4. The full check-in (including planning) completes in under 4 minutes of user interaction time
5. `npm run build` passes with no errors

## Files Likely Touched

- `.claude/skills/checkin/skill.md` — Phase 5 redesign (primary change)
- `app/app/lib/csv.ts` — may need helper to read incomplete plan items for a date
- No new files unless absolutely necessary

## What NOT to Do

- Don't build a UI for this. The check-in is a CLI conversation skill.
- Don't create a new CSV file.
- Don't add a new route.
- Don't refactor the existing plan page or SchedulerModal.
- Don't change the Phase 0-4 flow (it works well).
- Don't add config values to config.ts for planning defaults — keep it in the skill prompt.
