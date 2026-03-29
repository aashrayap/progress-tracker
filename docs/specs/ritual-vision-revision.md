Status: shipped

# Feature Spec: Ritual & Vision Revision

## 1. Problem Statement

```
PROBLEM:
- What: Protocol tracking, identity script, habit grid, and vision.json content are all out of sync
  with how the system is actually used.
- Why:
    1. habitMetrics has 10 signals but 3 tracked protocol activities (wim_hof, cold_shower, journal)
       are untracked — nonNegotiables lists "Wim Hof every morning" but zero wim_hof rows exist.
    2. coreTraits and antiVision are single prose strings; Abrada recommends per-pillar "I am"
       character-sheet format read daily — current format is generic and non-actionable.
    3. vision_reviewed is a single signal that can't distinguish morning/midday/evening completion.
    4. Habit grid lives on /vision (weekly review page), not /plan/day (daily home) — wrong location
       for daily tracking.
    5. ritualBlueprint content is stale and doesn't match the actual protocol (missing Wim Hof,
       Cooper walk, 5pm hard stop).
    6. Ritual steps on /plan/day are read-only — no way to mark a protocol complete without opening
       the checkin skill.
- User-facing effect:
    - User cannot log wim_hof, morning_review, or protocol completion from /plan/day.
    - Identity script reads as vague prose, not daily commitment statements.
    - Habit grid requires navigating away from the daily page.
    - Anti-vision is a single sentence mixing all pillars — harder to read quickly.
```

## 2. Affected Files

```
SCOPE:

Files to modify:
  DATA:
  - data/vision.json                              (content: coreTraits, antiVision, ritualBlueprint, triggerReplacements)

  INTELLIGENCE:
  - app/app/lib/types.ts                          (IdentityScript.coreTraits string→object, VisionData.antiVision string→object)
  - app/app/lib/csv.ts                            (habitMetrics array: 10 → 14 signals)
  - app/app/lib/config.ts                         (HABIT_CONFIG: remove vision_reviewed, add 5 new entries)
  - app/app/api/hub/route.ts                      (DopamineDay type + computation: new signal names)

  SURFACES:
  - app/app/components/DayView.tsx                (identity rendering, protocol mark-complete, habit toggles, habit grid)
  - app/app/vision/page.tsx                       (remove ritual blueprint, today's plan, habit grid; update antiVision/coreTraits rendering)

  DOCS/SKILLS:
  - .claude/skills/checkin/SKILL.md               (new signal names, protocol references)
  - docs/data-schemas.md                          (habitMetrics list, vision.json shape)

Files to create:
  - none

Files that must NOT change:
  - app/app/api/plan/route.ts
  - app/app/api/todos/route.ts
  - app/app/api/health/route.ts
  - app/app/api/daily-signals/route.ts            (no changes needed — existing POST handles new signal names)
  - scripts/voice-inbox.sh
  - data/daily_signals.csv                        (existing rows must not be modified; new signal names are additive)
  - data/plan.csv
  - data/workouts.csv
  - app/app/plan/day/page.tsx                     (thin wrapper — DayView handles all logic)
  - app/app/plan/PlanProvider.tsx
```

## 3. Visual Contract

### /plan/day (today view)

