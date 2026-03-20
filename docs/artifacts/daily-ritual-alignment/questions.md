# Research Questions: Daily Ritual Alignment

Feature: Align the tracker's vision page, planning system, and daily surfaces into a repeatable morning/afternoon/evening interaction protocol, grounded in the Reinvention Formula and Reshaping Protocol frameworks.

## Codebase Questions

1. What does the current vision page (`/vision` or equivalent route) display, and what components does it render?
2. What data does `data/vision.json` (or equivalent vision data file) contain — structure, fields, and content?
3. What does the `/plan` route display, and what sub-routes exist (day/week/month/year)?
4. What does the plan day view show — does it have morning/afternoon/evening sections or time blocks?
5. What does the `/` hub route display — what cards, signals, or status info does it surface?
6. What does the daily check-in skill (`/checkin`) capture, and what CSV fields does it write to?
7. What does the briefing pipeline (`scripts/briefing-pipeline.sh`) produce, and what data feeds `data/briefing.json`?
8. What habits/signals are currently tracked in `daily_signals.csv` — what signal names exist in recent rows?
9. What does `data/plan.csv` look like for a typical day — what blocks exist and how are they structured?
10. Does the app currently have any concept of "identity script", "north star", or "vision statement" stored in data files or config?
11. What does the `/health` route display, and how does it connect to daily_signals and workouts data?
12. What reflection/review mechanisms exist — does the `/checkin` or `/weekly-review` skill write to `reflections.csv`?
13. What is the current navigation structure — what top-level routes exist and what does the nav bar render?
14. Does `data/experiments.csv` exist and what does it track?

## Core Docs Questions

15. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature — specifically vision, planning, daily rituals, and how surfaces should interact?

## Framework Mapping Questions

16. Where in the current system would the "ABT(H) formula" (Actual → Becoming → Timeline → Habits) live — is there any per-domain goal tracking with current state vs target state?
17. Does the system currently support any form of "identity reinforcement" — morning affirmations, identity script review, or north star review as part of a daily flow?
18. Is there any existing concept of "input audit" or "distraction tracking" in the signals or reflections data?
19. Does the system track "compressed cycles" or feedback loops — e.g., daily action → feedback → adjustment sequences?

## Resolved Questions

20. RESOLVED: Use the 4-domain model from the scripts (health, wealth, love, self). Map the existing 7-domain taxonomy onto these 4 pillars.
21. RESOLVED: Yes — the vision page IS the primary morning ritual surface. It's where the user starts each day, week, and month to build momentum.

## Open Questions

22. How much of the ritual should be in-app vs assumed to happen offline (pen-and-paper identity writing, cold showers, etc.)?
