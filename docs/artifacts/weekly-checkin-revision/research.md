# Research: Weekly Check-in Revision

## Flagged Items

- **Q7**: precompute-weekly.js uses 7-day calendar weeks, NOT 14-day rolling. Previous conversation wanted 14 days — not implemented.
- **Q2**: Phase 6c (Week Sketch) in checkin SKILL.md is a direct duplicate of the plan agent's week mode. Not delegated.
- **Q15**: All compute-morning-report.js functions are hardcoded to "last 7/14 days from today" — no date range parameterization. Not reusable at weekly scale without refactoring.
- **Q15 conflict**: precompute-weekly.js has its own `computeStreak()` that duplicates `csv-utils.js` `computeStreaks()` — parallel implementations, drift risk.

## Findings

### Q1: How does checkin SKILL.md detect cadence?
- **Answer**: Purely presentational — shows a menu with all cadences, user picks. Weekly rule is "Sundays only" (day-of-week). It reads `daily_signals.csv` for `checkin_daily` to show re-entry state, and shows "last: Feb 23" from signal history, but never auto-runs a cadence.
- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:27-57`
- **Conflicts**: none
- **Open**: How the "last: Feb 23" date is computed — whether it actually reads `checkin_weekly` from CSV at render time.

### Q2: Does plan agent week mode overlap with weekly Phase 6c?
- **Answer**: Yes, functionally identical. Both show weekly goals as context, accept natural language ("gym MWF, deep work daily"), write draft blocks to plan.csv with start=0, end=0. Same day abbreviation mapping, same output. Phase 6c runs inline in checkin rather than delegating to the plan agent.
- **Confidence**: high
- **Evidence**: `.claude/agents/plan.md:131-156`, `.claude/skills/checkin/SKILL.md:546-559`
- **Conflicts**: Duplicate logic — Phase 6c should delegate to the plan agent.
- **Open**: Whether Phase 6c was intentionally kept inline.

### Q3: Does a weekly-checkin agent exist?
- **Answer**: No. Agents directory contains: anchor, brain-state, plan, process, set-tomorrow, todays-plan, todo. The weekly flow is executed entirely inline within checkin SKILL.md.
- **Confidence**: high
- **Evidence**: `.claude/agents/` directory listing
- **Conflicts**: none
- **Open**: none

### Q4: What's unique to precompute-weekly.js?
- **Answer**: Unique outputs: (1) two-week side-by-side habit scoring with bar charts, (2) domain-level habit aggregation (`habit_by_domain`, `domain_spotlight_candidates` with stalled/declining/vision-misaligned logic), (3) execution stats (plan done/total, checkin day count), (4) briefing feedback summary, (5) addiction streak comparison (current vs last-week), (6) goals/experiment lookback. Neither daily precompute nor morning report produces domain spotlighting, week-over-week scoring, or execution stats.
- **Confidence**: high
- **Evidence**: `scripts/precompute-weekly.js:200-538`
- **Conflicts**: none
- **Open**: none

### Q5: How does process agent handle re-entry?
- **Answer**: Loops internally. After any branch, asks "Anything else on your mind?" Routes to new branch if yes. Returns control to checkin menu only when user says no. Checkin SKILL.md confirms: "The agent handles re-entry internally. After it returns, resume the menu."
- **Confidence**: high
- **Evidence**: `.claude/agents/process.md:203-209`, `.claude/skills/checkin/SKILL.md:233`
- **Conflicts**: none
- **Open**: none

### Q6: What CSV writes per weekly phase?
- **Answer**:

| Phase | File | Signal/Write |
|---|---|---|
| 3 | reflections.csv | One row per spotlighted domain (domain, win, lesson, change) |
| 4 | daily_signals.csv | `social_contact` (value=0/1, category=relationships) |
| 4.5 | inbox.csv | Status updates (logged→processed/discarded/archived) |
| 4.5 | todos.csv | New todos from processed inbox items |
| 5 | experiments.csv | Conclude expired + new experiment rows |
| 6 | daily_signals.csv | `weekly_goal_result`, `weekly_goal`, `weekly_intention` |
| 6b | vision.json (PATCH) | `domains[].actual`, `domains[].habits`, `intentions.weekly` |
| 6c | plan.csv | Draft blocks (start=0, end=0) |
| 7 | daily_signals.csv | `checkin_weekly=1` |

- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:300-564`
- **Conflicts**: none
- **Open**: none