```
VISUAL CONTRACT — /plan/day (viewport: 1280x800, today):

What the user SHOULD see:
- Section 1: Ritual checklist (current phase, e.g. "Morning Ritual")
    - Collapsible, open by default
    - Ordered list of steps (8 for morning, 6 for midday, 6 for evening)
    - Habit stacks below steps in italic
    - "Mark complete" button at bottom of section (not a checkbox)
      - Label: "Mark morning complete" / "Mark midday complete" / "Mark evening complete"
      - On click: optimistic green tick, POST /api/daily-signals with signal=morning_review
        (or midday_review / evening_review), value=1
      - Once marked: button disabled / greyed, tick remains
      - Visually distinct from habit toggle row (not in the same grid)

- Section 2: Identity — per-pillar "I am" display
    - 4 rows: Health / Wealth / Love / Self
    - Each row: small uppercase pillar label (zinc-500) + "I am..." statement (zinc-300)
    - No editable fields — read-only display

- Section 3: Intentions + Briefing (unchanged)

- Section 4: Today's Habits grid (moved from /vision)
    - Row of signal toggles: weed, lol, poker, clarity, gym, sleep, meditate, deep_work, ate_clean,
      morning_review, midday_review, evening_review, wim_hof_am, wim_hof_pm
    - Each toggle: signal abbreviation label, coloured dot (green=done, red=missed, grey=unlogged)
    - Click: optimistic update (green), POST /api/daily-signals
    - Avoid/vice signals (weed, lol, poker): 1=clean (green), not logged=grey
    - Habit signals (gym, sleep, meditate, deep_work, ate_clean, wim_hof_am, wim_hof_pm): 1=done (green)
    - Review signals (morning_review, midday_review, evening_review): 1=done (green)
    - Separate visual group from the protocol mark-complete button

- Section 5: 90-day habit grid (moved from /vision)
    - Same grid component as was on /vision — unchanged rendering logic
    - Paginated, 4 weeks visible

- Section 6: Today's Priorities + Schedule (unchanged)

What the user should NOT see:
- No console errors
- No layout overflow
- No empty "Core traits" prose string — must render per-pillar object
- vision_reviewed as a toggle or in the habits grid
- cold_shower or journal as standalone habit signals
```

### /vision (weekly+ review page)

```
VISUAL CONTRACT — /vision (viewport: 1280x800):

What the user SHOULD see:
- Section 1: Identity Script
    - "Core Traits" block: 4 labelled "I am" statements (Health / Wealth / Love / Self)
    - "Non-Negotiables" unchanged
    - Language Rules (use/forbid chips) unchanged
    - Physical Presence, Social Filter, Decision Style unchanged

- Section 2: Anti-Vision
    - 4 labelled failure states (Health / Wealth / Love / Self)
    - Red left border accent (unchanged)
    - Per-pillar layout (matching coreTraits pattern)

- Section 3: Intentions + Briefing (unchanged)

- Zone separator (unchanged)

- Section 4: (Habit Grid REMOVED — moved to /plan/day)

- Section 5 onward: ABT(H) domains, Experiments, Input Control, Distractions,
  Habit Audit — all unchanged

What the user should NOT see:
- Ritual Blueprint section (removed)
- Today's Plan section / PlanCard component (removed)
- Habit grid / "Daily Habits" CollapsibleSection (removed)
- vision_reviewed signal references anywhere
- No console errors
- No broken layout from removed sections
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Build passes: cd app && npm run build — zero errors, zero type errors
- [ ] /plan/day: protocol mark-complete button writes *_review signal to daily_signals.csv
      (verify: curl GET /api/daily-signals?signal=morning_review&start=TODAY&end=TODAY returns 1 row)
- [ ] /plan/day: habit toggles render 14 signals (weed, lol, poker, clarity, gym, sleep, meditate,
      deep_work, ate_clean, morning_review, midday_review, evening_review, wim_hof_am, wim_hof_pm)
      with NO vision_reviewed
- [ ] /plan/day: 90-day habit grid visible and clickable
- [ ] /vision: coreTraits renders as 4 per-pillar rows, not a single string
- [ ] /vision: antiVision renders as 4 per-pillar rows, not a single string
- [ ] /vision: Ritual Blueprint section NOT present
- [ ] /vision: Today's Plan (PlanCard) NOT present
- [ ] /vision: Habit Grid NOT present
- [ ] data/vision.json is valid JSON (node -e "require('./data/vision.json')" exits 0)
- [ ] No files modified outside declared scope (git diff --stat)
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild before proceeding |
| TypeScript: coreTraits still typed as string | tsc error on per-pillar access | Update IdentityScript interface in types.ts |
| TypeScript: antiVision still typed as string | tsc error on per-pillar access | Update VisionData interface in types.ts |
| Console error on /plan/day | Browser console | Trace to source, fix |
| Console error on /vision | Browser console | Trace to source, fix |
| Habit toggle POST fails (non-200) | Network tab in Chrome | Check /api/daily-signals POST handler |
| Mark-complete button not writing correct signal | GET /api/daily-signals check | Fix signal name in POST body |
| vision.json invalid JSON | node parse check | Fix JSON syntax |
| vision_reviewed still appears in grid | Visual + code search | Remove from habitMetrics + HABIT_CONFIG |
| Ritual Blueprint still visible on /vision | Screenshot | Remove the section block from vision/page.tsx |
| Habit grid still visible on /vision | Screenshot | Remove CollapsibleSection "Daily Habits" from vision/page.tsx |
| PlanCard still visible on /vision | Screenshot | Remove the hub?.todaysPlan block |
| Scope violation | `git diff --stat` | Revert unintended changes |
| 3 consecutive fix cycles fail | Count | Stop, explain blocker to user |

## 6. Invariants

```
INVARIANTS:
- Existing daily_signals.csv rows must not be modified — no backfill, no delete
- vision_reviewed rows in daily_signals.csv are historical — leave them, just stop writing new ones
- nonNegotiables, languageRules, physicalPresence, socialFilter, decisionStyle fields in
  identityScript must not change content or structure
