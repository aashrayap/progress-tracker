# Personal Assistant OS

```
┌─────────────────────────────────────────────────────────────────┐
│  A local-first operating system that turns life data            │
│  into decisions and actions.                                    │
│                                                                 │
│  "Trade escape for building systems and habits where I can      │
│   operate at a level to change the world for the better."       │
└─────────────────────────────────────────────────────────────────┘
```

Given your logs and plans, the system always answers:
```
1. What matters now?     →  Hub (/)
2. What pattern is forming?  →  Reflect (/reflect)
3. What should I do next?    →  Hub next-action
```

---

## Life Pillars

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LIFE PILLARS                                    │
├────────────┬────────────┬────────────┬────────────┬──────────┬─────────────┤
│   WEIGHT   │ ADDICTION  │  FITNESS   │   MEALS    │  MONEY   │   TRAVEL    │
│  245→200   │  90-Day    │  Gym 5x/wk │ Elk Bowl   │ 500k→1M │  Poland x3  │
│  by Jun 30 │  Reset     │  W1-W5     │ 1400 cal   │ by 37   │  in 2026    │
└────────────┴────────────┴────────────┴────────────┴──────────┴─────────────┘
```

### Weight — 245 → 200 lbs by Jun 30

```
Current ████████████████████████░░░░░░░░░░░░░░░░░░ 245 lbs
Goal    ████████████████████░░░░░░░░░░░░░░░░░░░░░░ 200 lbs

Feb 232 ─── Mar 224 ─── Apr 216 ─── May 208 ─── Jun 200
```

```
├─ Age / Height: 30 / 6'0"
├─ BMR:    2,089 cal/day
├─ TDEE:   2,872 cal/day (light activity)
├─ Target: 1,900 cal/day · 180g protein · 8k steps
└─ Rate:   ~2 lbs/week
```

### Addiction Recovery — 90-Day Dopamine Reset

```
Jan 30 ══════════════════════════════════════════ Apr 30
       LoL: quit │ Weed: quit │ Poker: quit
       (cold turkey, zero negotiation)
```

```
Triggers:
├─ ⚠ HIGH   Poker environment    Social pressure → impulse
├─ ⚠ HIGH   Poker loss           Loss → dopamine crash → seeks hit
├─ ⚠ HIGH   Late night + friends Social + late = cascade
└─ ⚡ MED    Boredom, evening     Unstructured time

Emergency: Recognize → Delay 10m → Move → Remind "dopamine is healing"
```

### Fitness — Gym 5x/week (Habit > Optimization)

```
Rotation (completion-based, NOT calendar-based):
W1 → W2 → W3 → W4 → W5 → W1 → ...

┌─────┬──────────────────────────────────────┐
│ W1  │ squat / bench / lat_pulldown         │
│ W2  │ ohp / lat_row / incline_bench        │
│ W3  │ rdl / bench / pullup                 │
│ W4  │ front_squat / incline_bench / lat_row│
│ W5  │ lunges / ohp / pullup               │
└─────┴──────────────────────────────────────┘

Rules: 3 exercises × 3 sets · RIR 2-3 · 30-35 min · +5 min cardio finisher
Progression: top reps all sets → +5 lbs · miss 2 sessions → deload 10%
```

```
Weekly Split (Option B):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
│Zone2│ W1  │ W2  │ W3  │Cardio│ W4 │ W5  │
│45min│Lift │Lift │Lift │25min│Lift │Lift │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Daily home dose: 6 pull-ups + 20 push-ups (easy, never to failure)
```

### Meals — Elk Bowl Protocol

```
┌──────────┬─────────────────────────────┬──────────┐
│ Lunch    │ 8oz elk + 1c rice + 1c veg  │ ~700 cal │
│ Dinner   │ 8oz elk + 1c rice + 1c veg  │ ~700 cal │
│ Snacks   │ carrots, beets              │ ~100 cal │
├──────────┼─────────────────────────────┼──────────┤
│ TOTAL    │                             │~1400 cal │
│          │                             │ 115g pro │
└──────────┴─────────────────────────────┴──────────┘
```

### Money — $500k → $1M by Age 37

```
Strategy: hold S&P broad index · 10% annual return · no contributions

