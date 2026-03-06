# Feature Spec: App Restructure — Hub-Centric Consolidation

## Intent Alignment

This feature serves the app-intent directive: "fewer surfaces with more gravity." It cuts low-usage tabs, consolidates useful functionality into high-gravity surfaces, and tightens the morning flow to Hub + Vision.

### What to optimize for
- Daily usability of Hub and Plan (the two execution surfaces)
- Accountability clarity (can I see my streaks/habits/recovery in 3 seconds?)
- Briefing completeness (do I know what to do today without navigating away?)
- Minimal surface count (every tab must earn its place)

### Trade-off rules
- CUT over KEEP when usage is rare, even if the feature is "nice"
- KEEP logging breadth (CSVs stay) even when cutting surfacing breadth (UI goes)
- COMPACT over DETAILED when surfacing on Hub (full detail belongs on dedicated pages)
- SIMPLE over CLEVER for any new UI section

### Health metrics (from app-intent.md — must not degrade)
- 3-layer boundary integrity: CSV / lib+api / pages stays clean
- Flat navigation: no new route trees
- Capture reliability: voice/text pipeline keeps working
- Data simplicity: no new CSV files
- Startup friction: daily use should not require more steps

---

## Problem

### What
The app has 7 tabs (Hub, Health, Plan, Mind, Ideas, Resources, Vision). Surface Reality audit (app-intent.md) shows Mind, Ideas, and Resources have rare usage and low gravity. Hub carries sections that aren't useful (Next Action, Ideas summary, Meditation card) while missing useful functionality (reflections, todos peek). The Mind tab is "a complete shit show" per user — its only useful feature (ReflectPanel) is buried inside it.

### Why
Too many surfaces with too little gravity. The app feels like a restaurant with a menu too big. Daily flow should be Hub (accountability + briefing) then Vision (orientation), not scanning 7 tabs to find what matters.

### User-facing effect
- Fewer tabs in navigation (7 -> 5)
- Hub becomes a complete morning page (accountability + briefing + compact reflections)
- Plan gets always-visible todos sidebar
- Mind tab disappears (reflections move to Hub, CBT loops stay in CSV)
- Ideas and Resources stay but with fixes

---

## Scope

### Files to modify

**Navigation:**
- `app/app/components/BottomNav.tsx` — remove Mind from tabs

**Hub (cut sections + add reflection section):**
- `app/app/page.tsx` — remove Next Action card, Ideas summary, Meditation card, Weight progress bar; add compact AI reflection section; add todos peek (top 3 open)
- `app/app/api/hub/route.ts` — remove nextAction, ideas, meditation, weight from payload; add reflections summary and open todos count

**Plan (todos sidebar):**
- `app/app/plan/page.tsx` — make todos sidebar always-visible on desktop (>= 1024px), keep toggle on mobile

**Ideas pipeline fixes:**
- `app/app/api/ideas/route.ts` — fix filter to include `ideas` (plural) and compound destinations containing `idea`

**Resources content:**
- `data/resources.csv` — add "As a Man Thinketh" entry
- `data/quotes.csv` — add curated quotes from as_a_man_thinketh.txt

### Files to create
- None (all changes modify existing files)

### Files that must NOT change
- `app/app/vision/page.tsx` — Vision revamp is a separate session
- `app/app/health/page.tsx` — no changes to Health
- `app/app/resources/page.tsx` — no structural changes
- `data/daily_signals.csv` — no schema changes
- `data/workouts.csv` — no schema changes
- `data/plan.csv` — no schema changes
- `data/todos.csv` — no schema changes
- `data/reflections.csv` — no schema changes
- `data/mind_loops.csv` — no schema changes (CSV stays, UI goes)
- `data/inbox.csv` — no schema changes
- `scripts/voice-inbox.sh` — no changes (voice pipeline untouched)
- `.claude/prompts/voice-inbox.md` — no changes

### Routes after restructure
| Route | Status |
|-------|--------|
| `/` (Hub) | MODIFY — restructure sections |
| `/plan` | MODIFY — todos sidebar |
| `/health` | NO CHANGE |
| `/vision` | NO CHANGE |
| `/ideas` | MODIFY — API fix only |
| `/resources` | NO CHANGE (data additions only) |
| `/mind` | KEEP page file (for bookmarks/SEO) but redirect to `/` |
| `/reflect` | Already redirects to `/mind`, update to redirect to `/` |

---

## Visual Contract

### Hub (`/`) — Viewport: 390px mobile + 1280px desktop

What the user SHOULD see (top to bottom):
1. Date header (left) + "Hub" label (right) — unchanged
2. **Today Queue** — undone plan blocks (max 3) + top 3 open todos with "Open Plan" link
3. **Recovery card** — day X/90, streaks (weed, lol, poker, clarity) with progress bar
4. **Habit grid** — 14 days x 9 habits with trend buttons — unchanged
5. **90-Day Reset heatmap** — full grid with hover tooltips — unchanged
6. **Compact Reflections** — AI-analyzed ultra-concise bullet points grouped by life domain (max 5 bullets total, pulling from recent reflections.csv). Header: "Recent Reflections". Each bullet: domain tag + one-line insight.
7. **Daily Insight** — unchanged

