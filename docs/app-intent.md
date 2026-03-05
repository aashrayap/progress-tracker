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

<!-- TODO: Add or revise. What observable states would tell you "this app is working"? -->

## Health Metrics

While building new features, these must not degrade:

- **3-layer boundary integrity**: CSV (data) / lib+api (intelligence) / pages (surface) stays clean
- **Flat navigation**: no new route trees — depth via in-page UI only
- **Capture reliability**: voice/text intake pipeline must keep working
- **Data simplicity**: no new CSV files unless existing ones genuinely can't hold the data
- **Startup friction**: daily use shouldn't require more steps than it does today

## Surface Reality (March 2026)

| Surface | Usage | Gravity |
|---------|-------|---------|
| Hub | Daily | High — habit tracking, daily entry point |
| Health | Daily | High — workout logging, body metrics |
| Plan | Occasional | Medium — useful but underutilized |
| Mind | Rare | Low — almost unused |
| Ideas | Rare | Low — almost unused |
| Resources | Rare | Low — passive storage |
| Vision | Rare | Low — separate from app flow |

The app has too many surfaces and not enough gravity. It feels like a restaurant with a menu too big. Features that aren't pulling their weight should be consolidated, hidden, or removed — not maintained.

## Current Direction

- Vision-driven, not feature-driven — every surface must trace back to the life vision
- Hub as single entry point for daily execution
- CSV-first data model (no database migration)
- Voice and text converge through one pipeline
- Automation via idea-pipeline and voice-inbox (human gate = PR review only)
- Reflections should feed back into rules, not just sit in storage
- Fewer surfaces with more gravity, not more surfaces with less
- Capture works; retrieval and loop-closing are the gaps to fix

## Distillation Rules

Turn raw capture into a small set of actionable insights. Distillation should reduce noise, not summarize everything.

### Pattern Qualification

Create/refresh an insight candidate only when at least one condition is true:
- Recurrence: same issue/opportunity appears at least 3 times in 14 days, or 5 times in 30 days.
- Streak break: a core behavior misses for 2+ consecutive planned days.
- Trend shift: a tracked metric moves at least 10% from its 14-day baseline for 4+ days.
- Cross-source confirmation: the same pattern appears in at least 2 sources (`reflection`, `mind_loop`, `signal`, `manual`) within 21 days.

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

### Hub Surfacing Rules

- Show at most 3 active insights on Hub.
- Rank by weighted score, then evidence count, then recency.
- If there is any active addiction-risk pattern, reserve 1 slot for that class.
- Do not surface near-duplicates; merge to the highest-evidence candidate.

### Insight Lifecycle

- `active`: seen in the last 14 days and score >= 3.0.
- `dormant`: not seen for 15-45 days, or score falls below 3.0.
- `resolved`: no confirming evidence for 45+ days and an explicit replacement behavior exists.

When lifecycle changes, update `data/insights.csv` rather than rewriting historical source rows.

## Decisions Made

Append-only log. When a directional choice is made during a feature, record it here so future sessions don't re-litigate.

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-05 | Flat navigation only — no nested route trees | Consolidation of /reflect into /mind, /quotes into /resources |
| 2026-03-05 | CSVs are permanent data layer — no DB migration | Simplicity and local-first model preferred over scalability |
| 2026-03-05 | Intent doc created — read before multi-layer features | Repeated corrections during feature work indicated missing direction |
| 2026-03-05 | Vision-driven not feature-driven | App serves 5-year life vision; features must trace to vision, not justify themselves |
| 2026-03-05 | Fewer surfaces, more gravity | Too many routes feel like a big menu; consolidate or remove low-usage surfaces |

<!-- Add rows as decisions happen. Format: date, what was decided, why -->

## Execution Contract

See **[docs/feature-spec-template.md](feature-spec-template.md)** for the full feature specification and verification protocol.

That template is the single source of truth for how features are specified, verified, and fixed. It is system-agnostic — any AI tool or human developer should follow it.
