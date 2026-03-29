# Research Questions: Subagent Architecture

## Codebase Questions

### Skills & Current Token Spend
1. What skills exist in `.claude/skills/`, and for each: what are the distinct steps/phases in the SKILL.md instructions?
2. Which skill steps involve reading/parsing CSVs, and what specific CSV operations does each perform (read all rows, filter by date, count streaks, aggregate)?
3. Which skill steps involve writing to CSVs or JSON files, and what's the write pattern (append row, update field, overwrite)?
4. Which skills already spawn subagents, and what do those subagents do?
5. Which skill steps involve presenting formatted output to the user (tables, grids, visual summaries)?

### Scripts & Existing Deterministic Logic
6. What scripts exist in `scripts/`, and what does each one do (inputs, outputs, deterministic or not)?
7. What deterministic logic currently lives in `app/app/lib/` that skills or conversations repeatedly invoke (streak counting, date math, CSV parsing, rotation logic)?
8. Does `app/app/lib/csv.ts` expose functions that could be called from a CLI script, or is it coupled to the Next.js runtime?

### API Routes as Computation
9. What do the API routes in `app/app/api/` compute, and which computations are deterministic (could be a script) vs require judgment?
10. Does `/api/hub/route.ts` pre-aggregate data that agents currently re-derive from raw CSVs?

### Repeated Patterns Across Conversations
11. What data transformations appear in multiple skills (e.g., "read daily_signals.csv, filter last N days, pivot by signal name, compute streak")?
12. What output formats are reused across skills (habit grid, streak table, domain summary)?

## Core Docs Questions
13. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the boundary between deterministic logic and LLM reasoning? Any existing guidance on script extraction?

## Classification Questions
14. For each skill's steps identified in Q1: which require natural language judgment (interpreting user input, generating advice, asking follow-up questions) vs pure data operations (read CSV, count rows, format table)?
15. What prompt sections in skills contain hardcoded templates, schemas, or format strings that could be moved to files rather than consuming tokens?

## Open Questions
16. Are there analysis patterns from ad-hoc conversations (like today's brain-state analysis) that aren't captured in any skill but recur frequently?
17. What's the desired interface between a script and an agent — stdout JSON? temp file? API endpoint?
