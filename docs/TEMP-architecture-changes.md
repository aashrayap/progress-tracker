# TEMP: As-Built App Analysis (For Next Iteration)

Snapshot date: February 27, 2026  
Codebase scope: `app/` Next.js app + CSV data model in repo root + voice ingestion script.

## Executive Summary

The app currently provides Ash with a functional personal operating system centered on six surfaces (`Hub`, `Review`, `Plan`, `Reflect`, `Health`, `Ideas`) backed by local CSV files as the system of record.

What it already delivers well:

- A single daily decision surface (`Hub`) with next action logic, habits state, and momentum context.
- A practical execution surface (`Plan`) with day/week/month/year views, drag-to-schedule, and plan-vs-actual signals.
- A domain-specific health surface (`Health`) with workout programming, history, progression, and weight trend.
- An analysis surface (`Reflect`) for reflection history, recurring lessons, and deep work analytics.
- A review queue (`Review`) that makes capture backlog visible and triageable.
- A structured ideas pipeline (`Ideas`) for moving ideas across statuses.

Where the architecture is still early-stage:

- Data integrity is best-effort (append/update CSV without transaction/locking semantics).
- Review actions do not yet execute full routing/transformation logic inside the app.
- Identity/uniqueness for plan and signal records is still partial (no stable row IDs in some core tables).
- Some metrics are inference-heavy from free text (`deep_work` parsing) and can drift.

---

## 1) Data Layer Analysis

### 1.1 Canonical Data Stores

The app uses flat CSV files at repo root as canonical storage:

- `daily_signals.csv`
- `inbox.csv`
- `ideas.csv`
- `plan.csv`
- `todos.csv`
- `workouts.csv`
- `reflections.csv`

Current row counts in this snapshot:

- `daily_signals.csv`: 140 lines
- `inbox.csv`: 11 lines
- `ideas.csv`: 5 lines
- `plan.csv`: 49 lines
- `todos.csv`: 9 lines
- `workouts.csv`: 11 lines
- `reflections.csv`: 4 lines

### 1.2 Data Semantics by Table

`daily_signals.csv` (`date,signal,value,unit,context,source,capture_id,category`)

- Purpose: daily fact/event layer (habits, execution, metrics).
- Supports both binary (`gym`, `sleep`, `ate_clean`) and scalar (`weight`) values.
- `context` and `category` are used for downstream parsing and display.
- `capture_id` exists but is not strictly enforced for idempotency in API writes.

`workouts.csv` (`date,workout,exercise,set,weight,reps,notes`)

- Purpose: workout benchmark detail (per-set history).
- Used to derive grouped daily sessions and exercise progression.
- Workout day label currently mixes historical values (ex: legacy `A`) with current config labels (`W1..W5`).

`plan.csv` (`date,start,end,item,done,notes`)

- Purpose: scheduled intent and all-day events.
- All-day convention: `start=0,end=0`.
- Completion state is `done` as `"1" | "0" | ""`.
- No dedicated primary key column.

`todos.csv` (`id,item,done,created`)

- Purpose: unscheduled task pool.
- Has numeric `id` primary key behavior (auto-increment in CSV layer).

`reflections.csv` (`date,domain,win,lesson,change`)

- Purpose: reflection memory with minimal schema.
- Drives morning priming and recurring lesson detection.

`inbox.csv` (`capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error`)

- Purpose: capture queue state, mainly for review/triage.
- Statuses: `new | needs_review | accepted | archived | failed`.

`ideas.csv` (`id,created_at,title,details,domain,status,source,capture_id`)

- Purpose: structured idea backlog.
- Domains: `app | health | life | system`.
- Statuses: `inbox | reviewed | building | archived`.

### 1.3 Shared Data Access Layer (`app/app/lib/csv.ts`)

Strengths:

