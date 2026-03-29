# Research Questions: Unified Cadence System

## Codebase Questions
1. What validation does the plan API (`/api/plan/route.ts`) enforce on `start` and `end` fields? Can they be 0, empty string, or null currently?
2. How does DayView distinguish "all-day events" (start=0, end=0) from missing data? What renders differently?
3. What does the `/checkin` daily "plan today" step actually write to plan.csv — does it always require times, or can it write timeless entries?
4. How does the SchedulerModal populate its initial state — does it read from plan.csv directly or receive props?
5. What signals does `/checkin` daily write to daily_signals.csv upon completion? Is there a `checkin_daily:1` flag or similar?
6. Does `/checkin` currently detect time-of-day (morning vs evening), or does it always run the same daily flow?
7. How does the `/relationship` skill structure its CBT thought record flow — what are the exact steps, and what does it write to CSV?
8. What does `/plan week` currently write to plan.csv — does it produce one row per day, or multiple rows with times?
9. How does the vision page determine which ritual tab to auto-select — is it just `new Date().getHours()` or something more?
10. What does the PlanCard component on the vision page show — only timed blocks, or also all-day/timeless entries?
11. How does `precompute-checkin.js` work — what data does it compute and return to the checkin skill?
12. What's the current rollover logic in `/checkin` daily — how does it handle yesterday's unfinished plan blocks?

## Core Docs Questions
13. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about plan.csv schema constraints, the cadence contract, and which surfaces are read-only vs interactive?

## Pattern Questions
14. What pattern do existing skills use to present menus/options to the user — is there a standard format for "pick from these choices"?
15. How do skills currently call other skills or share logic — is there any precedent for one skill delegating to another?

## Open Questions
16. Should the crossroads intervention be a standalone option in `/checkin`'s menu (e.g., "crossroads check"), or should it trigger automatically when certain signals are detected (e.g., logging a slip)?
17. When you say "no editing from within the app" — does that mean the Edit Plan button on DayView should be removed entirely, or just that we don't build new editing UI?
18. Should `/plan` remain as a thin CLI alias for quick mutations (add/done/move), or should it be fully absorbed into `/checkin` with no separate entry point?
19. For the "which page when" question — is the vision page the morning-only surface and `/plan/day` the during-the-day surface? Or do you want a single page that adapts?
