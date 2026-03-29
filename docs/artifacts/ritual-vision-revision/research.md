# Research: Ritual & Vision Revision

## Flagged Items
- Q5: Wim Hof is listed as non-negotiable in identityScript but has NO tracked signal in daily_signals.csv
- Q8/Q14: Midday ritual says "After lunch → walk first" but distractions.triggerReplacements has no matching post-lunch entry — out of sync
- Q7: Love and Self domains have empty timelines
- Q11: Medium confidence — identity scripting in vision.json uses prose format, Abrada recommends character-sheet + "I am" language format

## Findings

### Q1: ritualBlueprint structure in vision.json
- **Answer**: 3 phases: morning (8 steps), midday (7 steps), evening (7 steps). No "night" phase. Each phase has steps[] and habitStacks[] (2 items each).
- **Confidence**: high
- **Evidence**: data/vision.json lines 85-131

### Q2: How DayView renders ritual checklist
- **Answer**: Shows ONE phase at a time based on getRitualPhase() (morning <12, midday 12-17, evening 17+). Flat ordered list, no checkboxes, no completion tracking. Read-only.
- **Confidence**: high
- **Evidence**: app/app/components/DayView.tsx lines 10-15, 154-186

### Q3: Checkin skill ↔ ritual blueprint
- **Answer**: Fully independent. Checkin skill never reads ritualBlueprint. Ritual is display-only in DayView; checkin has its own fixed question set from habitMetrics.
- **Confidence**: high
- **Evidence**: .claude/skills/checkin/SKILL.md lines 92-170; DayView.tsx lines 89-103

### Q4: Protocol phases in data model
- **Answer**: Phases exist ONLY in vision.json ritualBlueprint (morning/midday/evening keys) and DayView's getRitualPhase(). No phase concept in CSVs — daily_signals has no phase column, plan.csv has timestamps but no phase label.
- **Confidence**: high

### Q5: Protocol-related signals in daily_signals.csv
- **Answer**: Only sleep, meditate, gym exist. NO signals for: wim_hof, cold_shower, journal, breathwork. habitMetrics array: sleep, meditate, gym, deep_work, ate_clean, weed, lol, poker, clarity, vision_reviewed.
- **Confidence**: high
- **Evidence**: app/app/lib/csv.ts line 438
- **Conflicts**: identityScript.nonNegotiables lists "Wim Hof every morning" but wim_hof is untracked

### Q6: Current identityScript and antiVision
- **Answer**: identityScript has 6 fields: coreTraits ("grounded, positive, present"), nonNegotiables, languageRules (use/forbid arrays), physicalPresence, socialFilter, decisionStyle. antiVision is one sentence: "Smokes weed. Skips gym for any emotion or timing excuse. Watches porn. Isolates. Reactive. Overweight. Hates himself."
- **Confidence**: high

### Q7: Current ABT(H) per domain
- Health: becoming="200 lbs athletic Olympic lifter build", timeline="December 2026"
- Wealth: becoming="100k/year premium value across AI/meditation/personal growth/addiction recovery", timeline="December 2027"
- Love: becoming="shared vision romantic + active local community", timeline="" (EMPTY)
- Self: becoming="calm, resilient, self-aware, 3 years clean", timeline="" (EMPTY)
- **Confidence**: high

### Q8: inputControl, distractions, habitAudit
- inputControl: 1 mentor (Daniel Abrada), 2 books, 4 nutrition rules, empty podcasts/playlists/purgeList
- distractions.digital: LoL, poker, Instagram, YouTube rabbit holes, porn. triggerReplacements: boredom→walk/cook, stress→breathwork/cold shower, urge to game→read/meditate
- habitAudit: productive=[gym,meditation,deep work,clean eating,sleep routine,journaling,wim hof], neutral=[cooking,walking Cooper,reading], destructive=[weed,LoL,poker,porn,late-night scrolling,skipping gym,isolating]
- **Confidence**: high
- **Conflicts**: Midday ritual has "After lunch → walk first" but no matching triggerReplacement for post-lunch

