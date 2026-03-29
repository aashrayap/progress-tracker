# Design: Ritual & Vision Revision

## Summary
Standardize morning/midday/evening protocols in ritual blueprint, revise identity script to per-pillar "I am" statements using Abrada frameworks, move habit grid to /plan/day with optimistic signal toggles, and align protocol completion with daily signals.

## Pattern Decisions
| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | Identity format | Per-pillar "I am" statements (object with health/wealth/love/self keys) | Single prose string |
| 2 | Anti-vision format | Per-pillar failure states (same object structure) | Single sentence |
| 3 | Protocol completion | Dedicated *_review signals (morning_review, midday_review, evening_review) | Single vision_reviewed signal |
| 4 | Wim Hof tracking | Two signals (wim_hof_am, wim_hof_pm) | Single wim_hof signal |
| 5 | Habit grid location | /plan/day (moved from /vision) | Keep on /vision only |
| 6 | Edit surface | Optimistic toggles on /plan/day only | Checkin-only writes |

## Design Decisions
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | Scope: all three | Content + UI + skill | Locked |
| 2 | Night protocol | OUT OF SCOPE | Locked |
| 3 | Morning protocol | 8 steps: wake no snooze → open /plan/day → brush teeth + warm water → Wim Hof 1 round → journal top priorities → review identity script → plan day or confirm drafts → start work | Locked |
| 4 | Midday protocol | 6 steps: finish morning work block → walk/gym → cold shower → short meditation outside → lunch → resume work | Locked |
| 5 | Evening protocol | 6 steps: finish work 5pm hard stop → walk Cooper → Wim Hof → deep work session (personal) → set tomorrow → wind down + lights out | Locked |
| 6 | Wim Hof: morning + evening | wim_hof_am, wim_hof_pm signals | Locked |
| 7 | Journal: top priorities | Morning step 5 | Locked |
| 8 | YouTube: soft input control | Awareness, not hard ban. Add trigger replacement for "after lunch" | Locked |
| 9 | Vision rewrite: revise not scratch | Keep structure, update content | Locked |
| 10 | coreTraits → per-pillar "I am" | {health,wealth,love,self} object replacing single string | Locked |
| 11 | antiVision → per-pillar failures | {health,wealth,love,self} object replacing single string | Locked |
| 12 | nonNegotiables: keep as-is | No changes | Locked |
| 13 | Other identityScript fields: keep | languageRules, physicalPresence, socialFilter, decisionStyle unchanged | Locked |
| 14 | habitMetrics: 10 → 14 | Add morning_review, midday_review, evening_review, wim_hof_am, wim_hof_pm. Remove vision_reviewed. | Locked |
| 15 | Remove cold_shower, journal signals | Implied by protocol completion | Locked |
| 16 | Keep clarity signal | User confirms useful | Locked |
| 17 | Signal semantics: avoid = positive | weed/lol/poker: 1=clean (didn't do it). Unlogged=grey. | Locked |
| 18 | Mark protocol complete: button | Optimistic UI on protocol header, writes *_review signal | Locked |
| 19 | Habit toggles on /plan/day | Optimistic, only edit surface alongside schedule done toggles | Locked |
| 20 | Habit grid → /plan/day | Moved from /vision, 90-day view | Locked |
| 21 | Remove ritual blueprint from /vision | Lives on /plan/day now | Locked |
| 22 | Remove today's plan from /vision | /plan/day owns daily planning | Locked |
| 23 | Protocol review signals separate | Visually separate from habit toggles in UI | Locked |
| 24 | Schema: coreTraits string → object | vision.json + DayView + Anchor | Locked |
| 25 | Schema: antiVision string → object | vision.json + DayView | Locked |
| 26 | Verification: build + chrome + toggle | 3 gates | Locked |
| 27 | Deterministic signal checks | Scripts, not LLM | Locked |
| 28 | Add YouTube trigger replacement | "After lunch" → walk/breathwork in distractions.triggerReplacements | Locked |

## Content: Identity Script (coreTraits)

```json
{
  "health": "I am a 200lb Olympic lifter who never skips training. I eat clean, sleep by 9:30, and treat my body like the foundation everything else is built on.",
  "wealth": "I am building a 100k/year business providing premium value across AI, meditation, personal growth, and addiction recovery. I ship daily. I do deep work, not busy work.",
  "love": "I am genuine, caring, and a leader in my relationships. I show up — present, honest, initiating. I put in effort and build real connections, not convenient ones.",
  "self": "I am 3 years clean, calm, curious, never stagnant. I protect my mind at all costs. I read, reflect, and sit in stillness. Morning priorities before anyone else's."
}
```

## Content: Anti-Vision

```json
{
  "health": "Skips gym on any excuse. Eats junk. Overweight. No discipline. Numbs with food instead of facing discomfort.",
  "wealth": "Coasts at the 9-5. Never ships. Consumes instead of creates. Wastes evenings on League and poker instead of building.",
  "love": "Isolates. Avoids hard conversations. Lets relationships decay. Too comfortable to initiate. Takes people for granted.",
  "self": "Smokes weed. Watches porn. Plays League all night. Gambles on poker apps. Reactive. Hates himself. Zero self-respect."
}
```

## Content: Ritual Blueprint

```json
{
  "morning": {
    "steps": [
      "Wake — no snooze",
      "Open /plan/day (blueprint)",
      "Brush teeth + warm water",
      "Wim Hof (1 round)",
      "Journal (top priorities)",
      "Review identity script",
      "Plan day (or confirm last night's drafts)",
      "Start work"
    ],
    "habitStacks": [
      "Open laptop → blueprint first, nothing else",
      "After warm water → Wim Hof immediately"
    ]
  },
  "midday": {
    "steps": [
      "Finish morning work block",
      "Walk / Gym",
      "Cold shower",
      "Short meditation (outside)",
      "Lunch",
      "Resume work"
    ],
    "habitStacks": [
      "After gym → cold shower immediately",
      "After meditation → eat, then resume"
    ]
  },
  "evening": {
    "steps": [
      "Finish work — 5pm hard stop",
      "Walk Cooper",
      "Wim Hof",
      "Deep work session (personal)",
      "Set tomorrow",
      "Wind down + lights out"
    ],
    "habitStacks": [
      "After Cooper → Wim Hof immediately",
      "After deep work → set tomorrow before anything else"
    ]
  }
}
```

## Content: New Trigger Replacement

Add to distractions.triggerReplacements:
```json
{ "trigger": "After lunch — YouTube pull", "replacement": "Walk first, or short meditation outside" }
```

## Verification Strategy
1. Build gate: npm run build must pass
2. Chrome visual verification: navigate /plan/day, check all sections render correctly
3. Habit toggle test: click a signal, verify optimistic update + API call succeeds
4. Scope check: only scoped files modified

## Structure Outline

### Phase 1: Data layer (vision.json + habitMetrics constant)
- Update vision.json: coreTraits → object, antiVision → object, ritualBlueprint → new content, add trigger replacement
- Update habitMetrics in csv.ts: remove vision_reviewed, add 5 new signals
- Update types.ts if needed for new identity/antiVision shape
- Verify: vision.json is valid JSON, habitMetrics has 14 entries

### Phase 2: API layer (daily-signals route for optimistic writes)
- Ensure POST /api/daily-signals can handle the new signal names
- No new API routes needed — existing daily-signals route handles writes
- Verify: curl test with new signal names

### Phase 3: UI — DayView rebuild
- Update identity rendering: per-pillar "I am" display
- Add protocol mark-complete button (optimistic, writes *_review signal)
- Add Today's Habits section with optimistic toggles
- Move habit grid from /vision to /plan/day
- Protocol review checkboxes visually separate from habit toggles
- Verify: Chrome — all sections render, toggles work

### Phase 4: UI — Vision page cleanup
- Remove ritual blueprint section
- Remove today's plan section
- Remove habit grid (moved to /plan/day)
- Verify: Chrome — /vision still renders, removed sections gone

### Phase 5: Skill + docs update
- Update checkin SKILL.md: new signal names, protocol references
- Update data-schemas.md: new habitMetrics, new vision.json shape
- Update life-playbook.md if protocol content referenced
- Verify: docs consistent with code changes
