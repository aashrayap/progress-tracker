# Research: Health Page Redesign

## Flagged Items
- Q3: Recent gym signals (2026-03-20+) lack workout key in context/category, causing rotation to fall back to "A" — silent data integrity issue
- Q7: Inconsistent use of `context` and `category` fields for workout key storage across gym signals

## Findings

### Q1: What components and layout does `/health` currently render?
- **Answer**: Client component in `app/app/health/page.tsx` rendering 4 sections in `max-w-lg` centered column: header stats row (Gym Streak, Last 7 Days, Eating score), WorkoutCard, WeightChart, ExerciseHistory, GroceryCard (conditional). Calls `/api/health` and `/api/groceries`.
- **Confidence**: high
- **Evidence**: app/app/health/page.tsx:1-199, app/app/components/WorkoutCard.tsx, WeightChart.tsx, ExerciseHistory.tsx, GroceryCard.tsx
- **Conflicts**: none
- **Open**: none

### Q2: What API routes does the health page call, and what data shape does each return?
- **Answer**: `GET /api/health` returns `{ weight, workouts, gymToday, gymStreak, gymLast7, mealsToday, eatingSummary, gymReflection, exerciseProgress }`. The `workouts` object includes `today`, `history`, `nextWorkout`, `templateKey`, `displayTemplate`, `displayExercises`, `totalSets`, `cardioFinisherMin`, `rotationLength`, `isCardio`, `cardioInfo`, `rotation`, `exerciseTargets`. `GET /api/groceries` returns `{ sections, totalItems, doneItems }`.
- **Confidence**: high
- **Evidence**: app/app/api/health/route.ts:92-193, app/app/health/page.tsx:29-46
- **Conflicts**: none
- **Open**: none

### Q3: How does the current gym rotation work?
- **Answer**: `GYM_ROTATION = ["A","B","C","D","E","F","G"]` in csv.ts:672. `getNextWorkout()` (csv.ts:681-700) filters daily_signals for `gym=1`, walks backward to find "Day X" in context/category, returns `(lastIdx + 1) % 7`. Falls back to cycle[0] if no key found.
- **Confidence**: high
- **Evidence**: app/app/lib/csv.ts:672-700, app/app/lib/config.ts:36-68
- **Conflicts**: precompute-checkin.js parses context only (not category) — slight inconsistency. Several recent gym signals lack workout key in both fields.
- **Open**: Missing workout keys cause incorrect rotation — real data quality risk.

### Q4: How does the health page display workout templates?
- **Answer**: WorkoutCard renders full per-exercise list with prescribed sets/reps, progressive overload targets, today's target, and last session's logged sets for comparison. Logged exercises show in green.
- **Confidence**: high
- **Evidence**: app/app/components/WorkoutCard.tsx:114-193, app/app/api/health/route.ts:149-156
- **Conflicts**: none
- **Open**: none

### Q5: What workout logging flow exists?
- **Answer**: No in-app form for logging sets/reps/weight. Only UI action is "Mark Done" button writing `gym=1` to daily_signals. Set-level data logged exclusively via voice (iOS shortcut → GitHub Issue → voice-inbox.sh → workouts.csv).
- **Confidence**: high
- **Evidence**: app/app/health/page.tsx:79-108, app/app/components/WorkoutCard.tsx:84-89, 187
- **Conflicts**: none
- **Open**: No in-app set-logging UI exists.

### Q6: What columns exist in workouts.csv?
- **Answer**: `date,workout,exercise,set,weight,reps,notes` — strictly set-level, one row per set. Sessions reconstructed by grouping rows for a date via `groupWorkoutsByDay()`.
- **Confidence**: high
- **Evidence**: app/app/lib/csv.ts:33, 453-510
- **Conflicts**: none
- **Open**: none

### Q7: How does daily_signals.csv track gym attendance?
- **Answer**: `signal=gym`, `value=1` (attended) or `value=0` (skipped). Context optionally stores "Day A" etc, category optionally stores workout key. Inconsistent usage across signals.
- **Confidence**: high
- **Evidence**: data/daily_signals.csv, docs/data-schemas.md:35-36, app/app/lib/csv.ts:672-700
- **Conflicts**: category values inconsistent — sometimes workout key, sometimes "habits"/"health", sometimes empty.
- **Open**: none

### Q8: Is there existing missed workout or catch-up logic?
- **Answer**: No catch-up logic exists. System is purely completion-based: getNextWorkout() only looks at gym=1 signals, advances to next letter. Skipped days (gym=0) are ignored entirely. Neither precompute-weekly.js nor checkin skill adjusts rotation for misses.
- **Confidence**: high
- **Evidence**: app/app/lib/csv.ts:681-700, data/daily_signals.csv:243-257, scripts/precompute-checkin.js:278-301
- **Conflicts**: none
- **Open**: none

