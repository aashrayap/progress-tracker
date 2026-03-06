# Feature Spec: Habit Grid V2 — Tooltip, Click-to-Trend, Log History

## 1. Problem Statement

```
PROBLEM:
- What: The 14-Day Habit Grid on Hub uses browser-native title attributes for dates
  (slow, ugly, no styling control). Cells are not clickable — the only way to see
  trend data is via a separate "Trend" button per row. The Trend modal shows chart +
  stats but no log history, so the user can't see what actually happened on specific days.

- Why: The grid is the most-used surface on Hub. Date context is important for pattern
  recognition but the native tooltip is insufficient. The Trend button adds visual clutter
  without earning its space — clicking cells is more intuitive. The Trend modal lacks
  the "what happened" detail that would make it a complete habit review surface.

- User-facing effect:
  1. Hovering over any cell in a column shows a styled tooltip above the column
     with day-of-week + date (e.g., "Mon, Mar 3")
  2. Clicking any cell opens the Trend modal for that habit row
  3. The Trend modal now shows chart+stats on the left and a scrollable 90-day
     log history on the right (stacked vertically on mobile)
  4. The per-row "Trend" button is removed (click cell replaces it)
```

## 2. Affected Files

```
SCOPE:
- Files to modify:
  - app/app/page.tsx                    (Hub: grid interaction, tooltip state, remove Trend button, pass log history data)
  - app/app/components/TrendModal.tsx   (layout: support side-by-side content areas)
  - app/app/api/hub/route.ts           (add habitLogs to API response)

- Files to create:
  - app/app/components/HabitTooltip.tsx  (styled column tooltip component)
  - app/app/components/HabitLogHistory.tsx (scrollable log history list for trend modal)

- Files that must NOT change:
  - app/app/components/LineTrendChart.tsx
  - app/app/components/DayView.tsx
  - app/app/components/WeekView.tsx
  - app/app/components/MonthView.tsx
  - app/app/components/YearView.tsx
  - app/app/components/BottomNav.tsx
  - app/app/lib/config.ts
  - app/app/lib/types.ts (no schema changes — add new interface in page.tsx or HabitLogHistory.tsx)
  - All CSV files (no schema changes)
  - All other page routes
  - Voice/idea pipeline scripts
  - docs/ (except this spec)
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page/route: / (Hub)
- Viewport: 390x844 (mobile) + 1280x800 (desktop)

HABIT GRID — DEFAULT STATE:
- 9 habit rows, each with:
  - Label (left, 4.5rem width)
  - 14 colored squares (green/red/gray), same sizing as current
  - NO "Trend" button on the right (removed)
- Grid is visually tighter without the Trend button column

HABIT GRID — HOVER STATE:
- Hovering any cell in column N shows a single styled tooltip ABOVE that column
- Tooltip is shared across all rows for that column (not per-cell)
- Tooltip content: "Mon, Mar 3" (day-of-week, abbreviated month + day)
- Tooltip styling: zinc-800 bg, white/20 border, rounded-lg, text-xs, zinc-200 text
- Tooltip has a small caret/arrow pointing down to the column
- Tooltip disappears on mouse leave
- On mobile/touch: tooltip appears on first tap, second tap opens modal

HABIT GRID — CLICK STATE:
- Clicking any cell opens the TrendModal for that cell's habit row
- Modal opens immediately (same as current Trend button behavior)

TREND MODAL — DESKTOP (>=640px):
- Side-by-side layout:
  - LEFT (flex-1): Rolling 7-day adherence chart (LineTrendChart) + 3 stat cards below
  - RIGHT (w-80, max-h with overflow-y-auto): Scrollable log history
- Header: habit label + "Rolling 7-day adherence" subtitle (unchanged)

TREND MODAL — MOBILE (<640px):
- Stacked vertically:
  - TOP: Chart + stat cards (unchanged from current)
  - BELOW: Scrollable log history section

LOG HISTORY PANEL:
- Header: "History" label, subtle
- List of entries, most recent first, 90-day window
- Each entry shows:
  - Date (left): "Mar 4" format, zinc-400, text-xs
  - Status icon: green checkmark (done), red X (missed), gray dash (no log)
  - Context text (if available from daily_signals.csv context field): zinc-300, text-sm
  - For gym habit specifically: compact workout summary from workouts.csv
    - Exercise names + best set (e.g., "Bench 185x5, Squat 225x5")
- Days with no log entry are omitted (don't show 90 empty rows)
- Empty state: "No logs in the last 90 days"

What the user should NOT see:
- No console errors
- No "Trend" button per row
- No browser-native title tooltip on cells (removed)
- No layout overflow or broken styling
- No duplicate tooltips (only one column tooltip visible at a time)
- No tooltip on mobile hover (touch devices use tap)
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Build passes (zero errors, zero type errors)
- [ ] Hovering a habit cell column shows styled tooltip with day-of-week + date above that column
- [ ] Only one tooltip visible at a time
- [ ] Clicking any habit cell opens TrendModal for that habit row
- [ ] "Trend" button per row is removed from the grid
- [ ] TrendModal shows chart+stats on left, scrollable log history on right (desktop)
- [ ] TrendModal stacks chart then history vertically (mobile)
- [ ] Log history shows entries from daily_signals.csv with date, status, and context
- [ ] Gym habit log history includes compact workout data from workouts.csv
- [ ] Log history limited to 90-day window, most recent first, empty days omitted
- [ ] No files modified outside declared scope
- [ ] No console errors on Hub page
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console check | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| Tooltip shows on wrong column | Browser interaction test | Fix column index tracking |
| Modal doesn't open on click | Browser interaction test | Fix click handler wiring |
| Log history empty when data exists | Browser check + API response | Fix API data assembly or component rendering |
| Gym logs missing workout detail | Browser check | Fix workouts.csv reading in API |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Regression on other Hub sections | Screenshot comparison | Revert, find non-destructive approach |
| Mobile layout broken | Resize to 390px, screenshot | Fix responsive classes |

## 6. Invariants

```
INVARIANTS:
- 14-day grid color logic unchanged (green=true, red=false, gray=null)
- "Today" ring styling on last cell unchanged
- HABIT_ORDER array unchanged
- HABIT_CONFIG not modified
- 90-Day Reset heatmap section unchanged
- Recovery card unchanged
- Today Queue section unchanged
- Reflections section unchanged
- Daily Insight section unchanged
- LineTrendChart component not modified (used as-is)
- Hub API response shape is additive only — all existing fields preserved
- CSV files not modified
- Habit trend calculation logic (rolling 7-day) unchanged
- Habit summary stats (loggedDays, adherence, streak) unchanged
```

## 7. Per-File Checkpoints

After completing each file, answer yes/no:

1. Does this file reference only existing types and config from the codebase?
2. Does my diff contain ONLY changes the spec asked for?
3. Can I trace every change to a specific spec item?
4. Did I preserve all existing content not marked for removal?
5. Does the file respect layer boundaries (L2 for API, L3 for components)?

## 8. Diff Contract

### app/app/api/hub/route.ts
- **WHAT**: Add `habitLogs` to API response — per-habit array of {date, value, context} for 90 days, plus gym workout summaries
- **WHY**: Trend modal log history needs this data
- **PRESERVES**: All existing response fields, all existing logic
- **REMOVES**: Nothing
- **RISK**: Reading workouts.csv adds latency — keep it simple (filter by date range first)

### app/app/components/HabitTooltip.tsx (new)
- **WHAT**: Styled tooltip component that positions above a column, shows day-of-week + date
- **WHY**: Replaces browser-native title attr with styled tooltip
- **PRESERVES**: N/A (new file)
- **REMOVES**: N/A
- **RISK**: Positioning math — must align with column index in the grid

### app/app/components/HabitLogHistory.tsx (new)
- **WHAT**: Scrollable list of habit log entries with date, status, context, and gym workout detail
- **WHY**: New right panel in Trend modal
- **PRESERVES**: N/A (new file)
- **REMOVES**: N/A
- **RISK**: Gym workout data shape must match what API provides

### app/app/components/TrendModal.tsx
- **WHAT**: Update layout to support side-by-side content (left: chart+stats, right: log history) on desktop, stacked on mobile
- **WHY**: Modal needs to accommodate log history panel
- **PRESERVES**: Header, close button, escape key, body scroll lock, backdrop
- **REMOVES**: Nothing structural — the children area becomes a flex container
- **RISK**: Existing modal consumers (if any besides Hub) must still work. Currently only Hub uses it, so safe.

### app/app/page.tsx
- **WHAT**: (1) Add column hover state for tooltip, (2) add click handler on cells to open modal, (3) remove Trend button, (4) render HabitTooltip, (5) pass log history to modal, (6) remove title attr from cells
- **WHY**: Core interaction changes
- **PRESERVES**: All other Hub sections, data fetching, trend calculation logic, stat cards
- **REMOVES**: Trend button per row, native title attribute on cells
- **RISK**: Largest change — multiple interaction states. Test hover, click, and modal open carefully.

## 9. Abort Conditions

- File content doesn't match expected state when first read
- Change requires modifying something outside the declared scope
- Two spec items conflict with each other
- A checkpoint question answer is "no"
- 3 consecutive fix cycles fail on the same issue
- A fix introduces a new failure
- TrendModal is used by any page other than Hub (check before modifying)
- workouts.csv reading adds >500ms to API response time

## 10. Implementation Order

```
Phase 1: API (zero UI risk)
  1. app/app/api/hub/route.ts — add habitLogs + gym workout data to response

