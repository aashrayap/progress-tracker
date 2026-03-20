Status: shipped

# Feature: Vision Reinvention

## 1. Problem Statement

```
PROBLEM:
- What: Merge Hub (/) and Vision (/vision) into a single daily ritual surface at /vision.
  Rebuild from static reference page (radar/wheel/ikigai charts + 8-domain now/90d/3yr
  timelines) into the Reinvention Formula: identity script, anti-vision, 4-domain ABT(H)
  north star, ritual blueprint, briefing, habit grid, intentions, plan card, experiments,
  and periodic review sections. Hub route becomes a 302 redirect.
- Why: Current Vision page is decorative — nobody reads radar charts daily. Current Hub
  page has execution data (habit grid, briefing, experiments) but no identity/direction.
  Merging them creates a single daily entry point: who I am → where I'm going → what
  matters today → how I'm tracking.
- User-facing effect: /vision becomes a single-scroll read-only ritual page. / redirects
  to /vision. Nav bar drops Hub tab (4 tabs: Vision, Plan, Health, Resources). Page is
  read-only — NO edit modals. Content authored via JSON edit or future skills.
  3 review checkboxes (morning/afternoon/evening) log vision_reviewed signal.
  Habit grid gains a 3-segment vision_reviewed cell.
```

## 2. Affected Files

```
SCOPE:

Files to modify:
  - data/vision.json                        — rewrite to new schema (complete replacement)
  - app/app/lib/types.ts                    — replace VisionDomain + VisionData interfaces
  - app/app/lib/csv.ts                      — update readVision, add writeVision
  - app/app/lib/config.ts                   — add vision_reviewed to HABIT_CONFIG
  - app/app/api/vision/route.ts             — add PUT handler, add review status to GET
  - app/app/vision/page.tsx                 — full rewrite (merged Hub + Vision ritual page)
  - app/app/page.tsx                        — replace with 302 redirect to /vision
  - app/app/components/BottomNav.tsx         — remove Hub tab (5 tabs → 4 tabs)
  - app/app/api/hub/route.ts                — may need updates for shared data consumption

Files to create: none

Files that must NOT change:
  - data/daily_signals.csv          (append-only via existing functions)
  - data/workouts.csv
  - data/plan.csv
  - data/todos.csv
  - data/reflections.csv
  - data/groceries.csv
  - data/inbox.csv
  - data/briefing.json
  - data/experiments.csv
  - data/resources.csv
  - data/quotes.csv
  - data/relationship.md
  - scripts/voice-inbox.sh
  - app/app/health/ directory       (all files)
  - app/app/plan/ directory         (all files)
  - app/app/resources/ directory    (all files)
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page/route: /vision
- Viewport: 390x844 (mobile-first), also correct at 1280x800

What the user SHOULD see (top to bottom):

1. IDENTITY SCRIPT section — all 6 fields displayed read-only:
   ├─ Core Traits: paragraph text
   ├─ Non-Negotiables: paragraph text
   ├─ Language: "USE" chips (green-tinted) + "FORBID" chips (red-tinted)
   ├─ Physical Presence: paragraph text
   ├─ Social Filter: paragraph text
   └─ Decision Style: paragraph text

2. NORTH STAR — 4 domain cards in order: Health, Wealth, Love, Self
   Each card shows:
   ├─ Domain label with colored left border (Health=#10b981, Wealth=#f59e0b, Love=#ec4899, Self=#a855f7)
   ├─ A (Actual): text
   ├─ B (Becoming): text
   ├─ T (Timeline): text
   └─ H (Habits): bulleted list of habit strings

3. RITUAL BLUEPRINT — 3 tabs: Morning | Midday | Evening (scoped to this section only)
   Each tab shows:
   ├─ Ordered step list
   ├─ Habit stacks
   └─ Review checkbox (☑ Morning / ☑ Midday / ☑ Evening)
   Checkbox logs vision_reviewed signal. Disabled once checked. Pre-filled if already logged today.

4. BRIEFING CARD — same BriefingCard component currently on Hub

5. ANTI-VISION — collapsed by default (disclosure/chevron), expands to show text
   Positioned under briefing (intentional contrast: what matters today vs who I refuse to be)

6. INTENTIONS — "This week: [text]" and "Today: [text]"

7. HABIT GRID (28 days) — same grid from Hub
   ├─ Includes all existing habit columns
   └─ New "V" (vision_reviewed) column with 3-segment cell (morning/afternoon/evening)
       Each segment independently green (checked) or gray (unchecked), no labels

8. PLAN CARD — same PlanCard component currently on Hub

9. EXPERIMENTS — same ExperimentsTable component currently on Hub

10. Weekly review collapsed sections:
    ├─ ▶ Input Control (collapsed) — mentors, books, podcasts, playlists, nutrition rules, purge list
    ├─ ▶ Distractions (collapsed) — digital, physical, social, mental drains + trigger→replacement
    └─ ▶ Habit Audit (collapsed) — productive / neutral / destructive classification

Dark theme: bg-black, text-zinc-100, cards bg-zinc-900/40, rounded-xl, consistent with app

What the user should NOT see:
- No radar chart / Wheel of Life
- No ikigai chart / circles
- No 8-domain grid
- No now/90d/3yr timeline structure
- No "horizon" field
- No edit buttons or edit modals (page is read-only)
- No console errors
- No layout overflow or broken styling
```