2026 (31) $550k ──── 2028 (33) $665k ──── 2030 (35) $805k ──── 2032 (37) $1M
```

### Travel — Poland x3 in 2026

```
├─ Spring  Apr-May   ~$1,300
├─ Summer  Jul-Aug   ~$1,300
└─ Winter  Dec       ~$1,300
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ UI LAYER (decision + execution surfaces)                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ Hub │ Review │ Plan │ Reflect │ Health │ Ideas                            │
│ Each surface has ONE job. No surface invents its own semantics.           │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ consumes read models
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER (shared logic + decision engine)                       │
├──────────────────────────────────────────────────────────────────────────┤
│ API routes (app/app/api/*)  +  domain helpers (app/app/lib/*)            │
│ Normalization · read models · next-action · insights · routing           │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ reads/writes
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ DATA LAYER (canonical source of truth — flat CSVs in repo root)          │
├──────────────────────────────────────────────────────────────────────────┤
│ inbox.csv │ daily_signals.csv │ workouts.csv │ reflections.csv            │
│ plan.csv │ todos.csv                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

```
Three rules:
├─ UI:           consumes read models, never invents business logic
├─ Intelligence: single decision/routing layer for all interpretation + mutation
└─ Data:         canonical CSVs, shared access via app/app/lib/csv.ts
```

---

## Data Contracts

```
inbox.csv
├─ capture_id, captured_at, source, raw_text
├─ status, suggested_destination, normalized_text, error
└─ Purpose: append-only raw capture audit log

daily_signals.csv
├─ date, signal, value, unit, context, source, capture_id, category
└─ Purpose: daily facts (habits, metrics, events)

workouts.csv
├─ date, workout, exercise, set, weight, reps, notes
└─ Purpose: set-level lift history

reflections.csv
├─ date, domain, win, lesson, change
├─ Domains: gym │ addiction │ deep_work │ eating │ sleep
└─ Purpose: win/lesson/change memory

plan.csv
├─ date, start, end, item, done, notes
└─ Purpose: time blocks + completion state

todos.csv
├─ id, item, done, created
└─ Purpose: task backlog
```

### Signal Types

```
daily_signals.csv signal values:
├─ weight         number (lbs)
├─ lol/weed/poker 0=relapse, 1=clean
├─ gym/sleep/meditate/deep_work/ate_clean  0=missed, 1=done
├─ calories       number (daily total)
├─ trigger        text (craving trigger)
├─ relapse        text (substance)
└─ reset          1 (marks counter reset day)
```

---

## Workflow Pipeline

```
┌────────────┐     ┌──────────────────┐
│  CAPTURE   │────▶│  MATERIALIZE     │
│  inbox.csv │     │  → daily_signals │
│  append-   │     │  → workouts      │
│  only log  │     │  → reflections   │
│            │     │  → todos         │
└────────────┘     └──────────────────┘

Pipeline rule:
├─ Capture  = preserve raw signal in inbox.csv for audit/reprocessing
├─ Reflect  = interpretation (what patterns? what to change?)
└─ Todos    = single actionable backlog
```

---

## UI Surfaces

```
┌─────────────────────────────────────────────────────────────────┐
│  /  HUB                                                         │
│  Priority + next action now                                     │
│  ├─ north star · habit tiles · status metrics                   │
│  ├─ reset day / weight trend / gym day                          │
│  ├─ training card · daily insight · next action                 │
│  └─ 90-day dopamine grid                                        │
├─────────────────────────────────────────────────────────────────┤
│  /plan  PLAN                                                    │
│  Time-block execution                                           │
│  ├─ year / month / week / day views                             │
│  ├─ drag-to-schedule · completion / skip toggles                │
│  └─ todo sidebar                                                │
├─────────────────────────────────────────────────────────────────┤
│  /reflect  REFLECT                                              │
│  Evidence + insights                                            │
│  ├─ reflections by timeframe (week/month)                       │
│  ├─ recurring lessons · deep work analytics                     │
│  └─ add reflection follow-up → todo                             │
├─────────────────────────────────────────────────────────────────┤
│  /health  HEALTH                                                │
│  Training + body composition                                    │
│  ├─ current / next workout · weekly split (Option B)            │
│  ├─ compound master list · exercise progression                 │
│  └─ weight progress + checkpoints · meal status                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hub Decision Priority

```
nextAction computed server-side:
1. 📋 Start next plan block     (if one is pending)
2. 🏋 Trigger training/cardio   (if gym not yet logged)
3. 💭 Push reflection review    (fallback)
```

---

## API Surface

```
READ MODELS (aggregation):
├─ GET /api/hub              → decision payload: habits, streaks, weight, plan, next action, insight
├─ GET /api/health           → weight trend, workouts, gym streak, weekly count, meal status
├─ GET /api/deep-work        → deep work sessions, week stats, category breakdown
├─ GET /api/reflect-insights → timeframe-aware insight synthesis
└─ GET /api/plan/range       → calendar range (events + habit map by date range)

CRUD ENDPOINTS:
├─ GET/POST     /api/daily-signals  → read (filterable) · append signals
├─ GET/POST     /api/reflections    → reflection read/write + recurring lesson detection
├─ GET/POST/DELETE /api/plan        → plan entry CRUD (upsert/delete by date+item)
└─ GET/POST/PUT/DELETE /api/todos   → todo CRUD (ID-based)
```

---

## Input Channels

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │     │    Voice     │     │  CLI Skills  │
│   app/       │     │   Pipeline   │     │              │
│              │     │              │     │  /log        │
│  Review ───▶ │     │ iOS Shortcut │     │  /reflect    │
│  Plan ────▶  │     │  ▼           │     │  /weekly     │
│  Health ──▶  │     │ GH Issue     │     │              │
│  (reads +    │     │  ▼           │     │  Writes      │
│   actions)   │     │ voice-       │     │  directly    │
│              │     │  inbox.sh    │     │  to CSVs     │
│              │     │  ▼           │     │              │
│              │     │ Claude CLI   │     │              │
│              │     │  ▼           │     │              │
│              │     │ CSV write +  │     │              │
│              │     │ git push     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

Voice pipeline: phone → dictate → GH Issue ("Voice: ...") → voice-inbox.sh
  (launchd, 5s poll) → Claude CLI → parse + write CSVs → commit + push → close issue

Used at gym for workout logging (voice dictate sets/reps between exercises).
```

---

## Shared Domain Logic

```
app/app/lib/
├─ csv.ts             All CSV read/write, schema headers, analytics
│                     (streaks, habits, metrics, next workout)
├─ config.ts          Static config: profile, exercises, workout templates
│                     (W1-W5), weekly split, triggers, daily tasks
│                     Legacy normalization: A/B/C → W1/W2/W3
├─ timeframe.ts       Timeframe resolution (week/month) for Reflect
├─ types.ts           Shared types (DailySignalEntry, InboxEntry)
└─ utils.ts           Date helpers (todayStr, daysAgoStr, toDateStr)
```

---

## Memory Model

```
┌──────────────────┬──────────────────────────────────┬───────────────────┐
│ Event Memory     │ daily_signals, workouts,          │ What happened     │
│                  │ reflections                       │                   │
├──────────────────┼──────────────────────────────────┼───────────────────┤
│ State Memory     │ Derived API read models           │ Where things      │
│                  │ (/api/hub, /api/health)           │ stand now         │
├──────────────────┼──────────────────────────────────┼───────────────────┤
│ Rule Memory      │ Recurring lessons + playbook      │ What to do when   │
│                  │ (docs/life-playbook.md)           │ patterns repeat   │
├──────────────────┼──────────────────────────────────┼───────────────────┤
│ Action Memory    │ plan, todos                       │ What is changing  │
│                  │                                   │ next              │
└──────────────────┴──────────────────────────────────┴───────────────────┘
```

---

## Operating Cadence

```
DAILY:
├─ Morning prime:  carry-forward lesson + top risk + one key action
├─ During day:     execute planned blocks + log fast
└─ Evening close:  reflection (win/lesson/change) + plan adjustment

WEEKLY:
├─ Review trendlines, misses, relapse/gym/deep-work patterns
├─ Promote repeated insights → explicit rules/actions
└─ Update plan based on evidence, not mood
```

---

## Non-Negotiable Rules

```
1. One concept, one canonical table.
2. No UI surface invents its own semantics.
3. Every insight must connect to an action.
4. Every action should be traceable to evidence.
5. Reflection must feed future decisions, not just history.
6. Prefer deterministic logic over hidden prompt magic.
7. CSVs are the single source of truth.
8. Shared domain logic lives in app/app/lib/.
```

---

## Known Gaps

```
├─ ⚠ MEDIUM  Data integrity     CSV read-modify-write without file locks
├─ ⚠ MEDIUM  Plan identity      Keyed by date+item, not stable row ID
├─ ⚡ LOW     Signal dedupe      No idempotency guard on daily_signals POST
├─ ⚡ LOW     Routing            daily_signals destination not yet in pipeline
└─ ⚡ LOW     Streak logic       Based on logged rows, not calendar-day continuity
```

---

## Development Setup

```bash
cd app
nvm use          # .nvmrc → Node 22
npm install
npm run dev      # localhost:3000
```

Node `>=20.9` required. Run `npm run lint && npm run build` before finishing changes.

---

## Documentation Map

```
├─ docs/personal-os.md                 OS blueprint: mission, runtime loop, memory, build phases
├─ docs/life-playbook.md               Domain protocols: vision, fitness, meals, addiction, finance, travel
├─ docs/TEMP-architecture-changes.md   As-built technical audit + gap analysis
├─ CLAUDE.md                           Assistant context + operational guidance
└─ app/README.md                       App routes, APIs, data location, guardrails
```

---

## Near-Term Direction

```
1. Data integrity     → stable row IDs for plan, idempotency guards for signals
2. Capture clarity    → preserve raw capture log while routing directly to canonical tables
3. Reflect center     → timeframe-aware insight synthesis → action promotion into todos
4. Hub command center → elevate nextAction as primary UI control
5. Compounding memory → recurring lessons → explicit rules → future decision ranking
```
