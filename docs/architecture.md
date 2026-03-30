# Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│  L3  SURFACES        Next.js pages + components         │
│                      /plan/day  /vision  /health        │
├─────────────────────────────────────────────────────────┤
│  L2  INTELLIGENCE    app/app/lib/ + app/app/api/        │
│                      + scripts/*.js                     │
├─────────────────────────────────────────────────────────┤
│  L1  DATA            data/*.csv + data/vision.json      │
├─────────────────────────────────────────────────────────┤
│  L0  CORE DOCS       CLAUDE.md + docs/*.md              │
└─────────────────────────────────────────────────────────┘
          ▲ each layer depends only downward ▲
```

**Core rule:** Surfaces consume read models and trigger actions. Semantics are owned by Intelligence. Intelligence reads Foundation. Foundation (L0+L1) is self-contained.

**Navigation protocol:** Flat routing only — primary surfaces are top-level routes. Depth via in-page UI (tabs, modals, drawers). No new route trees.

---

## 2. Page Surfaces

Three pages. Only `/plan/day` has write operations — everything else is read-only.

```
┌─────────────────────────────────────────────────────────────────┐
│                        /plan (PlanProvider)                      │
│  Fetches: GET /api/plan/range, GET /api/todos                   │
│  Shared across all sub-routes                                   │
├──────────────────┬──────────────┬──────────────┬────────────────┤
│  /plan/day       │ /plan/week   │ /plan/month  │ /plan/year     │
│  DayView         │ WeekView     │ MonthView    │ YearView       │
│  READ + WRITE    │ READ-ONLY    │ READ-ONLY    │ READ-ONLY      │
└──────────────────┴──────────────┴──────────────┴────────────────┘
```

### /plan/day — DayView (daily home page)

```
DayView
├── Ritual/Identity card       ← GET /api/vision (ritual blueprint)
├── Intentions + Briefing      ← GET /api/hub (aggregates 8 CSVs)
├── Habit toggles (14 signals) ← GET /api/daily-signals
│                                → POST /api/daily-signals (toggle on)
│                                → DELETE /api/daily-signals (toggle off)
├── 90-day habit grid           ← GET /api/plan/range (historical)
├── Schedule blocks             ← GET /api/plan/range
│                                → POST /api/plan (mark done)
├── TodoList                    ← GET /api/todos
│                                → POST/PUT/DELETE /api/todos
└── BriefingCard                ← GET /api/hub
                                 → POST /api/hub/briefing-feedback
```

Uses `HABIT_CONFIG` from `lib/config.ts` for display labels.

### /vision (read-only)

```
vision/page.tsx
├── Per-pillar identity script  ← GET /api/vision (vision.json)
├── Per-pillar anti-vision      ←  "
├── NorthStarCard (ABT+H)      ←  "
├── ExperimentsTable            ← GET /api/hub (experiments)
├── InputControlSection         ← GET /api/vision
├── DistractionsSection         ←  "
└── HabitAuditSection           ←  "
```

### /health (read-only)

```
health/page.tsx                 ← GET /api/health
├── WeeklyProgramChart            (reads: daily_signals, workouts, reflections)
└── ExerciseHistory
```

Note: `WeightChart` component exists but is not rendered on this page.

---

## 3. API Layer

| Route | Methods | Reads | Writes | Consumers |
|---|---|---|---|---|
| `/api/daily-signals` | GET, POST, DELETE | daily_signals.csv | daily_signals.csv (via router.ts) | DayView habits |
| `/api/health` | GET | daily_signals, workouts, reflections | — | /health page |
| `/api/hub` | GET | daily_signals, plan, reflections, todos, workouts, quotes, experiments, briefing.json | — | DayView, /vision |
| `/api/hub/briefing-feedback` | POST | briefing.json | briefing_feedback.csv | BriefingCard |
| `/api/plan` | POST, DELETE | — | plan.csv | DayView |
| `/api/plan/range` | GET | plan.csv, daily_signals.csv | — | PlanProvider, DayView |
| `/api/todos` | GET, POST, PUT, DELETE | todos.csv | todos.csv | PlanProvider, TodoList |
| `/api/vision` | GET, PUT, PATCH | vision.json | vision.json | DayView (ritual), /vision, checkin agents |

Shared routes: `/api/hub` and `/api/vision` are consumed by both `/plan/day` and `/vision`.

---

## 4. Data Layer

### CSV Files (`data/`)

| File | Stores | Primary Writers |
|---|---|---|
| `daily_signals.csv` | Daily habits, metrics, signals (flat key-value) | /checkin, /log, process agent, plan agent, weekly agents |
| `workouts.csv` | Set-level gym data (exercise/weight/reps) | /log skill |
| `reflections.csv` | Micro-AARs (win/lesson/change per domain) | process agent, weekly-reflect agent |
| `plan.csv` | Time blocks and scheduled items | plan agent, DayView |
| `todos.csv` | Action backlog | plan agent, /log, todo agent |
| `groceries.csv` | Grocery items with section mapping | (no active page consumer) |
| `quotes.csv` | Curated quotes by domain | (read internally by /api/hub) |
| `resources.csv` | Books, articles, resources | (no active page consumer) |
| `briefing_feedback.csv` | Daily briefing ratings | BriefingCard |
| `experiments.csv` | Time-boxed behavior experiments | /checkin |

### vision.json (`data/`)

Structured document: per-pillar identity, ABT(H) cards, ritual blueprint, input control, distractions.

```
{
  domains: [{ id, actual, becoming, timeline, habits }],
  identityScript: { health, wealth, love, self },
  antiVision: { health, wealth, love, self },
  intentions: { weekly, monthly, quarterly },
  ritualBlueprint: { morning: [], midday: [], evening: [] },
  inputControl: {...},
  distractions: [...],
  habitAudit: { productive: [], neutral: [], destructive: [] }
}
```

Full schema: `docs/data-schemas.md`.

---

## 5. Cadence System

```
         Daily            Weekly (Sun)      Monthly (last Sun)  Quarterly
         ─────            ────────────      ──────────────────  ─────────
Trigger  /checkin          /checkin wk       /checkin mo         /checkin qt
         or /log
           │                 │                  │                   │
Script   precompute-       precompute-        (none)             (none)
         checkin.js        weekly.js
           │               --html → report
           │                 │                  │                   │
Menu/    ┌─┼─┐               │                  │                   │
Flow     │ │ │               │                  │                   │
         │ │ │               │                  │                   │
         ▼ ▼ ▼               ▼                  ▼                   ▼
Agents   L P Pr           wk-reflect         (inline)           (inline)
         o l r            wk-vision          no agents           no agents
         g a o            plan(week)
           n c
             e
             s
             s
           │                 │                  │                   │
           ▼                 ▼                  ▼                   ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                     WRITES BY CADENCE                           │
     ├─────────────────┬─────────┬──────────┬────────────┬────────────┤
     │                 │  Daily  │  Weekly  │  Monthly   │ Quarterly  │
     ├─────────────────┼─────────┼──────────┼────────────┼────────────┤
     │ daily_signals   │    ✓    │    ✓     │  flag only │ flag only  │
     │ reflections     │    ✓    │    ✓     │     —      │     —      │
     │ plan.csv        │    ✓    │    ✓     │     —      │     —      │
     │ todos.csv       │    ✓    │    —     │     —      │     —      │
     │ vision.json     │    —    │  PATCH   │   PATCH    │    PUT     │
     ├─────────────────┼─────────┼──────────┼────────────┼────────────┤
     │ completion flag │ _daily=1│_weekly=1 │ _monthly=1 │_quarterly=1│
     └─────────────────┴─────────┴──────────┴────────────┴────────────┘
```

### Daily detail

```
/checkin → precompute-checkin.js → state cards → menu
  │
  ├── 1. Log ──────── parse natural language → daily_signals.csv
  │
  ├── 2. Process ──── → process agent (auto-detects branch)
  │                      ├── crossroads (pull toward old identity)
  │                      ├── feelings (stress/anxiety)
  │                      ├── reflection (end-of-day AAR)
  │                      └── lag reframe (stuck/nothing changing)
  │                    → writes: daily_signals.csv + reflections.csv
  │
  └── 3. Plan ─────── → plan agent + precompute-plan.js
                         ├── today: schedule blocks
                         ├── tomorrow: draft priorities
                         └── week: sketch blocks
                       → writes: plan.csv + todos.csv + daily_signals.csv
  │
  └── post-write: reconcile.js (signal→plan auto-complete)
      completion: checkin_daily=1 → daily_signals.csv
```

Alternative lightweight path: `/log` for quick one-off writes (weight, workout, note, todo).

### Weekly detail

```
/checkin weekly
  │
  ├── Step 1: precompute-weekly.js --html → open report
  │
  ├── Step 2: → weekly-reflect agent
  │              ├── domain spotlight (2-3 domains)
  │              ├── feedback loop audit
  │              ├── B×A×D check
  │              ├── inversion quick-scan
  │              └── social contact
  │            → writes: reflections.csv + daily_signals.csv (social_contact)
  │
  ├── Step 3: → weekly-vision agent
  │              ├── review last week's goals (✓/✗/~)
  │              ├── set this week's goals (1-3)
  │              ├── set weekly intention
  │              └── update ABT(H) per pillar (actual + habits)
  │            → writes: daily_signals.csv (goal signals) + vision.json (PATCH)
  │
  ├── Step 4: → plan agent (week mode) → plan.csv
  │
  └── Step 5: checkin_weekly=1 → daily_signals.csv
```

Read-only alternative: `/weekly-review` skill (scorecard, no writes).

### Monthly detail

```
/checkin monthly (inline — no dedicated agents)
  │
  ├── Trajectory report (read-only: 30 days of signals/reflections)
  ├── 7 structured questions (no writes)
  ├── Vision rewrite: identityScript + antiVision + intentions
  │   → PATCH vision.json
  ├── Optional: life-playbook.md edits (user confirmation required)
  └── checkin_monthly=1 → daily_signals.csv
```

### Quarterly detail

```
/checkin quarterly (inline — no dedicated agents)
  │
  ├── Strategic orientation (3 questions, no writes)
  ├── Full ABT(H) rebuild per pillar
  ├── Ritual blueprint overhaul
  ├── Habit audit + inversion playbook per pillar
  ├── Forces/skills/peer audit + input control
  │   → all assembled into PUT vision.json (full replace)
  └── checkin_quarterly=1 → daily_signals.csv
```

### Agent bypass warning

Weekly/monthly/quarterly agents write directly to CSVs via Bash, bypassing `router.ts`. The side effects (workout→gym=1, signal→plan auto-complete) do NOT fire for agent-initiated writes. This is intentional — agents batch-write structured data where per-write side effects would double-fire. `reconcile.js` compensates for daily flows only.

---

## 6. Skill System

### /checkin (single entry point for all writes)

```
/checkin
  ├─ precompute-checkin.js (reads all CSVs → state cards)
  ├─ [daily]
  │   ├─ Log → daily_signals.csv
  │   ├─ Process → process agent → daily_signals.csv + reflections.csv
  │   └─ Plan → plan agent + precompute-plan.js → plan.csv + todos.csv + daily_signals.csv
  ├─ [weekly]
  │   ├─ precompute-weekly.js → HTML scorecard
  │   ├─ weekly-reflect agent → reflections.csv + daily_signals.csv
  │   ├─ weekly-vision agent → daily_signals.csv + vision.json (PATCH)
  │   └─ plan agent (week mode) → plan.csv
  ├─ [monthly] (inline, no agent)
  │   └─ vision.json (PATCH: identityScript, antiVision, intentions)
  └─ [quarterly] (inline, no agent)
      └─ vision.json (PUT: full rebuild)
```

### /log (quick one-off writes)

```
/log
  ├─ weight → daily_signals.csv
  ├─ workout → workouts.csv
  ├─ note → daily_signals.csv
  └─ todo → todos.csv
  (No agents. No scripts. Direct CSV write.)
```

### /weekly-review (read-only scorecard)

```
/weekly-review
  └─ precompute-weekly.js → reads daily_signals, reflections, workouts, plan
     └─ renders scorecard (no writes)
```

### /review-notes (read-only activity summary)

```
/review-notes
  └─ reads: daily_signals, workouts, reflections, plan, todos
     └─ renders summary (no writes)
```

### /todo

```
/todo → todo agent → todos.csv (read + write)
```

### /relationship

```
/relationship
  ├─ reads: data/relationship.md, vision.json
  └─ writes: daily_signals.csv, data/relationship.md
```

### /feature-interview

```
/feature-interview
  ├─ spawns ad-hoc subagents (research, alignment, conflict, spec-writer)
  └─ writes: docs/specs/*.md, docs/artifacts/<feature>/
```

### /audit (read-only)

```
/audit → reads all project files → writes docs/audits/*.md report
```

### /remove-slop

```
/remove-slop → reads git diff → edits modified TS/TSX files
```

### /qa

```
/qa → Chrome browser → reads console + network → fixes issues with user approval
```

### /brain-state (stale)

```
/brain-state → compute-brain-state.js → brain-state agent
  ⚠ Agent file archived — absorbed into morning report script.
```

---

## 7. Scripts

All scripts live in `scripts/`. Two are shared utilities; the rest are purpose-built.

| Script | Purpose | Called By |
|---|---|---|
| `config.js` | Shared constants: SIGNAL_TO_PLAN_KEYWORD, HABIT_LIST, ADDICTION_SIGNALS | All other scripts |
| `csv-utils.js` | Shared CSV read/write/parse/pivot utilities | All other scripts |
| `precompute-checkin.js` | Reads all CSVs → display cards + digest for /checkin pre-menu | /checkin skill (daily) |
| `precompute-plan.js` | Today's plan blocks + set-tomorrow data | plan agent |
| `precompute-weekly.js` | Weekly scorecard/digest — HTML report or plain text | weekly-reflect, weekly-vision, /weekly-review |
| `compute-brain-state.js` | Streaks, habit grid, vice/positive load analysis | brain-state agent (stale) |
| `compute-morning-report.js` | Self-contained HTML morning report with AI narrative | Standalone (reads daily_signals + vision.json + briefing.json) |
| `reconcile.js` | Post-checkin bridge: auto-marks plan items done from logged signals | /checkin skill (daily, post-write) |

---

## 8. Write Architecture

Three write paths exist. Each has a different scope and trigger.

### Path 1: API writes via router.ts (UI-initiated)

```
UI action (habit toggle, plan mark-done, etc.)
  └─ API route handler (e.g. POST /api/daily-signals)
      └─ router.ts: writeAndSideEffect(type, data, date?)
          ├─ Primary write → csv.ts function
          └─ Side effects (one level deep, never re-enter router):
               workout rows   → ensure gym=1 in daily_signals
               gym=1          → mark plan item "Gym" done
               sleep=1        → mark plan item "Sleep" done
               meditate=1     → mark plan item "Meditate" done
               deep_work=1    → mark plan item "Deep work" done
```

Six write types: `workout`, `signal`, `reflection`, `todo`, `grocery`, `plan`.
Keyword map sourced from `scripts/config.js:SIGNAL_TO_PLAN_KEYWORD`.

### Path 2: Agent-bypass writes (skill-initiated)

```
/checkin skill → spawns agent → agent writes directly to CSV via Bash
  └─ NO router.ts involvement
  └─ NO side effects fire
  └─ Agents: process, plan, weekly-reflect, weekly-vision
```

Intentional: agents batch-write structured data where per-write side effects would double-fire.

### Path 3: reconcile.js (post-checkin bridge)

```
/checkin daily → all writes complete → reconcile.js
  └─ Reads today's signals from daily_signals.csv
  └─ Applies SIGNAL_TO_PLAN_KEYWORD mapping (same as router.ts)
  └─ Auto-marks matching plan.csv items done
```

Runs once at end of checkin session as a cleanup pass. Compensates for the agent-bypass path where router.ts side effects don't fire.

**Duplication note:** `router.ts` and `reconcile.js` both implement signal→plan keyword mapping. `scripts/config.js:SIGNAL_TO_PLAN_KEYWORD` is the canonical source for both.

### Vision writes

| Method | Purpose | Consumer |
|---|---|---|
| GET | Read full vision.json | /vision page, DayView ritual strip |
| PUT | Full replace | Quarterly rebuild |
| PATCH | Partial field update | Weekly/monthly checkin |

| Cadence | Fields written |
|---|---|
| Weekly | `domains[].actual`, `domains[].habits`, `intentions.weekly` |
| Monthly | `identityScript`, `antiVision`, `intentions` |
| Quarterly | All fields (full rebuild) |

Daily checkins do NOT write to vision.json.

---

## Constraints

- CSV writes use atomic temp+rename but no cross-process file locks
- Single-user local-first model (no auth boundary)
- Some historical signal labels normalized for backward compatibility
- Feature specs live in `docs/specs/` (Status: draft | in-progress | shipped | archived)
- Phone intake via Claude Code iMessage channel (`--channels plugin:imessage`)