## 4. Success Criteria

```
SUCCESS:
- [ ] `cd app && npm run build` passes with zero errors
- [ ] GET /api/vision returns new schema (identityScript, antiVision, domains[4], ritualBlueprint, intentions, inputControl, distractions, habitAudit)
- [ ] PUT /api/vision writes to data/vision.json and returns updated data
- [ ] /vision page renders all sections in order: identity → north star → ritual → briefing → anti-vision → intentions → habit grid → plan → experiments → collapsed review sections
- [ ] Identity Script displays all 6 fields read-only, language rules as chips
- [ ] 4 domain ABT(H) cards render in order: Health, Wealth, Love, Self
- [ ] Ritual blueprint has 3 working tabs (morning/midday/evening)
- [ ] Review checkboxes (in ritual tabs) POST vision_reviewed signal to daily_signals.csv with correct context (morning/afternoon/evening)
- [ ] Review checkboxes pre-fill from today's existing signals and disable once checked
- [ ] Hub components (BriefingCard, habit grid, PlanCard, ExperimentsTable, intentions) render on /vision
- [ ] Habit grid includes vision_reviewed as 3-segment cell ("V" column)
- [ ] Anti-Vision is collapsed by default, expands on click
- [ ] Input control, distractions, habit audit are collapsed sections
- [ ] `/` redirects (302) to `/vision`
- [ ] Nav bar shows 4 tabs: Vision, Plan, Health, Resources (no Hub)
- [ ] No radar/wheel/ikigai charts visible
- [ ] No edit buttons or modals anywhere on the page
- [ ] No files modified outside declared scope (verify with git diff --stat)
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `cd app && npm run build` | Fix types/imports, rebuild |
| Console error on /vision | Browser console | Trace to source, fix |
| Old charts still visible | Navigate /vision, visual check | Remove remaining radar/ikigai/wheel code |
| API returns old schema | `curl localhost:3000/api/vision` | Fix readVision return type or vision.json |
| PUT /api/vision fails | `curl -X PUT ...` returns non-200 | Fix route handler |
| Review checkbox doesn't log | Check daily_signals.csv after clicking | Fix POST handler call |
| Hub components missing | Navigate /vision, check briefing/grid/plan/experiments | Wire up data fetching and component rendering |
| Redirect broken | Navigate `/`, should land on `/vision` | Fix page.tsx redirect |
| Nav still shows Hub | Visual check of nav bar | Fix BottomNav.tsx tabs array |
| 3-segment cell not rendering | Check "V" column in habit grid | Fix vision_reviewed rendering logic |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Regression on Plan/Health | Navigate those routes | Revert, isolate change |

## 6. Invariants

```
INVARIANTS:
- Existing vision content must be migrated to new schema, not lost
  (identityNorthStar → coreTraits, domain content → ABT(H) fields)
