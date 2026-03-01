# Architecture

## System Overview
Three-layer model:
1. Data layer: canonical CSV files at repo root
2. Intelligence layer: shared logic in `app/app/lib` + API routes in `app/app/api`
3. Surface layer: Next.js pages/components for execution

Core rule: UI surfaces consume read models and trigger actions; semantics are owned by shared logic.

## Canonical Data Layer
- `inbox.csv`: append-only raw capture audit
- `daily_signals.csv`: daily facts and habits
- `workouts.csv`: set-level training logs
- `reflections.csv`: win/lesson/change memory
- `plan.csv`: time blocks
- `todos.csv`: action backlog

## App Layer
`app/` contains the Next.js app.

Main routes:
- `/` Hub
- `/plan` Plan
- `/health` Health
- `/reflect` Reflect
- `/ideas` Ideas (voice idea pipeline status)

## Voice + Text Intake Pipeline
Both iOS shortcuts (voice and text) flow through one processor:
1. Shortcut creates GitHub issue (`Voice ...`)
2. `scripts/voice-inbox.sh` polls open issues
3. Claude prompt (`.claude/prompts/voice-inbox.md`) classifies/routes input
4. CSVs are updated
5. Commit + push, issue comment, issue close

## Idea Pipeline

```
Phone (voice/text — "idea: add dark mode")
  │
  ▼
voice-inbox.sh (detects idea keywords → inbox.csv with suggested_destination=idea)
  │
  ▼
idea-pipeline.sh (60s poll via launchd)
  │  finds: suggested_destination=idea + status=logged
  │  one idea per run
  │
  │  Phase 1: INVESTIGATE (read-only)
  │    Claude scans codebase, assesses 3 layers + runtime loop
  │    inbox status → investigating
  │
  │  Phase 2: IMPLEMENT
  │    branch: idea-{captureId}
  │    Claude codes, opens PR with structured notes
  │    inbox status → shipped, error field ← PR URL
  │    ntfy → "PR ready"
  │
  ▼
GitHub PR (sole human gate)
```

Plist: `~/Library/LaunchAgents/com.ash.idea-pipeline.plist` (60s interval)
Logs: `~/.local/log/idea-pipeline.log`

## API Surface (Current)
- `/api/hub`
- `/api/daily-signals`
- `/api/health`
- `/api/reflections`
- `/api/plan`
- `/api/plan/range`
- `/api/todos`
- `/api/ideas`

## Known Constraints
- CSV writes use atomic temp+rename but no cross-process file locks
- Shared writer lock (`/tmp/tracker-csv-writer.lock.d`) coordinates voice-inbox and idea-pipeline daemons
- Some historical labels are still normalized for backward compatibility
- Single-user local-first model (no auth boundary)
