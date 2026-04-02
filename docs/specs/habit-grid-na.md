Status: draft

# Feature Spec: Habit Grid N/A Days

## 1. Problem Statement

```
PROBLEM:
- What: The 90-day habit grid has no concept of "not applicable" days. Travel days,
  sick days, or other legitimate off-days show as red (missed) or grey (unlogged),
  making streaks look broken and scores artificially low.
- Why: The grid punishes the user for days where habits genuinely don't apply (e.g.,
  international travel). This creates misleading data and discourages engagement.
- User-facing effect: N/A days appear as a distinct faded column in the grid with a
  tooltip showing the reason (e.g., "Sat, Mar 28 — N/A: Travel — Poland"). Clicks are
  disabled on N/A columns. Scores exclude N/A days entirely.
```

## 2. Scope

```
SCOPE:
- Files to modify:
  1. app/app/lib/csv.ts — add getNaDays() helper
  2. app/app/api/hub/route.ts — include naDays in response
  3. app/app/components/DayView.tsx — consume naDays, render faded columns, skip
     click handlers, pass N/A info to tooltip, exclude N/A from computeDayScore()
  4. app/app/components/HabitTooltip.tsx — accept optional naReason prop, render
     "Date — N/A: reason" when present

- Files to create: none

- Files that must NOT change:
  - data/daily_signals.csv schema (columns unchanged — we add a new signal name
    "day_status" with value "na", not new columns)
  - Existing habit signal processing for non-N/A days (getHabitsForDate must remain
    unchanged in behavior for all existing signal names)
  - HabitTooltip positioning logic (getBoundingClientRect, useEffect, transform —
    only the content rendering changes)
  - Any file outside the 4 listed above
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page/route: /plan/day (today view only — grid renders when isToday && hubData)
- Viewport: 1280x800 (default)

What the user SHOULD see on an N/A day column:
- Score row cell: bg-zinc-600/50 (faded), no score text
- All habit row cells: bg-zinc-600/50 (faded), uniform across single and compound rows
- Today ring (ring-2 ring-zinc-400) still applies if the N/A day is today
- Tooltip on hover: "Sat, Mar 28 — N/A: Travel — Poland" (formatted date + reason)
- Cursor on N/A cells: default (not pointer), indicating non-interactive

What the user SHOULD see on a normal (non-N/A) day column:
- No change from current behavior: emerald-500/red-500/zinc-800 cell colors
- Score row computes and colors as before
- Tooltip shows date + score as before
- Click handlers work as before

What the user should NOT see:
- No console errors
- No layout shift or broken grid alignment from N/A styling
- No change to non-N/A day rendering
- No change to grid dimensions, spacing, or pagination
- No missing tooltip on N/A hover
- No clickable cells on N/A columns
```

## 4. Success Criteria

```
SUCCESS:
- [ ] npm run build passes with zero errors
- [ ] /api/hub response includes naDays object (Map<date_string, reason_string>)
- [ ] Grid column for a day with day_status=na signal shows all cells as bg-zinc-600/50
- [ ] Hovering an N/A column shows tooltip with "Date — N/A: reason" format
- [ ] Clicking any cell in an N/A column does nothing (no toggle, no modal)
- [ ] computeDayScore() returns { score: null, color: "bg-zinc-600/50" } for N/A days
- [ ] Non-N/A days render identically to current behavior
- [ ] No files modified outside declared scope (verify with git diff --stat)
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `cd app && npm run build` | Fix type errors, rebuild |
| Console error on /plan/day | Browser console check | Trace to source, fix |
| N/A column not faded | Visual inspection in Chrome | Check naDays data flow from API through DayView |
| Tooltip shows score instead of reason | Hover N/A column | Check HabitTooltip naReason prop wiring |
| Click triggers toggle on N/A day | Click N/A cell | Check guard in click handler and cell cursor |
| Non-N/A day rendering changed | Visual comparison | Revert — N/A branch likely leaked into normal path |
| Score calculation changed for non-N/A | Compare scores before/after | Ensure computeDayScore N/A check is date-specific |
| Scope violation | `git diff --stat` | Revert unintended file changes |
| API shape regression | `curl localhost:3000/api/hub \| jq '.habitTracker'` | Ensure habitTracker still has dates[] and days[] |

## 6. Invariants

```
INVARIANTS:
- daily_signals.csv column headers must not change
- getHabitsForDate() function signature and return type must not change
- getHabitsForDate() must continue to ignore day_status signals (it filters by
  habitMetrics array — day_status is not in that array, so this is automatic)