Phase 2: New components (no existing UI affected)
  2. app/app/components/HabitTooltip.tsx — create tooltip component
  3. app/app/components/HabitLogHistory.tsx — create log history component

Phase 3: Modal layout (contained change)
  4. app/app/components/TrendModal.tsx — update to support side-by-side layout

Phase 4: Hub integration (highest risk, all pieces ready)
  5. app/app/page.tsx — wire everything together, remove Trend button
```

## 11. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat`, verify only scoped files changed |
| Browser verification | Yes | Full Chrome verification protocol (see below) |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Yes | Summary with evidence + screenshots |

### Browser Verification Protocol (Gate 3 — mandatory before reporting done)

**Step 1: Setup**
- Ensure dev server is running (`cd app && npm run dev`)
- Call `mcp__claude-in-chrome__tabs_context_mcp` to get current browser state
- Navigate to `http://localhost:3000` via `mcp__claude-in-chrome__navigate`

**Step 2: Default View Check**
- Take screenshot via `mcp__claude-in-chrome__computer` (action: screenshot)
- Verify against visual contract:
  - [ ] 14-day habit grid renders with 9 rows
  - [ ] No "Trend" button visible on any row
  - [ ] Grid cells are present and correctly colored
  - [ ] All other Hub sections render normally (Recovery, 90-Day Reset, Reflections, Insight)
