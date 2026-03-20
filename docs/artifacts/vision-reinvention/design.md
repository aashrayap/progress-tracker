# Design: Vision Reinvention

## Summary
Merge Hub + Vision into a single daily execution surface at `/vision` based on the Reinvention Formula (5-pillar framework). The page becomes the primary entry point — identity script, north star goals (ABT(H) across 4 domains), ritual blueprints, briefing, habit grid, intentions, and periodic review sections (input control, distractions, habit audit). Hub route redirects to `/vision`. Page is read-only ritual surface — content authored via JSON edit or future skills.

## Source Framework
The Reinvention Formula (from video transcript) defines 5 pillars:
1. **North Star** — Define desired reality across 4 domains using ABT(H): Actual/Becoming/Timeline/Habits. Domains: Health, Wealth, Love, Self.
2. **New Identity** — Structured character sheet (6 fields) read daily + anti-vision (old self behaviors to refuse)
3. **Input Control** — Curate mentors, books, podcasts, playlists, nutrition rules; purge list
4. **Distraction Removal** — Audit digital/physical/social/mental drains + trigger→replacement protocols
5. **Habit Installation** — Ritual blueprints (morning/midday/evening), habit stacking, classification (productive/neutral/destructive), quarterly evolution

## Pattern Decisions
| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | Domain model | 4 domains for vision only; canonical 7 stays everywhere else | Full migration to 4 domains app-wide |
| 2 | Data format | Extend vision.json with new schema | New CSV; separate markdown file |
| 3 | Editing | NO edit modals — page is read-only. Content via JSON edit or future skill | Inline editing; guided modals |
| 4 | Visualizations | Kill radar/wheel and ikigai | Keep as secondary tab |
| 5 | Goal structure | ABT(H): Actual/Becoming/Timeline/Habits | Keep now/90d/3yr |
| 6 | Review tracking | 3 checkboxes (morning/afternoon/evening) → daily_signals | Single button; no tracking |
| 7 | Page merge | Single page absorbs Hub content | Keep Hub and Vision separate |

## Design Decisions
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | 4-domain model | Health, Wealth, Love, Self — vision page only | Locked |
| 2 | Domain mapping | Health→health, Wealth→career+finances, Love→relationships, Self→personal_growth+fun+environment | Locked |
| 3 | Love sub-sections | One section, non-visible sub-sections (romantic/social stored but not visually separated) | Locked |
| 4 | ABT(H) replaces now/90d/3yr | Per domain: Actual, Becoming, Timeline, Habits[] | Locked |
| 5 | Kill visualizations | Remove radar/wheel of life and ikigai charts entirely | Locked |
| 6 | Identity script fields | All 6: core traits, non-negotiables, language rules, physical presence, social filter, decision style | Locked |
| 7 | Anti-vision placement | Collapsed, positioned under briefing card | Locked |
| 8 | NO edit modals | Page is purely read-only + review checkboxes. Content authored via JSON edit or future skill | Locked |
| 9 | 3 review checkboxes | Morning, afternoon, evening → logs `vision_reviewed` signal to daily_signals.csv | Locked |
| 10 | 3-segment habit cell | Hub habit grid shows vision_reviewed as 3 vertical segments (no labels), each independently green/gray | Locked |
| 11 | Merged single page | Vision absorbs Hub content — one page at `/vision` | Locked |
| 12 | Route | Lives at `/vision`. Hub (`/`) → 302 redirect to `/vision` | Locked |
| 13 | Daily ritual surface | Designed for daily morning read-through, not setup-once | Locked |
| 14 | Review frequency | Morning (identity + north star), afternoon (check-in), evening (reflection). 2-3x daily | Locked |
| 15 | Ritual blueprint | Morning/midday/evening tabs (scoped to ritual section only, not whole page) | Locked |
| 16 | Weekly review sections | Input control, distractions, habit audit — all collapsed, periodic review | Locked |
| 17 | Experiments | Stays on merged page (from Hub) | Locked |
| 18 | Anti-vision under briefing | Intentional contrast: briefing = what matters today, anti-vision = who I refuse to be | Locked |
| 19 | Build first, populate later | Ship with empty/placeholder fields, fill in content separately | Locked |
| 20 | Verification | Build/lint + Chrome visual verification | Locked |
| 21 | Keep intentions | Daily + weekly, displayed on vision page, prompted by ritual | Locked |
| 22 | Weekly cadence | Update A + adjust H + set intention + audit inputs/distractions | Locked |
| 23 | Monthly cadence | Rewrite identity script + anti-vision | Locked |
| 24 | Quarterly cadence | Evolve B, T, habits, ritual blueprint | Locked |
| 25 | Hub route | `/` → 302 redirect to `/vision` | Locked |
| 26 | Nav bar | Remove Hub tab. 4 tabs: Vision, Plan, Health, Resources | Locked |
| 27 | Doc audit on ship | Phase 7 includes aggressive doc pruning — reduce noise, kill stale sections, consolidate | Locked |
| 28 | Checkin → vision.json | Future scope — not this build | Locked |
| 29 | Plan ritual reminder | Future scope — not this build | Locked |
| 30 | Generative plan blocks | Future scope — not this build | Locked |
| 31 | Ritual blueprint schema | morning/midday/evening with steps + habitStacks in vision.json | Locked |
| 32 | Input/distractions/habit audit schema | All in vision.json, collapsed sections on page | Locked |

## Content Cadence

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

## Data Schema (new vision.json)

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

## Page Layout (merged Vision + Hub)

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

## Signal Integration

Review checkboxes log to daily_signals.csv:
```
date,signal,value,unit,context,source,capture_id,category
2026-03-18,vision_reviewed,1,,morning,app,,personal_growth
2026-03-18,vision_reviewed,1,,afternoon,app,,personal_growth
2026-03-18,vision_reviewed,1,,evening,app,,personal_growth
```

## Verification Strategy
- Build/lint gate: `npm run build` must pass
- Chrome visual verification: navigate /vision, check layout matches spec, console clean
- Scope check: only vision-related files modified
- Doc audit: aggressive pruning of stale core docs during ship phase

## Structure Outline

### Phase 1: Data layer (tracer bullet)
- Rewrite vision.json to new schema (empty/placeholder content)
- Update VisionData types in types.ts to match new schema
- Update readVision in csv.ts
- Add PUT handler to /api/vision/route.ts
- Verify: API returns new schema, PUT writes correctly

### Phase 2: Read-only vision page (new content)
- Rewrite /vision/page.tsx: identity script, north star ABT(H) cards, ritual blueprint tabs, anti-vision (collapsed), intentions, input control / distractions / habit audit (collapsed)
- Remove radar/wheel/ikigai components
- Add review checkboxes (morning/afternoon/evening) with POST to daily_signals
- Verify: page renders all new sections

### Phase 3: Hub content migration
- Move briefing card, habit grid, plan card, experiments to /vision/page.tsx
- Add vision_reviewed to habit tracker config (3-segment cell)
- Update /api/hub or create shared data endpoint
- Verify: all Hub content renders on /vision

### Phase 4: Route + nav cleanup
- `/` page.tsx → 302 redirect to `/vision`
- Remove Hub tab from BottomNav (4 tabs: Vision, Plan, Health, Resources)
- Verify: `/` redirects, nav shows 4 tabs

### Phase 5: Cleanup + doc audit
- Remove dead radar/ikigai/wheel components
- Remove unused Hub-only code
- Aggressive doc pruning: architecture.md, data-schemas.md, app-intent.md
- Build passes, no dead code
