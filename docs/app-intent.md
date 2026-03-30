# App Intent

## Life Vision vs App Intent

```
Life Vision  = the GOAL (where I want to be in 5 years, defined in /vision route)
App Intent   = the SYSTEM BEHAVIOR (how this tool operates to serve that goal)
```

The life vision is an input to the app's intent — not the intent itself. Intent engineering governs how the system behaves: what it optimizes for, how it makes trade-offs, when it escalates. The life vision tells the system *what matters*; the intent tells the system *how to act on that*.

When the life vision shifts, the app intent should update to match — the system reshapes itself to serve the new goal.

## Objective

Operate as an execution system that translates the life vision into daily action. Surface what matters today, hide what doesn't, close the loop between reflection and behavior change. The system steers — it doesn't just record.

## Desired Outcomes

1. Daily startup gives one clear next move without browsing multiple surfaces
2. Reflections compound into rule updates, not just notes
3. Capture-to-action path works end-to-end without manual intervention
4. Weekly reviews produce concrete plan changes

## Health Metrics

While building new features, these must not degrade:

- **3-layer boundary integrity**: CSV (data) / lib+api (intelligence) / pages (surface) stays clean
- **Flat navigation**: no new route trees — depth via in-page UI only
- **Capture reliability**: voice/text intake pipeline must keep working
- **Data simplicity**: no new CSV files unless existing ones genuinely can't hold the data
- **Startup friction**: daily use shouldn't require more steps than it does today

## Surface Reality (March 2026)

| Surface | Usage | Gravity | Ritual Role |
|---------|-------|---------|-------------|
| Plan/Day | Daily | High — daily home page, morning ritual + execution | Morning: ritual + identity + plan. Midday: execute blocks. Evening: review done/missed. |
| Vision | Weekly+ | Medium — deep review surface (Sundays, on-demand) | Weekly: full identity review, habit grid audit, ABT(H) reflection. |
| Health | Daily | High — workout logging, body metrics | On-demand: log workouts, track weight. |
| Resources | Rare | Low — passive storage | On-demand: reference material. |

### Surface Interaction Map

| Time | Surface | Action |
|------|---------|--------|
| Morning | `/plan/day` | Read ritual checklist, identity anchor, intentions, run /checkin |
| Midday | `/plan/day` | Execute plan blocks, toggle done, midday ritual reference |
| Evening | `/plan/day` | Review day, run /checkin for decompress + reflect + set tomorrow |
| Sunday | `/vision` | Weekly deep review, full identity, habit grid, ABT(H) cards |

After the Vision Reinvention (March 2026), the app consolidated from 6 surfaces to 4 navigable routes (Vision, Plan, Health, Resources). Hub and Mind were absorbed or removed. In the Unified Cadence update (March 2026), /plan/day became the daily home page and /vision shifted to a weekly+ deep review surface.

## Current Direction

- Vision-driven, not feature-driven — every surface must trace back to the life vision
- Plan/day as daily entry point, Vision as weekly+ deep review
- CSV-first data model (no database migration)
- Phone intake via iMessage channel
- Reflections should feed back into rules, not just sit in storage
- Fewer surfaces with more gravity, not more surfaces with less
- Capture works; retrieval and loop-closing are the gaps to fix

## Cadence Contract

What writes where, at what frequency. See `docs/life-playbook.md` for the full cadence rules table.

| Cadence | Trigger | vision.json fields written | CSV files written |
|---------|---------|--------------------------|-------------------|
| Daily | `/checkin daily` or app signals | None | daily_signals, plan, reflections |
| Weekly | `/checkin weekly` (Sundays) | domains[].actual, domains[].habits, intentions.weekly | daily_signals, reflections, experiments |
| Monthly | `/checkin monthly` (last Sunday) | identityScript, antiVision, intentions | daily_signals |
| Quarterly | `/checkin quarterly` | All fields (full rebuild) | daily_signals |

Daily checkins do NOT write to vision.json. Vision.json writes start at weekly cadence.

## Distillation Rules

Turn raw capture into a small set of actionable insights. Distillation should reduce noise, not summarize everything.

### Pattern Qualification

Create/refresh an insight candidate only when at least one condition is true:
- Recurrence: same issue/opportunity appears at least 3 times in 14 days, or 5 times in 30 days.
- Streak break: a core behavior misses for 2+ consecutive planned days.
- Trend shift: a tracked metric moves at least 10% from its 14-day baseline for 4+ days.
- Cross-source confirmation: the same pattern appears in at least 2 sources (`reflection`, `signal`, `manual`) within 21 days.

