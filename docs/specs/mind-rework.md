## Feature: Mind Page Rework

### Problem

- What: The mind page is overcomplicated (519-line CBT therapy worksheet with 13-field entries, 4 sub-tabs, lens/relief scoring, streak tracking) and nearly unused (2 entries ever, rated "Rare / Low gravity" in app-intent.md).
- Why: It has its own data file (`mind_loops.csv`), its own entry flow, and doesn't connect to the daily checkin ritual that drives all other data capture. The philosophical framing (Advaita/Lucille, James Allen, Joscha Bach, CBT) should inform tone, not add schema complexity.
- User-facing effect: Replace with a simple read surface showing mind entries (trigger/thought/action/circumstance) captured during daily checkin, plus mental/addiction reflections. Kill `mind_loops.csv` entirely.

### Scope

Modify:
- `app/app/mind/page.tsx` — full rewrite to simple table view
- `app/app/api/mind/route.ts` — rewrite to read `daily_signals.csv` (signal=mind) + `reflections.csv` (domain=mental|addiction)
- `app/app/lib/csv.ts` — remove `readMindLoops()` and `appendMindLoop()` functions
- `app/app/lib/types.ts` — remove `MindLoopEntry` interface
- `.claude/skills/checkin/SKILL.md` — expand Phase 3 (Emotional Check) to capture mind entries
- `docs/data-schemas.md` — add `signal=mind` documentation, remove `mind_loops.csv` section
- `docs/features.md` — update mind surface description

Delete:
- `data/mind_loops.csv`

Must NOT change:
- `daily_signals.csv` column schema (no new columns)
- Hub page (`app/app/page.tsx`)
- Plan page and API
- Health page and API
- Voice inbox pipeline (`scripts/voice-inbox.sh`)
- Checkin phases 1, 2, 4, 5, 6
- `app/app/components/BottomNav.tsx`
- Any other CSV files

### Data Design

Single row per mind entry in `daily_signals.csv`:

```
date,signal,value,unit,context,source,capture_id,category
2026-03-06,mind,work_pressure,,thought: catastrophizing | action: went for walk | circumstance: bad call with manager,chat,,mental
```

Field mapping:
- `signal` = `mind` (fixed)
- `value` = trigger keyword (short, groupable — e.g. `work_pressure`, `isolation`, `relationship_doubt`)
- `unit` = empty
- `context` = pipe-delimited: `thought: <X> | action: <Y> | circumstance: <Z>` (any subset allowed — not all fields required)
- `category` = `mental` or `addiction`
- `source` = `chat` (from checkin) or `voice` (from voice inbox)

Parsing rule for API: split `context` on `|`, then split each segment on first `:` to get key-value pairs. Unknown keys are ignored. Missing keys return empty string.

### Visual Contract

Page: `/mind`
Viewport: mobile-first (375px), responsive to desktop

What the user SHOULD see:
- Page title "Mind" at top
- "Recent Entries" section: table/card list of `signal=mind` rows from daily_signals, most recent first
  - Each entry shows: date, trigger (from value), thought, action, circumstance (parsed from context)
  - Empty fields show as dash or are omitted
- "Reflections" section below: filtered reflections where domain = `mental` or `addiction`
  - Each row shows: date, domain, win, lesson, change
- Empty state when no mind entries exist: "No mind entries yet. They'll appear here after your daily check-in."

What the user should NOT see:
- No sub-tabs or tab navigation
- No streak/relief/intensity metrics
- No lens badges (CBT/DBT/IFS/ACT/somatic)
- No "Mind Snapshot" summary section
- No ReflectPanel component
- No console errors

### Checkin Skill Change (Phase 3 expansion)

Current Phase 3 asks: "How are you feeling right now? Anything unresolved you're carrying?"

Updated behavior:
1. Ask the same opening question
2. If user shares something substantive (not "fine"/"good"):
   - Write `feeling` signal as before
   - Follow up conversationally: "Was there a specific trigger?" (only if natural)
   - If trigger shared: "What thought came up?" (only if conversation flows there)
   - If thought shared: "What did you do about it?" (only if natural)
3. If any trigger was identified, write a single `signal=mind` row to daily_signals.csv:
   - `value` = trigger keyword (infer from their words)
   - `context` = pipe-delimited thought/action/circumstance from what they shared
   - `category` = `mental` or `addiction` (infer from content)
4. Do NOT force the deeper questions. If user gives a feeling and moves on, that's fine — just log the feeling signal.
5. The mind capture is opportunistic, not mandatory. No "mind" completion flag.

### Success Criteria

- [ ] Build passes (`cd app && npm run build` — zero errors)
- [ ] `/mind` page loads without console errors
- [ ] Mind page shows entries from `daily_signals.csv` where `signal=mind`
- [ ] Mind page shows reflections filtered to `mental` and `addiction` domains
- [ ] Mind page has no sub-tabs, no streak metrics, no lens badges
- [ ] `GET /api/mind` returns mind entries + reflections (test with curl)
- [ ] `mind_loops.csv` is deleted
- [ ] `readMindLoops` and `appendMindLoop` removed from csv.ts
- [ ] `MindLoopEntry` removed from types.ts
- [ ] No files modified outside declared scope
- [ ] Checkin SKILL.md Phase 3 updated with mind capture flow
- [ ] `docs/data-schemas.md` updated (mind_loops section removed, signal=mind added)

### Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console check | Trace to source, fix |
| Import error (MindLoopEntry) | Build fails after type removal | Find and remove all imports |
| API returns 500 | `curl localhost:3000/api/mind` | Fix route handler |
| Mind page still shows old UI | Visual check | Verify page.tsx was rewritten |
| Scope violation | `git diff --stat` | Revert unintended changes |

### Invariants

- `daily_signals.csv` column schema must not change (no new columns)
- Existing `daily_signals.csv` rows must not be modified
- Hub, Plan, Health pages must render identically
- Voice inbox pipeline must keep working
- BottomNav must still link to `/mind`
- Other checkin phases (1, 2, 4, 5, 6) must not change behavior

### Per-File Checkpoints

After each file, answer yes/no:
1. Does my diff contain ONLY changes the spec asked for?
2. Did I remove all references to deleted types/functions?
3. Can I trace every change to a specific spec item?

### Implementation Order

1. **Phase 1 (data layer cleanup)**: Remove `readMindLoops`/`appendMindLoop` from csv.ts, remove `MindLoopEntry` from types.ts
2. **Phase 2 (API rewrite)**: Rewrite `/api/mind/route.ts` to read daily_signals (signal=mind) + reflections (domain=mental|addiction), add context parsing logic
3. **Phase 3 (page rewrite)**: Rewrite `/mind/page.tsx` as simple table — entries + reflections, no tabs
4. **Phase 4 (docs + skill)**: Update data-schemas.md, features.md, checkin SKILL.md
5. **Phase 5 (cleanup)**: Delete `data/mind_loops.csv`
6. **Phase 6 (verify)**: Build, curl API, visual check

### Abort Conditions

- File content doesn't match expected state when first read
- Change requires modifying daily_signals.csv column schema
- Removing MindLoopEntry breaks something outside declared scope
- 3 consecutive fix cycles fail on the same issue
- Build introduces errors in unrelated pages

### Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat` — only declared files |
| Browser verification | Yes | Navigate to `/mind`, check table renders |
| API check | Yes | `curl localhost:3000/api/mind` |
| Spec adherence | Yes | Walk each success criterion |
