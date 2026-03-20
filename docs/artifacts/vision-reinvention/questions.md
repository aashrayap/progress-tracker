# Research Questions: Vision Reinvention

## Codebase Questions

1. Does a Vision page/route currently exist? If so, what does it render and what data does it consume?
2. Is there an existing "north star" or "vision" data structure anywhere in the codebase (CSV, config, or component state)?
3. How does the app's 7-domain taxonomy (health, career, relationships, finances, fun, personal_growth, environment) currently map to any vision/goal features?
4. Does `config.ts` contain any vision-related static config (e.g., domain descriptions, goal templates)?
5. Are there existing components for text input, rich text editing, or long-form content entry that could be reused for identity scripts / north star writing?
6. Does the app currently store any goal or ABT-style data (actual state, target state, timeline) in any CSV or data structure?
7. What is the current nav bar structure — is "Vision" already a top-level route, and how many nav items exist today?
8. How does the daily check-in (`/checkin` skill) currently reference domains — could the vision data feed into check-in prompts?
9. Does the reflections CSV or daily_signals CSV already capture any identity/vision-related signals (e.g., `identity_read:1`, `vision_reviewed:1`)?
10. What UI patterns are used on the Hub page for displaying summary/status data — cards, grids, progress bars?

## Core Docs Questions

11. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature — specifically any mention of vision, goals, north star, identity, or long-form content storage?

## Domain Mapping Questions

12. The video framework uses 4 domains (Health, Wealth, Love, Self). The app uses 7 (health, career, relationships, finances, fun, personal_growth, environment). How should these map? Does the app already have a domain-mapping or grouping mechanism?

## Data Model Questions

13. Where should vision/identity data live — a new CSV, a section in an existing CSV, or a markdown file in `data/`? What precedent exists for storing long-form structured text vs. row-based signals?
14. Does the app have any mechanism for versioned/timestamped long-form entries (like a journal) vs. append-only row data?

## Answered Questions (locked by user)

15. Moving to 4-domain model (Health/Wealth/Love/Self) — replacing the 7-domain model for vision purposes.
16. Daily ritual surface — designed for daily read/review, not setup-once.
17. Guided flow for ABT goal entry (like check-in skill pattern).
18. Structured fields for identity script / character sheet.
19. Yes — vision data should feed into daily check-in as reinforcement.
