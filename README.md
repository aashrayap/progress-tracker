# Progress Tracker

Personal life execution system. CSV-first, local-first, CLI-driven.

```
Capture → Normalize → Decide → Execute → Reflect → Adapt
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  L3  SURFACES        Next.js pages + components                     │
│                      /plan/day  /vision  /health                    │
├─────────────────────────────────────────────────────────────────────┤
│  L2  INTELLIGENCE    app/app/lib/ + app/app/api/ + scripts/*.js     │
├─────────────────────────────────────────────────────────────────────┤
│  L1  DATA            data/*.csv + data/vision.json                  │
├─────────────────────────────────────────────────────────────────────┤
│  L0  CORE DOCS       CLAUDE.md + docs/*.md                         │
└─────────────────────────────────────────────────────────────────────┘
          ▲ each layer depends only downward ▲
```

---

## Routes & Pages

```
/               → redirects to /plan/day
/plan           → PlanProvider (fetches plan + todos, shared across sub-routes)
  /plan/day     → DayView (READ + WRITE — daily home page)
  /plan/week    → WeekView (READ-ONLY)
  /plan/month   → MonthView (READ-ONLY)
  /plan/year    → YearView (READ-ONLY)
/vision         → Vision page (READ-ONLY — weekly+ deep review)
/health         → Workout tracker + weight + progress charts (READ-ONLY)
```

Nav: `Vision | Plan | Health` — sticky top bar with backdrop blur.

### /plan/day — Daily Home Page

```
DayView
├── Ritual/Identity card       ← GET /api/vision
├── Intentions + Briefing      ← GET /api/hub
├── Habit toggles (14 signals) ← GET/POST/DELETE /api/daily-signals
├── 90-day habit grid           ← GET /api/plan/range
├── Schedule blocks             ← GET /api/plan/range → POST /api/plan
├── TodoList                    ← GET/POST/PUT/DELETE /api/todos
└── BriefingCard                ← GET /api/hub → POST /api/hub/briefing-feedback
```

### /vision — Weekly+ Deep Review

```
vision/page.tsx
├── Per-pillar identity script  ← GET /api/vision
├── Per-pillar anti-vision
├── NorthStarCard (ABT+H per domain)
├── ExperimentsTable            ← GET /api/hub
├── InputControlSection
├── DistractionsSection
└── HabitAuditSection
```

### /health — Workout Tracker

```
health/page.tsx                 ← GET /api/health
├── WeeklyProgramChart            (daily_signals + workouts + reflections)
└── ExerciseHistory
```

---

## API Layer

| Route | Methods | Reads | Writes | Consumers |
|---|---|---|---|---|
| `/api/daily-signals` | GET, POST, DELETE | daily_signals.csv | daily_signals.csv (via router.ts) | DayView habits |
| `/api/health` | GET | daily_signals, workouts, reflections | — | /health page |
| `/api/hub` | GET | 8 CSVs + briefing.json | — | DayView, /vision |
| `/api/hub/briefing-feedback` | POST | briefing.json | briefing_feedback.csv | BriefingCard |
| `/api/plan` | POST, DELETE | — | plan.csv | DayView |
| `/api/plan/range` | GET | plan.csv, daily_signals.csv | — | PlanProvider, DayView |
| `/api/todos` | GET, POST, PUT, DELETE | todos.csv | todos.csv | PlanProvider, TodoList |
| `/api/vision` | GET, PUT, PATCH | vision.json | vision.json | DayView (ritual), /vision, checkin agents |

---

## Data Layer

### CSV Files (`data/`)

| File | Purpose | Headers | Primary Writers |
|---|---|---|---|
| `daily_signals.csv` | Habits, metrics, signals (flat key-value) | `date,signal,value,unit,context,source,capture_id,category` | /checkin, /log, process agent, plan agent, weekly agents |
| `workouts.csv` | Set-level gym data | `date,workout,exercise,set,weight,reps,notes` | /log |
| `plan.csv` | Time blocks + scheduled items | `date,start,end,item,done,notes,domain` | plan agent, DayView |
| `todos.csv` | Action backlog | `id,item,done,created,domain` | plan agent, /log, todo agent |
| `reflections.csv` | Micro-AARs | `date,domain,win,lesson,change,archived` | process agent, weekly-reflect agent |
| `experiments.csv` | Time-boxed behavior experiments | `name,hypothesis,start_date,duration_days,domain,status,verdict,reflection` | /checkin |
| `groceries.csv` | Grocery items by section | `item,section,done,added` | (no active consumer) |
| `resources.csv` | Books, articles, resources | `title,author,type,domain,status,notes` | (no active consumer) |
| `quotes.csv` | Curated quotes | (internal to /api/hub) | — |
| `briefing_feedback.csv` | Briefing ratings | `date,state,rating,feedback_text,briefing_hash` | BriefingCard |

