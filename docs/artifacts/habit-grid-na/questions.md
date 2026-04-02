# Research Questions: Habit Grid N/A Days

## Codebase Questions

1. What component renders the habit grid, and how is each cell structured (props, state, styling, click/hover handlers)?
2. How does the habit grid currently handle hover tooltips — what data is shown, what component renders them, and how is positioning handled?
3. What data source feeds the habit grid? Is it `daily_signals.csv`, a derived structure, or something else? What's the fetch path (API route → lib function → CSV)?
4. How does the habit grid determine cell color/status today — what are the current possible states per cell (done, missed, partial, empty, future)?
5. Is there any existing concept of "disabled" or "skipped" days anywhere in the codebase (daily_signals, plan.csv, or config)?
6. What date range does the habit grid display, and how does it handle the boundaries (e.g., today's column, future columns)?
7. Does the habit grid have any existing per-cell or per-day override mechanism (e.g., notes, context field usage)?

## Patterns Questions

8. How are hover/tooltip interactions implemented across the app — is there a shared tooltip component or are they inline per-feature?
9. What CSS/styling pattern does the habit grid use (Tailwind classes, CSS modules, etc.) and how are cell states differentiated visually?

## Core Docs Questions

10. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the habit grid, daily_signals schema, and any relevant constraints?

## Open Questions

11. Should N/A days be stored as entries in `daily_signals.csv` (e.g., a signal like `day_status` with value `na` and context = reason), or as a separate mechanism (config, separate CSV column)?
12. Should N/A apply to the entire day (all habits blocked) or should individual habits be markable as N/A independently?
13. How should N/A days affect streak calculations or any aggregation logic that reads habit data?
