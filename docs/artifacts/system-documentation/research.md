# Research: System Documentation & Visual Architecture

## Flagged Items
- Q5: `/resources` route is listed in CLAUDE.md and memory but does NOT exist in the codebase — stale docs
- Q7: `/api/groceries` and `/api/quotes` are orphaned routes with no page consumers
- Q9: `brain-state` skill references an archived agent — stale reference
- Q14: Weekly/monthly agents write directly to CSVs via Bash, bypassing `router.ts` side effects — the signal→plan auto-complete rules don't fire for agent writes
- Q16: `reconcile.js` duplicates `router.ts` side-effect logic (signal→plan keyword mapping) — intentional but runs in two places

## Findings

### Q1: What components does `/plan/day` render?
- **Answer**: Renders `DayView` inside `PlanProvider`. PlanProvider fetches `/api/plan/range` (plan.csv + daily_signals.csv) and `/api/todos` (todos.csv). DayView fetches `/api/plan/range` (intentions), `/api/vision` (ritual blueprint from vision.json), `/api/hub` (aggregates 8 CSVs), `/api/daily-signals` (habit pre-population). Writes: POST `/api/plan` (mark done → plan.csv), POST `/api/daily-signals` (habits → daily_signals.csv via router.ts), DELETE `/api/daily-signals` (unlog). Uses `HABIT_CONFIG` from config.ts.
- **Confidence**: high
- **Evidence**: app/app/plan/day/page.tsx, app/app/plan/PlanProvider.tsx:92-114, app/app/components/DayView.tsx:185-352

### Q2: What do /plan/week, /plan/month, /plan/year render?
- **Answer**: `WeekView`, `MonthView`, `YearView` — all fed by shared PlanProvider. All three are **read-only** with no API calls or writes. They receive events, habits, focusDate, onNavigate props. Only `/plan/day` has its own fetches and write operations.
- **Confidence**: high
- **Evidence**: app/app/plan/week|month|year/page.tsx, no fetch calls in WeekView/MonthView/YearView

### Q3: What does `/vision` render?
- **Answer**: Self-contained page fetching `/api/vision` (vision.json) and `/api/hub` (daily_signals, experiments, etc). Renders inline: NorthStarCard (ABT+H per domain), InputControlSection, DistractionsSection, HabitAuditSection, ExperimentsTable. **Entirely read-only** — no write operations on this page.
- **Confidence**: high
- **Evidence**: app/app/vision/page.tsx:40-141

### Q4: What does `/health` render?
- **Answer**: Renders `WeeklyProgramChart` and `ExerciseHistory` from single `GET /api/health` call. API reads daily_signals.csv, workouts.csv, reflections.csv. **Entirely read-only**. WeightChart component exists but is unused on this page.
- **Confidence**: high
- **Evidence**: app/app/health/page.tsx:17-93, app/app/api/health/route.ts:9-13

### Q5: What does `/resources` render?
- **Answer**: **Does not exist.** No `app/app/resources/` directory. BottomNav links to Vision, Plan, Health only. CLAUDE.md and memory doc both list it as a route — this is stale documentation.
- **Confidence**: high
- **Evidence**: No resources/page.tsx found; BottomNav.tsx:6-10 has 3 tabs only
- **Conflicts**: CLAUDE.md says `/resources` exists — it doesn't

### Q6: API route inventory

| Route | Methods | Reads | Writes |
|---|---|---|---|
| `/api/daily-signals` | GET, POST, DELETE | `daily_signals.csv` | `daily_signals.csv` (via router.ts) |
| `/api/groceries` | GET, POST, PUT, DELETE | `groceries.csv` | `groceries.csv` |
| `/api/health` | GET | `daily_signals`, `workouts`, `reflections` | none |
| `/api/hub` | GET | `daily_signals`, `plan`, `reflections`, `todos`, `workouts`, `quotes`, `experiments`, `briefing.json` | none |
| `/api/hub/briefing-feedback` | POST | `briefing.json` | `briefing_feedback.csv` |
| `/api/plan` | POST, DELETE | none | `plan.csv` |
| `/api/plan/range` | GET | `plan.csv`, `daily_signals.csv` | none |
| `/api/quotes` | GET | `quotes.csv` | none |
| `/api/todos` | GET, POST, PUT, DELETE | `todos.csv` | `todos.csv` |
| `/api/vision` | GET, PUT, PATCH | `vision.json` | `vision.json` |

