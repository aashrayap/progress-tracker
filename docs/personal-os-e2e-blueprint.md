# Personal OS E2E Audit and Build Blueprint

This is the implementation plan for aligning data + UI flows with the Personal OS principles.

## 1) Current-state audit

## Data contracts (today)

```
CSV                    Schema
------------------------------------------------------------
log.csv                date,metric,value,notes
reflections.csv        date,domain,win,lesson,change
plan.csv               date,start,end,item,done,notes
todos.csv              id,item,done,created
workouts.csv           date,workout,exercise,set,weight,reps,notes
```

## API map (today)

```
/api/log        GET+POST  -> hub status, dopamine grid, weight, plan, todos
/api/insight    GET       -> derived insight/pattern logic
/api/health     GET       -> weight, workout, exercise history, ate_clean history
/api/work       GET+POST  -> reflections summary + reflection write
/api/plan       POST+DELETE
/api/plan/range GET
/api/todos      GET+POST+PUT+DELETE
```

## UI map (today)

```
/         Hub      -> /api/log + /api/insight
/plan     Planner  -> /api/plan/range + /api/plan + /api/todos
/work     Reflect  -> /api/work (read only in UI)
/health   Health   -> /api/health + mark gym done via /api/log POST
```

## What is working

- CSV-first architecture and voice pipeline are strong and low-friction.
- Reflection schema (`win/lesson/change`) is structurally good.
- Plan/todo workflows are functional and fast.
- Insight route contains meaningful behavior logic (cascades/correlations).

## Structural breaks (core)

1. Reflection is not in the main decision loop
   - Reflection data is mostly isolated on `/work`; Hub does not center it.

2. Meaning drift from free text
   - Deep work topics, meal categories, trigger types are largely trapped in `notes`.

3. Duplicate/fragmented domain logic
   - Similar metrics are interpreted in multiple routes with separate logic.

4. Execution loop missing closure points
   - Daily plan items have `done` state, but there is little UI to complete tasks inline.

5. Naming and IA mismatch
   - `/work` now acts as reflections dashboard; route label and mental model are stale.

## 2) Target operating model

## Unified loop contract

Each domain event should become:

1. Event row (capture)
2. Domain state update (interpret)
3. Action prompt at decision time (decide)

## Domain-normalized semantics

Keep CSV minimal, but make key dimensions machine-readable:

- `metric` remains top-level event type
- add `category` for sub-type (deep work type, meal slot/type, trigger class, workout day)
- `notes` remains human context

Proposed `log.csv` contract:

```
date,metric,value,notes,category
```

Notes:
- Backward-compatible reader: `category` optional for old rows.
- Do not add new CSV files unless necessary; keep compounding in one canonical log stream.

## 3) UX target by time-of-day

## Morning (prime)

- Yesterday's `change` commitments (from reflections)
- Today's top risk signal (trigger pattern / cascade risk)
- One suggested action to reduce downside

## Daytime (execute)

- Current plan block + completion actions
- Habit execution panel
- Fast capture entry points (manual + voice confidence)

## Evening (close loop)

- Compact reflection capture for active domains
- Today's scorecard (done/missed with context)
- Carry-forward of tomorrow's change commitments

## 4) Implementation roadmap

## Phase 0 - Safety rails (short)

1. Add shared domain mappers in `app/app/lib/csv.ts`
2. Centralize types in `app/app/lib/types.ts`
3. Remove dead/duplicate helpers (single `getNextWorkout` contract)

## Phase 1 - Data normalization (foundation)

1. Extend `LogEntry` with optional `category`
2. Update CSV read/write to support 4 or 5 columns
3. Migrate header to `date,metric,value,notes,category`
4. Keep legacy rows readable without rewrite

## Phase 2 - API consolidation

1. Introduce canonical domain endpoints:
   - `/api/hub` (status + insight + morning/evening payload)
   - `/api/reflections` (GET+POST, explicit contract)
   - `/api/deep-work` (sessions + category analytics)
2. Reduce overlap:
   - Fold `/api/insight` into `/api/hub`
   - deprecate `/api/work` after consumer migration

## Phase 3 - UI flow rewrite

1. Hub (`/`) becomes time-aware decision surface
2. Rename `/work` -> `/reflect` and align nav copy
3. Add inline reflection capture (evening) and morning recall card
4. Add day-level completion actions in planner (close execute loop)

## Phase 4 - Domain enrichments

1. Deep work categories and weekly breakdowns
2. Meal categories (slot + meal type) and clean-eating context
3. Trigger category analysis surfaced in risk panel

## Phase 5 - Voice and skill contract alignment

1. Update `.claude/prompts/voice-inbox.md` to write `category`
2. Update `/log`, `/reflect`, `/review-notes` skills for same semantics
3. Keep outputs backward-compatible during migration window

## 5) File-level worklist

## Core data layer

- `app/app/lib/types.ts`
- `app/app/lib/csv.ts`
- `log.csv` (header migration)

## APIs

- `app/app/api/log/route.ts` (migrate or replace by `/api/hub`)
- `app/app/api/insight/route.ts` (merge)
- `app/app/api/work/route.ts` (split/deprecate)
- `app/app/api/health/route.ts` (meal + reflection hooks)
- `app/app/api/*` new canonical routes

## UI

- `app/app/page.tsx` (hub reframe)
- `app/app/work/page.tsx` (rename and re-scope)
- `app/app/health/page.tsx`
- `app/app/plan/page.tsx` + `app/app/components/DayView.tsx`
- `app/app/components/BottomNav.tsx`

## Voice/skills

- `scripts/voice-inbox.sh`
- `.claude/prompts/voice-inbox.md`
- `.claude/skills/log/SKILL.md`
- `.claude/skills/reflect/SKILL.md`
- `.claude/skills/review-notes/SKILL.md`

## 6) Success metrics (must verify)

1. Reflection recall rate
   - % mornings where yesterday change is surfaced on Hub

2. Structured capture rate
   - % deep_work / food / trigger rows with non-empty `category`

3. Decision latency
   - Time from opening app to identifying one next action

4. Loop closure rate
   - % days with both execution signal and reflection signal

5. Bad-day resilience
   - Relapse/missed-habit days still produce next-day action prompts

## 7) Launch sequence recommendation

```
Wave A (1-2 days): Phase 0 + Phase 1
Wave B (2-3 days): Phase 2 + Hub migration
Wave C (2-3 days): Phase 3 UI rewrite + route rename
Wave D (1-2 days): Phase 4 enrichments
Wave E (1 day):    Phase 5 voice/skills + docs cleanup
```

Rule: no wave starts until contracts for prior wave are stable.