### vision.json (`data/`)

```
{
  identityScript:    { coreTraits: {health,wealth,love,self}, nonNegotiables, languageRules, ... }
  antiVision:        { health, wealth, love, self }
  domains:           [{ id, actual, becoming, timeline, habits, hex, canonicalIds }]
  intentions:        { daily, weekly }
  ritualBlueprint:   { morning, midday, evening → { steps[], habitStacks[] } }
  inputControl:      { mentors, books, podcasts, playlists, nutritionRules, purgeList }
  distractions:      { digital, physical, social, mental, triggerReplacements }
  habitAudit:        { productive, neutral, destructive }
}
```

### 4-Pillar Vision Model

| Pillar | ID | Canonical Domain IDs | Covers |
|--------|-----|---------------------|--------|
| Health | `health` | `health` | Body comp, training, nutrition, sleep, emotional regulation |
| Wealth | `wealth` | `career`, `finances` | Deep work, output, visibility, income, net worth |
| Love | `love` | `relationships` | Partner, friends, family, social |
| Self | `self` | `personal_growth`, `fun`, `environment` | Reading, meditation, addiction recovery, hobbies, home |

7 canonical domain IDs (`health`, `career`, `relationships`, `finances`, `fun`, `personal_growth`, `environment`) are the tagging standard in all CSVs. The 4-pillar model is the human-facing overlay for vision.json and weekly+ check-ins.

---

## Write Architecture

Three write paths. Each has different scope and side-effect behavior.

```
Path 1: API writes via router.ts (UI-initiated)
─────────────────────────────────────────────────
  UI action → API route → router.ts: writeAndSideEffect()
    ├── Primary write → csv.ts
    └── Side effects (one level deep):
         workout rows  → ensure gym=1
         gym=1         → mark plan "Gym" done
         sleep=1       → mark plan "Sleep" done
         meditate=1    → mark plan "Meditate" done
         deep_work=1   → mark plan "Deep work" done

Path 2: Agent-bypass writes (skill-initiated)
─────────────────────────────────────────────────
  /checkin → agent → Bash write directly to CSV
    └── NO router.ts, NO side effects
    └── Intentional: agents batch-write, per-write effects would double-fire

Path 3: reconcile.js (post-checkin bridge)
─────────────────────────────────────────────────
  /checkin daily → all writes → reconcile.js
    └── Reads today's signals → applies SIGNAL_TO_PLAN_KEYWORD map
    └── Auto-marks matching plan items done
    └── Compensates for agent-bypass path
```

### Vision Write Semantics

| Cadence | Method | Fields | Merge |
|---------|--------|--------|-------|
| Weekly | PATCH | `domains[].actual`, `domains[].habits`, `intentions.weekly` | Deep merge |
| Monthly | PATCH | `identityScript`, `antiVision`, `intentions` | Key replace |
| Quarterly | PUT | All fields | Full replace |

Daily checkins do NOT write to vision.json.

---

## Cadence System

```
         Daily              Weekly (Sun)        Monthly (last Sun)  Quarterly
         ─────              ────────────        ──────────────────  ─────────
Trigger  /checkin            /checkin weekly     /checkin monthly    /checkin quarterly
         or /log
           │                   │                    │                   │
Script   precompute-         precompute-          (none)             (none)
         checkin.js          weekly.js
           │                 --html → report
           │                   │                    │                   │
Menu     ┌─┼─┐                 │                    │                   │
         │ │ │                 │                    │                   │
         ▼ ▼ ▼                 ▼                    ▼                   ▼
Agents   L P Pr             wk-reflect           (inline)           (inline)
         o l r              wk-vision            no agents           no agents
         g a o              plan(week)
           n c
             e
             s
             s
           │                   │                    │                   │
Writes   signals            reflections          identityScript     ALL fields
         plan               signals              antiVision         (full rebuild)
         reflections        vision.json          intentions
         todos              plan
           │                   │                    │                   │
Flag     checkin_daily=1    checkin_weekly=1     checkin_monthly=1  checkin_quarterly=1
```

### Writes by Cadence