- HabitTooltip positioning logic (useEffect, getBoundingClientRect, transform,
  leftOffset state) must not change — only the content div inside the tooltip changes
- hubData.habitTracker shape must remain { dates: string[], days: Record<string, boolean>[] }
  — naDays is a sibling field, not nested inside habitTracker
- Grid layout (gap-3 weeks, gap-1 days, w-7 h-7 cells, rounded) must not change
- Today ring (ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950) must still
  render on today's column even if today is N/A
- Non-N/A day cell colors: true=bg-emerald-500, false=bg-red-500, null=bg-zinc-800
  must remain unchanged
- handleHabitToggle() function body must not change — the guard is in the JSX onClick,
  not inside the handler
```

## 7. Per-File Checkpoints

After completing each file, answer these yes/no before proceeding. If any answer is "no," stop and explain.

**For every file:**
- Does this file reference only the canonical vocabulary defined in this spec?
- Did I preserve all existing content that wasn't explicitly marked for removal?
- Does my diff contain ONLY changes the spec asked for?
- Can I trace every change to a specific spec section?

**Additional per-file:**

**csv.ts:**
- Does getNaDays() return `Map<string, string>` (date to reason)?
- Does it filter only `signal === "day_status" && value === "na"`?
- Is getHabitsForDate() completely unchanged?

**hub/route.ts:**
- Is naDays a top-level key in the JSON response (sibling to habitTracker)?
- Is the value a plain object `{ [date]: reason }` (serializable from Map)?
- Are no existing response fields modified or removed?

**DayView.tsx:**
- Does computeDayScore() return `{ score: null, color: "bg-zinc-600/50" }` for N/A days?
- Do N/A cells use `bg-zinc-600/50` for both single-signal and compound rows?
- Are click handlers skipped (not onClick={undefined}, but a guard or no handler)?
- Is cursor changed to default on N/A cells?
- Is naReason correctly derived from naDays map and passed to HabitTooltip?

**HabitTooltip.tsx:**
- Is naReason an optional prop in the interface?
- When naReason is provided, does the tooltip show `"{label} — N/A: {reason}"`?
- When naReason is absent/undefined, is the existing content unchanged?
- Is the positioning logic (useEffect, getBoundingClientRect) untouched?

## 8. Diff Contract

### File 1: app/app/lib/csv.ts

- **WHAT**: Add `getNaDays(signals)` function that returns a Map of date to reason for day_status/na signals
- **WHY**: Data layer for Phase 1 — surface N/A days from CSV
- **PRESERVES**: All existing functions unchanged. getHabitsForDate signature, body, and return type unchanged.
- **REMOVES**: Nothing
- **RISK**: Low. Pure addition of a new exported function. No existing code paths affected.

```typescript
// Add after getHabitsForDate (after line ~416):
export function getNaDays(signals: DailySignalEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of signals) {
    if (entry.signal === "day_status" && entry.value === "na") {
      map.set(entry.date, entry.context || "N/A");
    }
  }
  return map;
}
```

### File 2: app/app/api/hub/route.ts

- **WHAT**: Call getNaDays(signals), include result as `naDays` object in response
- **WHY**: API layer for Phase 1 — expose N/A days to frontend
- **PRESERVES**: All existing response fields (habitTracker, dopamineReset, etc.). habitTracker shape unchanged.
- **REMOVES**: Nothing
- **RISK**: Low. Adding a sibling field to the response object. Existing consumers ignore unknown keys.

```typescript
// After habitTracker construction (~line 296), add:
import { getNaDays } from "@/app/lib/csv";  // add to existing imports

const naDaysMap = getNaDays(signals);
const naDays = Object.fromEntries(naDaysMap);  // serialize Map for JSON