What the user should NOT see:
- No "Next Action" card
- No "Ideas" summary card
- No "Meditation" section
- No "Weight" progress bar (weight lives on Health only)
- No console errors
- No layout overflow

### Plan (`/plan`) — Viewport: 1280px desktop

What the user SHOULD see:
- On desktop (>= 1024px): calendar takes ~70% width, todos panel always visible on right ~30%
- On mobile: todos accessible via toggle button (current behavior)
- Todos panel shows all todos with add/complete/delete functionality
- Calendar navigation unchanged (year/month/week/day zoom)

What the user should NOT see:
- No slide-out overlay on desktop (todos are inline, not overlaid)
- No visual regression on calendar views

---

## Success Criteria

- [ ] Build passes (`cd app && npm run build`) with zero errors
- [ ] Navigation shows exactly 5 tabs: Vision, Hub, Plan, Health, Ideas, Resources (6 total — Mind removed)
- [ ] Hub loads without Next Action, Ideas summary, Meditation, or Weight sections
- [ ] Hub shows Today Queue with both plan blocks AND top 3 open todos
- [ ] Hub shows compact reflections section with domain-tagged bullet points
- [ ] Plan page on desktop (>= 1024px) shows todos sidebar inline (not slide-out)
- [ ] `/mind` redirects to `/`
- [ ] `/reflect` redirects to `/`
- [ ] Ideas API returns entries with `suggested_destination` of `idea` OR `ideas` OR containing `idea` in compound values
- [ ] `data/resources.csv` contains "As a Man Thinketh" by James Allen
- [ ] `data/quotes.csv` contains at least 5 quotes from As a Man Thinketh
- [ ] No files modified outside declared scope
- [ ] Voice inbox pipeline still works (scripts unchanged)

---

## Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error on Hub | Browser console check | Trace to source, fix |
| Console error on Plan | Browser console check | Trace to source, fix |
| Hub still shows cut sections | Screenshot vs visual contract | Remove remnant JSX + API payload fields |
| Hub missing new sections | Screenshot vs visual contract | Implement missing section |
| Plan todos not inline on desktop | Screenshot at 1280px | Fix CSS layout |
| Mind tab still in nav | Screenshot of nav | Fix BottomNav.tsx |
| API error on /api/hub | `curl localhost:3000/api/hub` | Fix route handler |
| API error on /api/ideas | `curl localhost:3000/api/ideas` | Fix route handler |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Regression on Health/Vision/Resources | Navigate to each, screenshot | Revert, find non-destructive approach |

---

## Invariants

- All existing CSV data must not be modified (append-only for resources.csv and quotes.csv)
- Vision page must not change in any way
- Health page must not change in any way
- Resources page component must not change
- Voice inbox pipeline (scripts + prompts) must not change
- Layer boundaries must hold: new Hub reflection logic goes in `lib/` or `api/`, NOT in `page.tsx`
- Habit grid order and behavior must not change
- 90-Day Reset heatmap must not change
- Recovery card must not change (only its position in the page may move)

---

## Per-File Checkpoints

After completing each file, answer yes/no:
1. Does this file reference only the canonical vocabulary from the spec?
2. Did I preserve all existing content not explicitly marked for removal?
3. Does my diff contain ONLY changes the spec asked for?
4. Can I trace every change to a specific spec item?
5. Did I check the invariants list for this file?

---

## Diff Contract

State before each file edit:
- **WHAT**: 1-line description
- **WHY**: which spec item it maps to
- **PRESERVES**: what existing content is kept
- **REMOVES**: what is being deleted and why
- **RISK**: what could go wrong

---

## Abort Conditions

Default conditions plus:
- Hub API route returns different shape than page.tsx expects -> stop, reconcile types first
- ReflectPanel logic is too coupled to Mind page to extract cleanly -> stop, ask user about simplification
- Todos sidebar on Plan breaks calendar layout at any zoom level -> stop, revert to slide-out
- Any modification touches a file in the "must NOT change" list -> stop immediately
- New Hub reflection section requires a new API endpoint -> that's fine, create it, but verify it follows the existing pattern in `app/api/`
- 3 consecutive fix cycles fail on the same issue -> stop, explain, ask user

---

## Verification Route

