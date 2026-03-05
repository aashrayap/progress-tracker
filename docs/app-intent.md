# App Intent

## Objective

Turn raw life input into reliable, evidence-backed next actions with minimal daily friction — so the system runs me, not the other way around.

<!-- TODO: Ash to refine. What should this app BECOME in 6-12 months? What's the north star? -->

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

## Current Direction

<!-- These are directional bets — what the app is optimizing toward -->

- Hub as single entry point for daily execution
- CSV-first data model (no database migration)
- Voice and text converge through one pipeline
- Automation via idea-pipeline and voice-inbox (human gate = PR review only)
- Reflections should feed back into rules, not just sit in storage

<!-- TODO: What else? What should the app NOT become? -->

## Decisions Made

Append-only log. When a directional choice is made during a feature, record it here so future sessions don't re-litigate.

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-05 | Flat navigation only — no nested route trees | Consolidation of /reflect into /mind, /quotes into /resources |
| 2026-03-05 | CSVs are permanent data layer — no DB migration | Simplicity and local-first model preferred over scalability |
| 2026-03-05 | Intent doc created — read before multi-layer features | Repeated corrections during feature work indicated missing direction |

<!-- Add rows as decisions happen. Format: date, what was decided, why -->