### Q7: Does precompute-weekly.js use 7-day or 14-day lookback?
- **Answer**: **7-day calendar weeks** (Mon-Sun). `getWeekRange()` computes thisWeek and lastWeek as separate calendar weeks. Stalled detection looks 3 weeks back. No 14-day rolling window.
- **Confidence**: high
- **Evidence**: `scripts/precompute-weekly.js:50-64, 201-206, 441-461`
- **Conflicts**: Previous conversation wanted 14 days — NOT implemented.
- **Open**: none

### Q8: How does Phase 6b call /api/vision?
- **Answer**: SKILL.md specifies `PATCH /api/vision` with a JSON payload shape but does NOT specify the transport (curl, fetch, etc). Left to agent discretion. The API route exists at `app/app/api/vision/route.ts`.
- **Confidence**: medium
- **Evidence**: `.claude/skills/checkin/SKILL.md:493-544`
- **Conflicts**: none
- **Open**: Actual transport is unspecified — agents would use Bash+curl or direct file write.

Payload shape:
```json
{
  "domains": [
    { "id": "health", "actual": "<updated>", "habits": ["<updated>"] }
  ],
  "intentions": { "weekly": "<mantra>" }
}
```

### Q9: What signals are weekly-only?
- **Answer**: `social_contact`, `weekly_goal_result`, `weekly_goal`, `weekly_intention`, `checkin_weekly` — written only by the weekly flow. No other skill or script writes these. They ARE read by daily precompute (weekly_goals, weekly_intention for context display).
- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:316-564`
- **Conflicts**: Historical `weekly_experiment` signal is deprecated (SKILL.md:435).
- **Open**: none

### Q10: What does scripts/config.js export?
- **Answer**: Exports all four. `DOMAINS` = `["health", "career", "relationships", "finances", "fun", "personal_growth", "environment"]`
- **Confidence**: high
- **Evidence**: `scripts/config.js:17-39`
- **Conflicts**: none
- **Open**: none

### Q11: What do core docs say about relevant areas?
- **Answer**: Docs are comprehensive on cadence and vision.json writes but silent on subagent delegation and report generation. Weekly cadence: Sundays, PATCH vision.json (`domains[].actual`, `domains[].habits`, `intentions.weekly`), writes daily_signals + reflections + experiments. Daily does NOT write vision.json. Channel/always-on architecture has zero coverage.
- **Confidence**: high
- **Evidence**: `docs/architecture.md:67-87`, `docs/data-schemas.md:122-185`, `docs/app-intent.md:68-77, 143-145`
- **Conflicts**: Minor: app-intent.md says weekly writes `experiments.csv` but architecture.md omits it from the weekly write list. Complementary, not conflicting.
- **Open**: Subagent delegation not documented anywhere in these three docs.

### Q12: How do agents receive context from checkin?
- **Answer**: Agents are fully self-sufficient. The checkin skill spawns them with no data passing — each agent re-runs its own precompute script or reads CSVs directly. Plan agent runs `node scripts/precompute-plan.js`. Process agent reads vision.json and greps CSVs. Todo agent reads todos.csv. No prompt-text stuffing or piped JSON.
- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:226-248`, `.claude/agents/plan.md:8-25`, `.claude/agents/process.md:76-78`
- **Conflicts**: Weekly phases run inline (not delegated), so there's no agent context-passing pattern for weekly yet.
- **Open**: Whether the skill passes any context via `--append-system-prompt` when spawning.

