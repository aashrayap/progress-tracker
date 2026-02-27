# Progress Tracker

Personal operating system for weight, addiction recovery, fitness, and deep work.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DECISION LOOP                              │
│                                                                     │
│  Capture ──→ Interpret ──→ Decide ──→ Execute ──→ Reflect ──→ Adapt │
│     │            │            │           │           │          │   │
│ inbox.csv    API routes    Hub page    plan.csv   reflections  next  │
│ daily_signals patterns     prompts     todos.csv  .csv         day   │
│ workouts     insights      review      ideas.csv  win/lesson/       │
│              streaks       evening                change             │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Layer

```
┌──────────────┬───────────────┬──────────────┬─────────────────┐
│ inbox.csv    │ daily_signals │ plan.csv     │ reflections.csv │
│ raw capture  │ habits +      │ time blocks  │ win / lesson /  │
│ queue        │ execution     │ + events     │ change          │
├──────────────┴───────────────┴──────────────┴─────────────────┤
│ workouts.csv (lift benchmarks)  | ideas.csv (triage backlog)  │
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
| `/review` | Capture review queue (`inbox`) |
| `/plan` | Calendar — year/month/week/day + todos |
| `/reflect` | Reflection analysis + deep work patterns |
| `/health` | Gym + weight + eating |
| `/ideas` | Idea triage (`inbox/reviewed/building/archived`) |

## Input

```
Manual:  CLI skills (/log, /reflect, /weekly-review)
Voice:   iPhone → GitHub Issue → voice-inbox.sh → CSV
App:     Next.js forms → API routes → CSV
```

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
