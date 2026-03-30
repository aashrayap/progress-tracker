# Research Questions: System Documentation & Visual Architecture

## Page Surface Questions
1. What components does `/plan/day` render, and what data sources (CSVs, APIs, config) does each component read/write?
2. What components does `/plan/week`, `/plan/month`, `/plan/year` render, and how do they differ from `/plan/day`?
3. What components does `/vision` render, and what data sources does each component read/write?
4. What components does `/health` render, and what data sources does each component read/write?
5. What components does `/resources` render, and what data sources does each component read/write?

## API Layer Questions
6. What API routes exist under `app/app/api/`, and which CSVs does each route read/write?
7. Which API routes are shared across multiple pages vs. page-specific?

## Skill & Agent Questions
8. What skills exist (SKILL.md files), and for each: what data does it write, what agents does it spawn, what CSVs does it touch?
9. What agent definitions exist (agent .md files), and which skills invoke which agents?
10. Which agents/skills share the same underlying utilities (e.g., csv.ts functions, API routes)?

## Cadence System Questions
11. What is the full daily flow — which skills, pages, and data writes happen in a typical daily use?
12. What is the full weekly flow — which skills, pages, and data writes happen in a weekly check-in?
13. What is the full monthly/quarterly flow — which skills, pages, and data writes happen?
14. Which lib functions (csv.ts, router.ts, config.ts) are used by daily vs. weekly vs. monthly flows?

## Infrastructure Questions
15. What scripts exist in `scripts/` and what does each do?
16. What is the current state of `lib/router.ts` (the write router mentioned in architecture.md)?

## Core Docs Questions
17. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature — specifically, what's already documented vs. gaps?