- **Confidence**: high

### Q7: Shared vs page-specific routes

| Route | Consumers | Shared? |
|---|---|---|
| `/api/hub` | DayView + vision/page | **Shared** (plan + vision) |
| `/api/vision` | DayView + vision/page | **Shared** (plan + vision) |
| `/api/todos` | PlanProvider + TodoList | Plan surface only |
| `/api/plan`, `/api/plan/range` | DayView + PlanCard | Plan surface only |
| `/api/daily-signals` | DayView | Plan surface only |
| `/api/health` | health/page | Page-specific |
| `/api/hub/briefing-feedback` | BriefingCard | Component-specific |
| `/api/groceries` | **No consumer** | **Orphaned** |
| `/api/quotes` | **No consumer** (consumed internally by /api/hub) | **Orphaned** |

### Q8: Skills inventory

| Skill | CSVs Written | Agents Spawned | CSVs Read |
|-------|-------------|----------------|-----------|
| `/checkin` | daily_signals, reflections, plan, todos, experiments, vision.json | process, plan, weekly-reflect, weekly-vision | all above |
| `/log` | daily_signals, workouts, todos | none | none |
| `/weekly-review` | none (read-only) | none | via precompute-weekly.js |
| `/review-notes` | none (read-only) | none | daily_signals, workouts, reflections, plan, todos |
| `/todo` | todos | todo agent | todos |
| `/brain-state` | none | brain-state agent (archived) | via compute-brain-state.js |
| `/relationship` | daily_signals, data/relationship.md | none | relationship.md, vision.json |
| `/feature-interview` | docs/specs/, docs/artifacts/ | ad-hoc subagents | project files |
| `/audit` | docs/audits/ | none | all files (read-only) |
| `/remove-slop` | modified TS/TSX files | none | diff |
| `/qa` | none | none | Chrome browser |
| `/improve-claude-md` | CLAUDE.md | none | CLAUDE.md |

### Q9: Agent definitions

**Active agents (6):**
- `process` — spawned by /checkin Option 2
- `plan` — spawned by /checkin Option 3, and weekly Step 4
- `weekly-reflect` — spawned by /checkin weekly Step 2
- `weekly-vision` — spawned by /checkin weekly Step 3
- `todo` — spawned by /todo skill
- `brain-state` — spawned by /brain-state skill (**stale: agent file archived**)

**Archived agents (3):** anchor, todays-plan, set-tomorrow

- **Conflicts**: brain-state skill declares `agent: brain-state` but agent file is marked archived

### Q10: Shared utilities

| Utility | Used By |
|---------|---------|
| `scripts/precompute-plan.js` | plan agent |
| `scripts/precompute-weekly.js` | weekly-reflect, weekly-vision, /weekly-review |
| `scripts/precompute-checkin.js` | /checkin skill (daily pre-menu) |
| `scripts/compute-brain-state.js` | brain-state agent |
| `scripts/reconcile.js` | /checkin post-write (signal→plan sync) |
| `scripts/config.js` | shared constants consumed by all scripts |
| `scripts/csv-utils.js` | shared CSV read/write for all scripts |
| `data/vision.json` (read) | process, weekly-reflect, weekly-vision, /checkin monthly/quarterly |
| `PATCH /api/vision` | weekly-vision, /checkin monthly/quarterly |
| `daily_signals.csv` (write) | process, plan, weekly-reflect, weekly-vision, /log, /checkin, /relationship |

### Q11: Daily flow
- **Morning**: Open `/plan/day` → read ritual/identity. Run `/checkin` → `precompute-checkin.js` → state cards → 3-option menu:
  - **Log**: habit/addiction signals → `daily_signals.csv`
  - **Process**: spawns `process` agent → `daily_signals.csv` + `reflections.csv`
  - **Plan**: spawns `plan` agent → `plan.csv` + `daily_signals.csv` + `todos.csv`
