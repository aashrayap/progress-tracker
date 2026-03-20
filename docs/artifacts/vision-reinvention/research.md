# Research: vision-reinvention

## Flagged Items
- Q8: Medium confidence — checkin skill implementation not found in filesystem, only spec exists in archived docs
- Q6: Open — vision describes targets but no CSV tracks progress against vision domain goals (except weight)

## Findings

### Q1: Does a Vision page/route currently exist?
- **Answer**: Yes, at `/app/app/vision/page.tsx`. Renders Radar/Wheel of Life, Ikigai charts, Identity North Star statement, and 3-Year Destination with expandable Now/90-Day/3-Year timelines. Data from `/api/vision` reading `data/vision.json`.
- **Confidence**: high
- **Evidence**: `app/app/vision/page.tsx:1-386`, `app/app/api/vision/route.ts:1-8`, `data/vision.json:1-86`
- **Conflicts**: none
- **Open**: none

### Q2: Is there an existing north star/vision data structure?
- **Answer**: Yes. `data/vision.json` with `identityNorthStar` field and multi-domain vision destinations. VisionData interface in `types.ts`.
- **Confidence**: high
- **Evidence**: `data/vision.json:1-86`, `app/app/lib/types.ts:186-201`, `app/app/api/vision/route.ts:1-8`
- **Conflicts**: none
- **Open**: Vision data is read-only from app; authoring mechanism unclear.

### Q3: How does the 7-domain taxonomy map to vision features?
- **Answer**: Vision uses 8 custom domains mapping to canonical 7 via `canonicalId`: business_career→career, finances→finances, health→health, family_friends+romance→relationships, personal_growth→personal_growth, fun_recreation→fun, physical_environment→environment.
- **Confidence**: high
- **Evidence**: `app/app/lib/types.ts:186-201`, `data/vision.json:5-84`
- **Conflicts**: Relationships split into two vision domains (family_friends, romance) while canonical is one.
- **Open**: none

### Q4: Does config.ts have vision-related config?
- **Answer**: No. Only operational config (gym rotation, habit templates, exercises). Vision data is in vision.json.
- **Confidence**: high
- **Evidence**: `app/app/lib/config.ts:1-180`
- **Conflicts**: none
- **Open**: none

### Q5: Existing components for long-form text entry?
- **Answer**: No rich text or multiline components. Only plain `<input type="text" />` in TodoList, DailyTaskItem, BriefingCard. Zero textarea/contentEditable/RichText matches.
- **Confidence**: high
- **Evidence**: `app/app/components/TodoList.tsx:121-125`, `app/app/components/DailyTaskItem.tsx:39-46`, `app/app/components/BriefingCard.tsx:176-182`
- **Conflicts**: none
- **Open**: none

### Q6: Any goal/ABT-style data stored?
- **Answer**: Yes in `data/vision.json` (3-year/90-day/now per domain) and `config.ts` (weight goal: 200 lbs by 2026-06-30). No "actual vs target" tracking CSVs.
- **Confidence**: high
- **Evidence**: `data/vision.json:1-86`, `app/app/lib/config.ts:74-85`
- **Conflicts**: none
- **Open**: Vision describes targets but no CSV tracks progress against them.

### Q7: Nav bar structure?
- **Answer**: 5 top-level tabs: Vision (first), Hub, Plan, Health, Resources. Sticky top nav. Flat, no sub-routes.
- **Confidence**: high
- **Evidence**: `app/app/components/BottomNav.tsx:1-39`
- **Conflicts**: File named "BottomNav" but is sticky top.
- **Open**: none

### Q8: How does checkin reference domains?
- **Answer**: Checkin skill not found in filesystem. Archived spec references canonical domain IDs via daily_signals signals like `weekly_intention` and `daily_intention`.
- **Confidence**: medium
- **Evidence**: `docs/specs/archived/checkin-plan-integration.md:1-100`, `docs/data-schemas.md:45`
- **Conflicts**: none
- **Open**: Checkin skill location and current implementation status.

