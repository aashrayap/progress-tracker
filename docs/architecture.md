# Architecture

## System Overview

Four-layer model (see CLAUDE.md > System Vocabulary for full definitions):

| Layer | Name | Contains |
|-------|------|----------|
| L0 | Core Docs | `CLAUDE.md`, `docs/*.md` — defines the system |
| L1 | Core Data | `data/*.csv` — records evidence |
| L2 | Intelligence | `app/app/lib/` + `app/app/api/` — computes meaning |
| L3 | Surfaces | Next.js pages + components — renders for the user |

**Foundation** = L0 + L1. **Backend** = L0–L2. Each layer depends only downward.

Core rule: Surfaces consume read models and trigger actions; semantics are owned by Intelligence. Intelligence reads Foundation. Foundation is self-contained.

## Navigation Protocol
- Keep product information architecture flat: primary surfaces must be top-level routes.
- Do not add secondary route trees for core product areas (for example: `/health/...`, `/plan/...`, `/mind/...`).
- If a surface needs additional depth, use in-page UI state (tabs, sidebars, modals, drawers) instead of new URL routes.
- When consolidating features, merge into an existing top-level route or replace with a new top-level route.

## Canonical Data Layer
- `data/inbox.csv`: append-only raw capture audit
- `data/daily_signals.csv`: daily facts and habits
- `data/workouts.csv`: set-level training logs
- `data/reflections.csv`: win/lesson/change memory
- `data/plan.csv`: time blocks
- `data/todos.csv`: action backlog

## App Layer
`app/` contains the Next.js app.

Current top-level routes:
- `/vision` Vision
- `/` Hub
- `/plan` Plan
- `/health` Health
- `/mind` Mind
- `/resources` Resources


## Write Router

`app/app/lib/router.ts` — single `writeAndSideEffect()` function that writes to the primary CSV and fires deterministic side effects.

```
writeAndSideEffect(type, data, date?)
  │
  ├─ Primary write (csv.ts)
  │
  └─ Side effects (hardcoded rules, one level deep):
       workout rows → ensure gym=1 in daily_signals
       gym=1        → mark plan item matching "Gym" done
       sleep=1      → mark plan item matching "Sleep" done
       meditate=1   → mark plan item matching "Meditate" done
       deep_work=1  → mark plan item matching "Deep work" done
```

Side effects call csv.ts directly — they never re-enter the router.

Current consumers:
- `POST /api/daily-signals` — signals route through router for plan auto-complete
- `scripts/reconcile.js` — post-checkin bridge using same keyword map

## What Is Working
- Single canonical data model based on CSV files
- End-to-end capture path from phone to structured logs
- Hub-driven daily decision payload
- Calendar/todo execution loop
- Reflection capture and lesson surfacing

## Feature Specs
Specs live in `docs/specs/`. Status: `draft` | `in-progress` | `shipped` | `archived`. Template: `docs/feature-spec-template.md`.

## Voice + Text Intake Pipeline
Both iOS shortcuts (voice and text) flow through one processor:
1. Shortcut creates GitHub issue (`Voice ...`)
2. `scripts/voice-inbox.sh` polls open issues
3. Claude prompt (`.claude/prompts/voice-inbox.md`) classifies/routes input
4. CSVs are updated
5. Commit + push, issue comment, issue close

## API Surface (Current)
- `/api/hub`
- `/api/daily-signals`
- `/api/health`
- `/api/mind`
- `/api/reflections`
- `/api/plan`
- `/api/plan/range`
- `/api/todos`
- `/api/groceries`
- `/api/resources`
- `/api/quotes`
- `/api/hub/briefing-feedback`
- `/api/vision`

## Known Constraints
- CSV writes use atomic temp+rename but no cross-process file locks
- Shared writer lock (`/tmp/tracker-csv-writer.lock.d`) coordinates CSV-writing daemons
- Some historical labels are still normalized for backward compatibility
- Single-user local-first model (no auth boundary)
