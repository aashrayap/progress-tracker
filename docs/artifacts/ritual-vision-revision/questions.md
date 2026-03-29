# Research Questions: Ritual & Vision Revision

## Codebase Questions

### Ritual Blueprint & Plan/Day Structure
1. What is the current structure of `ritualBlueprint` in `data/vision.json`? How many steps, what phases (morning/evening/night), and what content?
2. How does `/plan/day` (DayView component) render the ritual checklist? Is it a flat list or grouped by time-of-day?
3. Does the checkin SKILL.md morning flow (Log → Anchor → Today's plan) reference or enforce the ritual blueprint steps, or are they independent?
4. Is there any concept of "protocol phases" (morning/evening/night) in the current data model, or is everything a flat list of steps?
5. What signals in `daily_signals.csv` relate to protocol activities (sleep, wim_hof, meditation, cold_shower, journal, etc.)? Which ones already exist as tracked signals?

### Vision & Identity
6. What is the current content of `identityScript` and `antiVision` in `data/vision.json`?
7. What are the current ABT(H) entries per domain in `data/vision.json`? (actual/becoming/timeline/habits for each pillar)
8. What does `inputControl`, `distractions`, and `habitAudit` currently contain in `data/vision.json`?

### Daniel Abrada Reference
9. What frameworks, concepts, and specific protocols does `docs/resources/daniel-abrada/master-compilation.md` contain?
10. Does the Daniel Abrada reference include specific morning/evening/night protocol structures or just general principles?
11. Does the reference material have specific identity scripting or anti-vision frameworks that differ from what's currently in vision.json?

### Weekly Check-in
12. How does the `/checkin` skill handle weekly cadence? What does it write to vision.json for the weekly flow?
13. What is the current state of the weekly check-in menu options in the checkin SKILL.md?

### Input Control & Distractions
14. What specific items are in `inputControl` and `distractions` in vision.json? Do they address the YouTube-after-lunch pattern?

## Core Docs Questions
15. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the ritual blueprint, vision.json structure, and cadence system?

## Open Questions
16. When you say "standardize protocols" — do you mean: (a) rewrite the ritual blueprint content in vision.json, (b) change how /plan/day renders protocols, (c) change the checkin skill flow, or (d) all three?
17. "Wim Hof is non-negotiable" — should this be encoded as a hard constraint in the ritual blueprint, or as a daily signal that gets flagged if missed?
18. The YouTube-after-lunch distraction — should this become an explicit item in inputControl/distractions, or is it a symptom of a missing "post-lunch protocol"?
19. How do you want nighttime protocol to differ from evening? (Evening = decompress/reflect/set-tomorrow. Night = wind-down/sleep prep? Or are they the same?)
20. For the vision revision — are you looking to rewrite from scratch using Abrada frameworks, or update/refine what's already there?