### Q13: Agent file naming convention?
- **Answer**: Single `.md` files in `.claude/agents/` named after function. YAML frontmatter: `name`, `description`, `tools`, `model: sonnet`. Archived agents add `archived: true` and `superseded_by`. Only `process.md` has `memory: project`.
- **Confidence**: high
- **Evidence**: All 7 agent files in `.claude/agents/`
- **Conflicts**: none
- **Open**: Whether `memory: project` on process.md is intentional or forgotten on others.

### Q15: What morning report compute is reusable at weekly scale?
- **Answer**: Almost nothing without refactoring. All functions are hardcoded to "today" via `pivotSignalsByDate(signals, 14)` + `.slice(-N)` offsets. `computeLagState()`, `computeCascadeRisk()`, `countHits()`, `countViceDays()`, `perViceBreakdown()` — none accept a dateRange parameter. Only `computeStreaks()` from csv-utils is generic (takes signals + habit list).
- **Confidence**: high
- **Evidence**: `scripts/compute-morning-report.js:33-252`
- **Conflicts**: precompute-weekly.js has its own `computeStreak()` duplicating csv-utils `computeStreaks()` — parallel implementations.
- **Open**: Whether csv-utils `computeStreaks()` supports arbitrary end dates.

### Q16: Does briefing-pipeline.sh produce anything weekly needs?
- **Answer**: No. `briefing.json` is consumed exclusively by compute-morning-report.js (for `state` and `quote`). precompute-weekly.js does NOT read briefing.json. However, the `state` field (momentum/recovery/danger/etc.) would be natural context for weekly reviews — it's just not wired up.
- **Confidence**: high
- **Evidence**: `scripts/compute-morning-report.js:28-30`, `scripts/precompute-weekly.js` (no briefing reference), `scripts/briefing-pipeline.sh:202-213`
- **Conflicts**: Both briefing-pipeline.sh and precompute-weekly.js read `briefing_feedback.csv` independently.
- **Open**: none

### Q17: Side-by-side daily vs weekly precompute

| Field | Daily (precompute-checkin.js) | Weekly (precompute-weekly.js) | Overlap? |
|---|---|---|---|
| display.card1 | Yesterday/today habit grid | — | No |
| display.card2 | Inbox, todos, plan, last gym | — | No |
| display.score_card | — | Full week bars, streaks, execution | No |
| digest.mood_arc | 7d feeling/energy | This week feeling/energy/mood+context | Partial |
| digest.habit_misses | Today's unlogged | — | No |
| digest.streak_breaks | Recently broken streaks | — | No |
| digest.stale_todos | Todos >7d old | Todos >7d old | **Yes** |
| digest.weekly_goals | Current week goals | — | No |
| digest.weekly_intention | Current week intention | — | No |
| digest.daily_intention | Today's intention | — | No |
| digest.rollover_items | Yesterday's incomplete plan | — | No |
| digest.recent_reflections | 14d reflections | — | No |
| digest.last_workout | Last gym + next day | — | No |
| digest.triggers | — | This week's mind signals | No |
| digest.habit_by_domain | — | Per-domain habit counts (this/last) | No |
| digest.domain_spotlight_candidates | — | Top 3 domains by decline/stalled/misaligned | No |
| digest.goals_last_week | — | Last week's weekly_goal signals | No |
| digest.experiment_last_week | — | weekly_experiment signal | No |
| digest.briefing_feedback | — | Good/bad counts | No |

**Recommendation**: Scripts are appropriately separate. Only overlap is stale_todos. A `--weekly` flag would be a misfit. Weekly script should be extended for current-week goals/intention and reflections-per-domain.

- **Confidence**: high
- **Evidence**: `scripts/precompute-checkin.js:316-429`, `scripts/precompute-weekly.js:522-536`
- **Conflicts**: none
- **Open**: none

### Q18: Full inbox.csv reference list

