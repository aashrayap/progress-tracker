# Progress Tracker

Personal operating system for weight, addiction recovery, fitness, and deep work.

## Architecture (Visual First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UI LAYER (read + decision surfaces)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Hub | Review | Plan | Reflect | Health | Ideas (read-only board)          │
│ Main in-app triage input: /review                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER (shared logic)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ API routes + shared CSV/domain helpers                                     │
│ Responsibilities: validate, route, sync, side effects, read models         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DATA LAYER (source of truth)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ inbox.csv | daily_signals.csv | workouts.csv | reflections.csv             │
│ ideas.csv | plan.csv | todos.csv                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Three Layers

1. `UI`
   Visual surfaces for context and decisions. Keep write interactions minimal and intentional.
2. `Intelligence`
   Single decision/routing layer that all write paths should use.
3. `Data`
   Canonical CSVs, append/update semantics, no business logic in raw writers.

## Layer Details (As Built)

### Data Layer

| CSV | Canonical role | Current write paths |
|-----|----------------|---------------------|
| `inbox.csv` | Raw capture queue + review state (`new/needs_review/accepted/archived/failed`) | `POST/PATCH /api/inbox`, voice pipeline, CLI note capture |
| `daily_signals.csv` | Daily facts (habits, metrics, events) | `POST /api/daily-signals`, `/health` mark done, voice pipeline, CLI `/log` |
| `workouts.csv` | Set-level workout benchmarks | Voice pipeline, CLI workout logging |
| `reflections.csv` | `win/lesson/change` by domain | `POST /api/reflections`, voice pipeline, CLI `/reflect` |
| `ideas.csv` | Structured idea backlog | Voice pipeline, server `POST/PATCH /api/ideas` (UI is read-only) |
| `plan.csv` | Time blocks + completion state | `POST/DELETE /api/plan` from planner UI |
| `todos.csv` | Task pool + done state | `POST/PUT/DELETE /api/todos` from planner/todo UI |

### Intelligence Layer

| Area | Responsibility |
|------|----------------|
| `app/app/lib/csv.ts` | Schema headers, CSV parsing/serialization, append/overwrite helpers, table-level read/write helpers |
| `app/app/api/hub` | Composed dashboard read model + next-action priority |
| `app/app/api/health` | Health/workout read model |
| `app/app/api/deep-work` | Deep-work analytics read model |
| `app/app/api/plan/range` | Calendar range read model (`events + habits`) |
| `app/app/api/*` write routes | Mutations for inbox/signals/plan/todos/ideas/reflections |

### UI Layer

| Surface | Type |
|---------|------|
| `Hub`, `Reflect`, `Health` | Primarily read + focused action controls |
| `Review` | Review queue + triage actions |
| `Plan` | High-interaction execution UI (schedule/todos) |
| `Ideas` | Read-only board |

## Action Map (Current)

### Review-Related Actions

1. `Hub` computes unresolved inbox counts and prioritizes opening `/review`.
2. `/review` reads queue via `GET /api/inbox`.
3. `/review` triage buttons call `PATCH /api/inbox` (`accepted`, `needs_review`, `archived`).
4. `PATCH /api/inbox` updates only inbox row metadata (`status`, `suggestedDestination`, `normalizedText`, `error`).

Important: review triage currently does not execute downstream routing/transforms into other CSVs.

### Non-Review Web Actions (Still Writing Data)

1. `/health` has `Mark Done` which writes `gym=1` to `daily_signals.csv` via `POST /api/daily-signals`.
2. `/plan` day view toggles plan completion/skip via `POST /api/plan`.
3. `/plan` scheduler modal adds/moves/deletes plan blocks via `POST/DELETE /api/plan`.
4. `/plan` todo controls create/update/delete tasks via `POST/PUT/DELETE /api/todos`.
5. `/ideas` is now read-only and does not call mutation endpoints.

### Non-Web Actions (Still Writing Data)

1. Voice pipeline (`scripts/voice-inbox.sh`) processes GitHub voice issues and appends directly to CSVs per prompt rules.
2. CLI skills write directly through operational flows:
   - `/log` -> daily signals, workout sets, inbox note capture.
   - `/reflect` -> reflections.

## Read/Write Intent (Before Next Changes)

- Keep UI visual-first and decision-focused.
- Keep `/review` as the explicit in-app triage gate.
- Treat other write paths above as current-state exceptions to be consolidated in a later migration.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Hub — status, streaks, insights, morning priming |
| `/review` | Capture review queue (`inbox`) + triage actions |
| `/plan` | Calendar — year/month/week/day + todos |
| `/reflect` | Reflection analysis + deep work patterns |
| `/health` | Gym + weight + eating |
| `/ideas` | Read-only idea pipeline view (`inbox/reviewed/building/archived`) |

## Input Channels

```
Manual:  CLI skills (/log, /reflect, /weekly-review)
Voice:   iPhone → GitHub Issue → voice-inbox.sh → CSV
Web:     Review queue triage + read surfaces
```

Architecture direction: all capture channels converge through the Intelligence layer before touching CSVs.

## Setup

```bash
cd app
nvm use   # uses .nvmrc (20.20.0)
npm install && npm run dev   # requires Node >= 20.9
```

## Docs

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant context (always loaded) |
| `docs/personal-os.md` | Principles + visual loop + operator flow + phased plan |
| `docs/life-playbook.md` | Consolidated life protocols (vision, fitness, meals, addiction, finance, travel) |
| `docs/TEMP-architecture-changes.md` | Current migration/architecture decisions |
