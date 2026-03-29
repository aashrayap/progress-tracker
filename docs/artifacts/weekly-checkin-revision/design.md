# Design: Weekly Check-in Revision

## Summary

Extract the weekly check-in from the monolithic checkin SKILL.md into a thin orchestrator + 2 new agents (weekly-reflect, weekly-vision) + existing plan agent. Add an auto-generated weekly report HTML artifact (extending precompute-weekly.js) that the user reads before the interactive check-in. Ground the interactive phases in the Abrada System's 8 weekly practices.

## Locked Decisions

| # | Decision | Detail |
|---|----------|--------|
| D1 | Kill experiments from weekly | Phase 5 (Experiment Loop) removed entirely |
| D2 | Auto-detection = suggest in menu | On Sundays, `/checkin` menu highlights weekly but user still picks |
| D3 | All 3 Abrada audits every week | Feedback Loop, B×A×D, Inversion Quick-Scan — all 3, not rotated |
| D4 | Social contact stays weekly | Question in weekly-reflect agent, not converted to daily signal |
| D5 | Extend precompute-weekly.js to HTML | Not a new compute-report.js — extend existing script to output HTML artifact |
| D6 | Weekly report replaces morning on Sunday | Same surface slot (data/artifacts/), shown in morning ritual step |
| D7 | No afternoon/evening report artifacts | Morning + weekly only. Midday/evening are action surfaces (equation check) |
| D8 | Anti-vision is NOT daily | Weekly inversion scan + monthly rewrite only. Fixed in abrada-system.md |
| D9 | Option B: 3-agent decomposition | weekly-reflect + weekly-vision + plan (existing) |
| D10 | Channels out of scope | Channels for gym/todo only, not for checkin flows |
| D11 | Kill inbox triage from weekly | Phase 4.5 removed (inbox.csv pipeline being killed) |

## Pattern Decisions

| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | Agent delegation | Agents self-fetch data (run own precompute) | Passing piped JSON from skill |
| 2 | Agent frontmatter | `model: sonnet`, standard tools, YAML frontmatter | model: haiku |
| 3 | Week Sketch | Delegate to existing plan agent (week mode) | Inline in weekly skill or new agent |
| 4 | Precompute scripts | Separate per-cadence (daily + weekly), shared csv-utils | Single script with --type flag |
| 5 | Report output | HTML artifact to data/artifacts/ | JSON to stdout only |

## Architecture

```
/checkin weekly (or auto-suggested on Sundays)
     │
     ▼
checkin SKILL.md (thin orchestrator, ~30 lines for weekly)
     │
     ├── 1. Generate weekly report
     │      node scripts/precompute-weekly.js --html
     │      → data/artifacts/weekly-report-{date}.html
     │      "Read your weekly report, then continue."
     │
     ├── 2. Delegate to weekly-reflect agent
     │      ┌──────────────────────────────────────┐
     │      │ .claude/agents/weekly-reflect.md      │
     │      │                                       │
     │      │ Reads: precompute-weekly.js output     │
     │      │        vision.json (for inversion)     │
     │      │                                       │
     │      │ Interactive phases:                    │
     │      │  • Domain Reflection (2-3 domains)    │
     │      │  • Feedback Loop Audit                │
     │      │  • B×A×D Check                        │
     │      │  • Inversion Quick-Scan               │
     │      │  • Social Contact                     │
     │      │                                       │
     │      │ Writes: reflections.csv               │
     │      │         daily_signals.csv (social)    │
     │      └──────────────────────────────────────┘
     │
     ├── 3. Delegate to weekly-vision agent
     │      ┌──────────────────────────────────────┐
     │      │ .claude/agents/weekly-vision.md       │
     │      │                                       │
     │      │ Reads: precompute-weekly.js output     │
     │      │        vision.json (current ABT(H))    │
     │      │                                       │
     │      │ Interactive phases:                    │
     │      │  • Review last week's goals           │
     │      │  • Set this week's goals (1-3)        │
     │      │  • Set weekly intention (mantra)       │
     │      │  • ABT(H) Update (actual + habits)    │
     │      │                                       │
     │      │ Writes: daily_signals.csv (goals,     │
     │      │   intention, goal_result)              │
     │      │         vision.json (PATCH)           │
     │      └──────────────────────────────────────┘
     │
     ├── 4. Delegate to plan agent (existing, week mode)
     │      ┌──────────────────────────────────────┐
     │      │ .claude/agents/plan.md                │
     │      │ Mode: week                            │
     │      │ Writes: plan.csv (draft blocks)       │
     │      └──────────────────────────────────────┘
     │
     └── 5. Close
            Write checkin_weekly=1 to daily_signals.csv
```

