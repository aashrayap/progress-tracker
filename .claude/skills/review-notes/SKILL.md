---
name: review-notes
description: Summarize recent activity across canonical CSVs.
---

# Review Notes

Read-only summary across tracker data for a selected period.

## Data Sources
- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/workouts.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`

## Commands
- `/review-notes` (default: last 7 days)
- `/review-notes day`
- `/review-notes week`
- `/review-notes month`
- `/review-notes all`

## Behavior
1. Resolve date window
2. Read all canonical files
3. Filter to window
4. Group by date (newest first)
5. Output compact summary + totals

## Output Includes
- Contextual/critical signals (`daily_signals`)
- Workout entries
- Reflections
- Plan blocks + completion state
- Todos created/completed

## Rules
- Read-only: never modify files.
- Do not include entries outside requested range.
- Keep format scannable and factual.
