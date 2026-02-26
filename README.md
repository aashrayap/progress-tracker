# Progress Tracker

Personal operating system for weight, addiction recovery, fitness, and deep work.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DECISION LOOP                              │
│                                                                     │
│  Capture ──→ Interpret ──→ Decide ──→ Execute ──→ Reflect ──→ Adapt │
│     │            │            │           │           │          │   │
│  log.csv     API routes    Hub page    plan.csv   reflections  next  │
│  voice       patterns      prompts     todos.csv  .csv         day  │
│  workouts    insights      morning/    workouts   win/lesson/       │
│              streaks       evening                change             │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Layer

```
┌──────────────┬───────────────┬──────────────┬─────────────────┐
│  log.csv     │  plan.csv     │  todos.csv   │ reflections.csv │
│  habits +    │  time blocks  │  backlog     │  win / lesson / │
│  metrics +   │               │              │  change         │
│  notes       │               │              │                 │
├──────────────┴───────────────┴──────────────┴─────────────────┤
│  workouts.csv (set-level gym data)                            │
└───────────────────────────────────────────────────────────────┘
```

## Surfaces

```
Morning         Day              Evening
─────────       ─────────        ─────────
yesterday's     schedule         domain reflection
changes         habit tracking   win / lesson / change
risk flags      gym / deep work  carry forward to tomorrow
one key action  meal logging
```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Hub — status, streaks, insights, morning priming |
| `/plan` | Calendar — year/month/week/day + todos |
| `/work` | Deep work — sessions, categories, reflections |
| `/health` | Gym + weight + eating |

## Input

```
Manual:  CLI skills (/log, /reflect, /weekly-review)
Voice:   iPhone → GitHub Issue → voice-inbox.sh → CSV
App:     Next.js forms → API routes → CSV
```

## Setup

```bash
cd app && npm install && npm run dev   # requires Node >= 20.9
```

## Docs

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant context (always loaded) |
| `docs/personal-os.md` | Principles + visual loop + operator flow + phased plan |
| `docs/life-playbook.md` | Consolidated life protocols (vision, fitness, meals, addiction, finance, travel) |
