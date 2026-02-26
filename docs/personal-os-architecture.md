# Personal OS Architecture (Visual)

This document maps the current system as a decision loop, not just a set of pages.

## 1) System at a glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PERSONAL OS LOOP                           │
├───────────┬──────────────┬───────────┬───────────┬───────────┬─────┤
│  Capture  │  Interpret   │  Decide   │  Execute  │  Reflect  │Adapt│
└─────┬─────┴──────┬───────┴────┬──────┴─────┬─────┴─────┬─────┴──┬──┘
      │            │            │            │           │        │
      ▼            ▼            ▼            ▼           ▼        ▼
  log.csv      API routes     Hub/Pages    plan.csv   reflections.csv
  workouts.csv insights       prompts      todos.csv  pattern signals
  voice issues
```

Core risk today: the loop exists, but handoffs between stages are inconsistent.

## 2) Data layer (single source of truth)

```
┌───────────────────────────────────────────────────────┐
│ CSV TRUTH LAYER                                       │
├───────────────────────────────────────────────────────┤
│ log.csv          daily metrics + events + notes       │
│ reflections.csv  win / lesson / change                │
│ plan.csv         time-blocked execution               │
│ todos.csv        backlog                              │
│ workouts.csv     set-level lifting                    │
└───────────────────────────────────────────────────────┘
```

Current semantic split:

```
State-like signals:   weed/lol/poker/gym/sleep/deep_work/ate_clean
Event-like signals:   trigger/relapse/note/deep_work details
Learning signals:     reflections.csv (lesson/change)
```

## 3) Runtime topology (current)

```
                         ┌───────────────────────────────┐
                         │         app/lib/csv.ts        │
                         │   read/write + helper funcs   │
                         └───────────────┬───────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
┌───────────────┐                 ┌───────────────┐                 ┌───────────────┐
│ /api/log      │                 │ /api/insight  │                 │ /api/health   │
│ hub payload   │                 │ pattern logic │                 │ health payload│
└───────┬───────┘                 └───────┬───────┘                 └───────┬───────┘
        │                                 │                                 │
        ▼                                 ▼                                 ▼
   app/page.tsx                    DailyInsight.tsx                    health/page.tsx

                          ┌───────────────┐
                          │ /api/work     │
                          │ reflections   │
                          └───────┬───────┘
                                  ▼
                            work/page.tsx
```

Observation: behavior logic is distributed across multiple routes with overlapping concerns.

## 4) Input pipelines

### A) Manual app flow

```
User action -> UI form/button -> API route -> csv.ts -> CSV append/read -> UI refresh
```

### B) Voice flow

```
iPhone voice
   │
   ▼
GitHub Issue (Voice: ...)
   │
   ▼
scripts/voice-inbox.sh (poll every 5m)
   │
   ▼
.claude/prompts/voice-inbox.md parsing rules
   │
   ▼
CSV append + git commit + push + issue close + ntfy
```

Strength: capture reliability is high.
Risk: interpretation structure depends heavily on prompt quality and consistent schema usage.

## 5) UX surfaces by decision moment

```
Morning   -> prime decisions (what to do differently today)
Daytime   -> execute schedule and habits
Evening   -> close loop with reflection and next-change
```

Current mapping:

- Hub (`app/app/page.tsx`) is strongest on status and pattern display.
- Work/Reflections (`app/app/work/page.tsx`) holds reflection review.
- Health (`app/app/health/page.tsx`) holds gym and weight execution context.
- Plan (`app/app/plan/page.tsx`) holds time-block execution.

Core mismatch: reflection learning is not yet the dominant cross-page driver for next decisions.

## 6) Principle-to-architecture mapping

```
Principle                         Primary Architecture Anchor
--------------------------------------------------------------------------
Decision-first                    Hub modules + timing-aware sections
One truth model                   app/lib/types.ts + app/lib/csv.ts
Reflection drives planning        reflections.csv -> hub/plan prompting
Structure over prose drift        log/reflection schema + parser contracts
Time-contextual interface         page composition by morning/day/evening
Compounding memory                pattern extraction in API/domain layer
Low-friction capture              voice-inbox + minimal manual logging
Graceful under failure            non-judgmental relapse/trigger handling
```

## 7) Architectural success criteria

A feature is architecturally correct when:

1. It improves one explicit loop stage.
2. It does not create a second source of truth for the same concept.
3. It appears at the moment a user can act.
4. It compounds with repeated use.
5. It still works on bad days (missed habits, relapse, low energy).

## 8) Current canonical file map

```
Core context:     CLAUDE.md
Principles:       docs/personal-os-principles.md
Visual architecture: docs/personal-os-architecture.md

Data:
  log.csv
  reflections.csv
  plan.csv
  todos.csv
  workouts.csv

Domain code:
  app/app/lib/csv.ts
  app/app/lib/types.ts

Primary surfaces:
  app/app/page.tsx
  app/app/work/page.tsx
  app/app/health/page.tsx
  app/app/plan/page.tsx

Input automation:
  scripts/voice-inbox.sh
  .claude/prompts/voice-inbox.md
```
