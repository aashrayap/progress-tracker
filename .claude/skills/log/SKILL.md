---
name: log
description: Structured data entry into canonical CSVs. Use for log requests like weight, habits, workout, relapse, trigger, or notes.
---

# Log

Write structured entries to tracker CSVs.

## Canonical Files
- `~/Documents/tracker/daily_signals.csv`
- `~/Documents/tracker/workouts.csv`
- `~/Documents/tracker/todos.csv`

## Daily Signals Header
```
date,signal,value,unit,context,source,capture_id,category
```

## Supported Commands
- `/log weight <number>`
- `/log day <metric:value ...>`
- `/log trigger "<trigger>" "<context/result>"`
- `/log relapse <substances...>`
- `/log reset`
- `/log note "<text>"` (route to todo)
- `/log workout <exercise> <weight>x<reps>x<sets> [...]`

## Metric Conventions
- Addiction signals (`lol`, `weed`, `poker`): `0=relapse`, `1=clean`
- Habit signals (`gym`, `sleep`, `meditate`, `deep_work`, `ate_clean`): `0=missed`, `1=done`
- Numeric metrics (`weight`, `calories`, `steps`) store number values

## Workout Logging
Append one row per set to `workouts.csv`.

When workout sets are logged, also append `gym=1` to `daily_signals.csv` for that date.

## Behavior
1. Parse command
2. Resolve date (default today)
3. Validate required fields
4. Append to canonical file(s)
5. Confirm exactly what was logged

## Rules
- Do not invent values.
- Preserve user wording in `context` when useful.
- Keep writes append-only unless explicitly asked to edit/correct.
