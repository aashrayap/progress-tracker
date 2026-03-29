Status: shipped

# Feature Spec: Check-in → Plan Integration

## 1. Problem Statement

```
PROBLEM:
- What: The /checkin skill captures a daily intention and shows the plan read-only,
  but the intention is metadata (a signal row) that never becomes a plan entry,
  never surfaces on Hub or Plan day view, and never connects to todos or
  yesterday's incomplete items. The weekly check-in has no intention concept at all.
- Why: Reflection and planning are parallel tracks that never merge. The user
  context-switches between check-in and Plan UI to turn intentions into time blocks.
  Incomplete items from yesterday vanish. Relevant todos aren't surfaced.
- User-facing effect: After check-in, the user still needs to manually open /plan,
  remember what was incomplete, drag todos, and build the day from scratch.
  Intentions are captured but invisible — they have no gravity anywhere in the app.
```

## 2. Affected Files

```
SCOPE:
Files to modify:
  - .claude/skills/checkin/skill.md          (Phase 5 redesign + weekly intention step)
  - app/app/api/hub/route.ts                 (add intention fields to hub response)
  - app/app/page.tsx                         (render daily + weekly intention on Hub)
  - app/app/components/DayView.tsx           (render daily + weekly intention above schedule)
  - app/app/api/plan/range/route.ts          (include intention data in plan range response)
  - app/app/lib/csv.ts                       (helper: read incomplete plan items for a date,
                                              helper: read current intentions)

Files to create:
  - none

Files that must NOT change:
  - app/app/api/plan/route.ts
  - app/app/api/todos/route.ts
  - app/app/components/SchedulerModal.tsx
  - app/app/health/page.tsx
  - app/app/mind/page.tsx
  - app/app/vision/page.tsx
  - app/app/ideas/page.tsx
  - app/app/resources/page.tsx
  - app/app/quotes/page.tsx
  - app/app/lib/config.ts
  - data/*.csv schemas (no new columns, no new files)
  - Check-in Phases 0-4 (within skill.md — preserve exactly)
```

## 3. Visual Contract

```
VISUAL CONTRACT:

Page: / (Hub)
Viewport: 1280x800

What the user SHOULD see:
  - An intention section near the top of Hub (below status row, above habit grid)
  - If weekly intention exists: "This week: <mantra text>" in subdued style
  - If daily intention exists: "Today: <mantra text>" below the weekly
  - If neither exists: section hidden entirely (no empty state)
  - Intention text styled as a quote/mantra — italic or lighter weight, not a card

What the user should NOT see:
  - No empty "No intention set" placeholder
  - No edit buttons (intentions are set via /checkin, not Hub UI)
  - No console errors
  - No layout shift in existing Hub elements

---

Page: /plan (Day view only, when zoom=day)
Viewport: 1280x800

What the user SHOULD see:
  - Intention banner pinned above the timed schedule section
  - Same format: weekly + daily intention, collapsed if not set
  - Visually distinct from plan blocks (not a time slot)

What the user should NOT see:
  - Intention in week/month/year views (day view only)
  - No console errors
  - No changes to breadcrumbs, navigation, or todo sidebar
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Running /checkin daily surfaces yesterday's incomplete plan items
      and asks keep/defer/drop for each
- [ ] Kept items are written to plan.csv with user-specified time slots
- [ ] Daily intention is written as signal=intention with qualitative mantra text
- [ ] Weekly intention is set during weekly check-in, written as
      signal=weekly_intention to daily_signals.csv
- [ ] Hub displays current daily + weekly intention (read from daily_signals.csv)
- [ ] Plan day view displays current daily + weekly intention above the schedule
- [ ] Check-in uses LLM reasoning to surface relevant todos, reflections,
      and signals based on the user's stated intention and feelings
- [ ] Full daily check-in (including new planning steps) completes in < 4 min
      of user interaction time
- [ ] Phases 0-4 of daily check-in are unchanged
- [ ] npm run build passes with zero errors
- [ ] No files modified outside declared scope
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error on Hub or Plan | Browser console check | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| Intention not appearing on Hub | Navigate to /, check for intention section | Check hub API response, fix data flow |
| Intention not appearing on Plan day | Navigate to /plan, zoom=day | Check plan range API or DayView props |
| Phase 0-4 behavior changed | Read skill.md diff, verify phases preserved | Revert changes to phases 0-4 |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Check-in takes > 4 min | Time a test run | Reduce questions, simplify flow |
| Rollover not surfacing incomplete items | Run /checkin after a day with incomplete plan | Debug csv.ts helper for reading incomplete items |

## 6. Invariants

```
INVARIANTS:
- Check-in Phases 0-4 must not change in any way
- daily_signals.csv schema (date,signal,value,unit,context,source,capture_id,category)
  must not change — new signals use existing columns
- plan.csv schema (date,start,end,item,done,notes,domain) must not change
- todos.csv schema must not change
- No new CSV files
- No new routes
- Addiction signals remain non-skippable
- Planning steps within check-in must be skippable ("skip" = keep plan as-is)
- Intention is qualitative/mantra-style ("move with discipline"),
  NOT a task ("finish API migration")
- Weekly intention guides daily intention but they are distinct
- Hub navigation, habit grid, streak display, and insight card must not change
- Plan breadcrumbs, zoom controls, and todo sidebar must not change
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO:

**skill.md:**
- Are Phases 0-4 identical to the original?
- Does Phase 5 surface yesterday's incomplete items with keep/defer/drop?
- Does Phase 5 use LLM reasoning (not just keyword matching) to surface relevant
  todos/reflections/signals based on stated intention and feelings?
