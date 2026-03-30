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
- `data/daily_signals.csv`: daily facts and habits
- `data/workouts.csv`: set-level training logs
- `data/reflections.csv`: win/lesson/change memory
- `data/plan.csv`: time blocks
- `data/todos.csv`: action backlog
- `data/groceries.csv`: grocery lists
- `data/quotes.csv`: curated quotes by domain
- `data/resources.csv`: books, articles, resources
- `data/briefing_feedback.csv`: daily briefing feedback
- `data/experiments.csv`: active experiments and verdicts

## App Layer
`app/` contains the Next.js app.

Current top-level routes:
- `/plan` Plan (/plan/day is daily home page, /plan/week|month|year for calendar views)
- `/vision` Vision (weekly+ deep review — identity, anti-vision, ABT(H), habit grid)
- `/` Redirect → `/plan/day`
- `/health` Health
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

## Vision Write Paths

vision.json is updated through the checkin skill at weekly+ cadences. The API supports three methods:

| Method | Purpose | Consumer |
|--------|---------|----------|
| GET | Read full vision.json | /vision page, /plan day view (ritual strip) |
| PUT | Full replace | Manual JSON edits, quarterly rebuild |
| PATCH | Partial field update | Weekly/monthly checkin writes |

### Cadence-Aware Write Routing

The checkin skill determines which vision.json fields to update based on cadence:

| Cadence | Fields written |
|---------|---------------|
| Weekly | `domains[].actual`, `domains[].habits`, `intentions.weekly` |
| Monthly | `identityScript`, `antiVision`, `intentions` |
| Quarterly | All fields (full rebuild) |

Daily checkins do NOT write to vision.json.

Current consumers:
- `POST /api/daily-signals` — signals route through router for plan auto-complete
- `scripts/reconcile.js` — post-checkin bridge using same keyword map

## What Is Working
- Single canonical data model based on CSV files
- Vision-driven daily execution surface
- Calendar/todo execution loop
- Reflection capture and lesson surfacing

## Feature Specs
Specs live in `docs/specs/`. Status: `draft` | `in-progress` | `shipped` | `archived`. Template: `docs/feature-spec-template.md`.

## Phone Intake (iMessage Channel)
Data entry from phone flows through Claude Code iMessage channel:
- Gym sets: text mid-workout → workouts.csv
- Todos: add/list/complete → todos.csv
- Requires persistent Claude Code session with `--channels plugin:imessage`
5. Commit + push, issue comment, issue close

## API Surface (Current)
- `/api/hub` (consumed by /vision page — briefing, habits, plan, experiments)
- `/api/daily-signals`
- `/api/health`
- `/api/plan`
- `/api/plan/range`
- `/api/todos`
- `/api/groceries`
- `/api/resources`
- `/api/quotes`
- `/api/hub/briefing-feedback`
- `/api/vision` (GET + PUT + PATCH — vision.json read/write/partial-update)

## Known Constraints
- CSV writes use atomic temp+rename but no cross-process file locks
- Shared writer lock (`/tmp/tracker-csv-writer.lock.d`) coordinates CSV-writing daemons
- Some historical labels are still normalized for backward compatibility
- Single-user local-first model (no auth boundary)