- Single module centralizing CSV read/write logic and schema headers.
- Supports append and overwrite patterns per table.
- Shared helpers for core analytics inputs (`getMetricHistory`, `getStreak`, `getHabitsForDate`, `getNextWorkout`).

Current constraints / risks:

- Concurrency risk: read-modify-write on files without file locks.
- Integrity risk: appends and updates are not transactional.
- Keying risk: some updates key by business text fields (for example, plan keyed by `date + item`) rather than stable IDs.
- Streak logic is based on logged rows, not strict day continuity.

### 1.4 Config-Driven Domain Model (`app/app/lib/config.ts`)

The app now has a richer training config that actively drives UI and decisions:

- Compound master exercise catalog.
- Workout templates `W1..W5`.
- Weekly split (`Option B`) with cardio days.
- Daily home-dose targets (pull-ups/push-ups).
- Cardio finisher duration per lift session.

This is a strong step toward explicit, machine-readable protocol instead of free-text assumptions.

---

## 2) API / Management Layer Analysis

### 2.1 API Surface Inventory

`GET /api/hub`

- Composes the primary decision payload for Hub.
- Aggregates signals, plan, reflections, todos, inbox, and computed insight.
- Computes:
  - now window (`morning/day/evening`)
  - next action priority
  - habit states for today (with sleep lag fallback to latest prior day)
  - dopamine reset log and streaks
  - weight log and current progress

`GET /api/health`

- Composes health view model:
  - weight trend/checkpoints
  - workout session grouping and progress
  - gym streak and weekly count
  - today meal clean entries
  - latest gym reflection

`GET/POST /api/plan` and `GET /api/plan/range`

- `POST`: upserts plan entries.
- `DELETE`: removes plan entries.
- `range`: returns events + habit map by date range for calendar views.

`GET/POST /api/daily-signals`

- Reads signals with optional filters.
- Appends new signal entries.
- Minimal validation only (presence of key fields).

`GET/POST/PUT/DELETE /api/todos`

- Standard CRUD over todo rows.

`GET/POST/PATCH /api/inbox`

- Review queue read + state patching.
- Supports capture insertion.

`GET/POST/PATCH /api/ideas`

- Idea backlog read/create/update.

`GET/POST /api/reflections`

- Reflection read model and write endpoint.
- Includes recurring lesson detection.

`GET /api/deep-work`

- Derives deep work sessions from `daily_signals` (`signal=deep_work` + context parsing).
- Computes week stats and category breakdown.

### 2.2 Orchestration and Decision Logic

Hub action priority currently follows this order:

1. Resolve review backlog if pending captures exist.
2. Start next scheduled plan block if one is pending.
3. Trigger training/cardio action if gym not yet logged.
4. Else push reflection review.

This gives the app a clear operational bias toward immediate action.

### 2.3 Management Layer Strengths

- Aggregation routes (`/api/hub`, `/api/health`) provide UI-ready read models instead of pushing computation into components.
- Shared CSV layer avoids route-level data logic duplication.
- API contracts are simple and local-first; fast iteration is easy.

### 2.4 Management Layer Gaps

- No auth/role boundaries (single-user local model assumed).
- No schema enforcement beyond minimal route checks.
- No dedupe/idempotency guard on `daily_signals` POST (duplicate writes possible).
- Plan upsert/delete contract is not row-ID based.
- Review queue patching does not perform deterministic routing into final destination tables from inside app.

### 2.5 External Management Flow (Voice)

`scripts/voice-inbox.sh` runs an async ingestion loop:

- Polls GitHub issues titled as voice captures.
- Invokes Claude with system prompt to classify/write to CSVs.
- Commits and closes issues.

This gives Ash a parallel capture channel beyond the app UI, but also means core routing logic is partly outside the web app boundary.

---

## 3) UX Layer Analysis

### 3.1 Surface Map and User Value

`/` (Hub)