- All other vision.json fields not listed in Phase 1 must be preserved verbatim
- ABT(H) domain objects (actual, becoming, timeline, habits) must not change
- HABIT_CONFIG keys for unchanged signals (gym, sleep, meditate, deep_work, ate_clean, weed, lol,
  poker, clarity) must keep their existing label and abbr values
- Layer boundary: no business logic in DayView or vision/page.tsx — reads come from API calls,
  writes go to /api/daily-signals
- /api/daily-signals POST does NOT need modification — it accepts any signal name
- Route tree must stay flat — no new top-level routes
- Build must pass at the end of each phase before the next phase begins
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO before proceeding:

1. Does this file reference only the canonical vocabulary from this spec?
2. Did I preserve all existing content not explicitly marked for removal?
3. Does my diff contain ONLY changes the spec asked for?
4. Can I trace every change to a specific spec decision number?
5. If I modified a type, did I update all consumers of that type in-scope?

Additional per-file gates:

- `data/vision.json`: Is it valid JSON? Are coreTraits and antiVision now objects with health/wealth/love/self keys? Is ritualBlueprint replaced with the verbatim content from this spec?
- `app/app/lib/types.ts`: Is IdentityScript.coreTraits now `{ health: string; wealth: string; love: string; self: string }`? Is VisionData.antiVision now the same object type?
- `app/app/lib/csv.ts`: Does habitMetrics have exactly 14 entries? Is vision_reviewed absent? Are morning_review, midday_review, evening_review, wim_hof_am, wim_hof_pm present?
- `app/app/lib/config.ts`: Does HABIT_CONFIG have 14 entries? Is vision_reviewed absent?
- `app/app/api/hub/route.ts`: Does DopamineDay type reflect new signal names? Does scoring logic use new signals?
- `app/app/components/DayView.tsx`: Is identityScript.coreTraits rendered per-pillar? Is there a mark-complete button per protocol phase? Is there a habit toggles section with 14 signals? Is there a 90-day grid?
- `app/app/vision/page.tsx`: Is Ritual Blueprint section removed? Is PlanCard / today's plan removed? Is habit grid removed? Are coreTraits and antiVision rendered per-pillar?

## 8. Diff Contract

Before writing each file, state:

```
WHAT:   [1-line description]
WHY:    [spec item(s) — use decision # from design.md or phase name]
PRESERVES: [existing content kept]
REMOVES:   [what is deleted and why]
RISK:   [what could go wrong]
```

## 9. Abort Conditions

Stop and ask the user before continuing if:

- File content on first read doesn't match expected state described in this spec's research section
- A type change requires modifying a file outside the declared scope
- Two spec items conflict (e.g., hub/route.ts scoring logic cannot accommodate new signals without
  breaking existing dopamine reset score)
- Any per-file checkpoint answer is NO
- 3 consecutive fix cycles fail on the same issue
- A fix introduces a new build error in a previously passing file
- vision.json schema change would break the weekly checkin skill's PATCH logic (check /api/vision
  PATCH handler before committing to schema change)
