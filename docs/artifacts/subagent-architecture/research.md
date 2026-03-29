# Research: Subagent Architecture

## Flagged Items
- Q8: csv.ts is TypeScript + `process.cwd()` coupled — cannot be called from CLI scripts without build step. Parallel CommonJS implementation exists in `scripts/csv-utils.js`.
- Q10: Two parallel pre-aggregation systems (API routes for UI, precompute scripts for skills) compute same metrics from same CSVs with no shared code path.
- Q11: Streak counting has 4 independent implementations with semantic differences (`csv.ts:getStreak`, `insight.ts:computeStreaks`, `precompute-weekly.js:computeStreak`, `precompute-checkin.js:buildDigest`). Week-start calculation has 3 implementations with different anchoring (Sunday vs Monday).
- Q12: No shared output format templates — each skill and API route independently formats the same data types.

## Findings

### Q1: What skills exist and what are their steps/phases?
- **Answer**: 10 skills exist: audit, checkin, feature-interview, log, plan, qa, relationship, remove-slop, review-notes, weekly-review. Checkin is the most complex (daily/weekly/monthly/quarterly modes with 5+ sub-options each). Feature-interview has 7 phases with subagent orchestration. Most others are 3-5 step linear flows.
- **Confidence**: high
- **Evidence**: All 10 `.claude/skills/*/SKILL.md` files
- **Conflicts**: none
- **Open**: none

### Q2: Which skill steps involve reading/parsing CSVs?
- **Answer**: Heavy CSV readers delegate to precompute scripts (checkin, weekly-review, plan). Direct CSV reads happen in: checkin (auto-detect, experiment conclude, inbox triage), plan (done/move commands), review-notes (all CSVs for date window), relationship (relationship.md). Weekly-review does zero raw CSV reads.
- **Confidence**: high
- **Evidence**: checkin/SKILL.md:24-74, plan/SKILL.md:28-98, review-notes/SKILL.md:26-32
- **Conflicts**: none
- **Open**: none

### Q3: Which skill steps involve writing to CSVs or JSON?
- **Answer**: 5 skills write: checkin (daily_signals, reflections, plan, todos, inbox, experiments, vision.json), log (daily_signals, workouts, todos), plan (plan.csv, daily_signals), relationship (relationship.md, daily_signals), feature-interview (spec files, not CSVs). All CSV writes are append-only except field updates on plan.csv (done, move), experiments.csv (conclude), inbox.csv (status).
- **Confidence**: high
- **Evidence**: checkin/SKILL.md:55-83, log/SKILL.md:34-48, plan/SKILL.md:41-116
- **Conflicts**: Checkin states "all writes are append-only" but performs field mutations on inbox, experiments, plan.
- **Open**: none

### Q4: Which skills already spawn subagents?
- **Answer**: Only feature-interview spawns subagents (across phases 2-7: research agents, alignment/conflict agents, spec-writer, execution agents, verification agents, doc-sync). No other skill uses subagents — all operate in single context window.
- **Confidence**: high
- **Evidence**: feature-interview/SKILL.md:73-488
- **Conflicts**: none
- **Open**: none

### Q5: Which skill steps present formatted output?
- **Answer**: All skills produce formatted output. Heaviest: checkin (box diagrams, verbatim precompute cards, domain spotlight boxes, monthly summaries), feature-interview (spec/verification/ship summary trees), relationship (state snapshot box, pattern analysis). Lightest: log (confirmation line), review-notes (grouped summary).
- **Confidence**: high
- **Evidence**: checkin/SKILL.md:27-33, feature-interview/SKILL.md:343-370, relationship/SKILL.md:143-162
- **Conflicts**: none
- **Open**: Precompute script output formats are defined in scripts, not skill files.

### Q6: What scripts exist and what do they do?
- **Answer**: 7 scripts. 2 non-deterministic (briefing-pipeline.sh and voice-inbox.sh — both invoke Claude CLI). 5 deterministic: config.js (constants), csv-utils.js (CSV parsing utilities), precompute-checkin.js (daily digest → JSON stdout), precompute-plan.js (plan digest → JSON stdout), precompute-weekly.js (weekly digest → JSON stdout), reconcile.js (auto-complete plan items from signals).
- **Confidence**: high
- **Evidence**: All files in scripts/
- **Conflicts**: none
- **Open**: none