### Q9: Daniel Abrada frameworks
- 14 named sections: Inversion Thinking, 4-Pillar Model, ABT(H), Identity-First Change (Be→Do→Have), Systems Thinking, Dopamine & Nervous System, Consistency & Comeback, Compounding Choices, Focus & Elimination, Skill Stacking, Wealth Creation, 6 Freedoms, Purpose & Meaning, Mental Models
- Key techniques: identity character sheet (read daily), "never miss twice" comeback, dopamine detox, 90-min deep work blocks, leading vs lagging indicators, weekly reflection
- **Confidence**: high

### Q10: Specific protocol structures in Abrada
- **Answer**: NO specific morning/evening/night protocol structures. Only general principles: 90-min blocks, script identity daily, track focus hours not busy hours.
- **Confidence**: high

### Q11: Abrada identity scripting vs current vision.json
- **Answer**: Abrada recommends: detailed character sheet, read daily out loud with feeling, "I am" language not "I'm trying to be", every action = vote for new identity. Anti-vision: invert failure across 4 domains (financial ruin, physical decline, relational isolation, mental dullness), circle familiar patterns, write opposite behavior.
- **Confidence**: medium — structural comparison needs Q6 cross-reference
- Current vision.json identityScript uses prose description format, not character-sheet or "I am" framing

### Q12: Weekly cadence in checkin skill
- **Answer**: 7-phase sequential flow (Sundays, ~15 min). Writes to vision.json via PATCH: domains[].actual, domains[].habits, intentions.weekly. Only changed pillars patched.
- **Confidence**: high

### Q13: Weekly check-in menu
- **Answer**: No user-facing menu — locked sequential flow. Phases: Score Card (auto) → Mood & Triggers (auto) → Domain Spotlight (interactive) → Social Contact → Inbox Triage → Experiment Loop → Goals & Intention + Vision Update → Stale Review.
- **Confidence**: high

### Q14: YouTube-after-lunch in inputControl/distractions
- **Answer**: "YouTube rabbit holes" is in distractions.digital. No trigger replacement for post-lunch specifically — only "Boredom after work" → walk/cook. Midday ritual has "After lunch → walk first" habit stack but it's in ritualBlueprint, not distractions.
- **Confidence**: high
- **Conflicts**: ritualBlueprint and distractions are out of sync on post-lunch pattern

### Q15: Core docs on ritual/vision/cadence
- **Answer**: ritualBlueprint is morning|midday|evening with steps[] and habitStacks[]. Cadence contract: daily→CSVs only, weekly→actual+habits+intentions.weekly, monthly→identityScript+antiVision+intentions, quarterly→full PUT. Daily checkins NEVER write vision.json.
- **Confidence**: high

### Q21: Habit grid signal mapping
- **Answer**: MonthView computes habitScore = (true habits / total habits) from 10-signal habitMetrics array. Each signal is independent boolean. YearView only counts plan.csv events, doesn't use habits. Multi-part protocols are NOT represented as a unit. wim_hof, cold_shower, journal are not in habitMetrics so they contribute zero to grid scoring.
- **Confidence**: high
- **Conflicts**: YearView accepts habits prop but never uses it (dead prop)

## Patterns Found
- DayView shows ritual phase by time-of-day but no completion tracking — pure display
- Checkin skill and ritual blueprint are completely decoupled (no cross-reference)
- habitMetrics (10 signals) determines grid color, but only 3 overlap with protocol activities (sleep, meditate, gym)
- identityScript is written monthly/quarterly only — can go 3 months without revision
- Weekly writes limited to actual + habits + intentions.weekly — no way to update ritual/identity/distractions weekly

## Core Docs Summary
- vision.json is structured state store, read-only in UI, authored via skills or JSON edit
- Cadence contract is structural constraint, not convention
- Daily checkins never touch vision.json (locked decision 2026-03-23)
- vision_reviewed signal fires when user checks ritual review step

## Open Questions
- Whether vision_reviewed signal is actively written (appears in habitMetrics but no rows found in CSV)
- Whether empty timelines for love/self are intentional
- Whether habitStacks in ritualBlueprint link to domains[].habits or are independent