## Abrada Practice Coverage

| Abrada Weekly Practice | Agent | Phase |
|---|---|---|
| Weekly Reflection | weekly-reflect | Domain Reflection (2-3 domains) |
| Leading Indicator Review | weekly report | Score card (auto-generated) |
| Comeback Speed Tracking | weekly report | Streak deltas (auto-generated) |
| Feedback Loop Audit | weekly-reflect | "Where is lag longest? Shrink it." |
| Belief × Action × Duration | weekly-reflect | "Which multiplier is broken?" |
| Inversion Quick-Scan | weekly-reflect | Failure playbook scan per pillar |
| Background App Audit | weekly-reflect | Captured in domain reflection |
| ABT(H) Weekly Update | weekly-vision | Update actual + habits per pillar |

## Weekly Report (auto-generated HTML)

Generated by `precompute-weekly.js --html` before the interactive check-in.

Contains (pattern-level, not signal-level):
- Score card with week-over-week bars
- Trajectory deltas per signal (↑ ↗ → ↘ ↓)
- Identity-action gap (vision.json habits vs actual signal completion)
- Domain balance (signal coverage per pillar)
- Trigger patterns (cluster by time/context)
- Streak momentum (growing vs fragile)
- Comeback speed (days to return after each miss)
- Reflection coverage (which domains got reflections, which got zero)
- Plan accuracy (planned vs completed, overplanning detection)

Replaces morning report on Sundays. Same artifact path pattern: `data/artifacts/weekly-report-{date}.html`.

## Verification Strategy

- `npm run build` must pass after all changes
- Each agent tested independently via `/checkin weekly` flow
- Checkin SKILL.md weekly section reduced from ~300 lines to ~30 lines
- Phase 6c (Week Sketch) duplicate code removed — delegates to plan agent
- No regression to daily check-in flow
- Weekly-only signals still written correctly (weekly_goal, weekly_intention, etc.)

## Structure Outline

### Phase 1: Weekly report HTML generation
- Extend `precompute-weekly.js` with `--html` flag
- Reuse existing score card + digest computation
- Add new weekly-only analyses (identity-action gap, domain balance, trigger patterns, plan accuracy, comeback speed)
- Generate self-contained HTML artifact (same style as morning report)
- Verify: `node scripts/precompute-weekly.js --html` produces valid HTML

### Phase 2: Create weekly-reflect agent
- New file: `.claude/agents/weekly-reflect.md`
- Runs `node scripts/precompute-weekly.js`, reads vision.json
- Interactive flow: domain reflection → feedback loop → B×A×D → inversion → social contact
- Writes: reflections.csv, daily_signals.csv (social_contact)
- Verify: agent runs standalone, produces correct CSV writes

### Phase 3: Create weekly-vision agent
- New file: `.claude/agents/weekly-vision.md`
- Runs `node scripts/precompute-weekly.js`, reads vision.json via API
- Interactive flow: review last goals → set new goals → intention → ABT(H) update
- Writes: daily_signals.csv (weekly_goal_result, weekly_goal, weekly_intention), vision.json (PATCH)
- Verify: agent runs standalone, produces correct signal + vision writes

### Phase 4: Refactor checkin SKILL.md weekly section
- Replace ~300 lines of inline weekly phases with thin orchestrator
- Step 1: generate report, Step 2: delegate weekly-reflect, Step 3: delegate weekly-vision, Step 4: delegate plan (week), Step 5: close
- Remove Phase 4.5 (inbox triage) and Phase 5 (experiments) entirely
- Remove Phase 6c duplicate code (now delegated to plan agent)
- Add Sunday auto-suggest in menu detection
- Verify: `/checkin weekly` still works end-to-end, daily unaffected

### Phase 5: Kill inbox references
- Remove inbox.csv references from: csv.ts, router.ts, precompute-checkin.js, checkin SKILL.md, review-notes SKILL.md
- Archive inbox.csv to data/archived/
- Update docs: architecture.md, data-schemas.md, CLAUDE.md, README.md
- Verify: `npm run build` passes, no broken imports
