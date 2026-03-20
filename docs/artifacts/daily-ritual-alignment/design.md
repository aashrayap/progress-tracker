# Design: Daily Ritual Alignment

## Summary
Align the tracker's core docs and surfaces to a repeatable morning/afternoon/evening interaction protocol grounded in two Daniel Abrada frameworks (Reinvention Formula + Reshaping Protocol). Rewrite life-playbook.md, update all core docs, then implement the three deferred features: checkin→vision.json writes, plan ritual reminder, and generative plan blocks.

## Pattern Decisions
| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | Domain model | 4 pillars (health/wealth/love/self) mapping to existing 7 canonical IDs | Keep 7 domains as primary |
| 2 | Vision page role | Primary morning ritual surface — start each day/week/month here | Separate ritual flow or checkin-first |
| 3 | Doc split | life-playbook.md = stable rules, vision.json = living content that iterates | Merge everything into vision.json (too bloated) or keep separate protocols (too scattered) |
| 4 | Decision rule | Rules → playbook, Current state/content → vision.json, System behavior → app-intent, Technical → architecture/data-schemas | Single source of truth for everything |

## Design Decisions
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | 4-pillar model | health=[health], wealth=[career,finances], love=[relationships], self=[personal_growth,fun,environment] | Locked |
| 2 | Vision page = morning ritual surface | Start each day/week/month on /vision for momentum | Locked |
| 3 | Playbook = rules, vision.json = content | Playbook rarely changes; vision.json iterates weekly/monthly/quarterly | Locked |
| 4 | Daily write scope | Signals only (vision_reviewed, habits). No vision.json writes. | Locked |
| 5 | Weekly write scope (Sunday) | Update A (actual) ×4 domains, adjust H (habits) ×4, set weekly intention | Locked |
| 6 | Monthly write scope (1st Sunday) | Rewrite identityScript + antiVision, update intentions, review inputControl + experiments | Locked |
| 7 | Quarterly write scope | Full ABT(H) rebuild (B+T), ritualBlueprint, habitAudit, inputControl overhaul | Locked |
| 8 | Surface interaction | Morning: /vision (read + direction). Midday: /plan (execute + midday ritual strip). Evening: /vision (review + reflect + prepare tomorrow). | Locked |
| 9 | Core docs audit | Rewrite life-playbook.md, update app-intent.md, audit architecture.md + data-schemas.md + CLAUDE.md | Locked |
| 10 | Deferred work unblock | Implement all 3: checkin→vision.json writes, plan ritual reminder, generative plan blocks | Locked |
| 11 | Scripts reference | Saved to docs/resources/daniel-abrada/ for future reference | Locked |

## Verification Strategy
- Build gate: `cd app && npm run build` must pass
- Core docs: cross-reference all docs for consistency (domain names, cadence rules, field references)
- Checkin→vision.json: manual test — run weekly checkin, verify vision.json fields updated
- Plan ritual strip: visual check — /plan/day shows ritual context from vision.json
- Generative blocks: manual test — morning skill suggests blocks aligned to ritual blueprint

## Structure Outline

### Phase 1: Rewrite life-playbook.md
- Replace 7-domain structure with 4-pillar model
- Add operating philosophy from Daniel Abrada scripts (compression, identity→action→habit, inputs shape identity, evening shapes tomorrow)
- Add cadence rules (daily/weekly/monthly/quarterly write scopes)
- Fill TBD protocols using vision.json content + scripts principles
- Add trigger protocol, depletion protocol, recharge menu
- Add write routing rules table
- Verify: playbook references vision.json for living content, not duplicating it

### Phase 2: Update app-intent.md
- Update surface reality table
- Add cadence contract section (what writes where when)
- Unblock deferred work table (mark items as in-progress)
- Update operating priorities to reference playbook's 4-pillar model
- Add surface interaction map (morning→midday→evening flow)
- Verify: no conflicts with architecture.md or data-schemas.md

### Phase 3: Audit + update architecture.md, data-schemas.md, CLAUDE.md
- architecture.md: add vision.json write paths, cadence-aware routing
- data-schemas.md: document vision.json write semantics (which fields, which cadence, which skill), document vision_reviewed signal
- CLAUDE.md: update domain taxonomy to show 4-pillar mapping, update skills table with cadence info
- Verify: all docs consistent on domain names, cadences, field references

### Phase 4: Implement checkin → vision.json writes
- Extend checkin skill to support weekly/monthly/quarterly modes with vision.json writes
- Weekly: update domains[].actual, domains[].habits, intentions.weekly
- Monthly: rewrite identityScript, antiVision, intentions
- Quarterly: full ABT(H) rebuild, ritualBlueprint, habitAudit, inputControl
- Create /api/vision POST endpoint for writing vision.json fields
- Verify: run each cadence mode, confirm vision.json updated correctly

### Phase 5: Plan ritual reminder strip
- Add ritual context strip to /plan/day view
- Read ritualBlueprint from vision.json via /api/vision
- Show morning/midday/evening steps based on current time of day
- Show habitStacks as contextual reminders
- Verify: visual check on /plan/day at different times of day

### Phase 6: Generative plan blocks
- Morning skill auto-suggests plan blocks from ritualBlueprint + ABT(H) habits
- Read vision.json domains[].habits + ritualBlueprint.morning.steps
- Generate suggested time blocks for plan.csv
- User confirms before writing
- Verify: suggested blocks align with ritual blueprint and domain habits