### Q9: How does the system determine which workout is "next"?
- **Answer**: Strictly by completion sequence. Find last gym=1 signal with parseable key, look up in A-G array, return (index+1)%7. Day-of-week is never consulted. Missing days don't count.
- **Confidence**: high
- **Evidence**: app/app/lib/csv.ts:681-700, app/app/lib/config.ts:159
- **Conflicts**: none
- **Open**: Recent gym signals lack workout key data, causing silent fallback to "A".

### Q10: How does `/checkin` interact with workout logging?
- **Answer**: `/checkin` logs gym signal (0/1) to daily_signals via Log option. Actual set data handled by `/log workout` → workouts.csv. precompute-checkin.js reads gym signals to display "Last gym" in Card 2 and surfaces last_workout (day label + next) in digest.
- **Confidence**: high
- **Evidence**: .claude/skills/checkin/SKILL.md:187-227, .claude/skills/log/SKILL.md:33-37, scripts/precompute-checkin.js:279-301, 413-425
- **Conflicts**: none
- **Open**: Health page is never linked from checkin flow.

### Q11: Does `/checkin` reference gym rotation or suggest today's workout?
- **Answer**: Logs gym=1/0 but does NOT suggest today's workout or prompt for details. precompute-checkin.js derives next rotation day from last gym signal context ("Last gym: Day X → next: Day Y") and exposes digest.last_workout.next — informational only.
- **Confidence**: high
- **Evidence**: scripts/precompute-checkin.js:40, 279-301, 413-425; .claude/skills/checkin/SKILL.md:103-113
- **Conflicts**: none
- **Open**: none

### Q12: What would need to change in `/checkin` if rotation switches to fixed day-of-week?
- **Answer**: Three changes: (1) buildCard2 and buildDigest logic that reads "Day X" from context and advances sequentially → map today's weekday to fixed workout instead; (2) WORKOUT_CYCLE array and (idx+1)%7 logic → {Mon: A, Tue: B, ...} lookup; (3) context written to daily_signals for gym=1 would store weekday-mapped label, or rotation lookup shifts to calendar weekday entirely.
- **Confidence**: high
- **Evidence**: scripts/precompute-checkin.js:40, 283-299, 418-424
- **Conflicts**: none
- **Open**: csv.ts getNextWorkout() also needs updating (not examined by this agent).

### Q13: How do other pages handle highlighting "today" or "current"?
- **Answer**: All views compute isToday via `toDateStr(new Date())` comparison, apply `bg-blue-500/5 border-blue-500/30` container + `text-blue-400` date label. Habit grid adds `ring-2 ring-zinc-400 ring-offset-1` on today cell. DayView renders NowLine (green line) between past/future blocks.
- **Confidence**: high
- **Evidence**: WeekView.tsx:26,40-53,82-98; MonthView.tsx:19,81-105; YearView.tsx:48,60-69; DayView.tsx:157-158,745-746,782-795,852-870; NowLine.tsx
- **Conflicts**: none
- **Open**: none

## Patterns Found
- Pattern A: `isToday` string comparison — `toDateStr(new Date())` — 8+ occurrences across 4 files
- Pattern B: Blue container highlight — `bg-blue-500/5 border-blue-500/30` — 5 occurrences
- Pattern C: `text-blue-400` for today's date label — 6 occurrences
- Pattern D: `ring-2 ring-zinc-400` on today's habit grid cell — 3 occurrences
- Pattern E: NowLine temporal separator — 1 render site in DayView
- Pattern F: `isToday` gates entire UI sections — 4 occurrences in DayView

## Core Docs Summary
- `/health` is a high-gravity daily surface for workout logging and body metrics
- `workouts.csv` is set-level (`date,workout,exercise,set,weight,reps,notes`)
- `daily_signals.csv` holds binary gym attendance (`gym: 0|1`)
- Side effect: writing workout rows → auto-ensures gym=1
- Gym rotation logic lives entirely in csv.ts, not documented in core docs
- Flat navigation rule applies — no sub-routes off `/health`
- 3-layer boundary: CSV data / lib+api intelligence / pages surface

## Open Questions
- Recent gym signals lack workout key data — rotation silently falls back to "A"
- No in-app set-logging UI exists (voice only)
- csv.ts getNextWorkout() needs updating alongside precompute-checkin.js if rotation changes
