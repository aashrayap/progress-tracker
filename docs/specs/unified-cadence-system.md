Status: shipped

# Unified Cadence System

## 1. Problem Statement

```
PROBLEM:
- What: The daily execution loop is split across three surfaces (/vision for ritual,
  /plan/day for schedule, CLI /checkin for writes) with no clear home page. Morning ritual
  requires navigating to /vision, then /plan, then CLI. Evening has no dedicated flow.
  The /plan skill duplicates /checkin plan actions. Draft planning (blocks without times)
  has no first-class support — PlanCard renders 0,0 entries as "12:00am-12:00am".
  There is no anchor/crossroads tool for real-time trigger management.

- Why: The current architecture forces 3+ surface switches during a single morning ritual.
  /vision was designed as the daily entry point but is too dense for quick daily use — it
  belongs as a weekly+ deep review surface. /plan/day should be the daily home: lightweight
  read + done toggles. /checkin should be the single CLI write entry point, absorbing /plan
  skill actions and adding evening + anchor flows.

- User-facing effect: One browser tab (/plan/day) is the daily home page. One CLI command
  (/checkin) handles all writes. /vision becomes a Sunday + on-demand deep review. Morning
  startup drops from 3+ surface switches to: open browser (already on /plan/day) + run
  /checkin. Evening gets a dedicated flow for decompression, reflection, and tomorrow prep.
```

## 2. Affected Files

```
SCOPE:

Files to modify:
  # UI (Surfaces — L3)
  - app/app/page.tsx                          # redirect / → /plan/day (was /vision)
  - app/app/plan/day/page.tsx                 # rebuild as daily home page
  - app/app/components/DayView.tsx            # rebuild content order, remove SchedulerModal + Edit Plan
  - app/app/components/PlanBlock.tsx           # handle start=0/end=0 draft display
  - app/app/components/PlanCard.tsx            # handle start=0/end=0 draft display (vision page)
  - app/app/vision/page.tsx                   # refactor: open habit grid by default, collapse experiments/input/distractions/audit

  # Skills (L0 — Core Docs)
  - .claude/skills/checkin/SKILL.md           # full rewrite: new menu, evening flow, anchor, absorb /plan actions

  # Docs (L0 — Core Docs)
  - docs/architecture.md                      # update route table, redirect, vision description
  - docs/app-intent.md                        # swap vision/plan roles, update surface map, add decisions
  - docs/data-schemas.md                      # crossroads signal, draft block semantics, fix mind/vision categories
  - CLAUDE.md                                 # update skills table, current app routes
  - docs/life-playbook.md                     # update surface interaction flow table

Files to delete:
  - .claude/skills/plan/SKILL.md              # /plan skill eliminated — absorbed into /checkin
  - app/app/components/SchedulerModal.tsx      # SchedulerModal removed entirely

Files to create: none

Files that must NOT change: (see Section 6 — Invariants)
```

## 3. Visual Contract

### 3a. `/plan/day` (Daily Home Page) — viewport 1280x800

Content order top to bottom:

```
┌─────────────────────────────────────────────────────────────────┐
│ RITUAL CHECKLIST                                                │
│ Morning ritual steps from ritualBlueprint.morning.steps         │
│ (auto-selects phase by time of day, same as current logic)      │
│ Collapsible, default OPEN for current phase                     │
│ Step 7+ note: "Run /checkin"                                    │
├─────────────────────────────────────────────────────────────────┤
│ COMPACT IDENTITY                                                │
│ Core traits (1 line) + Non-negotiables (1 line)                 │
│ From vision.json identityScript.coreTraits + .nonNegotiables    │
│ No other identity fields. Compact text block, not a card.       │
├─────────────────────────────────────────────────────────────────┤
│ INTENTIONS + BRIEFING                                           │
│ Weekly intention (if set): "This week: <mantra>"                │
│ Daily intention (if set): "Today: <mantra>"                     │
│ Briefing card (existing BriefingCard component, same as vision) │
├─────────────────────────────────────────────────────────────────┤
│ TODAY'S PRIORITIES (drafts section)                              │
│ Shows plan.csv entries where start=0 AND end=0 for today        │
│ Purple accent (same as current all-day styling in DayView)      │
│ Each draft shows item text, no time label                       │
│ Section DISAPPEARS when no drafts exist for today               │
├─────────────────────────────────────────────────────────────────┤
│ SCHEDULE                                                        │
│ Timed blocks (start>0 or end>0) with done toggles              │
│ Past/future split with NowLine (same as current)                │
│ Done toggle + missed button (same interaction as current)       │
│ NO Edit Plan button. NO SchedulerModal.                         │
└─────────────────────────────────────────────────────────────────┘
```

What the user should NOT see:
- No "Edit Plan" button anywhere on /plan/day
- No SchedulerModal overlay
- No console errors
- No "12:00am-12:00am" on draft blocks — they show without time labels
- No empty "All Day" section when there are no drafts

### 3b. `/vision` (Weekly+ Deep Review) — viewport 1280x800

Changes from current:

```
OPEN by default:
- Identity script (full — all fields, not just core traits)
- Anti-vision
- North Star (4 domain ABT(H) cards)
- Habit Grid (90 days) — MUST be open by default, NOT collapsed

COLLAPSED by default:
- Experiments table
- Input Control
- Distractions
- Habit Audit

UNCHANGED:
- PlanCard (today's plan) — stays but with draft block fix
- BriefingCard — stays
- All existing content and components remain
```

What the user should NOT see:
- No console errors
- No "12:00am-12:00am" on draft blocks in PlanCard
- Habit Grid must not be collapsed on load

### 3c. `/` (Root redirect)

- `redirect("/plan/day")` — not `/vision`

## 4. Success Criteria