### Scoring (High-Leverage Definition)

Score each candidate on a 1-5 scale across:
- Priority weight (aligned to playbook operating priorities)
- Downside risk if ignored
- Actionability this week
- Evidence strength (count + source diversity)
- Recency

Priority weight ranking (from `docs/life-playbook.md` operating priorities):
- Sleep and recovery quality = 5
- Eating clean and protein-first defaults = 4
- Training consistency = 3
- Addiction avoidance and trigger management = 2
- Deep work and execution reliability = 1

If a pattern touches multiple priorities, assign the highest impacted priority weight.

Weighted score:
`score = 0.35*priority + 0.25*risk + 0.20*actionability + 0.15*evidence + 0.05*recency`

High-leverage = score >= 3.8.

### Vision Surfacing Rules

- Show at most 3 active insights on Vision page.
- Rank by weighted score, then evidence count, then recency.
- If there is any active addiction-risk pattern, reserve 1 slot for that class.
- Do not surface near-duplicates; merge to the highest-evidence candidate.

### Insight Lifecycle

- `active`: seen in the last 14 days and score >= 3.0.
- `dormant`: not seen for 15-45 days, or score falls below 3.0.
- `resolved`: no confirming evidence for 45+ days and an explicit replacement behavior exists.

## Decisions Made

Append-only log. When a directional choice is made during a feature, record it here so future sessions don't re-litigate.

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-05 | Flat navigation only — no nested route trees | Consolidation of /reflect into /mind, /quotes into /resources |
| 2026-03-05 | CSVs are permanent data layer — no DB migration | Simplicity and local-first model preferred over scalability |
| 2026-03-05 | Intent doc created — read before multi-layer features | Repeated corrections during feature work indicated missing direction |
| 2026-03-05 | Vision-driven not feature-driven | App serves 5-year life vision; features must trace to vision, not justify themselves |
| 2026-03-05 | Fewer surfaces, more gravity | Too many routes feel like a big menu; consolidate or remove low-usage surfaces |
| 2026-03-10 | Vision page reads from `data/vision.json` via `/api/vision` | Hardcoded vision data moved to structured JSON in core data layer; vision page is now data-driven with expandable domain cards showing now/90-day/3-year |
| 2026-03-18 | Hub merges into Vision at `/vision` | Single daily entry point — identity/direction + execution data on one page. Hub route → 302 redirect. Nav drops Hub tab (4 tabs). |
| 2026-03-18 | Reinvention Formula replaces old vision structure | 5 pillars: north star (ABT(H) across 4 domains), identity script, input control, distraction removal, habit installation. Kills radar/ikigai charts and 8-domain now/90d/3yr model. |
| 2026-03-18 | Vision page is read-only ritual surface | NO edit modals. Content authored via JSON edit or future skills. Page designed for daily morning read-through. |
| 2026-03-20 | 4-pillar model overlays 7 canonical IDs | Health=[health], Wealth=[career,finances], Love=[relationships], Self=[personal_growth,fun,environment]. Pillars are human-facing; canonical IDs stay for CSV tagging. |
| 2026-03-20 | Cadence contract: daily=signals, weekly=A+H, monthly=identity, quarterly=full rebuild | Write scopes locked — see life-playbook.md cadence rules. |
| 2026-03-23 | /plan/day becomes daily home page, / redirects to /plan/day | Vision too dense for daily — lightweight plan surface for morning ritual + execution |
| 2026-03-23 | /vision becomes weekly+ deep review surface (Sundays, on-demand) | Full identity + ABT(H) + habit grid belong in weekly review, not daily |
| 2026-03-23 | /checkin absorbs /plan skill — single CLI write entry point | Eliminate skill duplication, one command for all writes |
| 2026-03-23 | Draft blocks: plan.csv entries with start=0, end=0 | Sunday weekly → draft blocks for week, evening → draft blocks for tomorrow, morning → assign times |
| 2026-03-23 | Anchor flow added to /checkin (crossroads signal) | Real-time trigger management using pre-committed identity content |
| 2026-03-23 | SchedulerModal removed — no in-app plan editing | CLI-first writes, app is for reading + done toggles only |
| 2026-03-23 | Evening flow added to /checkin (decompress, reflect, set tomorrow) | Evening shapes tomorrow — Daniel Abrada principle |

<!-- Add rows as decisions happen. Format: date, what was decided, why -->