// Add naDays to the response object alongside habitTracker
```

### File 3: app/app/components/DayView.tsx

- **WHAT**: (a) Update computeDayScore to return null/faded for N/A days. (b) Consume naDays from hubData. (c) Render N/A columns with bg-zinc-600/50, disable clicks, pass naReason to tooltip.
- **WHY**: Phase 2 — grid rendering for N/A visual treatment
- **PRESERVES**: All non-N/A rendering paths. handleHabitToggle body unchanged. Grid layout, spacing, pagination. Today ring. Score trend modal.
- **REMOVES**: Nothing
- **RISK**: Medium. Multiple touch points in render logic. Must ensure N/A check doesn't leak into normal day path. The `naDays` lookup must use the correct date string from `allDates[i]`.

Key changes:
1. Extract `naDays` from `hubData` (e.g., `const naDays: Record<string, string> = hubData?.naDays || {}`)
2. In `computeDayScore()`: add a parameter or check — if the date is N/A, return `{ score: null, color: "bg-zinc-600/50" }`. Since computeDayScore currently takes `(entry, isToday)`, the cleanest approach is to add an `isNa` boolean parameter (default false) as the third arg, checked first.
3. Score row cells: if `naDays[ds]`, use `bg-zinc-600/50`, no click handler
4. Single-signal habit cells: if `naDays[ds]`, use `bg-zinc-600/50`, `cursor-default`, no onClick
5. Compound habit cells: same treatment
6. Tooltip: pass `naReason={naDays[allDates[hoveredCol]]}` to HabitTooltip

### File 4: app/app/components/HabitTooltip.tsx

- **WHAT**: Add optional `naReason` prop. When present, show "Date — N/A: reason" instead of score.
- **WHY**: Phase 2 — tooltip content for N/A columns
- **PRESERVES**: Interface (all existing props remain). Positioning logic (useEffect, getBoundingClientRect, leftOffset, transform). Arrow element. Styling classes on container.
- **REMOVES**: Nothing
- **RISK**: Low. Conditional content in a single div. No structural changes.

```typescript
// Interface addition:
interface HabitTooltipProps {
  dateStr: string;
  columnIndex: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  score?: number | null;
  naReason?: string;  // NEW
}