- A component outside declared scope imports a type that changed shape

## 10. Implementation Order (5 Phases)

Phases are designed to be file-disjoint where possible. Phases 1 and 2 can run in parallel.
Phases 3 and 4 can run in parallel after Phase 1+2 complete.
Phase 5 is independent and can run last.

```
Phase 1 — Data Layer          Phase 2 — API Layer
(vision.json, types, csv,     (hub/route.ts only)
 config)
        │                             │
        └──────────────┬──────────────┘
                       │
              Phase 3 — DayView rebuild
              (DayView.tsx only)
                       │
              Phase 4 — Vision cleanup
              (vision/page.tsx only)
                       │
              Phase 5 — Skill + Docs
              (.claude/skills/checkin/SKILL.md,
               docs/data-schemas.md)
```

---

### Phase 1 — Data Layer

Files: `data/vision.json`, `app/app/lib/types.ts`, `app/app/lib/csv.ts`, `app/app/lib/config.ts`

#### Task 1.1 — Update vision.json content

Update the following fields. All other fields must be preserved verbatim.

**1.1a — identityScript.coreTraits** (string → object):
```json
{
  "health": "I am a 200lb Olympic lifter who never skips training. I eat clean, sleep by 9:30, and treat my body like the foundation everything else is built on.",
  "wealth": "I am building a 100k/year business providing premium value across AI, meditation, personal growth, and addiction recovery. I ship daily. I do deep work, not busy work.",
  "love": "I am genuine, caring, and a leader in my relationships. I show up — present, honest, initiating. I put in effort and build real connections, not convenient ones.",
  "self": "I am 3 years clean, calm, curious, never stagnant. I protect my mind at all costs. I read, reflect, and sit in stillness. Morning priorities before anyone else's."
}
```

**1.1b — antiVision** (string → object):
```json
{
  "health": "Skips gym on any excuse. Eats junk. Overweight. No discipline. Numbs with food instead of facing discomfort.",
  "wealth": "Coasts at the 9-5. Never ships. Consumes instead of creates. Wastes evenings on League and poker instead of building.",
  "love": "Isolates. Avoids hard conversations. Lets relationships decay. Too comfortable to initiate. Takes people for granted.",
  "self": "Smokes weed. Watches porn. Plays League all night. Gambles on poker apps. Reactive. Hates himself. Zero self-respect."
}
```

**1.1c — ritualBlueprint** (full replacement):
```json
{
  "morning": {
    "steps": [
      "Wake — no snooze",
      "Open /plan/day (blueprint)",
      "Brush teeth + warm water",
      "Wim Hof (1 round)",
      "Journal (top priorities)",
      "Review identity script",
      "Plan day (or confirm last night's drafts)",
      "Start work"
    ],
    "habitStacks": [
      "Open laptop → blueprint first, nothing else",
      "After warm water → Wim Hof immediately"
    ]
  },
  "midday": {
    "steps": [
      "Finish morning work block",
      "Walk / Gym",
      "Cold shower",
      "Short meditation (outside)",
      "Lunch",
      "Resume work"
    ],
    "habitStacks": [
      "After gym → cold shower immediately",
      "After meditation → eat, then resume"
    ]
  },
  "evening": {
    "steps": [
      "Finish work — 5pm hard stop",
      "Walk Cooper",
      "Wim Hof",
      "Deep work session (personal)",
      "Set tomorrow",
      "Wind down + lights out"
    ],
    "habitStacks": [
      "After Cooper → Wim Hof immediately",
      "After deep work → set tomorrow before anything else"
    ]
  }
}
```

**1.1d — distractions.triggerReplacements** (append one entry):
```json
{ "trigger": "After lunch — YouTube pull", "replacement": "Walk first, or short meditation outside" }
```

Checkpoint after 1.1: `node -e "require('./data/vision.json')" && echo OK`

#### Task 1.2 — Update types.ts

**1.2a — IdentityScript interface**: change `coreTraits: string` to:
```typescript
coreTraits: { health: string; wealth: string; love: string; self: string };
```

