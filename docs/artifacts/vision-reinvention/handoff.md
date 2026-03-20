# Vision Reinvention — Handoff Document

**Status:** Phase 3 (Design Discussion) — incomplete. Spec needs rewrite before execution.
**Date:** 2026-03-18
**Resume with:** `/feature-interview` — skip Phase 1-2 (research done), resume Phase 3 design finalization, then write spec (Phase 4), then execute.

## What This Feature Is

Rebuild the tracker into a single-page life execution system centered on the "Reinvention Formula" — a 5-pillar framework for identity-level transformation. The Vision page (`/vision`) becomes the primary surface, absorbing Hub content. Hub (`/`) is deprecated as a standalone route.

### The 5 Pillars (from transcript)

```
1. NORTH STAR — Define desired reality across 4 domains using ABT(H)
   A = Actual (where I am — brutal, measurable)
   B = Becoming (vivid target state)
   T = Timeline (specific deadline)
   H = Habits (daily actions that close the gap)
   Domains: Health, Wealth, Love, Self

2. NEW IDENTITY — Structured character sheet read daily
   6 fields: core traits, non-negotiables, language rules (use/forbid),
   physical presence, social filter, decision style
   + Anti-Vision: old self behaviors to refuse

3. INPUT CONTROL — Curate what enters your system
   Mentors, books, podcasts, playlists, nutrition rules, purge list

4. DISTRACTION REMOVAL — Audit and eliminate
   Digital, physical, social, mental + trigger→replacement protocols

5. HABIT INSTALLATION — Ritual blueprints + habit stacking
   Morning/midday/evening routines, habit classification
   (productive/neutral/destructive), quarterly evolution
```

## Locked Decisions

| # | Decision | Detail |
|---|----------|--------|
| 1 | 4-domain model | Health→health, Wealth→career+finances, Love→relationships, Self→personal_growth+fun+environment |
| 2 | Vision page only | 4-domain model for vision; rest of app keeps canonical 7 |
| 3 | Love sub-sections | One section, non-visible sub-sections (romantic/social stored but not separated visually) |
| 4 | ABT(H) replaces now/90d/3yr | Per domain: Actual, Becoming, Timeline, Habits[] |
| 5 | Kill visualizations | Remove radar/wheel of life and ikigai charts entirely |
| 6 | Identity script fields | All 6: core traits, non-negotiables, language rules, physical presence, social filter, decision style |
| 7 | Anti-vision placement | Collapsed, positioned under briefing card |
| 8 | NO edit modals | Page is purely read-only + review checkboxes. Content authored via JSON edit or future skill. |
| 9 | 3 review checkboxes | Morning, afternoon, evening → logs `vision_reviewed` signal to daily_signals.csv |
| 10 | 3-segment habit cell | Hub habit grid shows vision_reviewed as 3 vertical segments (no labels), each independently green/gray |
| 11 | Merged single page | Vision absorbs Hub content — one page at `/vision` |
| 12 | Route | Lives at `/vision`. Hub (`/`) route to be deprecated or redirect. |
| 13 | Daily ritual surface | Designed for daily morning read-through, not setup-once |
| 14 | Review frequency | Morning (identity + north star), afternoon (check-in), evening (reflection). 2-3x daily. |
| 15 | Ritual blueprint | Morning/midday/evening tabs (scoped to ritual section only, not whole page) |
| 16 | Weekly review sections | Input control, distractions, habit audit, experiments — all collapsed, periodic review |
| 17 | Experiments | Moves to periodic review cluster (not daily execution) |
| 18 | Anti-vision under briefing | Intentional contrast: briefing = what matters today, anti-vision = who I refuse to be |
| 19 | Build first, populate later | Ship with empty/placeholder fields, fill in content separately |
| 20 | Verification | Build/lint + Chrome visual verification |