// Content change (line ~48):
// Before: {label}{score !== null && score !== undefined ? ` · ${score}/9` : ""}
// After:  {naReason ? `${label} — N/A: ${naReason}` : `${label}${score !== null && score !== undefined ? ` · ${score}/9` : ""}`}
```

## 9. Abort Conditions

Stop and ask the user if any of these occur:

- `getHabitsForDate()` signature or body has changed since research (line ~408-416 of csv.ts)
- `computeDayScore()` signature or body has changed since research (line ~124-141 of DayView.tsx)
- Hub route response shape has changed (habitTracker no longer at top level)
- HabitTooltip component structure has changed from what's documented in this spec
- A required change touches a file outside the 4 declared in scope
- The N/A visual treatment requires CSS modules or globals.css changes (it should not — Tailwind inline only)
- Build fails 3 times on the same error after attempted fixes
- A fix to one file breaks a previously passing file's checkpoint
- `patchedTrackerDays` or `patchedLog` construction logic needs modification beyond what this spec describes

## 10. Implementation Order

### Phase 1: Data Layer (no UI changes)

**Task 1.1: Add getNaDays() to csv.ts**
- Dependencies: none
- Add `getNaDays(signals: DailySignalEntry[]): Map<string, string>` after `getHabitsForDate`
- Filters signals where `signal === "day_status"` and `value === "na"`
- Returns Map of date string to context string (reason)
- Checkpoint: csv.ts questions all "yes"

**Task 1.2: Expose naDays in hub API response**
- Dependencies: Task 1.1
- Import `getNaDays` in hub/route.ts
- Call `getNaDays(signals)` using the existing `signals` array (already loaded at top of handler)
- Convert Map to plain object via `Object.fromEntries()`
- Add `naDays` to the response JSON as a top-level key
- Checkpoint: hub/route.ts questions all "yes"
- Verify: `cd app && npm run build` passes. Then `curl localhost:3000/api/hub | jq '.naDays'` returns `{}` (empty — no day_status signals logged yet)

### Phase 2: Grid Rendering (UI changes)

**Task 2.1: Update HabitTooltip for N/A content**
- Dependencies: none (can parallel with Phase 1, but ordered here for clarity)
- Add `naReason?: string` to `HabitTooltipProps`
- Destructure `naReason` from props
- Conditional content: if `naReason`, show `{label} — N/A: {naReason}`; otherwise existing content
- Checkpoint: HabitTooltip.tsx questions all "yes"

**Task 2.2: Update DayView.tsx for N/A rendering**
- Dependencies: Task 1.2, Task 2.1
- This is the largest change. Sub-steps:

  **2.2a**: Extract naDays from hubData
  ```typescript
  const naDays: Record<string, string> = hubData?.naDays || {};
  ```

  **2.2b**: Update computeDayScore — add `isNa?: boolean` third parameter
  ```typescript
  function computeDayScore(
    entry: DopamineDay | undefined,
    isToday: boolean,
    isNa?: boolean
  ): { score: number | null; color: string } {
    if (isNa) return { score: null, color: "bg-zinc-600/50" };
    // ... rest unchanged
  }
  ```
  Update all call sites to pass `isNa`:
  - Score row (line ~834): `computeDayScore(entry, isTodayCell, !!naDays[ds])`
  - Tooltip section (line ~800): `computeDayScore(entry, isTodayCell, !!naDays[allDates[hoveredCol]])`
  - scoreTrendData memo: `computeDayScore(entry, isTodayCell, !!naDays[ds])`

  **2.2c**: Update tooltip invocation (line ~802-808) — pass naReason prop
  ```tsx
  <HabitTooltip
    dateStr={allDates[hoveredCol]}
    columnIndex={hoveredCol}
    gridRef={gridRef}
    score={score}
    naReason={naDays[allDates[hoveredCol]]}
  />
  ```

  **2.2d**: Update score row cells — N/A days get faded style, no click
  ```tsx
  // In the score row weekCells callback:
  const isNa = !!naDays[ds];
  // If isNa: className uses "bg-zinc-600/50" and "cursor-default", onClick is undefined
  // If not isNa: existing logic unchanged
  ```

  **2.2e**: Update single-signal habit cells — N/A days get faded style, no click
  ```tsx
  const isNa = !!naDays[ds];
  // className: isNa ? "bg-zinc-600/50" : (existing true/false/null logic)
  // cursor: isNa ? "cursor-default" : "cursor-pointer"
  // onClick: isNa ? undefined : existing handler
  ```

  **2.2f**: Update compound habit cells — same treatment as 2.2e
  ```tsx
  // Outer div: isNa ? "cursor-default" and no onClick : existing
  // Inner signal divs: isNa ? "bg-zinc-600/50" : existing color logic
  ```

- Checkpoint: DayView.tsx questions all "yes"

### Phase 3: Build Verification

**Task 3.1: Build gate**
- Dependencies: all above
- Run `cd app && npm run build`
- Must pass with zero errors
- If type errors: fix and rebuild (likely HabitTooltip prop types or computeDayScore signature)

### Phase 4: Manual Verification (requires test data)

**Task 4.1: Log test N/A signals**
- Log day_status signals for testing:
  ```
  curl -X POST localhost:3000/api/daily-signals -H "Content-Type: application/json" \
    -d '{"entries":[{"date":"2026-03-31","signal":"day_status","value":"na","unit":"","context":"Travel — Poland","source":"app","captureId":"","category":""}]}'
  ```

**Task 4.2: Visual verification in Chrome**
- Navigate to /plan/day
- Confirm: March 31 column shows all cells as faded (bg-zinc-600/50)
- Confirm: Hover on March 31 column shows "Mon, Mar 31 — N/A: Travel — Poland"
- Confirm: Clicking March 31 cells does nothing
- Confirm: Adjacent non-N/A columns render normally
- Confirm: No console errors

**Task 4.3: Cleanup test data**
- Delete the test day_status signal:
  ```
  curl -X DELETE "localhost:3000/api/daily-signals?date=2026-03-31&signal=day_status"
  ```

### Verification Gates

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat` — only 4 files modified |
| Browser verification | Yes | Navigate to /plan/day, visual check per Visual Contract |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Yes | Summary to user with evidence |