**1.2b — VisionData interface**: change `antiVision: string` to:
```typescript
antiVision: { health: string; wealth: string; love: string; self: string };
```

All other fields in IdentityScript and VisionData must be preserved exactly.

Checkpoint after 1.2: Build must pass (type errors from consumers will surface; fix in their respective phases).

#### Task 1.3 — Update csv.ts habitMetrics

In `getHabitsForDate`, change habitMetrics array from:
```typescript
["weed", "lol", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean", "vision_reviewed"]
```
to:
```typescript
["weed", "lol", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean", "morning_review", "midday_review", "evening_review", "wim_hof_am", "wim_hof_pm"]
```

Checkpoint: array has exactly 14 entries. vision_reviewed is absent.

#### Task 1.4 — Update config.ts HABIT_CONFIG

Replace vision_reviewed entry. New HABIT_CONFIG (14 entries):
```typescript
export const HABIT_CONFIG = {
  weed:           { label: "No Weed",       abbr: "W"  },
  lol:            { label: "No LoL",        abbr: "L"  },
  poker:          { label: "No Poker",      abbr: "P"  },
  clarity:        { label: "Clarity",       abbr: "C"  },
  gym:            { label: "Gym",           abbr: "G"  },
  sleep:          { label: "Sleep",         abbr: "S"  },
  meditate:       { label: "Meditate",      abbr: "M"  },
  deep_work:      { label: "Deep Work",     abbr: "D"  },
  ate_clean:      { label: "Ate Clean",     abbr: "E"  },
  morning_review: { label: "Morning",       abbr: "AM" },
  midday_review:  { label: "Midday",        abbr: "MD" },
  evening_review: { label: "Evening",       abbr: "PM" },
  wim_hof_am:     { label: "Wim Hof AM",   abbr: "WA" },
  wim_hof_pm:     { label: "Wim Hof PM",   abbr: "WP" },
} satisfies Record<string, HabitConfigEntry>;
```

Checkpoint: 14 entries. vision_reviewed absent.

Phase 1 gate: `cd app && npm run build` — must pass with 0 errors before Phase 3/4 begin.
(Type errors from consumers are expected until Phases 3/4 fix them.)

---

### Phase 2 — API Layer

Files: `app/app/api/hub/route.ts`

#### Task 2.1 — Update DopamineDay type and scoring logic

The hub route builds a `DopamineDay` structure and a `computeDayScore` function that references
the current 10 habitMetrics signals. Update for the new 14-signal set.

**2.1a — DopamineDay type**: remove `visionReviewed: boolean | null`. Add:
```typescript
morningReview: boolean | null;
middayReview: boolean | null;
eveningReview: boolean | null;
wimHofAm: boolean | null;
wimHofPm: boolean | null;
```

**2.1b — Signal mapping**: wherever hub/route.ts maps signal names to DopamineDay fields,
add mappings for the 5 new signals. Remove vision_reviewed mapping.

**2.1c — Score computation**: the existing score uses weed as a gate, then counts
[gym, sleep, meditate, deepWork, ateClean] for habitScore, and [lol, poker, clarity] for viceScore.
Update to also count [wimHofAm, wimHofPm] in habitScore (max score increases from 8 to 10).
Protocol review signals (morningReview, middayReview, eveningReview) are NOT included in the score
— they are tracked but don't affect the dopamine reset scoring.

NOTE: HabitTooltip currently shows `/8` — update to `/10` if that tooltip references the max score.
Check `/app/app/components/HabitTooltip.tsx` for hardcoded `/8` string. If present, update to `/10`.
HabitTooltip.tsx IS NOT in the declared scope change list — if this change is needed, add it to
scope or leave the tooltip showing stale max. Flag to user.

**2.1d — Vision page DopamineDay local type**: vision/page.tsx has a local `DopamineDay` interface
(lines 16-28) that mirrors the hub type. This will be updated in Phase 4 when vision/page.tsx is
modified.

Phase 2 gate: `cd app && npm run build` — must pass.

Curl test after Phase 2:
```bash
curl -s http://localhost:3000/api/hub | jq '.dopamineReset.log[0]'
# Verify: no visionReviewed key, new keys present
```