- Does Phase 5 ask for daily intention as a mantra, not a task?
- Does the weekly check-in now ask for a weekly intention as a mantra?
- Are planning steps skippable?
- Does kept-item flow ask "what time?" and write to plan.csv?
- Is intention written as `signal=intention` (daily) / `signal=weekly_intention` (weekly)?

**csv.ts:**
- Does the new helper read incomplete plan items for a given date correctly?
- Does the intention reader find the most recent weekly_intention and today's intention?
- Are existing functions unmodified?

**hub/route.ts:**
- Does the response now include `dailyIntention` and `weeklyIntention` fields?
- Are existing response fields unchanged?
- Does it read from daily_signals.csv using existing `readDailySignals()`?

**page.tsx (Hub):**
- Does the intention section render only when data exists?
- Is it positioned below status row, above habit grid?
- Are all existing Hub sections unchanged?

**DayView.tsx:**
- Does the intention banner appear only in day view?
- Is it above the timed schedule, visually distinct from plan blocks?
- Are all existing DayView features unchanged?

## 8. Diff Contract

Before writing each file, state WHAT/WHY/PRESERVES/REMOVES/RISK.

**skill.md:**
- WHAT: Replace Phase 5 with rollover + context-aware surfacing + intention + time slotting.
  Add weekly intention step to weekly check-in.
- WHY: Core feature — closes the reflection→planning gap
- PRESERVES: Phases 0-4, Phase 6, all rules, weekly steps 1-3, monthly check-in
- REMOVES: Old Phase 5 (simple "#1 priority" question + read-only plan display)
- RISK: Phase boundary bleed — must verify phases 0-4 are byte-identical

**csv.ts:**
- WHAT: Add `getIncompletePlanItems(date)` and `getCurrentIntentions()` helpers
- WHY: Skill needs incomplete items; Hub + Plan need intention data
- PRESERVES: All existing exports and functions
- REMOVES: Nothing
- RISK: Low — additive only

**hub/route.ts:**
- WHAT: Add dailyIntention + weeklyIntention to response JSON
- WHY: Hub needs to render intentions
- PRESERVES: All existing response fields and computation
- REMOVES: Nothing
- RISK: Low — additive fields only. Must not break existing consumers.

**page.tsx (Hub):**
- WHAT: Add intention display section between status row and habit grid
- WHY: Intention must be visible on Hub per decision #1
- PRESERVES: All existing sections, layout, state management
- REMOVES: Nothing
- RISK: Layout shift if section sizing is wrong

**DayView.tsx:**
- WHAT: Add intention banner above timed schedule
- WHY: Intention must be visible on Plan day view per decision #1
- PRESERVES: All existing DayView features (habits, schedule, reconciliation, edit button)
- REMOVES: Nothing
- RISK: Needs intention data passed through — may need plan/range API or separate fetch

**api/plan/range/route.ts (if needed):**
- WHAT: Include intention data in plan range response
- WHY: DayView needs intention data without a separate API call
- PRESERVES: Existing events and habits response
- REMOVES: Nothing
- RISK: Must check if this route exists first; may need to add intention via Hub API instead

## 9. Abort Conditions

Stop and ask if:
- Phases 0-4 in skill.md don't match expected content when first read
- A file in the "must NOT change" list needs modification to make this work
- The plan/range API doesn't exist or has unexpected structure
- DayView can't receive intention data without modifying SchedulerModal
- Two spec items conflict with each other
- A checkpoint question answer is "no"
- 3 consecutive fix cycles fail on the same issue
- Build fails on a type error that requires schema changes

## 10. Implementation Order

```
Phase A: Foundation (zero UI risk)
  1. csv.ts — add getIncompletePlanItems() and getCurrentIntentions() helpers
  2. Verify: helpers return correct data when called standalone

Phase B: Skill update (no app changes yet)
  3. skill.md — redesign Phase 5 (rollover, context-aware surfacing,
     intention as mantra, time slotting for kept items)
  4. skill.md — add weekly intention step to weekly check-in (Step 3.5)
  5. Verify: read the diff, confirm phases 0-4 unchanged

Phase C: API layer (backend, no UI breakage)
  6. hub/route.ts — add dailyIntention + weeklyIntention to response
  7. Verify: curl /api/hub | jq '.dailyIntention, .weeklyIntention'

Phase D: Surfaces (UI changes)
  8. page.tsx — render intention section on Hub
  9. DayView.tsx — render intention banner on Plan day view
  10. Verify: npm run build, Chrome verification on / and /plan
```

## 11. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `npm run build`, zero errors |
| Diff review | Yes | `git diff --stat`, only declared files changed |
| Browser verification | Yes | Navigate /, /plan (day view), screenshot, console check |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Yes | Summary with evidence |

## Locked Decisions Reference

| # | Decision | Detail |
|---|----------|--------|
| 1 | Intention visible on Hub + Plan day view | Both weekly + daily |
| 2 | Weekly intention set during weekly check-in | Reflect on last week → set next week's mantra |
| 3 | Interactive rollover during daily check-in | Keep/defer/drop for incomplete items |
| 4 | Intention = qualitative mantra, not a task | "Move with discipline" not "finish API migration" |
| 5 | Weekly guides daily, different granularity | Weekly = broad mantra, daily = narrower focus |
| 6 | Context-aware surfacing via LLM reasoning | Reads intention + feelings, reasons about relevant todos/reflections/signals |
| 7 | Kept items → ask "what time?" | Written to plan.csv with time slots |
| 8 | Weekly intention in daily_signals.csv | signal=weekly_intention, value=domain, context=mantra |
| 9 | No capacity check for now | Deferred |
| 10 | Up to 4 min total check-in time | Replaces separate Plan UI session |
| 11 | Skill + UI in one spec | Single deliverable |
| 12 | Full LLM reasoning for surfacing | Not keyword matching |