```
                 │  Daily  │  Weekly  │  Monthly   │ Quarterly  │
─────────────────┼─────────┼──────────┼────────────┼────────────┤
 daily_signals   │    ✓    │    ✓     │  flag only │ flag only  │
 reflections     │    ✓    │    ✓     │     —      │     —      │
 plan.csv        │    ✓    │    ✓     │     —      │     —      │
 todos.csv       │    ✓    │    —     │     —      │     —      │
 vision.json     │    —    │  PATCH   │   PATCH    │    PUT     │
─────────────────┼─────────┼──────────┼────────────┼────────────┤
 completion flag │ _daily=1│_weekly=1 │ _monthly=1 │_quarterly=1│
```

### Daily Detail

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

### Weekly Detail

```
/checkin weekly
  ├── Step 1: precompute-weekly.js --html → open report
  ├── Step 2: → weekly-reflect agent
  │              ├── domain spotlight (2-3 domains)
  │              ├── feedback loop audit
  │              ├── B×A×D check + inversion quick-scan
  │              └── social contact
  │            → writes: reflections.csv + daily_signals.csv
  ├── Step 3: → weekly-vision agent
  │              ├── review last week's goals (✓/✗/~)
  │              ├── set this week's goals + intention
  │              └── update ABT(H) per pillar (actual + habits)
  │            → writes: daily_signals.csv + vision.json (PATCH)
  ├── Step 4: → plan agent (week mode) → plan.csv
  └── Step 5: checkin_weekly=1 → daily_signals.csv
```

### Monthly Detail

```
/checkin monthly (inline — no agents)
  ├── Trajectory report (30 days signals/reflections)
  ├── 7 structured questions
  ├── Vision rewrite: identityScript + antiVision + intentions → PATCH vision.json
  └── checkin_monthly=1 → daily_signals.csv
```

### Quarterly Detail

```
/checkin quarterly (inline — no agents)
  ├── Strategic orientation (3 questions)
  ├── Full ABT(H) rebuild per pillar
  ├── Ritual blueprint + habit audit + input control
  │   → PUT vision.json (full replace)
  └── checkin_quarterly=1 → daily_signals.csv
```

---

## Skills

All skills are in `.claude/skills/`. Invoked via `/skill-name` in Claude Code.

### /checkin — Single entry point for all writes

```
/checkin                       → auto-detect cadence, show menu
/checkin daily                 → force daily check-in
/checkin weekly                → force weekly check-in (Sundays)
/checkin monthly               → force monthly check-in (last Sunday)
/checkin quarterly             → force quarterly check-in
/checkin add <item> <time>     → quick-add plan block
/checkin done <item>           → mark block done + auto-signal
/checkin move <item> <time>    → move plan block
/checkin intention [text]      → set/view daily intention
/checkin show                  → show today's plan + context
```

### /log — Quick one-off CSV writes

```
/log weight <number>                        → daily_signals.csv
/log day <metric:value ...>                 → daily_signals.csv
/log workout <exercise> <weight>x<reps>     → workouts.csv
/log trigger "<trigger>" "<context>"        → daily_signals.csv
/log relapse <substances...>                → daily_signals.csv
/log reset                                  → daily_signals.csv
/log note "<text>"                          → todos.csv
```

### /weekly-review — Read-only scorecard

```
/weekly-review    → precompute-weekly.js → score card + mood/trigger arc (no writes)
```

### /review-notes — Cross-CSV activity summary

```
/review-notes              → last 7 days (default)
/review-notes day          → today
/review-notes week         → last 7 days
/review-notes month        → last 30 days
/review-notes all          → all time
```

### /todo — Task management

```
/todo              → list, add, complete, or remove items in todos.csv
```

### /brain-state — Neuroscience-informed assessment (stale)

```
/brain-state       → compute-brain-state.js → streaks, habit grid, vice/positive load
⚠ Agent file archived — absorbed into morning report script.
```

### /relationship — CBT-informed relationship coach

```
/relationship      → thought records, pattern review, state snapshots
```

### /feature-interview — Feature spec generation

```
/feature-interview → audit → interview → lock decisions → write spec to docs/specs/
```

### /audit — Codebase health scan

```
/audit             → find dead files, stale docs, orphaned code → docs/audits/ (read-only)
```

### /remove-slop — Strip AI slop from diff

```
/remove-slop       → reads git diff → edits modified TS/TSX files
```

### /qa — Live smoke test via Chrome

```
/qa                → Chrome browser → console + network → fix issues with approval
```

---

## Scripts

All in `scripts/`. Two shared utilities, six purpose-built.

