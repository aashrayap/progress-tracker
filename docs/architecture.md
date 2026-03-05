# Architecture

## System Overview

Four-layer model (see CLAUDE.md > System Vocabulary for full definitions):

| Layer | Name | Contains |
|-------|------|----------|
| L0 | Core Docs | `CLAUDE.md`, `docs/*.md` — defines the system |
| L1 | Core Data | `data/*.csv` — records evidence |
| L2 | Intelligence | `app/app/lib/` + `app/app/api/` — computes meaning |
| L3 | Surfaces | Next.js pages + components — renders for the user |

**Foundation** = L0 + L1. **Backend** = L0–L2. Each layer depends only downward.

Core rule: Surfaces consume read models and trigger actions; semantics are owned by Intelligence. Intelligence reads Foundation. Foundation is self-contained.

## Navigation Protocol
- Keep product information architecture flat: primary surfaces must be top-level routes.
- Do not add secondary route trees for core product areas (for example: `/health/...`, `/plan/...`, `/reflect/...`).
- If a surface needs additional depth, use in-page UI state (tabs, sidebars, modals, drawers) instead of new URL routes.
- When consolidating features, merge into an existing top-level route or replace with a new top-level route.

## Canonical Data Layer
- `data/inbox.csv`: append-only raw capture audit
- `data/daily_signals.csv`: daily facts and habits
- `data/workouts.csv`: set-level training logs
- `data/reflections.csv`: win/lesson/change memory
- `data/plan.csv`: time blocks
- `data/todos.csv`: action backlog

## App Layer
`app/` contains the Next.js app.

Current top-level routes:
- `/` Hub
- `/plan` Plan
- `/health` Health
- `/mind` Mind
- `/ideas` Ideas
- `/resources` Resources
- `/vision` Vision (optional standalone)

Consolidated redirects:
- `/reflect` → `/mind`
- `/quotes` → `/resources`

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
voice-inbox.sh (detects idea keywords → data/inbox.csv with suggested_destination=idea)
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
- `/api/mind`
- `/api/reflections`
- `/api/plan`
- `/api/plan/range`
- `/api/todos`
- `/api/ideas`
- `/api/groceries`
- `/api/resources`
- `/api/quotes`

## Known Constraints
- CSV writes use atomic temp+rename but no cross-process file locks
- Shared writer lock (`/tmp/tracker-csv-writer.lock.d`) coordinates voice-inbox and idea-pipeline daemons
- Some historical labels are still normalized for backward compatibility
- Single-user local-first model (no auth boundary)