---

### Phase 3 — DayView Rebuild

Files: `app/app/components/DayView.tsx` only.

This is the largest change. DayView currently renders:
1. Ritual checklist (read-only)
2. Compact identity (coreTraits as string)
3. Intentions + Briefing
4. Today's Priorities (draft blocks)
5. Schedule

After this phase it must render:
1. Ritual checklist + mark-complete button
2. Compact identity (per-pillar)
3. Intentions + Briefing
4. Today's Habits toggles (14 signals)
5. 90-day habit grid
6. Today's Priorities (draft blocks)
7. Schedule

#### Task 3.1 — Per-pillar identity rendering

Current code (lines 189-204):
```tsx
{isToday && identityScript && (identityScript.coreTraits || identityScript.nonNegotiables) && (
  <div ...>
    {identityScript.coreTraits && (
      <p ...>
        <span>Core traits</span>
        {identityScript.coreTraits}   {/* currently a string */}
      </p>
    )}
```

New behaviour: `identityScript.coreTraits` is now `{ health, wealth, love, self }`. Render as 4 rows:
```
HEALTH   I am a 200lb Olympic lifter...
WEALTH   I am building a 100k/year business...
LOVE     I am genuine, caring...
SELF     I am 3 years clean...
```
Each row: `<span className="text-zinc-500 text-xs uppercase tracking-wide w-16 shrink-0">{pillar}</span>`
followed by `<span className="text-sm text-zinc-300">{statement}</span>`.

Update local state type: `identityScript` state should include `coreTraits` as the object type.
Change the useState type and the fetch assignment.

#### Task 3.2 — Protocol mark-complete button

Below the ritual steps list, add a "Mark complete" button for the current phase.

- Button label: `Mark ${phase} complete` (e.g., "Mark morning complete")
- Signal map: morning → `morning_review`, midday → `midday_review`, evening → `evening_review`
- Optimistic state: local useState `reviewDone: Record<string, boolean>`
  - Pre-populate from today's signals on mount (fetch `/api/daily-signals?signal=morning_review&start=TODAY`)
  - Actually fetch all three review signals in one call: `?start=TODAY&end=TODAY` then filter
- On click:
  1. Optimistic: set `reviewDone[phase] = true`
  2. POST `/api/daily-signals` with `{ entries: [{ date, signal: "${phase}_review", value: "1", unit: "", context: phase, source: "app", captureId: "", category: "personal_growth" }] }`
  3. On error: revert optimistic state
- Once marked done: button shows green checkmark, disabled, label changes to "Morning complete ✓"
- Visual placement: below habitStacks list, above the collapsible close

This button is visually separate from the habit toggles (next task). It lives inside the Ritual
Checklist card, not in the habit toggles grid.

#### Task 3.3 — Today's Habits toggles

Add a new section "Today's Habits" after the ritual section (before Intentions).
Only show on `isToday`.

14 signals in display order:
```
wim_hof_am, wim_hof_pm, gym, sleep, ate_clean, deep_work, meditate,
morning_review, midday_review, evening_review,
weed, lol, poker, clarity
```

Group layout (visual):
- Row 1 (protocol + training): wim_hof_am, wim_hof_pm, gym, sleep, ate_clean, deep_work, meditate
- Row 2 (reviews): morning_review, midday_review, evening_review
- Row 3 (avoidance): weed, lol, poker, clarity

Each toggle:
- Shows `HABIT_CONFIG[signal].abbr` as label
- Dot: green (logged=1), red (logged=0 where applicable), grey (not logged today)
- Avoidance signals (weed, lol, poker): 1 = clean = green, not logged = grey
  (there is no "missed" state for avoidance — grey means unlogged, green means clean)
- Habit signals: 1 = done = green, not logged = grey
- Review signals: 1 = done = green, not logged = grey (same as habits)
- Click: optimistic green → POST /api/daily-signals with value "1"
  - Second click on an already-green toggle: no-op (cannot unlog)