- The 7 canonical domain taxonomy is NOT changed — 4-domain model is vision-page-only
- Domain mapping is fixed: Health→["health"], Wealth→["career","finances"],
  Love→["relationships"], Self→["personal_growth","fun","environment"]
- daily_signals.csv is append-only — never read/modify existing rows
- vision_reviewed signal format: date,vision_reviewed,1,,{morning|afternoon|evening},app,,personal_growth
- All CSV files remain completely untouched (schemas unchanged)
- No new routes created — /vision already exists, / already exists
- No new API endpoints created beyond adding PUT to existing /api/vision
- Flat navigation preserved — no sub-routes
- Existing readVision function signature preserved (returns VisionData | null)
- config.ts changes limited to adding one entry to HABIT_CONFIG
- NO edit modals — page is read-only. No IdentityScriptModal, no DomainEditModal
- Hub components (BriefingCard, PlanCard, ExperimentsTable, HabitTooltip, etc.) are
  imported into /vision — NOT duplicated or rewritten
- /api/hub/route.ts continues to work (shared data source for /vision)
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO:

1. Does this file reference the correct type names (VisionData, VisionDomain, IdentityScript)?
2. Does the new VisionData type match the full schema (identityScript, antiVision, domains, intentions, ritualBlueprint, inputControl, distractions, habitAudit)?
3. Does each domain have exactly: id, label, hex, canonicalIds, actual, becoming, timeline, habits[]?
4. Does identityScript have exactly: coreTraits, nonNegotiables, languageRules{use[],forbid[]}, physicalPresence, socialFilter, decisionStyle?
5. Is the page purely read-only? (No edit buttons, no modals, no inline editing)
6. Did I preserve all existing content that wasn't explicitly marked for removal?
7. Does my diff contain ONLY changes the spec asked for?
8. Can I trace every change to a specific spec section?

## 8. Diff Contract

### Phase 1: Data Layer

**File: data/vision.json**
- WHAT: Rewrite to new schema with all sections
- WHY: New Reinvention Formula structure replaces old 8-domain now/90d/3yr model
- PRESERVES: Existing vision content migrated into new fields (domain text → ABT(H), identityNorthStar → coreTraits)
- REMOVES: horizon, identityNorthStar, 8-domain structure, threeYearDestination/now/ninetyDay/threeYear fields, canonicalId (singular) → canonicalIds (array)
- RISK: Content loss during migration — verify all text accounted for

**File: app/app/lib/types.ts**
- WHAT: Replace VisionDomain and VisionData interfaces with full new schema
- WHY: Type safety for new vision.json structure
- PRESERVES: All other interfaces in the file (ResourceEntry, etc.)
- REMOVES: Old VisionDomain fields, old VisionData fields
- RISK: Breaking imports — only vision/page.tsx and api/vision use these types

**File: app/app/lib/csv.ts**
- WHAT: Add writeVision function after readVision. Do NOT modify readVision itself.
- WHY: PUT endpoint needs to write vision.json
- PRESERVES: All existing functions unchanged
- REMOVES: Nothing
- RISK: writeVision could corrupt vision.json — use tmp-file-rename pattern

**File: app/app/api/vision/route.ts**
- WHAT: Add PUT handler; extend GET to include today's vision_reviewed signals
- WHY: PUT for JSON editing; GET needs review status for checkbox pre-fill
- PRESERVES: Existing GET handler logic
- REMOVES: Nothing
- RISK: None — additive

### Phase 2: Vision Page (new content)

**File: app/app/vision/page.tsx**
- WHAT: Full rewrite — identity script, north star ABT(H), ritual blueprint tabs, anti-vision (collapsed), review checkboxes
- WHY: Core of the feature — new ritual surface sections
- PRESERVES: Nothing (full replacement)
- REMOVES: RadarChart, IkigaiChart, IkigaiDetail, VisionDestination, all SVG/chart code, IKIGAI constant
- RISK: Large diff. Review checkbox POST must match daily_signals schema exactly.