- Read console via `mcp__claude-in-chrome__read_console_messages` pattern="error|Error" — zero errors
- Read network via `mcp__claude-in-chrome__read_network_requests` — /api/hub returns 200

**Step 3: Tooltip Hover Check**
- Hover over a habit cell via `mcp__claude-in-chrome__computer` (action: hover)
- Take screenshot
- Verify:
  - [ ] Styled tooltip visible above the column
  - [ ] Shows day-of-week + date format
  - [ ] No browser-native tooltip visible
- Move to a different column, verify tooltip moves
- Move off grid, verify tooltip disappears

**Step 4: Click-to-Modal Check**
- Click a habit cell via `mcp__claude-in-chrome__computer` (action: click)
- Take screenshot of modal
- Verify:
  - [ ] TrendModal opens with correct habit name in header
  - [ ] Chart renders on left side (desktop)
  - [ ] Stat cards visible below chart
  - [ ] Log history panel visible on right side with scrollable entries
  - [ ] Log entries show date, status icon, context
- Close modal (Escape or close button)
- Click a gym cell specifically
- Verify:
  - [ ] Gym log history includes workout exercise details

**Step 5: Mobile Responsive Check**
- Resize to 390x844 via `mcp__claude-in-chrome__resize_window`
- Navigate to `http://localhost:3000`
- Take screenshot
- Click a habit cell, take screenshot of modal
- Verify:
  - [ ] Modal stacks vertically (chart on top, history below)
  - [ ] No horizontal overflow

**Step 6: Regression Check**
- Navigate to `http://localhost:3000/plan` — confirm unchanged
- Navigate to `http://localhost:3000/health` — confirm unchanged
- Read console on each — zero errors

**Step 7: Failure Loop**
- If any check fails: fix, rebuild, re-navigate, re-screenshot
- Max 3 retries per failure type
- If 3 retries fail on same issue: stop and report with screenshots

**Fallback when screenshot tool disconnects** (known issue):
- Use `mcp__claude-in-chrome__javascript_tool` for DOM inspection
- Query element presence, CSS classes, computed styles
- Use `mcp__claude-in-chrome__get_page_text` for content verification