State: `habitSignals: Record<string, string | null>` — null=unlogged, "1"=done/clean, "0"=missed
Pre-populate from `habits` prop passed from PlanProvider (which calls getHabitsForDate).

Note: PlanProvider already fetches habits. DayView already receives `habits: HabitMap` prop.
Use `habits[dateStr]` to pre-populate the toggle states. The `habits` prop type is
`Record<string, Record<string, boolean>>` — `habits[dateStr][signal]` is `true` if the signal
was logged as "1" for that date.

For optimistic updates: maintain local override state. Start from `habits[dateStr]` values.
On toggle click, set local state immediately, POST in background.

#### Task 3.4 — Move 90-day habit grid to DayView

The habit grid currently lives in `vision/page.tsx` (lines ~509-700+). Extract the grid rendering
into DayView (or a helper component imported by DayView).

Strategy: rather than duplicating the full grid logic, extract the grid into a new component
`HabitGrid` in `app/app/components/HabitGrid.tsx`.

Wait — the spec prohibits creating new files unless absolutely necessary. Instead: copy the grid
rendering logic from vision/page.tsx into DayView as a local render block. Keep it self-contained.

The grid requires:
- `hub.habitTracker` (dates + days arrays) — DayView must fetch `/api/hub` (it already does for isToday)
- Pagination state (`habitPageOffset`)
- `activeHabitKey` for trend view
- `gridRef` for tooltip positioning

DayView already fetches `/api/hub` into `hubData` state for isToday. Extend `hubData` state to
include `habitTracker` and `habitTrends` (they are already in the hub response).

The grid computation (weeks pagination, score computation, tooltip) is currently inlined in
vision/page.tsx. Move it to DayView as a local block. The `computeDayScore` function and
`HABIT_ORDER` constant must also be copied.

NOTE: after Phase 4 removes the grid from vision/page.tsx, the grid code remains only in DayView.

Phase 3 gate: `cd app && npm run build` — must pass.

---

### Phase 4 — Vision Page Cleanup

Files: `app/app/vision/page.tsx` only.

#### Task 4.1 — Remove Ritual Blueprint section

Remove the entire `<section>` block for "Ritual Blueprint" (currently lines ~394-462 in vision/page.tsx).
This includes:
- The `<section>` with tabbed morning/midday/evening ritual steps
- The "Review checkbox" sub-block
- The `ritualTab` state and `reviewChecked` state
- The `handleReview` function
- The `RITUAL_TABS`, `RITUAL_CONTEXT` constants
- The `fetchAll` logic that fetches `vision_reviewed` signals
- The `RitualTab` type alias

Also remove: the `vision_reviewed` signal fetch from `fetchAll` (line 193).

#### Task 4.2 — Remove Today's Plan section (PlanCard)

Remove the `{hub && (<PlanCard ... />)}` block inside the 2-column grid (lines ~464-471).
If the grid only contained Ritual Blueprint + PlanCard, remove the entire `<div className="grid...">`.

Also remove the `PlanCard` import from vision/page.tsx if it is no longer used.

#### Task 4.3 — Remove Habit Grid section

Remove the `CollapsibleSection title="Daily Habits"` block and all its contents
(lines ~509 to ~700+ in vision/page.tsx).

Also remove:
- `activeHabitKey` state
- `hoveredCol` state
- `habitPageOffset` state
- `gridRef`
- `isScoreActive`, `activeHabitTrendSeries`, `scoreTrendPoints`, `activeHabitTrendPoints`,
  `activeHabitSummary` computed values
- `computeDayScore` function (defined locally in vision/page.tsx)
- `HABIT_ORDER` constant
- `HabitKey`, `ActiveKey` type aliases
- `HabitTooltip` import (if no longer used)
- `HabitLogHistory` import (if no longer used)
- `LineTrendChart` import (if no longer used)
- `TrendModal` import (if no longer used)

#### Task 4.4 — Update coreTraits and antiVision rendering