### Phase 3: Hub Content Migration

**File: app/app/vision/page.tsx (continued)**
- WHAT: Import and render BriefingCard, habit grid, PlanCard, ExperimentsTable, intentions
- WHY: Hub content moves to merged vision page
- PRESERVES: Existing component behavior — import, don't rewrite
- REMOVES: Nothing — components stay in app/app/components/
- RISK: Data fetching — may need to call /api/hub from /vision page, or merge API calls

**File: app/app/lib/config.ts**
- WHAT: Add `vision_reviewed: { label: "Vision", abbr: "V" }` to HABIT_CONFIG
- WHY: Habit grid needs to know about this signal
- PRESERVES: All existing HABIT_CONFIG entries, all other config
- REMOVES: Nothing
- RISK: Minimal — single line addition

**File: app/app/lib/csv.ts (getHabitsForDate)**
- WHAT: Add "vision_reviewed" to habitMetrics array at line 438
- WHY: Hub grid (now on /vision) must show vision review status
- PRESERVES: All 9 existing habit metrics
- REMOVES: Nothing
- RISK: None — additive. Array is currently: ["weed", "lol", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean"]

**File: app/app/api/hub/route.ts**
- WHAT: May need updates if /vision page consumes hub data differently
- WHY: Shared data endpoint for briefing, habits, plan, experiments
- PRESERVES: All existing response fields
- REMOVES: Nothing
- RISK: Minimal — /vision can just call GET /api/hub

### Phase 4: Route + Nav Cleanup

**File: app/app/page.tsx**
- WHAT: Replace entire Hub page with 302 redirect to /vision
- WHY: Hub is absorbed — / should go to /vision
- PRESERVES: Nothing (replacement)
- REMOVES: Entire Hub page component and all its imports
- RISK: Ensure redirect works in both SSR and client navigation

**File: app/app/components/BottomNav.tsx**
- WHAT: Remove Hub tab from tabs array
- WHY: Hub no longer exists as a separate page
- PRESERVES: Vision, Plan, Health, Resources tabs
- REMOVES: `{ href: "/", label: "Hub" }` entry
- RISK: Active-state logic for "/" — remove or update the special case

### Phase 5: Cleanup + Doc Audit

- Remove dead radar/ikigai/wheel code (already done in Phase 2)
- Remove unused Hub-only code from page.tsx (already done in Phase 4)
- Aggressive doc pruning: architecture.md, data-schemas.md, app-intent.md
- Build passes, no dead code

## 9. Abort Conditions

Stop and ask if:
- vision.json doesn't match the expected 8-domain structure when first read
- Any existing content from vision.json cannot be mapped to the new schema
- A type change in VisionData/VisionDomain breaks imports outside vision/ and api/vision/
- The PUT handler needs to modify any file other than data/vision.json
- Review checkbox POST requires a new API endpoint (should use existing /api/daily-signals)
- getHabitsForDate is not a simple array addition (function structure changed)
- Build fails on a type error in a file outside declared scope
- 3 consecutive fix cycles fail on the same issue
- Any change requires modifying Plan page, Health page, or Resources page
- Tempted to add edit modals or edit buttons — the page is READ-ONLY
- Hub components need to be rewritten instead of imported as-is

## 10. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` — zero errors |
| Diff review | Yes | `git diff --stat` — only declared files changed |
| Browser verification | Yes | Navigate /vision, check all sections render in order, console clean |
| API verification | Yes | `curl localhost:3000/api/vision` returns new schema |
| PUT verification | Yes | `curl -X PUT -H 'Content-Type: application/json' -d '...' localhost:3000/api/vision` |
| Review checkbox | Yes | Click checkbox in ritual tab, verify daily_signals.csv has new row |
| Redirect | Yes | Navigate `/`, verify 302 to `/vision` |
| Nav bar | Yes | Check 4 tabs visible: Vision, Plan, Health, Resources |
| Hub components on /vision | Yes | Verify briefing, habit grid, plan card, experiments all render |
| 3-segment cell | Yes | Check "V" column in habit grid shows morning/afternoon/evening segments |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Always | Summary with evidence |

---

## Implementation Order

### Phase 1: Data Layer (tracer bullet)

**Task 1.1: Rewrite data/vision.json**
- Dependencies: none
- Migrate existing content into new schema structure
- Map old 8 domains → 4 new domains:
  - Health: health domain content → actual/becoming/timeline/habits
  - Wealth: business_career + finances → merged actual/becoming/timeline/habits
  - Love: family_friends + romance → merged actual/becoming/timeline/habits
  - Self: personal_growth + fun_recreation + physical_environment → merged actual/becoming/timeline/habits
- identityNorthStar text → coreTraits field
- antiVision: write placeholder (user fills in later)
- All other identity fields: write placeholders
- languageRules: initialize with empty arrays `{ "use": [], "forbid": [] }`
- habits: initialize with empty arrays `[]` per domain
- ritualBlueprint: initialize morning/midday/evening with empty steps[] and habitStacks[]
- intentions: initialize with empty strings
- inputControl: initialize all arrays empty
- distractions: initialize all arrays empty, triggerReplacements empty
- habitAudit: initialize all arrays empty
- Verify: file is valid JSON, all old content accounted for

**Task 1.2: Update types.ts**
- Dependencies: none (can parallel with 1.1)
- Replace `VisionDomain` and `VisionData` interfaces:
  ```typescript
  export interface LanguageRules {
    use: string[];
    forbid: string[];
  }

  export interface IdentityScript {
    coreTraits: string;
    nonNegotiables: string;
    languageRules: LanguageRules;
    physicalPresence: string;
    socialFilter: string;
    decisionStyle: string;
  }

  export interface RitualBlock {
    steps: string[];
    habitStacks: string[];
  }

  export interface RitualBlueprint {
    morning: RitualBlock;
    midday: RitualBlock;
    evening: RitualBlock;
  }

  export interface TriggerReplacement {
    trigger: string;
    replacement: string;
  }

  export interface InputControl {
    mentors: string[];
    books: string[];
    podcasts: string[];
    playlists: string[];
    nutritionRules: string[];
    purgeList: string[];
  }

  export interface Distractions {
    digital: string[];
    physical: string[];
    social: string[];
    mental: string[];
    triggerReplacements: TriggerReplacement[];
  }

  export interface HabitAudit {
    productive: string[];
    neutral: string[];
    destructive: string[];
  }

  export interface VisionDomain {
    id: string;
    label: string;
    hex: string;
    canonicalIds: string[];
    actual: string;
    becoming: string;
    timeline: string;
    habits: string[];
  }

  export interface VisionData {
    identityScript: IdentityScript;
    antiVision: string;
    domains: VisionDomain[];
    intentions: {
      daily: string;
      weekly: string;
    };
    ritualBlueprint: RitualBlueprint;
    inputControl: InputControl;
    distractions: Distractions;
    habitAudit: HabitAudit;
  }
  ```
- Preserve all other interfaces in the file
- Verify: no unused old fields remain in Vision types

**Task 1.3: Add writeVision to csv.ts**
- Dependencies: 1.2 (needs new VisionData type)
- Add function after readVision:
  ```typescript
  export function writeVision(data: VisionData): void {
    const dir = path.dirname(VISION_PATH);
    const base = path.basename(VISION_PATH);
    const tmpPath = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tmpPath, VISION_PATH);
  }
  ```
- Do NOT modify readVision — it already reads JSON and casts to VisionData
- Do NOT modify any other function in csv.ts
- Verify: `npm run build` passes

**Task 1.4: Add PUT handler to api/vision/route.ts**
- Dependencies: 1.3 (needs writeVision)
- Add PUT handler:
  ```typescript
  export async function PUT(req: Request) {
    const body = await req.json();
    if (!body.identityScript || typeof body.antiVision !== "string" || !Array.isArray(body.domains)) {
      return NextResponse.json({ error: "invalid vision data" }, { status: 400 });
    }
    writeVision(body as VisionData);
    return NextResponse.json(body);
  }
  ```
- Import writeVision from csv.ts
- Preserve existing GET handler
- Verify: `npm run build` passes, GET still works

### Phase 2: Read-Only Vision Page (new content)

**Task 2.1: Rewrite vision/page.tsx — new sections**
- Dependencies: 1.1 + 1.2 (needs new data + types)
- Delete ALL chart code (RadarChart, IkigaiChart, IkigaiDetail, VisionDestination, IKIGAI constant, polar helpers, SVG)
- Build page structure (read-only, NO edit buttons):
  1. Fetch vision data from GET /api/vision
  2. Identity Script section — 6 labeled paragraphs, language rules as chips
  3. North Star — 4 domain cards showing A/B/T/H with colored left borders
  4. Ritual Blueprint — 3 tabs (morning/midday/evening), each with steps, habit stacks, review checkbox
  5. Anti-Vision — collapsible section (useState toggle), collapsed by default

**Task 2.2: Review checkboxes**
- Dependencies: 2.1
- Place one checkbox per ritual tab (morning in morning tab, etc.)
- On page load: fetch today's vision_reviewed signals to pre-fill
- On check: POST to /api/daily-signals (existing endpoint) with:
  ```json
  {
    "date": "YYYY-MM-DD",
    "signal": "vision_reviewed",
    "value": "1",
    "unit": "",
    "context": "morning|afternoon|evening",
    "source": "app",
    "captureId": "",
    "category": "personal_growth"
  }
  ```
- Checkbox disabled once checked (append-only — no un-checking)
- Verify: page renders, checkboxes log signals, `npm run build` passes

### Phase 3: Hub Content Migration

**Task 3.1: Move Hub components to /vision page**
- Dependencies: 2.1 (page skeleton exists)
- Import existing components into vision/page.tsx:
  - `BriefingCard` from `../components/BriefingCard`
  - `PlanCard` from `../components/PlanCard`
  - `ExperimentsTable` from `../components/ExperimentsTable`
  - Habit grid rendering logic (from current page.tsx Hub code)
- Fetch data from GET /api/hub (same endpoint Hub page uses)
- Render in order after ritual section: briefing → anti-vision → intentions → habit grid → plan → experiments
- Verify: all Hub content renders correctly on /vision

**Task 3.2: Add vision_reviewed to HABIT_CONFIG**
- Dependencies: none
- In config.ts, add to HABIT_CONFIG:
  ```typescript
  vision_reviewed: { label: "Vision", abbr: "V" },
  ```
- Verify: `npm run build` passes

**Task 3.3: Add vision_reviewed to getHabitsForDate**
- Dependencies: 3.2
- In csv.ts line 438, add "vision_reviewed" to the habitMetrics array:
  ```typescript
  const habitMetrics = ["weed", "lol", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean", "vision_reviewed"];
  ```
- Verify: Hub data includes "V" column

**Task 3.4: 3-segment vision_reviewed cell**
- Dependencies: 3.3
- In the habit grid rendering on /vision, render vision_reviewed differently:
  - Instead of single green/gray cell, show 3 vertical segments (morning/afternoon/evening)
  - Each segment independently green (checked) or gray (unchecked)
  - No labels on segments — just colored blocks
  - Data source: filter daily_signals for vision_reviewed rows, check context field
- Verify: vision_reviewed column shows segmented cells

**Task 3.5: Collapsed weekly review sections**
- Dependencies: 2.1 (page skeleton)
- Add 3 collapsed sections at bottom of page:
  - Input Control: mentors, books, podcasts, playlists, nutrition rules, purge list
  - Distractions: digital, physical, social, mental, trigger→replacement
  - Habit Audit: productive / neutral / destructive
- All read-only, all collapsed by default (disclosure/chevron toggle)
- Data from vision.json (already fetched in Task 2.1)
- Verify: sections expand/collapse, content renders

### Phase 4: Route + Nav Cleanup

**Task 4.1: Hub redirect**
- Dependencies: Phase 3 complete (all Hub content on /vision)
- Replace app/app/page.tsx with 302 redirect:
  ```typescript
  import { redirect } from "next/navigation";
  export default function Home() {
    redirect("/vision");
  }
  ```
- Verify: navigating `/` lands on `/vision`

**Task 4.2: Remove Hub tab from nav**
- Dependencies: 4.1
- In app/app/components/BottomNav.tsx, remove the Hub entry:
  ```typescript
  const tabs = [
    { href: "/vision", label: "Vision" },
    { href: "/plan/day", label: "Plan" },
    { href: "/health", label: "Health" },
    { href: "/resources", label: "Resources" },
  ] as const;
  ```
- Remove the special-case active check for `tab.href === "/"` (line 22)
- Verify: nav shows 4 tabs, Vision tab is active on /vision

### Phase 5: Cleanup + Doc Audit

**Task 5.1: Remove dead code**
- Dependencies: Phase 4 complete
- Verify no orphaned radar/ikigai/wheel component files exist
  (all chart code is inline in old vision/page.tsx — removed in Phase 2)
- Remove any unused Hub-specific component imports from old page.tsx
- Verify: `npm run build` passes, `git diff --stat` shows only declared files

**Task 5.2: Doc audit**
- Dependencies: Phase 4 complete
- Update docs/architecture.md: reflect merged Vision+Hub page
- Update docs/data-schemas.md: vision.json schema, vision_reviewed signal
- Update docs/app-intent.md: current route structure
- Aggressive pruning — remove stale sections, consolidate

**Task 5.3: Final verification**
- Dependencies: all above
- `cd app && npm run build` — zero errors
- `git diff --stat` — only declared files
- Navigate /vision — all sections render in correct order
- Navigate / — redirects to /vision
- Nav bar — 4 tabs, no Hub
- Review checkbox → signal in daily_signals.csv
- Habit grid → "V" column with 3-segment cells
- Anti-vision → collapsed, expands on click
- Input control / distractions / habit audit → collapsed, expand on click
- Briefing, plan card, experiments → render correctly
- Console — no errors

---

## New vision.json Schema Reference

```json
{
  "identityScript": {
    "coreTraits": "string — tone, attitude, conviction, drive",
    "nonNegotiables": "string — daily actions without exception",
    "languageRules": {
      "use": ["words/phrases I use"],
      "forbid": ["words/phrases I forbid"]
    },
    "physicalPresence": "string — posture, energy, movement",
    "socialFilter": "string — who I attract, who I reject",
    "decisionStyle": "string — how I act under pressure"
  },
  "antiVision": "string — old self behaviors I refuse to repeat",
  "domains": [
    {
      "id": "health",
      "label": "Health",
      "hex": "#10b981",
      "canonicalIds": ["health"],
      "actual": "string — where I am now (brutal, measurable)",
      "becoming": "string — vivid target state",
      "timeline": "string — specific deadline",
      "habits": ["string — daily actions that close the gap"]
    },
    {
      "id": "wealth",
      "label": "Wealth",
      "hex": "#f59e0b",
      "canonicalIds": ["career", "finances"],
      "actual": "...",
      "becoming": "...",
      "timeline": "...",
      "habits": ["..."]
    },
    {
      "id": "love",
      "label": "Love",
      "hex": "#ec4899",
      "canonicalIds": ["relationships"],
      "actual": "...",
      "becoming": "...",
      "timeline": "...",
      "habits": ["..."]
    },
    {
      "id": "self",
      "label": "Self",
      "hex": "#a855f7",
      "canonicalIds": ["personal_growth", "fun", "environment"],
      "actual": "...",
      "becoming": "...",
      "timeline": "...",
      "habits": ["..."]
    }
  ],
  "intentions": {
    "daily": "string — set each morning",
    "weekly": "string — set each week"
  },
  "ritualBlueprint": {
    "morning": {
      "steps": ["string"],
      "habitStacks": ["string"]
    },
    "midday": {
      "steps": ["string"],
      "habitStacks": ["string"]
    },
    "evening": {
      "steps": ["string"],
      "habitStacks": ["string"]
    }
  },
  "inputControl": {
    "mentors": ["string"],
    "books": ["string"],
    "podcasts": ["string"],
    "playlists": ["string — name + purpose"],
    "nutritionRules": ["string"],
    "purgeList": ["string — what to cut"]
  },
  "distractions": {
    "digital": ["string"],
    "physical": ["string"],
    "social": ["string"],
    "mental": ["string — loops/rumination patterns"],
    "triggerReplacements": [
      { "trigger": "string", "replacement": "string" }
    ]
  },
  "habitAudit": {
    "productive": ["string"],
    "neutral": ["string"],
    "destructive": ["string"]
  }
}
```

## Review Signal Format

```csv
date,signal,value,unit,context,source,capture_id,category
2026-03-18,vision_reviewed,1,,morning,app,,personal_growth
2026-03-18,vision_reviewed,1,,afternoon,app,,personal_growth
2026-03-18,vision_reviewed,1,,evening,app,,personal_growth
```

## Content Cadence (reference — not implemented in code)

| Section | Daily | Weekly | Monthly/Quarterly |
|---------|-------|--------|-------------------|
| Identity Script | READ aloud | — | REWRITE (monthly) |
| Anti-Vision | READ | — | REWRITE (monthly) |
| North Star A (Actual) | — | UPDATE w/ data | — |
| North Star B (Becoming) | — | — | REFINE (quarterly) |
| North Star T (Timeline) | — | — | RESET (quarterly) |
| North Star H (Habits) | — | ADJUST | EVOLVE (quarterly) |
| Ritual Blueprint | FOLLOW | — | EVOLVE (quarterly) |
| Intentions | SET (morning) | SET (weekly) | — |
| Input Control | — | AUDIT | — |
| Distractions | — | AUDIT | — |
| Habit Audit | — | CLASSIFY | EVOLVE (quarterly) |

## Page Layout (reference)

```
/vision — single page, merged Hub + Vision
┌─────────────────────────────────────────┐
│ IDENTITY SCRIPT (full — all 6 fields)   │
│ ├─ Core Traits                          │
│ ├─ Non-Negotiables                      │
│ ├─ Language: USE [chips] / FORBID [chips]│
│ ├─ Physical Presence                    │
│ ├─ Social Filter                        │
│ └─ Decision Style                       │
├─────────────────────────────────────────┤
│ NORTH STAR — 4 domains                  │
│ ┌─ Health ─────────────────────────┐    │
│ │ A: actual  B: becoming           │    │
│ │ T: timeline  H: habits           │    │
│ └──────────────────────────────────┘    │
│ [Wealth] [Love] [Self] — same pattern   │
├─────────────────────────────────────────┤
│ RITUAL: [Morning] [Midday] [Evening]    │
│ ┌─────────────────────────────────┐     │
│ │ This block's ritual steps       │     │
│ │ Habit stacks for this block     │     │
│ │ ☑ Review checkbox               │     │
│ └─────────────────────────────────┘     │
├─────────────────────────────────────────┤
│ BRIEFING                                │
├─────────────────────────────────────────┤
│ ▶ ANTI-VISION (collapsed)               │
├─────────────────────────────────────────┤
│ INTENTIONS                              │
│ This week: [text]  Today: [text]        │
├─────────────────────────────────────────┤
│ HABIT GRID (28 days)                    │
│ [includes 3-segment vision_reviewed]    │
├─────────────────────────────────────────┤
│ PLAN CARD                               │
├─────────────────────────────────────────┤
│ EXPERIMENTS                             │
├─────────────────────────────────────────┤
│ ▶ Input Control (collapsed)             │
│ ▶ Distractions (collapsed)              │
│ ▶ Habit Audit (collapsed)               │
└─────────────────────────────────────────┘
```
