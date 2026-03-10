---
name: log
description: Structured data entry into canonical CSVs. Use for log requests like weight, habits, workout, relapse, trigger, or notes.
---

# Log

Write structured entries to tracker CSVs.

## Canonical Files
- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/workouts.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/data/code-todos.csv`

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
- `/log note "<text>" --file=<path> --line=<number>` (route to code-todos with file context)
- `/log workout <exercise> <weight>x<reps>x<sets> [...]`

## Metric Conventions
- Addiction signals (`lol`, `weed`, `poker`, `clarity`): `0=relapse`, `1=clean`
- Habit signals (`gym`, `sleep`, `meditate`, `deep_work`, `ate_clean`): `0=missed`, `1=done`
- Numeric metrics (`weight`, `calories`, `steps`) store number values

## Workout Logging
Append one row per set to `data/workouts.csv`.

When workout sets are logged, also append `gym=1` to `data/daily_signals.csv` for that date.

## Behavior
1. Parse command
2. Resolve date (default today)
3. Validate required fields
4. Append to canonical file(s)
5. Confirm exactly what was logged

## Code Todo Routing

When `/log note` includes `--file` or references a specific file path + line number:

1. Route to `data/code-todos.csv` instead of `data/todos.csv`
2. Header: `date,item,file_path,start_line,end_line,type,done,domain`
3. Parse flags:
   - `--file=<path>` — relative to project root (e.g., `app/lib/csv.ts`)
   - `--line=<number>` or `--line=<start>-<end>` — line range
4. Infer `type` from context: `refactor`, `fix`, `improve`, `feature`, `debt`, `investigate`
5. Set `domain=career`, `done=0`, `date=today`

If no `--file` flag and no file path detected in the note text, route to `todos.csv` as normal.

Auto-detection: if the note text naturally contains a file reference (e.g., "fix the auth flow in lib/auth.ts around line 42"), parse it without requiring explicit flags.

## Rules
- Do not invent values.
- Preserve user wording in `context` when useful.
- Keep writes append-only unless explicitly asked to edit/correct.