**HARD REQUIREMENT: All browser verification gates use `mcp__claude-in-chrome__*` tools. Do NOT report done without screenshot evidence from Chrome.**

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat`, scope check against files list |
| Browser verification | Yes | **Chrome extension (mandatory)** — see protocol below |
| Spec adherence | Yes | Walk each success criterion with evidence |
| Regression check | Yes | **Chrome extension (mandatory)** — see protocol below |
| Confidence report | Yes | Summary with screenshot evidence per route |

### Chrome Verification Protocol

Before reporting any phase or the final result to the user:

1. **Ensure dev server is running** (`cd app && npm run dev`)
2. **Get tab context** (`mcp__claude-in-chrome__tabs_context_mcp`)
3. **For each affected route** (`/`, `/plan`, `/ideas`):
   a. Navigate to the route (`mcp__claude-in-chrome__navigate`)
   b. Take a screenshot (`mcp__claude-in-chrome__computer` with action=screenshot)
   c. Read console messages (`mcp__claude-in-chrome__read_console_messages` with pattern="error|Error|ERR")
   d. Read network requests (`mcp__claude-in-chrome__read_network_requests`) — check for failed API calls
   e. Compare screenshot against the Visual Contract section of this spec
   f. If any element is missing or misplaced: enter fix loop, do NOT report to user
4. **For regression routes** (`/health`, `/vision`, `/resources`):
   a. Navigate and screenshot each
   b. Confirm no visual changes from baseline
   c. Check console for new errors
5. **For Plan todos sidebar**: screenshot at desktop width (1280px+) to confirm inline layout
   a. Use `mcp__claude-in-chrome__resize_window` to set 1280x800 before screenshot
6. **For redirects** (`/mind`, `/reflect`):
   a. Navigate to each
   b. Confirm redirect lands on `/`

### Screenshot Evidence Required

The confidence report to the user MUST include:
- Screenshot of Hub showing all kept sections and no cut sections
- Screenshot of Plan at 1280px showing inline todos sidebar
- Screenshot of nav bar showing correct tabs
- Console output confirming zero errors on `/` and `/plan`
- Confirmation that `/mind` and `/reflect` redirect to `/`

If any screenshot shows a problem, enter the fix loop. Do NOT show the user a broken screenshot and ask what to do — fix it first, re-screenshot, then report.

---

## Implementation Order

Execute in this order to minimize risk and enable incremental verification:

### Phase 1: Data additions (zero risk)
1. Add "As a Man Thinketh" to `data/resources.csv`
2. Add curated quotes to `data/quotes.csv`

### Phase 2: API changes (backend, no UI breakage)
3. Modify `/api/hub/route.ts` — remove nextAction, ideas, meditation, weight; add reflections summary + open todos peek
4. Modify `/api/ideas/route.ts` — fix idea/ideas filter

### Phase 3: Navigation
5. Modify `BottomNav.tsx` — remove Mind tab
6. Update `/mind/page.tsx` — redirect to `/`
7. Update `/reflect/page.tsx` — redirect to `/`

### Phase 4: Hub restructure (most complex)
8. Modify `app/page.tsx` — remove cut sections, add new sections, update types

### Phase 5: Plan todos sidebar
9. Modify `app/plan/page.tsx` — inline todos on desktop

### Phase 6: Verification (all gates mandatory)
10. Build gate: `cd app && npm run build` — zero errors
11. Start dev server: `cd app && npm run dev`
12. Chrome verification — every affected route:
    - `/` (Hub): screenshot, console check, network check, visual contract comparison
    - `/plan` (Plan): resize to 1280x800, screenshot, confirm inline todos
    - `/ideas`: screenshot, confirm fixed entries appear
    - `/mind`: confirm redirect to `/`
    - `/reflect`: confirm redirect to `/`
13. Chrome regression check — unchanged routes:
    - `/health`: screenshot, confirm identical
    - `/vision`: screenshot, confirm identical
    - `/resources`: screenshot, confirm new data appears
14. Diff review: `git diff --stat` — only expected files changed
15. Confidence report with screenshot evidence per route

**Do NOT report to user until gates 10-14 all pass. If any gate fails, enter fix loop (max 3 retries per failure type, then abort and explain).**

---

## Reflection Section Design

The compact reflection section on Hub must:
- Pull from `data/reflections.csv` (last 7 days)
- Group by canonical domain
- Show max 5 bullet points total
- Each bullet: `[domain tag] one-line summary`
- Prioritize: entries with `change` field > entries with `lesson` > entries with `win`
- If no reflections in 7 days, show: "No reflections this week. Use /reflect to capture one."
- Logic for grouping and prioritization lives in `/api/hub/route.ts`, NOT in the page component

Example rendering:
```
Recent Reflections (7d)
  health    Protein target hit 5/7 days - keep meal prep Sundays
  addiction Stress trigger on Tuesday - walk worked as interrupt
  career    Shipped PR visibility helped - do more public work
```

---

## Todos Peek Design (Hub)

- Show header: "Open Todos (N)" where N = total incomplete
- Show top 3 incomplete todos (sorted by created date, newest first)
- Each todo: checkbox-style circle + item text (read-only on Hub)
- Footer link: "View all in Plan ->"
- If no open todos: don't render the section
- Data comes from existing `/api/todos` or bundled into `/api/hub` response
