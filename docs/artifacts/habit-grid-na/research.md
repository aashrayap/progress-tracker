# Research: habit-grid-na/questions.md

## Flagged Items
- Q10: Medium confidence — core docs reference the habit grid but contain no structural specs for cell states or grid internals

## Findings

### Q1: What component renders the habit grid, and how is each cell structured?
- **Answer**: The habit grid is rendered in `DayView.tsx` (lines 731-913) as a 90-day grid. Each cell is a 27x27px div with `data-col` attribute, Tailwind classes for color, click handlers for trend modals, and mouseEnter handlers for tooltips. Cells are either single-signal (colored divs) or compound rows (vertical slices for multi-signal habits like Protocol).
- **Confidence**: high
- **Evidence**: `app/app/components/DayView.tsx:731-913`, lines 856-909 for row mapping, lines 874-876/898-900 for cell color logic
- **Conflicts**: none
- **Open**: none

### Q2: How does the habit grid handle hover tooltips?
- **Answer**: Tooltips rendered by `HabitTooltip` component (DayView lines 797-809). Shows formatted date + score (e.g., "Mar 28", "5/9") from dopamine scoring. Positioning uses `getBoundingClientRect()` relative to grid, centered above cell with CSS `translate(-50%, -100%)` and a downward arrow.
- **Confidence**: high
- **Evidence**: `app/app/components/HabitTooltip.tsx:12-62`, lines 27-34 for positioning, line 44 for transform; `DayView.tsx:797-809`
- **Conflicts**: none
- **Open**: Tooltip only shows date + score — no per-cell context/notes displayed

### Q3: What data source feeds the habit grid?
- **Answer**: `daily_signals.csv` → `/api/daily-signals` (GET) → `/api/hub` (aggregates via `getHabitsForDate()`) → DayView via `hubData.habitTracker`. The hub endpoint iterates 90+ days calling `getHabitsForDate(signals, date)` for each.
- **Confidence**: high
- **Evidence**: `/api/hub/route.ts:289-296`, `lib/csv.ts:408-416` for `getHabitsForDate()`, `DayView.tsx:218-230` for fetch
- **Conflicts**: none
- **Open**: Optimistic patching via `patchedTrackerDays` (DayView lines 402-417)

### Q4: How does the grid determine cell color/status?
- **Answer**: Three states: **true** = `bg-emerald-500`, **false** = `bg-red-500`, **null/undefined** = `bg-zinc-800`. Score cells use `computeDayScore()` (lines 124-141) with red/orange/lime/emerald gradient based on 0-9 scale.
- **Confidence**: high
- **Evidence**: `DayView.tsx:874-876,898-900` for cell colors, lines 124-141 for score colors
- **Conflicts**: none
- **Open**: none

### Q5: Is there any existing "disabled" or "skipped" day concept?
- **Answer**: No. The only related pattern is `archived=1` in reflections.csv. For signals, days are either logged (true/false) or unlogged (null). No N/A, skip, or per-day exception mechanism exists anywhere.
- **Confidence**: high
- **Evidence**: `lib/csv.ts:408-416`, `docs/data-schemas.md`, `lib/config.ts:143-148`
- **Conflicts**: none
- **Open**: none

### Q6: What date range does the grid display?
- **Answer**: 90+ days backward from today to nearest Monday. Calculated as `89 + ((todayDow + 6) % 7)` days. Today is always the last column with `ring-2 ring-zinc-400` border. Future dates not included.
- **Confidence**: high
- **Evidence**: `/api/hub/route.ts:289-292`, `DayView.tsx:757,839`
- **Conflicts**: none
- **Open**: none

### Q7: Any existing per-cell override mechanism?
- **Answer**: No. Only way to change a cell is logging a new signal via `handleHabitToggle()` (lines 311-374), cycling true→false→null. The `context` field exists in daily_signals.csv but is not surfaced in grid UI.
- **Confidence**: high
- **Evidence**: `DayView.tsx:311-374`, `lib/csv.ts:26,145-149`, `HabitTooltip.tsx:48`
- **Conflicts**: none
- **Open**: The context field could potentially be repurposed for N/A reasons

### Q8: How are tooltips implemented across the app?
- **Answer**: Dedicated `HabitTooltip` component for the grid with `onMouseEnter/onMouseLeave` handlers. Elsewhere, `group-hover` opacity transitions for action buttons (TodoItem, TodoList, TimelineItem). Also native HTML `title` attributes on some cells.
- **Confidence**: high
- **Evidence**: `HabitTooltip.tsx:1-62`, `DayView.tsx:771,841,877,890`, `TodoItem.tsx:42`, `TimelineItem.tsx:56`
- **Conflicts**: none
- **Open**: none

### Q9: What styling pattern does the habit grid use?
- **Answer**: Tailwind-only (no CSS modules). Cell states via background colors: emerald-500 (done), red-500 (missed), zinc-800 (unlogged). Score cells use gradient colors. Today marked with ring. Grid uses gap-3 (weeks), gap-1 (days), w-7 h-7 rounded cells.
- **Confidence**: high
- **Evidence**: `DayView.tsx:124-142,836-843,874-879,898-900`, `globals.css:1-6`, `HabitTooltip.tsx:47`
- **Conflicts**: none
- **Open**: none

### Q10: What do core docs say about habit grid and daily_signals?
- **Answer**: Core docs reference habit grid on `/plan/day` and `/vision` surfaces but contain no structural specs for cell states. daily_signals.csv has binary 0|1 habit signals with optional context field. No N/A mechanism documented.
- **Confidence**: medium
- **Evidence**: `docs/app-intent.md:40,51,144`, `README.md:419`, `docs/data-schemas.md:27-56`
- **Conflicts**: none
- **Open**: Core docs don't specify cell states, grid rendering rules, or N/A mechanisms

## Patterns Found

- **HabitTooltip component**: Dedicated positioned tooltip with `useEffect` + `getBoundingClientRect()` — 1 file (`HabitTooltip.tsx`)
- **onMouseEnter/onMouseLeave state tracking**: `hoveredCol` state drives tooltip visibility — 4 occurrences in `DayView.tsx`
- **group-hover opacity transitions**: `opacity-0 group-hover:opacity-100` for action buttons — 6 occurrences across TodoItem, TodoList, TimelineItem, YearView
- **Cell state colors**: emerald-500/red-500/zinc-800 for true/false/null — consistent across single and compound cells
- **Today ring indicator**: `ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950` — 3+ occurrences in grid rows
- **Tailwind-only styling**: No CSS modules anywhere in component directory

## Core Docs Summary

- Habit grid appears on `/plan/day` (daily) and `/vision` (weekly review)
- Component: `HabitLogHistory` with child `HabitTooltip`
- Canonical habit signals: `gym`, `sleep`, `meditate`, `deep_work`, `ate_clean`, `wim_hof_am`, `wim_hof_pm` — all binary 0|1
- Optional fields: `unit`, `context`, `source`, `category` — context exists but unused in grid display
- Side effects: `gym=1` auto-marks plan item done (one level deep)
- CSV is canonical truth; no database

## Open Questions
- Whether the `context` field in daily_signals.csv is the right place to store N/A reasons
- How N/A days should interact with score/streak calculations
- Whether N/A should be whole-day or per-signal