## Page Layout (Final Draft)

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
│ HABIT GRID (28 days)                    │
│ [includes 3-segment vision_reviewed]    │
├─────────────────────────────────────────┤
│ PLAN CARD                               │
├─────────────────────────────────────────┤
│ ▶ Intentions (collapsed? TBD)           │
├─────────────────────────────────────────┤
│ ▶ Experiments (collapsed)               │
│ ▶ Input Control (collapsed)             │
│ ▶ Distractions (collapsed)              │
│ ▶ Habit Audit (collapsed)               │
└─────────────────────────────────────────┘
```

## Open Decisions (Resume Here)

| # | Question | Options | Notes |
|---|----------|---------|-------|
| 1 | **Intentions** | Keep near briefing / move to periodic cluster / kill | User said "not sure yet but might have value" |
| 2 | **Hub route (`/`)** | Redirect to /vision / keep as alias / remove entirely | Needs decision |
| 3 | **Checkin → vision.json writes** | Checkin skill modifies vision.json / surfaces prompts for manual edit / future scope | User likes generative approach but acknowledges complexity |
| 4 | **Plan ritual reminder** | Plan page shows ritual blueprint context / future scope | User sees plan as weekly + daily; wants generative plan suggestions from vision eventually |
| 5 | **Generative plan blocks** | Morning skill auto-suggests plan from ritual + ABT(H) / future scope | User said "I like this" but understands complexity — likely Phase 2 |
| 6 | **Nav bar** | Keep 5 tabs with Vision first / reduce tabs / rename | Need to decide if Hub tab stays, redirects, or is removed |
| 7 | **Data schema for ritual blueprint** | Extend vision.json / separate file | Not yet specified |
| 8 | **Data schema for input control, distractions, habit audit** | Extend vision.json / separate files | Not yet specified |

## System Architecture (Proposed)

```
┌─────────┐     defines      ┌─────────┐
│ VISION  │ ───────────────▶ │  PLAN   │
│ /vision │  ritual blueprint │  /plan  │
│         │  + ABT(H) habits  │         │
│         │                   │         │
│         │ ◀─────────────── │ shows   │
│         │  "today's ritual" │ ritual  │
│         │   context strip   │ reminder│
└────┬────┘                   └─────────┘
     │
     │ iterated by
     ▼
┌──────────┐
│ CHECKIN  │
│ (skill)   │
├──────────┤
│ Daily:   │ → reflections.csv + signals
│ Weekly:  │ → vision.json updates (ABT, habits, inputs, distractions)
│ Monthly: │ → identity script + anti-vision rewrites
└──────────┘
```

## Research Artifacts (Complete — Do Not Redo)

| File | Status |
|------|--------|
| `docs/artifacts/vision-reinvention/questions.md` | Complete |
| `docs/artifacts/vision-reinvention/research.md` | Complete |
| `docs/artifacts/vision-reinvention/design.md` | Outdated — needs rewrite with merged page decisions |

## Existing Spec (Outdated)

`docs/specs/vision-reinvention.md` — written before scope expanded. Needs full rewrite to reflect:
- Merged single page (Hub absorbed into Vision)
- No edit modals
- Ritual blueprint section with morning/midday/evening tabs
- Input control, distractions, habit audit sections
- 3-segment vision_reviewed cell
- Anti-vision under briefing
- Experiments moved to periodic cluster
- Hub route deprecation

## Key Codebase Context

| File | Role |
|------|------|
| `data/vision.json` | Current vision data — 8 domains, old schema. Will be rewritten. |
| `app/app/vision/page.tsx` | Current vision page — radar/ikigai/destinations. Full rewrite. |
| `app/app/page.tsx` | Current Hub page — briefing, habit grid, intentions, experiments, plan. Content moves to /vision. |
| `app/app/lib/types.ts` | VisionData/VisionDomain interfaces. Replace with new schema. |
| `app/app/lib/config.ts` | HABIT_CONFIG (9 habits). Add vision_reviewed. |
| `app/app/lib/csv.ts` | readVision, getHabitsForDate. Update both. Add writeVision. |
| `app/app/api/vision/route.ts` | GET only. Add PUT. |
| `app/app/api/hub/route.ts` | Hub API. Content moves to vision API or shared. |
| `app/app/components/BottomNav.tsx` | 5 tabs: Vision, Hub, Plan, Health, Resources. Hub tab needs decision. |

## Transcript Source

The Reinvention Formula framework comes from a video transcript. Full transcript was provided in the initial user message. Key concepts extracted and structured in the "5 Pillars" section above and in the earlier deconstruction in conversation.

## Next Steps

1. Resume `/feature-interview` at Phase 3 — resolve open decisions (8 items)
2. Finalize vision.json schema (including ritual blueprint, input control, distractions, habit audit)
3. Rewrite spec from scratch (old spec is outdated)
4. Execute in phases