- Primary daily command center.
- Shows:
  - north-star reminder
  - habit status tiles
  - status metrics (reset day, weight trend, workout day, gym completion)
  - today training card
  - daily insight panel
  - next action panel
  - 90-day dopamine grid with hover detail
- Value for Ash: fast orientation and one clear next step.

`/plan`

- Multi-zoom calendar (`year`, `month`, `week`, `day`) + todo side panel.
- Day view includes schedule completion, skip, and plan-vs-actual gym reconciliation.
- Scheduler modal supports drag-and-drop from daily tasks/todos to timeline.
- Value for Ash: converts intent into time blocks and tracks completion quality.

`/health`

- Training-focused dashboard.
- Shows:
  - current/next workout card
  - weekly split visualization (Option B)
  - daily home dose
  - compound master list
  - meal-clean status today
  - weight progress and checkpoints
  - exercise progression + workout history
- Value for Ash: clear training protocol + progression visibility.

`/reflect`

- Analysis-first reflection surface.
- Two tabs:
  - reflections (recent entries, recurring lessons, yesterday changes)
  - deep work (minutes, category breakdown, recent sessions)
- Value for Ash: pattern detection and behavior feedback loop.

`/review`

- Capture triage queue with status counts and actions.
- Value for Ash: visibility into unresolved ingestion backlog.

`/ideas`

- Lightweight Kanban-style status pipeline for idea flow.
- Value for Ash: keeps strategic thoughts structured and actionable later.

### 3.2 UX Strengths

- Clear route separation by job-to-be-done.
- Dense but legible information design on mobile-first layouts.
- Consistent visual language across surfaces.
- Fast interaction loops (few clicks for key actions).

### 3.3 UX Frictions / Gaps

- Review page actions are state-oriented, not full resolve/route actions.
- No in-app reflection capture flow for end-of-day input if chat/voice is unavailable.
- Calendar and scheduler still assume item-string identity in several flows.
- Limited edit UX for plan rows and structured signal corrections.

---

## 4) What the App Is Providing Ash Today (Practical Outcome)

Operationally, the app currently provides:

- A unified daily control layer (what to do now).
- Habit and recovery visibility with relapse-aware context.
- Structured workout execution and progression tracking.
- Time-based planning with completion feedback.
- Reflection and deep-work insight loops.
- Capture backlog visibility and idea triage.

In short: Ash already has a functioning decision-and-execution system, not just a passive tracker.

---

## 5) Iteration Priorities (Recommended Next)

### Priority 1: Data Integrity

- Add stable row IDs for `plan` entries.
- Move upsert/delete contracts to ID-based operations.
- Add idempotency guards for `daily_signals` writes (at least optional dedupe key).

### Priority 2: Review Resolution Engine

- Upgrade Review actions from status-only to deterministic resolution flows:
  - `accept+route`
  - `edit+route`
  - `split+route`
- Record audit trail (`resolved_by`, `resolved_at`, destination rows written).

### Priority 3: Cross-Layer Consistency

- Normalize workout day labels in historical data (`A/B/C` vs `W1..W5`) via mapping layer.
- Standardize habit continuity rules (logged-row streak vs calendar-day streak) and expose definition in UI.

### Priority 4: UX Loop Closure

- Add fast “end of day” capture panel for reflection/sleep confirmation.
- Add inline correction tools for wrongly logged signals/events.
- Add calendar conflict/duplication guardrails in scheduler.

---

## 6) Architecture Readiness Assessment

Current maturity by layer:

- Data Layer: 7/10
  - Strong canonical schema direction, but needs stronger identity and write safety.
- API / Management Layer: 7/10
  - Good read-model composition and modular routes; needs stronger mutation contracts and routing closure.
- UX Layer: 8/10
  - Good route architecture and daily usability; needs a few loop-closure and resolve flows.

Overall assessment:

- The app is already useful and compounding for daily operations.
- Next iteration should focus on integrity and resolution mechanics rather than adding new surfaces.