| File | Context |
|---|---|
| `scripts/voice-inbox.sh` | Reads/writes inbox.csv, git commits it |
| `scripts/precompute-checkin.js:59` | Reads inbox for Card 2 counts |
| `app/app/lib/csv.ts:21` | `INBOX_PATH` constant |
| `app/app/lib/router.ts:152` | "inbox" WriteType |
| `.claude/skills/checkin/SKILL.md:75,86,326-389` | Read/write/triage instructions |
| `.claude/skills/review-notes/SKILL.md:16` | Reads inbox |
| `.claude/prompts/voice-inbox.md:4,26,72,236` | Append-only audit, routing |
| `docs/architecture.md:25` | Listed as append-only raw capture |
| `docs/data-schemas.md:84,226` | Schema definition |
| `docs/life-playbook.md:63` | Listed as raw capture destination |
| `README.md:29,47` | Described as raw capture audit log |
| `docs/specs/health-page-redesign.md:140` | "must remain untouched" constraint |
| `docs/specs/deterministic-voice-pipeline.md:224` | Test reference |
| `docs/specs/vision-reinvention.md:50` | Listed as data source |
| `docs/artifacts/subagent-architecture/research.md:26,124` | Write semantics notes |
| `docs/specs/archived/checkin-plan-integration.md` | Historical reference |

- **Confidence**: high
- **Evidence**: Full repo grep
- **Conflicts**: none
- **Open**: none

## Patterns Found

1. **Agent self-sufficiency**: Agents always re-fetch their own data via scripts or direct CSV reads. The checkin skill does NOT pass precomputed digest to spawned agents — each is fully context-isolated.

2. **Frontmatter schema**: `.claude/agents/*.md` — YAML with `name`, `description`, `tools`, `model: sonnet`. Archived agents add `archived: true` + `superseded_by`. `memory: project` only on process.md.

3. **Hardcoded date anchoring**: compute-morning-report.js is anchored to `today` throughout. No functions accept dateRange. precompute-weekly.js is slightly better — `getWeekRange(refDate)` could accept an arbitrary date, but main() always passes today.

4. **briefing.json is morning-report-only**: Produced by briefing-pipeline.sh (every 60s), consumed only by compute-morning-report.js. Weekly checkin doesn't use it.

5. **Parallel streak implementations**: csv-utils.js exports `computeStreaks()`, but precompute-weekly.js has its own `computeStreak()` — drift risk.

6. **Two-script pattern**: Daily and weekly each have dedicated precompute scripts outputting `{ display, digest }` JSON to stdout. They share only csv-utils.js and config.js imports. This pattern is stable — new cadences should follow it.

7. **Weekly runs entirely inline**: Unlike daily (which delegates to plan/process/todo agents), the weekly flow has zero agent delegation. All 7 phases execute in the checkin skill's context window.

## Core Docs Summary

- **Cadence system**: Four cadences (daily/weekly/monthly/quarterly) with explicit write permissions per cadence. Daily does NOT write vision.json. Weekly writes `domains[].actual`, `domains[].habits`, `intentions.weekly` via PATCH.
- **Vision.json**: `/api/vision` supports GET/PUT/PATCH. Weekly uses PATCH (deep merge). Quarterly uses PUT (full replace). Schema: 4-domain ABT(H) with identityScript, antiVision, intentions, ritualBlueprint, inputControl, distractions, habitAudit.
- **Subagent delegation**: Not documented in any core doc. Governed by skill files and global CLAUDE.md only.
- **Report generation**: Not architecturally documented. briefing-pipeline.sh and compute-morning-report.js are referenced obliquely but have no spec in architecture.md.
- **Channel/always-on**: Zero coverage in any core doc.

## Open Questions

- Whether css-utils `computeStreaks()` supports arbitrary end dates or is anchored to today
- Whether the checkin skill passes context to spawned agents via any mechanism beyond agent self-fetch
- How the "last: Feb 23" weekly date is computed in the checkin menu display
- Whether `memory: project` on process.md is intentional or should apply to other agents
