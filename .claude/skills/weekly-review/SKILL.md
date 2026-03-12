---
name: weekly-review
description: Weekly accountability review using tracker CSV data.
---

# Weekly Review

Quick data-only snapshot. For the full interactive weekly check-in (with domain spotlight, experiments, goals, and intention setting), use `/checkin weekly`.

This skill runs Phases 1-2 only from the weekly check-in — the quantitative score card and mood/trigger arc. No interactive questions, no writes.

## Phase 1: Score Card

Run `node ~/Documents/2026/tracker/scripts/precompute-weekly.js` and parse the JSON output.

Display `display.score_card` **verbatim** — do not reformat, re-compute, or summarize it.

## Phase 2: Mood & Trigger Arc

Use `digest.mood_arc` and `digest.triggers` from the script output. AI interprets patterns only — do not re-read raw CSVs.

If `digest.mood_arc` has 3+ entries, present the emotional arc with pattern detection (correlation between mood shifts and habit misses/relapses). If fewer than 3, note "Not enough mood data this week."

If `digest.triggers` is non-empty, present triggers with pattern detection (time, circumstance, recurring patterns).

## Rules
- Read-only — no CSV writes.
- Do not read raw CSVs for score card generation or aggregation — the script handles all computation.
- Highlight patterns, not anecdotes.
- Use actual logged data only (via the script output).