- **Side effects**: `router.ts` fires workout→gym=1, signal=1→mark plan done
- **Post-write**: `reconcile.js` syncs plan items with logged signals
- **Evening**: Process (reflect/decompress) + Plan (set tomorrow's drafts)
- **Completion**: `checkin_daily=1` → `daily_signals.csv`
- **Alternative**: `/log` for quick one-off writes (weight, workout, note)

### Q12: Weekly flow (Sundays)
1. `precompute-weekly.js --html` → HTML report
2. `weekly-reflect` agent → reflections.csv + social_contact signal
3. `weekly-vision` agent → weekly_goal_result, weekly_goal, weekly_intention signals + PATCH vision.json
4. `plan` agent (week mode) → draft blocks in plan.csv
5. `checkin_weekly=1` → daily_signals.csv

Separate lighter path: `/weekly-review` skill (read-only scorecard, no writes)

### Q13: Monthly/quarterly flow
**Monthly (last Sunday):**
1. Trajectory report (read-only)
2. 7 structured questions (no writes)
3. Vision rewrite: identityScript, antiVision, intentions → PATCH vision.json
4. Optional life-playbook.md edits
5. `checkin_monthly=1` → daily_signals.csv

**Quarterly (every 3 months):**
1. Strategic orientation (3 questions, no writes)
2. Full ABT(H) rebuild per pillar
3. Ritual blueprint overhaul
4. Habit audit + inversion playbook
5. Forces/skills/peer audit + input control
6. All assembled → PUT vision.json
7. `checkin_quarterly=1` → daily_signals.csv

Monthly/quarterly are handled inline by the checkin skill (no dedicated agents).

### Q14: Lib functions by cadence

| Function | Daily | Weekly | Monthly/Quarterly |
|---|---|---|---|
| `csv.ts:appendDailySignals` | Y | Y | Y (flags only) |
| `csv.ts:readDailySignals` | Y | Y (via scripts) | Y |
| `csv.ts:appendReflection` | Y (process) | Y (weekly-reflect) | N |
| `csv.ts:upsertPlanEntry` | Y | Y (week sketch) | N |
| `csv.ts:readVision/writeVision` | N | Y (PATCH fallback) | Y |
| `router.ts:writeAndSideEffect` | Y (API writes) | **N (agents bypass)** | **N (bypass)** |
| `config.ts:HABIT_CONFIG` | Y (display) | N | N |
| `reconcile.js` | Y (post-checkin) | N | N |

**Key conflict**: Weekly/monthly agents write directly to CSVs via Bash, bypassing router.ts side effects.

### Q15: Scripts inventory

| Script | Purpose | Used By |
|---|---|---|
| `config.js` | Shared constants (SIGNAL_TO_PLAN_KEYWORD, HABIT_LIST, ADDICTION_SIGNALS) | All other scripts |
| `csv-utils.js` | Shared CSV read/write/parse utilities | All other scripts |
| `compute-brain-state.js` | Streaks, habit grid, vice/positive load | brain-state agent |
| `compute-morning-report.js` | Self-contained HTML morning report with AI narrative | Standalone (reads daily_signals + vision.json + briefing.json) |
| `precompute-checkin.js` | Checkin display cards and digest | /checkin skill (daily) |
| `precompute-plan.js` | Today's plan blocks + set-tomorrow data | plan agent |
| `precompute-weekly.js` | Weekly scorecard and digest | weekly-reflect, weekly-vision, /weekly-review |
| `reconcile.js` | Post-checkin bridge: auto-marks plan items done from signals | /checkin daily post-write |

### Q16: Router.ts state
- Fully implemented. Exports `writeAndSideEffect(type, data, date?)`.
- 6 write types: workout, signal, reflection, todo, grocery, plan.
- Side effects: workout → gym=1; gym/sleep/meditate/deep_work=1 → mark plan done.
- Keyword map from scripts/config.js via dynamic require.
- **Conflicts**: reconcile.js duplicates the signal→plan side-effect logic.

### Q17: Documentation gaps
**Already documented:** CSV schemas, side effect rules, vision.json schema, write router, API list, cadence contract, 4-layer model, nav protocol, decisions log.

**Missing:**
- Page component decomposition (what each page renders)
- Skill data flows (which CSVs, which agents, which scripts)
- API route → CSV mappings
- Visual diagrams (zero exist — all text/tables)
- Full cadence interaction sequences (skill → script → API → CSV)
- Scripts directory (not referenced in any core doc)
- /resources listed but doesn't exist (stale)

## Open Questions
- Whether `compute-morning-report.js` + `briefing.json` are still in use after voice-inbox kill
- Whether `/resources` was intentionally removed or never built
- WeightChart component exists but unused on /health page — intended?
- Full `reconcile.js` behavior (read but not deeply traced)
