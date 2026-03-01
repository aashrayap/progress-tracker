# Features

Current state of the app surfaces and known gaps.

## Surfaces

| Route | Surface | Primary Role |
|-------|---------|-------------|
| `/` | Hub | Daily command center: habits, next action, streaks, 90-day grid |
| `/plan` | Plan | Calendar planner (year/month/week/day) + todo sidebar + DnD scheduler |
| `/health` | Health | Workout tracker, weight trend, progression charts, weekly split |
| `/reflect` | Reflect | Reflection history, recurring lessons, action promotion to todos |

## What Works Well

- Single daily decision surface (Hub) with clear next action
- Time-block execution (Plan) with drag-to-schedule and completion signals
- Domain-specific health tracking with workout programming and progression
- Reflection loop with recurring lesson detection
- Voice capture pipeline (phone → GitHub Issue → auto-processed → CSV)
- Dense but legible mobile-first layouts

## Known Gaps

### Data Integrity
- No file locks for concurrent CSV writes
- Plan entries keyed by `date + item` text, not stable row IDs
- No idempotency guard on daily_signals POST (duplicate writes possible)
- Workout day labels have historical inconsistency (`A/B/C` vs `W1..W5`)

### UX Gaps
- No in-app reflection capture for end-of-day input
- Limited edit UX for plan rows and signal corrections
- Calendar scheduler lacks conflict/duplication guardrails

### Architecture Gaps
- No auth (single-user local model assumed)
- No schema enforcement beyond minimal route checks
- Voice routing logic partly outside web app boundary (in Claude CLI prompt)
- Streak logic based on logged rows, not strict day continuity

## Iteration Priorities

1. **Data integrity** — stable row IDs for plan, idempotency guards, file locking
2. **Capture quality** — improve voice routing confidence while preserving raw capture audit
3. **Cross-layer consistency** — normalize workout labels, standardize streak definitions
4. **UX loop closure** — end-of-day capture panel, inline signal corrections