**coreTraits (in Identity Script section, line ~357):**
Replace `<IdentityField label="Core Traits" value={vision.identityScript.coreTraits} />`
with per-pillar rendering:
```tsx
<div>
  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Core Traits</p>
  <div className="space-y-2">
    {(["health", "wealth", "love", "self"] as const).map((pillar) => (
      <div key={pillar} className="flex gap-3">
        <span className="text-zinc-500 text-xs uppercase tracking-wide w-14 shrink-0 pt-0.5">{pillar}</span>
        <span className="text-sm text-zinc-300">{vision.identityScript.coreTraits[pillar]}</span>
      </div>
    ))}
  </div>
</div>
```

**antiVision (lines ~383-391):**
Replace `<p className="text-sm text-zinc-300 ...">` with per-pillar rendering:
```tsx
<div className="space-y-2">
  {(["health", "wealth", "love", "self"] as const).map((pillar) => (
    <div key={pillar} className="flex gap-3">
      <span className="text-zinc-500 text-xs uppercase tracking-wide w-14 shrink-0 pt-0.5">{pillar}</span>
      <span className="text-sm text-zinc-300">{vision.antiVision[pillar]}</span>
    </div>
  ))}
</div>
```

**4.4 local DopamineDay type**: vision/page.tsx has a local DopamineDay interface (lines 16-28).
Update it to remove `visionReviewed` and add the 5 new fields:
- `morningReview: boolean | null`
- `middayReview: boolean | null`
- `eveningReview: boolean | null`
- `wimHofAm: boolean | null`
- `wimHofPm: boolean | null`

Phase 4 gate: `cd app && npm run build` — must pass.

---

### Phase 5 — Skill + Docs Update

Files: `.claude/skills/checkin/SKILL.md`, `docs/data-schemas.md`

These files are documentation-only. Changes are informational — they tell the checkin skill what
signals to use when logging protocol completion.

#### Task 5.1 — Update checkin SKILL.md

Find any reference to `vision_reviewed` in the signal list and replace with the three review signals.
Find any reference to the old ritual protocol and update to the new 8-step morning / 6-step midday /
6-step evening from design.md.
Add wim_hof_am and wim_hof_pm to the list of loggable signals.

#### Task 5.2 — Update docs/data-schemas.md

Update the habitMetrics documentation to show all 14 signals.
Update the vision.json shape description to show coreTraits and antiVision as objects.

Phase 5 gate: No build gate (docs). Verify no broken references in SKILL.md that would cause
checkin to write vision_reviewed when a user says "morning review done."

---

## Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` — zero errors |
| Diff review | Yes | `git diff --stat` — only declared files |
| Browser: /plan/day | Yes | Navigate, check all 7 sections, click habit toggle, click mark-complete |
| Browser: /vision | Yes | Navigate, verify coreTraits per-pillar, antiVision per-pillar, no ritual/plan/grid |
| API: mark-complete | Yes | `curl -s "http://localhost:3000/api/daily-signals?signal=morning_review&start=$(date +%Y-%m-%d)&end=$(date +%Y-%m-%d)"` — expect 1 row |
| Spec adherence | Yes | Walk each success criterion checkbox |
| Confidence report | Always | Summary to user with evidence |

---

## Appendix: Signal Semantics Reference

| Signal | Positive value (1 means...) | Zero value (0 means...) | Unlogged (null means...) |
|---|---|---|---|
| gym | trained today | did not train | not logged |
| sleep | slept well / on time | poor sleep | not logged |
| meditate | meditated | did not | not logged |
| deep_work | did deep work | did not | not logged |
| ate_clean | ate clean | did not | not logged |
| weed | stayed clean (no weed) | used | not logged (grey) |
| lol | stayed clean (no LoL) | played | not logged (grey) |
| poker | stayed clean (no poker) | played | not logged (grey) |
| clarity | mental clarity | foggy/unclear | not logged (grey) |
| morning_review | completed morning protocol | did not complete | not logged |
| midday_review | completed midday protocol | did not complete | not logged |
| evening_review | completed evening protocol | did not complete | not logged |
| wim_hof_am | did Wim Hof in AM | did not | not logged |
| wim_hof_pm | did Wim Hof in PM | did not | not logged |

For avoid signals (weed, lol, poker): 1=clean is positive, 0=slipped. Unlogged=grey (no assumption).
