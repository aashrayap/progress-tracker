# Personal OS

Single source of truth for product principles, architecture framing, and build plan.

Canonical runtime model: `inbox.csv + daily_signals.csv + plan.csv + todos.csv + reflections.csv + workouts.csv + ideas.csv`.

## Core Problem

The system captures life data well, but does not yet consistently convert that data into better next decisions.

- Data entry is strong; behavioral guidance is inconsistent.
- The repo still behaves like separate trackers, not one compounding operating system.

## North Star Loop

```
Capture -> Interpret -> Decide -> Execute -> Reflect -> Adapt
```

If any handoff is weak, compounding breaks.

## Product Principles

1. Decision-first, not dashboard-first
2. One truth model per concept
3. Reflection drives planning
4. Structure over prose drift
5. Time-contextual interface
6. Compounding memory
7. Low-friction capture, high-quality synthesis
8. Graceful under failure

## Definition of Done (feature gate)

A feature ships only if it:

1. Strengthens at least one loop stage
2. Uses canonical schema/domain meaning
3. Appears at the moment a user can act
4. Compounds with repeated usage
5. Works on bad days (misses/relapse/low energy)

## Visual System Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PERSONAL OS LOOP                           │
├───────────┬──────────────┬───────────┬───────────┬───────────┬─────┤
│  Capture  │  Interpret   │  Decide   │  Execute  │  Reflect  │Adapt│
└─────┬─────┴──────┬───────┴────┬──────┴─────┬─────┴─────┬─────┴──┬──┘
      │            │            │            │           │        │
      ▼            ▼            ▼            ▼           ▼        ▼
  inbox+signals API/domain    Hub/Pages   plan/todos   reflections next-day
  voice/manual  logic         prompts     workouts      win/lesson behavior
```

## Operator View

```
Morning (prime): yesterday change + top risk + one key action
Day (execute):   current plan block + habits + quick capture
Evening (close): reflection (win/lesson/change) + carry-forward
```

Command-center questions:

1. What matters now?
2. What pattern is forming?
3. What one action changes trajectory today?

## Current-State Audit (snapshot)

### Data contracts

```
inbox.csv         capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
daily_signals.csv date,signal,value,unit,context,source,capture_id,category
ideas.csv         id,created_at,title,details,domain,status,source,capture_id
reflections.csv   date,domain,win,lesson,change
plan.csv          date,start,end,item,done,notes
todos.csv         id,item,done,created
workouts.csv      date,workout,exercise,set,weight,reps,notes
```

### Structural breaks

1. Reflection is not central in the daily decision loop
2. Key semantics (topic/category/context) are trapped in free text
3. Domain logic is fragmented across overlapping API routes
4. Execute loop is weakly closed in UI (limited completion flow)
5. Capture review routing still needs higher precision on ambiguous voice notes

## Target Operating Model

Each input should produce:

1. Event row (capture)
2. State update (interpret)
3. Time-appropriate action prompt (decide)

### Normalized semantics

- Keep CSVs minimal
- Keep `signal` as top-level event type
- Add `category` for machine-readable subtypes
- Keep `context` for human context

Target `daily_signals.csv` shape:

```
date,signal,value,unit,context,source,capture_id,category
```

## Build Roadmap

### Phase 0 - Safety Rails

1. Consolidate shared domain helpers in `app/app/lib/csv.ts`
2. Centralize types in `app/app/lib/types.ts`
3. Remove duplicate helper contracts

### Phase 1 - Data Normalization

1. Lock canonical schemas (`inbox`, `daily_signals`, `ideas`, `workouts`, `reflections`, `plan`, `todos`)
2. Validate CSV read/write paths against canonical headers only
3. Remove compatibility wrappers once no callers remain

### Phase 2 - API Consolidation

1. Add canonical routes:
   - `/api/hub`
   - `/api/daily-signals`
   - `/api/inbox`
   - `/api/ideas`
   - `/api/reflections`
   - `/api/deep-work`
2. Keep `/api/hub` focused on decision payload (no write side effects)

### Phase 3 - UI Flow Rewrite

1. Hub becomes time-aware decision surface
2. Keep reflection UI analysis-first (`/reflect`)
3. Improve planner completion actions
4. Tighten health and review tab workflows

### Phase 4 - Domain Enrichment

1. Deep work categories + analytics
2. Meal categories + context
3. Trigger category analysis in risk view

### Phase 5 - Voice + Skills Alignment

1. Update voice parser and skills to write/read `category`
2. Enforce inbox-first routing and deterministic destination rules

## Success Metrics

1. Reflection recall rate (morning carry-forward)
2. Structured capture rate (% rows with non-empty `category`)
3. Decision latency (time to one clear next action)
4. Loop closure rate (execute + reflect same day)
5. Bad-day resilience (useful next-day prompts after misses/relapse)

## Launch Waves

```
Wave A: Phase 0 + 1
Wave B: Phase 2 + hub migration
Wave C: Phase 3 route/UI rewrite
Wave D: Phase 4 enrichments
Wave E: Phase 5 voice/skills + cleanup
```

No wave starts until prior contracts are stable.

## Implementation Status

Completed now:

- Canonical CSV layer in place (`inbox`, `daily_signals`, `ideas`, `workouts`, `reflections`, `plan`, `todos`)
- Canonical gym rotation helper in shared data layer
- New APIs: `/api/hub`, `/api/daily-signals`, `/api/inbox`, `/api/ideas`, `/api/reflections`, `/api/deep-work`
- Hub migrated to `/api/hub` with morning priming and evening reflection capture
- Reflection surface on `/reflect` (analysis-first)
- Day view supports quick schedule completion and skip actions
- Health now surfaces meal entries and latest gym reflection