### Q7: What deterministic logic lives in app/app/lib/?
- **Answer**: csv.ts has all CSV I/O + getStreak, getNextWorkout, getHabitsForDate, getMetricHistory, workout progression. insight.ts has computeInsightResponse (streaks, weight trend, habit summary, pattern detection). utils.ts/date-utils.ts have date primitives. timeframe.ts has week/month window resolution. router.ts has write gateway with side-effect rules.
- **Confidence**: high
- **Evidence**: csv.ts, insight.ts, utils.ts, date-utils.ts, timeframe.ts, router.ts
- **Conflicts**: getStreak in csv.ts is simpler than precompute-weekly.js version (doesn't handle "not logged" vs "logged as 0").
- **Open**: Whether insight.ts is still used by app surfaces.

### Q8: Can csv.ts be called from CLI scripts?
- **Answer**: No. It's TypeScript with `process.cwd()` path resolution, no CommonJS export. Cannot be require()'d without build step. scripts/csv-utils.js is the parallel CommonJS implementation. router.ts uses `eval("require")` hack for config.js — signals the boundary is real.
- **Confidence**: high
- **Evidence**: csv.ts:1,19; csv-utils.js; router.ts:29
- **Conflicts**: none
- **Open**: Whether tsx/ts-node is available as dev dependency.

### Q9: What do API routes compute, deterministic vs judgment?
- **Answer**: All 11 routes are fully deterministic. Every computation is pure filtering, sorting, grouping, aggregation, or lookup. The closest to judgment is computeInsightResponse in lib/insight.ts, but it's entirely rule-based conditionals (no LLM). Routes: hub (streaks, habits, dopamine log, reflections, todos, experiments, insight), health (weight, gym, eating, exercise progress), groceries (group by section), plan/range (filter + habits overlay), daily-signals, todos, vision, resources, experiments.
- **Confidence**: high
- **Evidence**: All route.ts files in app/app/api/
- **Conflicts**: none
- **Open**: none

### Q10: Does /api/hub pre-aggregate data that agents re-derive?
- **Answer**: Yes, significantly. Hub pre-aggregates: checkin streaks, 90-day habit grid, habit trends, per-habit logs with workout summaries, dopamine log, reflection summary, todos peek, experiment day counts, insight object. Skills (/checkin, /weekly-review) do NOT call this endpoint — they re-derive the same data via precompute scripts from raw CSVs.
- **Confidence**: high
- **Evidence**: hub/route.ts:37-356, checkin/SKILL.md:96, weekly-review/SKILL.md:14
- **Conflicts**: Two parallel pre-aggregation systems (API routes for UI, precompute scripts for skills) compute same metrics with no shared code.
- **Open**: Whether skills could consume /api/hub instead.

### Q11: What data transformations are duplicated?
- **Answer**: 6 transformation patterns duplicated across csv.ts, insight.ts, and 3 precompute scripts:
  - Streak counting: 4 implementations
  - Signal pivot by date: 4 implementations
  - Gym rotation/next workout: 2 implementations
  - extractContext (resolve signal text): 2 identical function bodies
  - daysSince/date diff: 5+ instances
  - Weekly window computation: 3 implementations (with Sunday vs Monday anchoring conflict)
- **Confidence**: high
- **Evidence**: csv.ts:221, insight.ts:133, precompute-weekly.js:140, precompute-checkin.js:343, csv.ts:437, insight.ts:124, csv.ts:679, precompute-checkin.js:277
- **Conflicts**: Week-start anchoring: precompute-weekly.js ends on Sunday, date-utils.ts anchors to Monday.
- **Open**: none

### Q12: What output formats are reused across skills?
- **Answer**: No output formats are formally shared as reusable templates. Each skill and API route independently formats the same data types (habit status, streaks, domain summaries). Closest to reuse: precompute scripts provide `display.*` fields consumed verbatim by skills, but each script defines its own format.
- **Confidence**: medium
- **Evidence**: checkin/SKILL.md:27-33, weekly-review/SKILL.md:14-16, hub/route.ts:288-310
- **Conflicts**: none
- **Open**: none

### Q13: What do core docs say about deterministic vs LLM boundaries?
- **Answer**: Explicitly defined at workspace level via "Deterministic-First Principle": L0-L2 (lookup, filtering, regex, counting, formatting) = CODE; L3+ (judgment, synthesis, creativity) = LLM. Script extraction protocol: when L0-L2 step found in skill, stop and propose scripts/ file with inputs/outputs. Project docs enforce structurally: Write Router uses hardcoded rules ("No AI, no NLP"), 4-layer architecture, Common Failure Modes list.
- **Confidence**: high
- **Evidence**: ../CLAUDE.md:27-43, docs/data-schemas.md:197-207, docs/architecture.md:50-65, CLAUDE.md:143-147
- **Conflicts**: none
- **Open**: No existing inventory of L0-L2 steps inside skills that haven't been extracted yet.

### Q14: Which skill steps require NL judgment vs pure data operations?
- **Answer**: Pattern across all skills: data operations at start (read/filter/aggregate), NL judgment in middle (interpret, advise, surface patterns), data operations at end (write results). Pure data: review-notes (entirely), checkin state scan, checkin habit logging, plan done/move, log. Heavy judgment: checkin emotional check, checkin domain spotlight questions, checkin monthly/quarterly identity work, relationship distortion ID + reframe, feature-interview design discussion, qa root cause diagnosis, remove-slop identification.
- **Confidence**: high
- **Evidence**: checkin/SKILL.md:400-401 ("Use LLM reasoning — not keyword matching"), review-notes/SKILL.md:26-44
- **Conflicts**: none
- **Open**: Exact boundary for inbox triage NL reasoning underspecified.

### Q15: What hardcoded templates could be externalized?
- **Answer**: Highest-value candidates: (1) feature-interview subagent launch template (~25 lines, repeated per execution agent), (2) checkin monthly summary format (~30 lines), (3) relationship distortion table (7 rows, could be CSV), (4) feature-interview research/design output formats (overlap with existing feature-spec-template.md). Feature-interview already partially externalizes ("reference docs/feature-spec-template.md") but still embeds full output format templates inline.
- **Confidence**: high
- **Evidence**: feature-interview/SKILL.md:398-423, checkin/SKILL.md:711-741, relationship/SKILL.md:79-87
- **Conflicts**: feature-interview says "don't memorize" the template but embeds equivalent templates inline.
- **Open**: For shorter templates (audit, QA, remove-slop), inline may be cheaper than file load overhead.

## Patterns Found
- **Precompute-then-display**: checkin, weekly-review, and plan all run a Node script that outputs JSON, then display `display.*` fields verbatim. The LLM only reasons over `digest.*` fields.
- **Append-only with exceptions**: CSV writes are append-only except plan.csv (done/move), experiments.csv (conclude), inbox.csv (status update).
- **Single-context skills**: 9 of 10 skills run entirely in the main conversation window. Only feature-interview uses subagents.
- **Duplicate computation paths**: API routes (for UI) and precompute scripts (for skills) compute identical metrics independently.
- **Format divergence**: Same data types (habit grids, streaks, domain summaries) are formatted independently in 3+ locations with no shared templates.

## Core Docs Summary
- **Workspace CLAUDE.md**: Canonical Deterministic-First Principle (L0-L5 ladder). Code for counting/filtering/formatting, LLM for judgment/synthesis/creativity. Script extraction protocol: propose scripts/ file with inputs/outputs.
- **architecture.md**: Write Router uses hardcoded rules for all side effects. 4-layer model (Foundation → Intelligence → Surfaces). No LLM in the data path.
- **data-schemas.md**: Side Effect Rules: "No AI, no NLP" — hardcoded keyword map, case-insensitive substring only.
- **app-intent.md**: Distillation Rules define scoring formula with numeric thresholds (deterministic). Health metrics include "3-layer boundary integrity."
- **Project CLAUDE.md**: Common Failure Modes: "Adding business logic to page components instead of lib/ or api/." Layer boundary enforcement.

## Open Questions
- Q16: Are there analysis patterns from ad-hoc conversations (like today's brain-state analysis) that aren't captured in any skill but recur frequently? (Human question — Phase 3)
- Q17: What's the desired interface between a script and an agent — stdout JSON? temp file? API endpoint? (Human question — Phase 3)