```
SUCCESS:
- [ ] `cd app && npm run build` passes with zero errors
- [ ] / redirects to /plan/day (not /vision)
- [ ] /plan/day shows content in order: ritual → identity → intentions+briefing → drafts → schedule
- [ ] /plan/day has NO Edit Plan button and NO SchedulerModal reference
- [ ] Plan blocks with start=0,end=0 render without time labels in both DayView and PlanCard
- [ ] /vision habit grid is open (not collapsed) on page load
- [ ] /vision experiments, input control, distractions, habit audit sections are collapsed on load
- [ ] .claude/skills/plan/SKILL.md is deleted
- [ ] .claude/skills/checkin/SKILL.md contains: 7-option menu, evening flow (options 4-6), anchor flow (option 2), no auto-detection of morning/evening
- [ ] /checkin menu presents all options without time-of-day gating — user picks freely
- [ ] crossroads signal definition exists in data-schemas.md
- [ ] draft block semantics (start=0,end=0) documented in data-schemas.md plan.csv section
- [ ] architecture.md route table shows / → /plan/day, /vision described as weekly+ deep review
- [ ] app-intent.md surface reality table swaps vision/plan roles
- [ ] CLAUDE.md skills table removes /plan, updates /checkin description
- [ ] All 5 doc files updated per doc updates requirement
- [ ] No files modified outside declared scope
- [ ] Health metrics preserved (layer boundaries, flat nav, capture reliability, data simplicity)
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `cd app && npm run build` | Fix code, rebuild |
| Console error on /plan/day | Browser console | Trace to source, fix |
| Console error on /vision | Browser console | Trace to source, fix |
| Draft blocks show "12:00am" | Visual inspection of /plan/day with 0,0 entries in plan.csv | Fix PlanBlock conditional rendering |
| Redirect goes to /vision | Navigate to / | Fix app/app/page.tsx redirect target |
| SchedulerModal still reachable | grep for SchedulerModal in DayView.tsx | Remove all references |
| Edit Plan button visible | Visual inspection of /plan/day | Remove from DayView.tsx |
| /checkin skill has auto-detection | Read SKILL.md for time-of-day gating | Rewrite menu section to present all options |
| /plan skill still exists | Check .claude/skills/plan/SKILL.md | Delete file |
| Habit grid collapsed on /vision | Visual inspection | Change default state to open |
| Scope violation | `git diff --stat` against file list | Revert unintended changes |
| Crossroads signal missing from schemas | Read data-schemas.md | Add signal definition |
| API contract broken | Test /api/hub, /api/vision, /api/plan endpoints | Revert — APIs must not change |

## 6. Invariants (Must NOT Change)

```
INVARIANTS — DATA LAYER:
- data/vision.json structure (schema unchanged)
- data/daily_signals.csv schema (only ADD new signal types, never modify existing)
- data/plan.csv column structure (date,start,end,item,done,notes,domain — unchanged)
- data/*.csv — no new CSV files created

INVARIANTS — API LAYER:
- /api/vision GET/PUT/PATCH contract (request/response shape unchanged)
- /api/hub GET contract (response shape unchanged)
- /api/plan GET/POST contract (request/response shape unchanged)
- /api/plan/range GET contract unchanged
- /api/daily-signals POST contract unchanged

INVARIANTS — ROUTES:
- /health route and all components — zero changes
- /resources route and all components — zero changes
- /plan/week, /plan/month, /plan/year pages — zero changes
- app/app/plan/PlanProvider.tsx — zero changes
- app/app/plan/layout.tsx — zero changes

INVARIANTS — PIPELINES:
- scripts/voice-inbox.sh — zero changes
- .claude/prompts/voice-inbox.md — zero changes (line 54 legacy domain fix is OUT OF SCOPE for this spec — tracked separately)
- scripts/precompute-checkin.js — zero changes
- scripts/precompute-weekly.js — zero changes
- scripts/precompute-plan.js — zero changes
- scripts/reconcile.js — zero changes

INVARIANTS — CADENCE CONTRACT:
- Daily = signals only (NO vision.json writes)
- Weekly = A+H+intentions.weekly to vision.json
- Monthly = identityScript+antiVision+intentions to vision.json
- Quarterly = full PUT to vision.json

INVARIANTS — BEHAVIOR:
- Done toggles on schedule blocks continue to work (POST /api/plan)
- PlanCard on /vision page continues to show today's plan with done toggles
- Habit grid on /vision page continues to show 90 days of data
- BriefingCard continues to work on both /plan/day and /vision
- NowLine continues to render between past and future blocks
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO:

1. Does this file reference only canonical vocabulary (ritual, identity, draft, schedule)?
2. Did I preserve all existing content not explicitly marked for removal in this spec?
3. Does my diff contain ONLY changes this spec asked for?
4. Can I trace every change to a specific section of this spec?
5. Did I break any invariant from Section 6?
6. If this is a UI file: does the visual output match Section 3?
7. If this is a skill file: does the menu/flow match Pillar 3/4 decisions?
8. If this is a doc file: is the change consistent with ALL other doc updates in this spec?

## 8. Diff Contracts

### 8a. `app/app/page.tsx`
- **WHAT**: Change redirect from `/vision` to `/plan/day`
- **WHY**: Pillar 1 — /plan/day becomes daily home page
- **PRESERVES**: File structure (still a redirect-only page)
- **REMOVES**: `/vision` as redirect target
- **RISK**: Low — single line change

### 8b. `app/app/components/DayView.tsx`
- **WHAT**: Rebuild content order, add ritual+identity+briefing sections, remove SchedulerModal
- **WHY**: Pillar 1 — /plan/day content order: ritual → identity → intentions+briefing → drafts → schedule
- **PRESERVES**: Done toggle logic (setPlanDone), NowLine rendering, timed event rendering, intention fetching
- **REMOVES**: SchedulerModal import + state + rendering, Edit Plan button, handleEdit callback
- **ADDS**: Fetch vision.json for identityScript (coreTraits + nonNegotiables), fetch /api/hub for briefing data, "Today's Priorities" draft section, compact identity text block
- **RISK**: Medium — largest UI change. Must preserve done toggle behavior. BriefingCard import needed.

### 8c. `app/app/components/PlanBlock.tsx`
- **WHAT**: Handle start=0/end=0 by hiding time label
- **WHY**: Pillar 2 — draft blocks should not show "12:00am-12:00am"
- **PRESERVES**: All existing props and behavior for timed blocks
- **REMOVES**: Nothing
- **ADDS**: Conditional: if start===0 && end===0, hide time span
- **RISK**: Low — additive conditional only

### 8d. `app/app/components/PlanCard.tsx`
- **WHAT**: Partition drafts from timed, render drafts separately
- **WHY**: Pillar 2 + research Q10 — PlanCard doesn't handle all-day events
- **PRESERVES**: Timed block rendering, done toggles, NowLine
- **REMOVES**: Nothing
- **ADDS**: Draft partition (same logic as DayView: start=0 && end=0), draft section above timed blocks
- **RISK**: Low — same pattern as DayView already uses

### 8e. `app/app/vision/page.tsx`
- **WHAT**: Change default collapse states — habit grid open, experiments/input/distractions/audit collapsed
- **WHY**: Pillar 1 — /vision is weekly+ deep review, habit grid is primary review surface
- **PRESERVES**: All existing components, data fetching, rendering logic
- **REMOVES**: Nothing
- **ADDS**: State change for default open/collapsed sections
- **RISK**: Low — state initialization only

### 8f. `app/app/components/SchedulerModal.tsx`
- **WHAT**: Delete file entirely
- **WHY**: Pillar 1 — no in-app editing, SchedulerModal removed
- **PRESERVES**: Nothing (full deletion)
- **REMOVES**: Entire file
- **RISK**: Medium — must ensure no remaining imports reference this file

### 8g. `.claude/skills/checkin/SKILL.md`
- **WHAT**: Full rewrite — new menu structure, evening flow, anchor flow, absorb /plan actions
- **WHY**: Pillar 3 + Pillar 4 — /checkin becomes single entry point
- **PRESERVES**: Pre-menu (state scan, sleep, intention), all CSV write semantics, weekly/monthly/quarterly flows, completion flags, rules section, all write paths and signal names
- **REMOVES**: Current 6-option menu, time-of-day auto-detection for menu options, inbox triage from daily (moved to weekly)
- **ADDS**: 7-option menu (Log, Anchor, Today's plan, Decompress, Reflect on today, Set tomorrow, Brain state), evening flow, anchor flow with crossroads signal, draft block writes (start=0,end=0)
- **RISK**: High — largest change. Must preserve all existing write semantics exactly.

### 8h. `.claude/skills/plan/SKILL.md`
- **WHAT**: Delete file entirely
- **WHY**: Pillar 3 — /plan skill eliminated, absorbed into /checkin
- **PRESERVES**: Nothing (full deletion, functionality moved to /checkin)
- **REMOVES**: Entire file
- **RISK**: Low — functionality preserved in /checkin rewrite

### 8i-8m. Doc files (architecture.md, app-intent.md, data-schemas.md, CLAUDE.md, life-playbook.md)
- **WHAT**: Update route tables, surface descriptions, signal definitions, skill tables
- **WHY**: Design decisions — docs must match new reality
- See per-file details in Phase 4 below
- **RISK**: Medium — must be internally consistent across all 5 files

## 9. Abort Conditions

```
ABORT IF:
- app/app/page.tsx does not currently contain redirect("/vision") — unexpected state
- DayView.tsx does not import SchedulerModal — file structure changed since spec was written
- PlanBlock.tsx does not have formatTime(start)/formatTime(end) — rendering logic changed
- /api/hub response shape has changed (missing briefing, todaysPlan, etc.)
- /api/vision response shape has changed (missing identityScript, ritualBlueprint)
- vision/page.tsx structure is unrecognizable from the ~80 lines read during spec writing
- Any invariant file from Section 6 needs modification to make the feature work
- Build fails on an error unrelated to this feature's changes
- A checkpoint question answer is "no" and the fix would touch an invariant file
- 3 consecutive fix cycles fail on the same issue
- precompute-checkin.js output shape has changed (digest fields missing)
- checkin SKILL.md write semantics need to change to support new features (they shouldn't — only menu structure and flow change)
```

## 10. Implementation Phases

### Dependency Map

```
Phase 1 (UI tracer)  ─── file-disjoint ───  Phase 2 (Skill rewrite)
         │                                            │
         └──────── both feed into ────────────────────┘
                          │
                    Phase 3 (Draft planning)
                          │
                    Phase 4 (Doc updates)
                          │
                    Phase 5 (Verification)
```

Phases 1 and 2 are file-disjoint and can proceed in parallel.

---

### Phase 1: UI — Page Architecture Tracer

**Goal**: Wire /plan/day as the daily home page with correct content order. Remove SchedulerModal. Fix /vision defaults.

**Files touched**: `app/app/page.tsx`, `app/app/components/DayView.tsx`, `app/app/components/SchedulerModal.tsx` (delete), `app/app/vision/page.tsx`

#### Step 1.1: Root redirect

**File**: `app/app/page.tsx`

Change:
```typescript
// FROM:
redirect("/vision");
// TO:
redirect("/plan/day");
```

**Checkpoint**: Build passes. Navigate to / and confirm redirect to /plan/day.

#### Step 1.2: Strip SchedulerModal from DayView

**File**: `app/app/components/DayView.tsx`

1. Remove `import SchedulerModal from "./SchedulerModal"`
2. Remove `const [editing, setEditing] = useState(false)` state
3. Remove `todosForModal` computation
4. Remove `handleEdit` callback
5. Remove `handleSchedulerClose` callback
6. Remove the Edit Plan button JSX block (lines ~130-137)
7. Remove the SchedulerModal JSX block (lines ~260-274)
8. Remove `localTodos` state if no longer used
9. Keep `todos` and `onTodosChange` props — they may be used elsewhere in the plan tree

**Checkpoint**: Build passes. /plan/day loads without SchedulerModal. No console errors.

#### Step 1.3: Delete SchedulerModal

**File**: `app/app/components/SchedulerModal.tsx` — DELETE

After deletion, verify no other files import SchedulerModal:
```bash
grep -r "SchedulerModal" app/app/
```

If other files import it, those imports must be removed too (but per current codebase, only DayView.tsx imports it).

Also check for imports of Timeline and TodoList components used only by SchedulerModal:
```bash
grep -r "import.*Timeline" app/app/
grep -r "import.*TodoList" app/app/
```

If Timeline.tsx and TodoList.tsx are ONLY imported by SchedulerModal, they become orphaned. Do NOT delete them in this phase — flag for a future `/audit` run.

**Checkpoint**: Build passes. No broken imports.

#### Step 1.4: Rebuild DayView content order

**File**: `app/app/components/DayView.tsx`

New content order (top to bottom):

1. **Ritual checklist** (already exists as "Ritual context strip" — promote from collapsed to open by default for current phase, keep collapsible)
2. **Compact identity** — NEW section. Fetch from `/api/vision` (already fetching for ritual). Show `identityScript.coreTraits` and `identityScript.nonNegotiables` as a compact text block.
3. **Intentions + Briefing** — Intentions banner already exists. ADD BriefingCard below it. Fetch briefing from `/api/hub` (new fetch for DayView).
4. **Today's Priorities (drafts)** — NEW section. Filter `allDayEvents` (start=0, end=0). Show only if non-empty. Purple accent styling.
5. **Schedule** — existing timed events section. Unchanged behavior.

New data fetches needed in DayView:
- `/api/hub` for briefing data (currently only fetched by /vision page)
- `/api/vision` already fetched for ritual — extend to read `identityScript`

New state:
```typescript
const [identityScript, setIdentityScript] = useState<{ coreTraits: string; nonNegotiables: string } | null>(null);
const [briefing, setBriefing] = useState<BriefingData | null>(null);
```

Ritual strip change: default `ritualOpen` to `true` (was `false`).

**Implementation notes**:
- BriefingCard component already exists (`app/app/components/BriefingCard.tsx`). Import it.
- BriefingCard props: check existing component interface and pass matching data from /api/hub response.
- Identity section should be `isToday` only (no identity on past/future day views).
- Briefing section should be `isToday` only.
- Drafts section should show for any date (drafts could exist for future days too).

**Checkpoint**: Build passes. /plan/day shows ritual (open) → identity → intentions+briefing → drafts → schedule. Done toggles still work.

#### Step 1.5: Fix /vision page defaults

**File**: `app/app/vision/page.tsx`

Find the state variables controlling collapse/expand for:
- Habit grid — find state, change default to `true` (open)
- Experiments — find state, change default to `false` (collapsed)
- Input Control — find state, change default to `false` (collapsed)
- Distractions — find state, change default to `false` (collapsed)
- Habit Audit — find state, change default to `false` (collapsed)

Read the actual file first to find exact state variable names before making changes.

**Checkpoint**: Build passes. /vision loads with habit grid open, other sections collapsed.

#### Phase 1 Gate

```
[ ] Build passes
[ ] / → /plan/day
[ ] /plan/day content order matches visual contract
[ ] No Edit Plan button
[ ] No SchedulerModal
[ ] /vision habit grid open by default
[ ] Done toggles work on /plan/day
[ ] /plan/week, /plan/month, /plan/year unchanged
[ ] /health, /resources unchanged
```

---

### Phase 2: Skill — /checkin Rewrite + /plan Deletion

**Goal**: Rewrite /checkin SKILL.md with new menu structure, evening flow, anchor flow. Delete /plan SKILL.md.

**Files touched**: `.claude/skills/checkin/SKILL.md`, `.claude/skills/plan/SKILL.md` (delete)

#### Step 2.1: Delete /plan skill

**File**: `.claude/skills/plan/SKILL.md` — DELETE

**Checkpoint**: File deleted. Verify no other skill files reference `/plan` as a delegation target.

#### Step 2.2: Rewrite /checkin SKILL.md

**File**: `.claude/skills/checkin/SKILL.md`

This is a full rewrite. The new file must preserve:
- All existing CSV write semantics (signal names, value formats, file paths)
- Weekly/monthly/quarterly flows (Phases 1-7, Steps 1-4, Steps 1-5)
- Completion flags table
- Canonical files read/written lists
- Rules section
- precompute script calls
- reconcile.js call at end
- Re-entry behavior

The new file must change:
- Daily menu from 6 options to 7 options with new labels
- Remove time-of-day auto-detection for menu options
- Add evening flow (options 4-6)
- Add anchor flow (option 2)
- Rename "Emotional check" to "Decompress" (option 4)
- Rename "Reflect on yesterday" to "Reflect on today" (option 5)
- Add "Set tomorrow" (option 6)
- Move inbox triage from daily to weekly only
- Add draft block writes (start=0, end=0) for "Set tomorrow"
- Absorb /plan skill add/done/move/intention into "Today's plan" (option 3) and as inline commands

#### Step 2.2.1: New SKILL.md Structure

```
---
name: checkin
description: [updated description]
---

# Check-in

## Date & Day-of-Week
[unchanged]

## Commands
[unchanged — /checkin, /checkin daily, /checkin weekly, /checkin monthly, /checkin quarterly]
[ADD: /checkin add, /checkin done, /checkin move — absorbed from /plan]

## Auto-Detection
[unchanged]

## Completion Flags
[unchanged]

## Canonical Files Read
[unchanged]

## Canonical Files Written
[unchanged]

## Daily Check-in

### Pre-Menu (always, in order)
1. State Scan (precompute-checkin.js, display cards)
2. Sleep (same as current)
3. Daily Intention (same as current)

### Menu
[NEW — see below]

### Option 1: Log
[same as current "Log habits" — unchanged write semantics]

### Option 2: Anchor
[NEW — see Pillar 4 spec below]

### Option 3: Today's Plan
[evolved from current "Plan today" + absorbed /plan skill actions]

### Option 4: Decompress
[renamed from "Emotional check" — same write semantics, new name]

### Option 5: Reflect on Today
[renamed from "Reflect on yesterday" — reframed to today, same write semantics]

### Option 6: Set Tomorrow
[NEW — writes draft blocks]

### Option 7: Brain State
[same as current]

### Conclude Expired Experiments
[unchanged]

## Weekly Check-in
[unchanged EXCEPT: inbox triage added as Phase 4.5]

## Monthly Check-in
[unchanged]

## Quarterly Check-in
[unchanged]

## Inline Commands
[NEW — /checkin add, /checkin done, /checkin move, /checkin intention]

## Rules
[mostly unchanged, updated references]
```

#### Step 2.2.2: New Daily Menu Spec

```markdown
### Menu

After sleep + intention are handled, present all options. No time-of-day gating — user picks freely. Labels are guidance, not auto-detected gates.

```
What do you want to do?

── Morning ──
  1. Log             (8 open today)
  2. Anchor
  3. Today's plan

── Evening ──
  4. Decompress
  5. Reflect on today
  6. Set tomorrow

── Anytime ──
  7. Brain state
```

Rules:
- Show counts from current state where applicable
- Options with nothing to do still appear but show "(done)" or "(0 items)"
- User can pick any option in any order regardless of time of day
- User can pick the same option again (re-enterable)
- After completing an option, ask "What next?" with the updated menu
- When user says "done" or stops, write `checkin_daily=1` if not already written today
```

#### Step 2.2.3: Option 2 — Anchor

```markdown
### Option 2: Anchor

A mirror, not therapy. Reads the user's own pre-committed words back at the moment of decision. Target: ~2 minutes.

#### Step 1: NAME IT

Ask: "What's pulling you right now?"

Accept free text. Store the response for use in subsequent steps.

#### Step 2: STATE CHECK

Ask two questions:
- "Energy right now?" (depleted / ok / good)
- "Clarity right now?" (foggy / clear)

If depleted + foggy:
> "You're in a low-reliability state. Decisions made here tend to serve the old identity."

#### Step 3: IDENTITY LENS

Surface from vision.json (read via `cat data/vision.json` — do NOT use API):

1. **Core traits + decision style**: `identityScript.coreTraits` and `identityScript.decisionStyle`
2. **Anti-vision**: `antiVision` (full text)
3. **Matched trigger replacements**: scan `distractions.triggerReplacements` for keyword overlap with the user's "pull" from step 1. Show matches.
4. **Matched destructive habits**: scan `habitAudit.destructive` for keyword overlap with the pull. Show matches.
5. **Relevant recent reflections**: grep `data/reflections.csv` for keyword overlap with the pull (last 30 days). Show up to 3 matches with date and lesson.

Present all surfaced content, then ask:

> "Does the person you're becoming do this? Or does this serve who you used to be?"

Keep it LEAN. Do NOT surface ABT(H) domains, becoming, timeline, or habits arrays.

#### Step 4: DECIDE + LOG

Wait for user's decision statement. Then:

- Classify as: `chose_new` (aligned with identity), `chose_old` (served old patterns), or `chose_middle` (compromise/unclear)
- Confirm classification with user: "I'd call that chose_new — sound right?"

Write to `daily_signals.csv`:
```
date,signal,value,unit,context,source,capture_id,category
<today>,crossroads,<chose_new|chose_old|chose_middle>,,<pull description> → <decision description>,chat,,personal_growth
```

Return to menu.
```

#### Step 2.2.4: Option 3 — Today's Plan (Evolved)

```markdown
### Option 3: Today's Plan

Surfaces existing drafts, assigns times, adds new blocks, handles rollover. Absorbs /plan skill quick actions.

#### 3.1 Surface Existing Drafts

Read today's plan entries from `data/plan.csv` where `start=0` and `end=0`.

If drafts exist:
```
Today's drafts (unscheduled):
  1. "Deep work block" — assign time? (e.g., 9-10:30am)
  2. "Gym session" — assign time?
  3. "Weekly team sync" — assign time?

  → assign times, skip, or add more
```

For each draft the user assigns a time:
- Parse time to decimal hours
- Update the row in plan.csv: set start and end to the parsed values
- Confirm: "Scheduled: [item] at [time]"

For drafts the user skips: leave as start=0, end=0.

#### 3.2 Rollover (same as current Option 5 — Section 5.1)

[Preserve exact current rollover logic from existing SKILL.md, including depth check, keep/defer/drop/skip, [rolled:N] tracking]

#### 3.3 Context-Aware Suggestions (same as current Option 5 — Section 5.2)

[Preserve exact current context-aware surfacing logic]

#### 3.4 Ritual Block Suggestions (morning only, same as current Section 5.2b)

[Preserve exact current ritual block suggestion logic]

#### 3.5 Quick Actions (absorbed from /plan skill)

After the planning flow, or if user enters a quick command:

- **"add <item> <time>"**: Parse item and time, write plan.csv row. Same logic as former `/plan add`.
- **"done <item>"**: Find matching block, mark done=1, check signal map. Same logic as former `/plan done`.
- **"move <item> <new-time>"**: Find matching block, update start/end. Same logic as former `/plan move`.

These also work as inline commands (see Inline Commands section).

#### 3.6 Confirm Plan (same as current Section 5.3)

[Preserve exact current confirm logic]
```

#### Step 2.2.5: Option 4 — Decompress

```markdown
### Option 4: Decompress

Renamed from "Emotional check". Same write semantics. New name reflects evening decompression framing.

Ask: "How are you feeling right now? Anything unresolved you're carrying?"

[Rest of flow identical to current Option 2: Emotional Check — same signal=feeling write, same opportunistic mind capture, same write semantics]

Write signals:
- `signal=feeling`, `value=<1-word summary>`, `context=<their words>`, `category=health`
- If trigger identified: `signal=mind`, `value=<trigger keyword>`, `context=thought: X | action: Y | circumstance: Z`, `category=health` or `category=personal_growth`

NOTE on category fix: Current spec says `category=mental` or `category=addiction`. These are legacy IDs. New writes MUST use `category=health` (for emotional/mental content) or `category=personal_growth` (for addiction content). Historical rows with `mental`/`addiction` remain valid.
```

#### Step 2.2.6: Option 5 — Reflect on Today

```markdown
### Option 5: Reflect on Today

Renamed from "Reflect on yesterday". Reframed: this option captures reflection on TODAY, not yesterday. Intended for evening use but available anytime.

Check `reflections.csv` for today (NOT yesterday). If no row exists:

1. "Quick win from today?"
2. "Anything you learned?"
3. "What would you do differently?"

Infer domain from answers. Write one row to `reflections.csv` with today's date immediately.

If reflection exists, say: "Today's reflection is already captured." and offer to view it.
```

#### Step 2.2.7: Option 6 — Set Tomorrow

```markdown
### Option 6: Set Tomorrow

Writes 2-3 draft blocks for tomorrow's date with start=0, end=0.

#### Flow:

1. Compute tomorrow's date: `date -d "+1 day" '+%Y-%m-%d'` (or equivalent)
2. Show tomorrow's existing plan (if any): read plan.csv for tomorrow's date
3. Ask: "What are tomorrow's 2-3 priorities?"
4. Accept natural language list. For each item:
   - Write to plan.csv: `date=<tomorrow>, start=0, end=0, item=<text>, done=, notes=, domain=<inferred>`
   - Do NOT ask for times — these are drafts. Times are assigned in the morning via Option 3.
5. Confirm: "Set [N] priorities for tomorrow."

Rules:
- Max 5 draft blocks per invocation
- If tomorrow already has drafts, show them and ask: "Add to these or replace?"
- If replace: do not delete old rows (append-only). Write new rows. Old 0,0 rows for tomorrow become orphaned drafts — acceptable.
- Infer domain from content (same heuristic as /plan skill used)
```

#### Step 2.2.8: Inbox Triage — Moved to Weekly

```markdown
## Weekly Check-in

[After existing Phase 4: Social Contact Check, ADD:]

### Phase 4.5: Inbox Triage

[Move entire current daily Option 4 (Inbox Triage) here — same GitHub sync, same triage sections, same rules. The only change is cadence: weekly instead of daily.]
```

#### Step 2.2.9: Inline Commands

```markdown
## Inline Commands

These work outside the menu flow, as direct commands. They are the absorbed /plan skill quick actions.

### `/checkin add <item> <time>`

Same behavior as former `/plan add`:
- Parse item and time. Accept: `3pm`, `15:00`, `3-4pm`, `3pm for 1h`
- Convert to decimal hours
- Default duration: 1 hour if no end time
- All-day (no time given): start=0, end=0
- Append to plan.csv
- Confirm: "Added: [item] at [time]"

### `/checkin done <item>`

Same behavior as former `/plan done`:
- Find matching block (case-insensitive substring)
- Mark done=1
- Check signal map for auto-signal
- If no keyword match, ask about trackable signal
- Confirm

### `/checkin move <item> <new-time>`

Same behavior as former `/plan move`:
- Find matching block
- Parse new time
- Update start/end
- Confirm

### `/checkin intention [text]`

Same behavior as former `/plan intention`:
- With arg: write immediately
- Without arg: show current, offer to change
- Same daily_signals.csv write

### `/checkin show`

Show today's plan:
1. Run `node scripts/precompute-plan.js`, display `display.today_plan`
2. Show weekly goals and intention context
3. Wait for user input
```

**Checkpoint for Phase 2**:
```
[ ] .claude/skills/plan/SKILL.md deleted
[ ] .claude/skills/checkin/SKILL.md rewritten with full spec
[ ] New menu has 7 options with morning/evening/anytime grouping
[ ] No time-of-day auto-detection in menu
[ ] Anchor flow has 4 steps ending with crossroads signal write
[ ] Decompress uses category=health not category=mental
[ ] Reflect on today references today not yesterday
[ ] Set tomorrow writes start=0, end=0
[ ] Inbox triage is in weekly flow, not daily
[ ] Inline commands section covers add/done/move/intention/show
[ ] All existing write semantics preserved (signal names, value formats, file paths)
[ ] Weekly/monthly/quarterly sections unchanged except inbox triage addition
[ ] reconcile.js call preserved at end
```

---

### Phase 3: Draft Planning — PlanBlock + PlanCard Fix

**Goal**: Plan blocks with start=0, end=0 render correctly as drafts (no time label) across all surfaces.

**Files touched**: `app/app/components/PlanBlock.tsx`, `app/app/components/PlanCard.tsx`

#### Step 3.1: PlanBlock draft rendering

**File**: `app/app/components/PlanBlock.tsx`

Current behavior: always renders `formatTime(start)-formatTime(end)`, which produces "12:00am-12:00am" for 0,0 entries.

Change: if `start === 0 && end === 0`, hide the time span entirely. Show only the item text with the done toggle.

```typescript
// Conditional rendering for time label:
{!(start === 0 && end === 0) && (
  <span className="text-xs text-zinc-400 w-24 shrink-0">
    {formatTime(start)}–{formatTime(end)}
  </span>
)}
```

Draft blocks should not show "missed" button (they have no time to be "past"):
```typescript
// isPast should be false for drafts regardless of currentHour
const effectivelyPast = (start === 0 && end === 0) ? false : isPast;
```

Pass `effectivelyPast` instead of `isPast` for opacity and missed button logic.

**Checkpoint**: Build passes. Draft blocks show item text without time. Timed blocks unchanged.

#### Step 3.2: PlanCard draft partition

**File**: `app/app/components/PlanCard.tsx`

Current behavior: all entries sorted by start, split into past/future by `currentHour`. Entries with start=0 always fall into pastBlocks.

Change: partition into drafts (start=0 && end=0) and timed. Render drafts in a separate section above timed blocks.

```typescript
const drafts = sorted.filter((b) => b.start === 0 && b.end === 0);
const timed = sorted.filter((b) => !(b.start === 0 && b.end === 0));
const pastBlocks = timed.filter((b) => b.end <= currentHour);
const futureBlocks = timed.filter((b) => b.end > currentHour);
```

Render drafts section (only if non-empty):
```
{drafts.length > 0 && (
  <div className="mb-3">
    <p className="text-[10px] uppercase tracking-wide text-purple-400 mb-1">Priorities</p>
    {drafts.map(...)}  // use PlanBlock which now handles 0,0
  </div>
)}
```

**Checkpoint**: Build passes. PlanCard on /vision shows drafts without "12:00am". Timed blocks unchanged.

#### Phase 3 Gate

```
[ ] Build passes
[ ] PlanBlock with start=0,end=0 shows no time label
[ ] PlanBlock with start=0,end=0 has no "missed" button
[ ] PlanBlock with start>0 is unchanged
[ ] PlanCard partitions drafts from timed
[ ] DayView allDayEvents section still works (it already handles 0,0 correctly)
[ ] Done toggles work on all block types
```

---

### Phase 4: Doc Updates

**Goal**: Update all 5 doc files to match new reality.

**Files touched**: `docs/architecture.md`, `docs/app-intent.md`, `docs/data-schemas.md`, `CLAUDE.md`, `docs/life-playbook.md`

#### Step 4.1: architecture.md

Changes:
1. Route table — change `/vision` description from "daily entry point" to "weekly+ deep review surface"
2. Route table — change `/` redirect from `/vision` to `/plan/day`
3. Route table — update `/plan` description to note `/plan/day` is daily home page
4. Remove `/api/reflections` from API Surface if still listed (already deleted per git status)
5. Remove `/api/mind` from API Surface if still listed (already deleted per git status)

Specific edits:
```
# Current:
- `/vision` Vision (daily entry point — merged Hub + Vision)
- `/` Redirect → `/vision`

# New:
- `/plan` Plan (/plan/day is daily home page, /plan/week|month|year for calendar views)
- `/vision` Vision (weekly+ deep review — identity, anti-vision, ABT(H), habit grid)
- `/` Redirect → `/plan/day`
```

#### Step 4.2: app-intent.md

Changes:
1. Surface Reality table — swap roles:

```
| Surface | Usage | Gravity | Ritual Role |
|---------|-------|---------|-------------|
| Plan/Day | Daily | High — daily home page, morning ritual + execution | Morning: ritual + identity + plan. Midday: execute blocks. Evening: review done/missed. |
| Vision | Weekly+ | Medium — deep review surface (Sundays, on-demand) | Weekly: full identity review, habit grid audit, ABT(H) reflection. |
| Health | Daily | High — workout logging, body metrics | On-demand: log workouts, track weight. |
| Resources | Rare | Low — passive storage | On-demand: reference material. |
```

2. Surface Interaction Map:

```
| Time | Surface | Action |
|------|---------|--------|
| Morning | `/plan/day` | Read ritual checklist, identity anchor, intentions, run /checkin |
| Midday | `/plan/day` | Execute plan blocks, toggle done, midday ritual reference |
| Evening | `/plan/day` | Review day, run /checkin for decompress + reflect + set tomorrow |
| Sunday | `/vision` | Weekly deep review, full identity, habit grid, ABT(H) cards |
```

3. Current Direction — update "Vision as single entry point" to "Plan/day as daily entry point, Vision as weekly+ deep review"

4. Decisions Made — append new rows:

```
| 2026-03-23 | /plan/day becomes daily home page, / redirects to /plan/day | Vision too dense for daily — lightweight plan surface for morning ritual + execution |
| 2026-03-23 | /vision becomes weekly+ deep review surface (Sundays, on-demand) | Full identity + ABT(H) + habit grid belong in weekly review, not daily |
| 2026-03-23 | /checkin absorbs /plan skill — single CLI write entry point | Eliminate skill duplication, one command for all writes |
| 2026-03-23 | Draft blocks: plan.csv entries with start=0, end=0 | Sunday weekly → draft blocks for week, evening → draft blocks for tomorrow, morning → assign times |
| 2026-03-23 | Anchor flow added to /checkin (crossroads signal) | Real-time trigger management using pre-committed identity content |
| 2026-03-23 | SchedulerModal removed — no in-app plan editing | CLI-first writes, app is for reading + done toggles only |
| 2026-03-23 | Evening flow added to /checkin (decompress, reflect, set tomorrow) | Evening shapes tomorrow — Daniel Abrada principle |
```

#### Step 4.3: data-schemas.md

Changes:
1. Add crossroads signal definition to daily_signals.csv section:

```
- `crossroads` — anchor decision point. `value` = `chose_new|chose_old|chose_middle`.
  `context` = `<pull description> → <decision description>`. `category=personal_growth`.
  Written by /checkin anchor flow (Option 2).
```

2. Add draft block semantics to plan.csv section:

```
Draft blocks: entries with `start=0` and `end=0` represent unscheduled priorities (drafts).
- Written by /checkin "Set tomorrow" (Option 6) and weekly checkin goal-to-block conversion.
- Rendered without time labels in DayView and PlanCard.
- Converted to scheduled blocks when user assigns times via /checkin "Today's plan" (Option 3).
- After time assignment, the row is updated in-place (start/end set to decimal hours).
```

3. Fix vision_reviewed signal description:

```
# Current:
- `vision_reviewed` (`1`) — review checkpoint ... Logged via ritual blueprint checkboxes on /vision.

# New:
- `vision_reviewed` (`1`) — review checkpoint, `context=morning|afternoon|evening`,
  `category=personal_growth`. Logged via ritual blueprint checkboxes on /plan/day
  (morning ritual checklist).
```

4. Fix mind signal category documentation:

```
# Current:
- `mind` — ... `category` = `mental` or `addiction`

# New:
- `mind` — trigger keyword in `value`, pipe-delimited context. `category` = `health`
  (emotional/mental content) or `personal_growth` (addiction/recovery content).
  Legacy rows with `category=mental` or `category=addiction` remain valid — do not backfill.
```

#### Step 4.4: CLAUDE.md

Changes:
1. Skills table — remove `/plan` row, update `/checkin` description:

```
# Remove:
| `/plan` | Fast plan mutations: add/done/move blocks, show day, sketch week | `plan`, `add block`, `plan week` |

# Update:
| `/checkin` | Single entry point for all daily writes. Morning: log, anchor, plan. Evening: decompress, reflect, set tomorrow. Also handles weekly/monthly/quarterly. Absorbed /plan skill. | `checkin`, `check in`, `morning check-in`, `plan`, `add block` |
```

2. Current App Routes — update redirect and descriptions:

```
# Current:
- `/` → redirects to `/vision`
- `/vision` — Merged Hub+Vision: identity script, 4-domain ABT(H) cards, ...

# New:
- `/` → redirects to `/plan/day`
- `/plan` — Daily home page (defaults to /plan/day): ritual checklist, compact identity, intentions+briefing, draft priorities, schedule with done toggles. Sub-routes: day/week/month/year.
- `/vision` — Weekly+ deep review: full identity script, anti-vision, 4-domain ABT(H) cards, 90-day habit grid (open), experiments (collapsed), input control (collapsed), distractions (collapsed), habit audit (collapsed), briefing, today's plan.
```

#### Step 4.5: life-playbook.md

Changes:
1. Surface Interaction Flow table:

```
# Current:
| Morning | `/vision` | Read identity script, review ritual steps, set direction |
| Midday | `/plan` | Execute blocks, midday ritual strip for reset anchors |
| Evening | `/vision` | Review the day, reflect, prepare tomorrow |

# New:
| Morning | `/plan/day` | Read ritual checklist, identity anchor, review intentions + briefing, run /checkin |
| Midday | `/plan/day` | Execute plan blocks, toggle done, midday ritual reference |
| Evening | `/plan/day` | Review day, run /checkin for decompress + reflect + set tomorrow |
| Sunday | `/vision` | Weekly deep review: full identity, habit grid, ABT(H), run /checkin weekly |
```

#### Phase 4 Gate

```
[ ] architecture.md route table updated
[ ] app-intent.md surface table swapped, decisions appended
[ ] data-schemas.md has crossroads signal + draft block semantics + category fixes
[ ] CLAUDE.md skills table updated, routes updated
[ ] life-playbook.md surface flow updated
[ ] All 5 doc files are internally consistent with each other
[ ] No contradictions between docs
```

---

### Phase 5: Verification

#### Step 5.1: Build

```bash
cd app && npm run build
```

Must pass with zero errors.

#### Step 5.2: Diff Review

```bash
git diff --stat
```

Verify ONLY files in the declared scope were modified. Flag any unexpected files.

Expected modified files:
```
app/app/page.tsx
app/app/components/DayView.tsx
app/app/components/PlanBlock.tsx
app/app/components/PlanCard.tsx
app/app/vision/page.tsx
.claude/skills/checkin/SKILL.md
docs/architecture.md
docs/app-intent.md
docs/data-schemas.md
CLAUDE.md
docs/life-playbook.md
```

Expected deleted files:
```
app/app/components/SchedulerModal.tsx
.claude/skills/plan/SKILL.md
```

#### Step 5.3: Browser Verification

Navigate to each route and verify:

| Route | Check |
|-------|-------|
| `/` | Redirects to `/plan/day` |
| `/plan/day` | Content order: ritual (open) → identity → intentions+briefing → drafts (if any) → schedule |
| `/plan/day` | No Edit Plan button |
| `/plan/day` | Done toggles work |
| `/plan/day` | No console errors |
| `/vision` | Habit grid open by default |
| `/vision` | Experiments/input/distractions/audit collapsed |
| `/vision` | No console errors |
| `/plan/week` | Unchanged, loads correctly |
| `/plan/month` | Unchanged, loads correctly |
| `/plan/year` | Unchanged, loads correctly |
| `/health` | Unchanged, loads correctly |
| `/resources` | Unchanged, loads correctly |

#### Step 5.4: Draft Block Test

To test draft rendering, temporarily add a 0,0 entry to plan.csv for today:
```
<today>,0,0,Test draft block,,,
```

Verify:
- /plan/day shows "Today's Priorities" section with "Test draft block" (no time label)
- /vision PlanCard shows draft in "Priorities" subsection (no "12:00am")

Remove the test entry after verification.

#### Step 5.5: Spec Adherence

Walk each success criterion from Section 4 and mark YES/NO.

#### Step 5.6: Invariant Check

Walk each invariant from Section 6 and verify no violations.

## Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat` against scope |
| Browser verification | Yes | Navigate all routes, console check |
| Draft block test | Yes | Manual 0,0 entry test |
| Spec adherence | Yes | Walk success criteria |
| Invariant check | Yes | Walk invariant list |
| Confidence report | Yes | Summary with evidence |
