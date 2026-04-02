# Design: Habit Grid N/A Days

## Summary
Add N/A day support to the habit grid so travel/off days show as faded-out columns with a reason tooltip instead of appearing as missed habits. Stored as a `day_status` signal in existing daily_signals.csv.

## Pattern Decisions
| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | Storage | `day_status` signal in daily_signals.csv (value=`na`, context=reason) | Separate CSV, config file, new column |
| 2 | Tooltip | Reuse existing HabitTooltip component with conditional content | New tooltip component |
| 3 | Styling | Tailwind inline classes with opacity modifier (`bg-zinc-600/50`) | CSS modules, stripe pattern |

## Design Decisions
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | Storage | `day_status` signal, value=`na`, context=reason text | Locked |
| 2 | Scope | Whole-day — all habits blanked for N/A days | Locked |
| 3 | Scoring | N/A days excluded from streak/score calculations entirely | Locked |
| 4 | Visual | `bg-zinc-600/50` reduced opacity faded look for all cells in column | Locked |
| 5 | Tooltip | HabitTooltip shows "Mar 31 — N/A: {reason}" instead of score | Locked |
| 6 | Entry | CLI only via `/log` or manual signal entry — no UI toggle | Locked |
| 7 | Click | No toggle on N/A day cells — clicks disabled | Locked |

## Verification Strategy
- Build gate: `npm run build` must pass
- Chrome visual verification: grid renders N/A days with faded style, tooltip shows reason, non-N/A days unaffected
- Scope check: only modified files in diff

## Structure Outline

### Phase 1: Data layer — surface N/A days through the API
- Add `getNaDays(signals)` helper in `lib/csv.ts` that returns a `Map<string, string>` (date → reason) by filtering day_status/na signals
- Update `/api/hub/route.ts` to include `naDays` map in response alongside habitTracker
- Update `computeDayScore()` to skip N/A days (return null score)
- Verify: curl `/api/hub` returns naDays for dates with day_status=na signals

### Phase 2: Grid rendering — N/A visual treatment
- Update DayView.tsx to consume `naDays` from hub response
- For N/A day columns: render all cells with `bg-zinc-600/50`, disable click handlers
- Update score row to show N/A style for those columns
- Update HabitTooltip to show "Date — N/A: reason" when hovering N/A column
- Verify: Chrome — grid shows faded columns, tooltip shows reason, clicks do nothing

### Phase 3: Log the travel days + verify
- Log `day_status,na` signals for 2026-03-31 and 2026-04-01 with context "Travel — Poland"
- Verify: full grid renders correctly with N/A days visible