### Q9: Identity/vision-related signals in CSVs?
- **Answer**: daily_signals.csv has "intention" and "weekly_goal" entries with vision-aligned context. reflections.csv has domain-level micro-AARs only, no explicit identity/vision signals.
- **Confidence**: high
- **Evidence**: `data/daily_signals.csv:267,275,307,318`, `data/reflections.csv:2-10`
- **Conflicts**: none
- **Open**: Intention signals are ad-hoc text, not structured.

### Q10: Hub UI patterns?
- **Answer**: Cards (rounded-xl, bg-zinc-900/60), 3-column grids, colored cell grids (28-day habit tracker), inline LineTrendChart components.
- **Confidence**: high
- **Evidence**: `app/app/page.tsx:283-287,290-406,460-479`
- **Conflicts**: none
- **Open**: none

### Q11: Core docs on vision/goals/identity?
- **Answer**: Vision is a data-driven surface reading `data/vision.json` with fields for identityNorthStar, threeYearDestination, now, ninetyDay, threeYear per domain. Life Vision (in /vision) explicitly distinguished from App Intent. Vision feeds directional updates to app behavior.
- **Confidence**: high
- **Evidence**: `docs/data-schemas.md:109-135`, `docs/app-intent.md:3-12,50-58`, `docs/architecture.md:41-46`
- **Conflicts**: none
- **Open**: none

### Q12: Domain mapping/grouping mechanism?
- **Answer**: vision.json has `canonicalId` field mapping custom vision domains to canonical 7. Multiple vision domains can share same canonical ID.
- **Confidence**: high
- **Evidence**: `docs/data-schemas.md:117-132`
- **Conflicts**: none
- **Open**: No reverse mapping to 4-domain model documented.

### Q13: Where should vision/identity data live?
- **Answer**: Precedent: JSON for singletons (vision.json, briefing.json), Markdown for append-only thought records (relationship.md). Extend vision.json or add identity.md. Never CSV for prose.
- **Confidence**: high
- **Evidence**: `data/vision.json`, `data/briefing.json`, `data/relationship.md:1-28`, `docs/data-schemas.md:109-134`
- **Conflicts**: none
- **Open**: Whether to extend vision.json or create separate file.

### Q14: Versioned/timestamped long-form entries?
- **Answer**: Two patterns: (1) relationship.md uses date headers, no auto-versioning. (2) reflections.csv has date column for micro-AARs. No automatic versioning system beyond git history.
- **Confidence**: high
- **Evidence**: `data/relationship.md`, `data/reflections.csv`, `app/app/lib/csv.ts:860-868`
- **Conflicts**: none
- **Open**: Whether to implement automatic versioning for identity content.

## Patterns Found
| Pattern | Files | Count |
|---------|-------|-------|
| Plain text input (single-line) | TodoList, DailyTaskItem, BriefingCard | 3 |
| JSON data (read-only singletons) | vision.json, briefing.json | 2 |
| Append-only markdown | relationship.md | 1 |
| CSV row-based with date | daily_signals, reflections, plan, workouts, todos | 5 |
| Rich text / multiline input | (none) | 0 |
| Domain mapping via canonicalId | vision.json, types.ts | 2 |

## Core Docs Summary
- Vision is L1 data (`data/vision.json`), consumed via L2 (`/api/vision`), displayed on L3 (`/vision` page)
- Currently read-only from app — manual JSON editing or AI session for authoring
- `canonicalId` field enables custom vision domains mapped to canonical 7
- Flat nav enforced — no sub-routes, depth via in-page UI
- Vision drives intent — app behavior should update when vision shifts
- Vision is "rare" usage surface per architecture docs — may need to become daily if it's a ritual surface

## Open Questions
- Checkin skill implementation location and status
- Authoring mechanism for vision data (currently manual JSON edit)
- Whether to version identity content snapshots
- Progress tracking against vision goals (gap — no CSV tracks this)
