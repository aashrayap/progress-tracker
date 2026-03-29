# Research Questions: Health Page Redesign

## Codebase Questions

### Current Health Page
1. What components and layout does `/health` currently render? (file paths, component tree)
2. What API routes does the health page call, and what data shape does each return?
3. How does the current gym rotation work — what's in `GYM_ROTATION`, `getNextWorkout()`, and how does it determine "today's workout"?
4. How does the health page currently display workout templates — per-exercise list, or just the day label?
5. What workout logging flow exists — how does a user mark exercises as done, log sets/reps/weight?

### Data Layer
6. What columns exist in `workouts.csv` and how are completed workouts stored? (set-level or session-level?)
7. How does `daily_signals.csv` track gym attendance — what signal name, what values?
8. Is there existing "missed workout" or catch-up logic in the codebase? Where and how does it work?
9. How does the system currently determine which workout is "next" — by day-of-week or by completion sequence?

### Checkin Integration
10. How does the `/checkin` skill currently interact with workout logging and the health page?
11. Does `/checkin` reference gym rotation, suggest today's workout, or log gym signals?
12. What would need to change in `/checkin` if the rotation switches from completion-based (A-G) to fixed day-of-week (Mon-Fri)?

### Patterns
13. How do other pages handle highlighting "today" or "current" within a full view? (plan week view, habit grid, etc.)

## Core Docs Questions
14. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the health page, workout system, and gym rotation?
