# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER (CSVs)                       │
├─────────────┬──────────────┬──────────────┬────────────────┤
│ inbox.csv   │daily_signals │  plan.csv    │ reflections.csv│
│ raw capture │  daily facts │  schedule    │  win/lesson/   │
│ audit log   │  + execution │  blocks      │  change        │
├─────────────┴──────────────┴──────────────┴────────────────┤
│ workouts.csv (lift benchmarks) + todos.csv (single actions) │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │ Next.js  │   │ Claude   │   │ Voice Inbox  │
   │ App      │   │ CLI      │   │ Pipeline     │
   │ (app/)   │   │ /log     │   │              │
   │          │   │ /reflect │   │ iOS Shortcut │
   │ Reads    │   │ /weekly  │   │ → GH Issue   │
   │ CSVs →   │   │          │   │ → voice-     │
   │ web UI   │   │ Writes   │   │   inbox.sh   │
   │          │   │ to CSVs  │   │ → Claude CLI │
   └──────────┘   └──────────┘   │ → CSV write  │
                                  └──────────────┘
```

## Next.js App

```
app/
├── app/
│   ├── page.tsx          ← / (Hub)
│   ├── plan/page.tsx     ← /plan (Calendar planner)
│   ├── api/
│   │   ├── hub/route.ts  ← hub + next-action payload
│   │   ├── daily-signals/← canonical daily facts API
│   │   ├── health/route.ts← health dashboard API
│   │   ├── reflections/  ← reflection read/write API
│   │   ├── plan/         ← CRUD for plan.csv
│   │   └── todos/        ← CRUD for todos.csv
│   ├── components/       ← YearView, MonthView, WeekView, DayView, etc.
│   └── lib/
│       ├── config.ts     ← static config (profile, exercises, triggers)
│       └── csv.ts        ← CSV read/write utilities
```

## Shared Data Access Layer (`app/app/lib/csv.ts`)

- Single module centralizing CSV read/write logic and schema headers
- Supports append and overwrite patterns per table
- Shared helpers: `getMetricHistory`, `getStreak`, `getHabitsForDate`, `getNextWorkout`

Current constraints:
- No file locks (concurrency risk on simultaneous writes)
- Some updates key by business text fields rather than stable IDs
- Streak logic based on logged rows, not strict day continuity

## Config (`app/app/lib/config.ts`)

- Compound master exercise catalog
- Workout templates and weekly split
- Daily home-dose targets (pull-ups/push-ups)
- Known triggers and profile data

## Inbox Pipeline (Voice + Text)

Two iOS Shortcuts feed the same pipeline:
- **Send Voice To Claude** — dictation input (hands-free, used at gym)
- **Send Text To Claude** — text input (for when you can't speak)

Both create a GitHub Issue with a `Voice`-prefixed title → same processing.

```
Phone (iOS Shortcut — voice or text)
  │  dictate or type
  ▼
GitHub Issue (title: "Voice ...")
  │  created on aashrayap/progress-tracker
  ▼
voice-inbox.sh (scripts/, runs via launchd every 5s)
  │  polls open issues, filters "Voice" titles
  ▼
Claude CLI (--print, bypassPermissions)
  │  reads .claude/prompts/voice-inbox.md for instructions
  │  parses input → appends inbox audit row + routed CSVs
  ▼
CSV write (inbox.csv, daily_signals.csv, workouts.csv, reflections.csv, todos.csv)
  │  git commit + push
  ▼
GitHub Issue closed with summary comment
```

Voice shortcut used at gym for workout logging (dictate sets/reps between exercises).
Text shortcut used on the go when speaking isn't possible.

### Launchd Setup

```
Plist: ~/Library/LaunchAgents/com.ash.voice-inbox.plist
Interval: 5s
Logs:
  ~/.local/log/voice-inbox.log       (app log)
  ~/.local/log/voice-inbox-stdout.log (Claude CLI output)
  ~/.local/log/voice-inbox-stderr.log (errors)
```

Reload: `launchctl unload ~/Library/LaunchAgents/com.ash.voice-inbox.plist && launchctl load ~/Library/LaunchAgents/com.ash.voice-inbox.plist`

## API Surface

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hub` | GET | Primary decision payload (habits, next action, streaks, weight) |
| `/api/health` | GET | Weight trend, workout history, gym streak, progression |
| `/api/daily-signals` | GET/POST | Read/append daily signals |
| `/api/plan` | GET/POST/DELETE | CRUD for plan entries |
| `/api/plan/range` | GET | Events + habit map by date range |
| `/api/todos` | GET/POST/PUT/DELETE | CRUD for todos |
| `/api/reflections` | GET/POST | Reflection read/write + recurring lesson detection |

### Hub Decision Priority

1. Start next scheduled plan block if one is pending
2. Trigger training/cardio action if gym not yet logged
3. Else push reflection review
