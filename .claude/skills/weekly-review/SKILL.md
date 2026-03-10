---
name: weekly-review
description: Weekly accountability review using tracker CSV data.
---

# Weekly Review

Quick data-only snapshot. For the full interactive weekly check-in (with domain spotlight, experiments, goals, and intention setting), use `/checkin weekly`.

This skill runs Phases 1-2 only from the weekly check-in — the quantitative score card and mood/trigger arc. No interactive questions, no writes.

## Core Sources
- `~/Documents/2026/tracker/data/daily_signals.csv`
- `~/Documents/2026/tracker/data/workouts.csv`
- `~/Documents/2026/tracker/data/reflections.csv`
- `~/Documents/2026/tracker/data/plan.csv`
- `~/Documents/2026/tracker/data/todos.csv`
- `~/Documents/2026/tracker/docs/vision.md`

## Output

Run the same computation as `/checkin weekly` Phase 1 (Score Card) and Phase 2 (Mood & Trigger Arc). Present the auto-generated output. Do not ask interactive questions or write to any CSVs.

## Rules
- Use actual logged data only.
- Highlight patterns, not anecdotes.
- Read-only — no CSV writes.