| Script | Purpose | Called By |
|---|---|---|
| `config.js` | Shared constants: SIGNAL_TO_PLAN_KEYWORD, HABIT_LIST, ADDICTION_SIGNALS | All scripts |
| `csv-utils.js` | CSV read/write/parse/pivot utilities | All scripts |
| `precompute-checkin.js` | All CSVs → state cards + digest for /checkin | /checkin (daily) |
| `precompute-plan.js` | Today's plan blocks + set-tomorrow data | plan agent |
| `precompute-weekly.js` | Weekly scorecard — HTML report or plain text | weekly agents, /weekly-review |
| `compute-brain-state.js` | Streaks, habit grid, vice/positive load analysis | /brain-state |
| `compute-morning-report.js` | Self-contained HTML morning report with AI narrative | Standalone |
| `reconcile.js` | Post-checkin bridge: auto-marks plan items done from signals | /checkin (daily, post-write) |

---

## Components

All in `app/app/components/`.

| Component | Used By | Purpose |
|---|---|---|
| `DayView` | /plan/day | Daily home page — ritual, habits, schedule, todos |
| `WeekView` | /plan/week | Weekly calendar grid |
| `MonthView` | /plan/month | Monthly overview |
| `YearView` | /plan/year | Yearly overview |
| `PlanBlock` | DayView | Single schedule block |
| `PlanCard` | DayView | Plan summary card |
| `Timeline` | DayView | Time-based schedule view |
| `TimelineItem` | Timeline | Single timeline entry |
| `NowLine` | Timeline | Current time indicator |
| `TodoList` | DayView | Todo management |
| `TodoItem` | TodoList | Single todo entry |
| `DailyTaskItem` | DayView | Ritual checklist item |
| `HabitLogHistory` | DayView | 90-day habit grid |
| `HabitTooltip` | HabitLogHistory | Hover tooltip for habit cells |
| `BriefingCard` | DayView | Daily briefing + feedback |
| `WorkoutCard` | /health | Workout summary |
| `WeeklyProgramChart` | /health | Weekly program visualization |
| `ExerciseHistory` | /health | Exercise progression |
| `WeightChart` | (unused) | Weight trend chart |
| `LineTrendChart` | various | Generic line chart |
| `TrendModal` | various | Trend detail overlay |
| `ExperimentsTable` | /vision | Active experiments table |
| `BottomNav` | layout | Sticky top navigation bar |

---

## Gym Rotation

Pure completion-based 7-day rotation: A→B→C→D→E→F→G→A...

| Day | Type | Exercises |
|-----|------|-----------|
| A | Lift | Squat, Bench, Lat Pulldown |
| B | Lift | OHP, Lat Row, Incline Bench |
| C | Lift | RDL, Bench, Pullup |
| D | Lift | Front Squat, Incline Bench, Lat Row |
| E | Lift | Lunges, OHP, Pullup |
| F | Cardio | Zone 2 (45 min) |
| G | Cardio | Moderate (25 min) |

`getNextWorkout()` in `csv.ts` reads last gym signal. `GYM_ROTATION` constant defined in `csv.ts`.

---

## Side Effects (router.ts)

One level deep — secondary writes call csv.ts directly, never re-enter the router.

```
workout rows written   → ensure gym=1 in daily_signals
gym=1                  → mark plan "Gym" done
sleep=1                → mark plan "Sleep" done
meditate=1             → mark plan "Meditate" done
deep_work=1            → mark plan "Deep work" done
```

Six write types: `workout`, `signal`, `reflection`, `todo`, `grocery`, `plan`.
Keyword map from `scripts/config.js:SIGNAL_TO_PLAN_KEYWORD`. Case-insensitive substring match.

**Duplication note:** `router.ts` and `reconcile.js` both implement signal→plan keyword mapping. `scripts/config.js:SIGNAL_TO_PLAN_KEYWORD` is the canonical source for both.

**Agent bypass:** Weekly/monthly/quarterly agents write directly to CSVs via Bash, bypassing `router.ts`. Side effects do NOT fire for agent-initiated writes. This is intentional — agents batch-write where per-write effects would double-fire. `reconcile.js` compensates for daily flows only.

---

## Constraints

- CSVs are truth. No database migration.
- Logic in `lib/` and `api/`, never in page components.
- Flat navigation only — depth via in-page UI (tabs, modals, drawers).
- Config values in `config.ts` are static — runtime data in CSV.
- Phone intake via iMessage channel (`claude --channels plugin:imessage`).
- Agents are for reasoning, not computation. Compute belongs in `scripts/`.
- Single-user local-first model (no auth boundary).

---

## Development

```bash
cd app && nvm use 22.14.0 && npm run dev
```

Build: `cd app && npm run build`
