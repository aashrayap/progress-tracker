Status: draft (interview in progress)

# Context-Aware Briefing Card — Feature Interview Context Dump

This file captures everything decided so far in the feature interview. Use it to continue the interview in a fresh session and then write the final spec.

## Current Phase

Feature Interview (Phase 1-2 of execution playbook). Audit complete, 5 batches of questions done. Remaining:
- Finish final questions (briefing generation mechanism, card layout)
- Lock all decisions (no TBDs survive)
- Write final spec file (all 10 template sections)
- Then: Execute (Phase 3) -> Verify (Phase 4) -> Record (Phase 5)

## Problem Statement

The hub's top card (check-in status) and quote are static and context-blind. On a relapse day, the user sees the same generic quote as on a 10-day streak. There's no AI-driven insight connecting recent signals to long-term vision. The user needs a unified "morning briefing" that reflects his actual state and tells him what matters today.

## What Exists Today

### Hub Page (`app/app/page.tsx`)
- Check-in card: shows daily/weekly/monthly status with "Run /checkin in Claude Code to start" (user wants this text removed)
- Quote: static rotation, `daysSinceEpoch % pool.length`, filtered by intention domain
- DailyInsight component: still in code (line 568) but user says it's dead — verify and remove
- Today Queue, Recovery card, Habit grid, 90-Day Reset, Reflections — these stay as-is

### Quote System
- `data/quotes.csv`: 9 James Allen quotes, domain-tagged (personal_growth, mental, addiction, career)
- `readQuotes()` in `lib/csv.ts` (lines 767-783)
- Quote selection in `/api/hub/route.ts` (lines 324-335): deterministic daily rotation by domain

### Insight System
- `lib/insight.ts`: computes streaks, weight, habits, patterns, structured insight (streak/warning/momentum)
- `DailyInsight` component (`components/DailyInsight.tsx`): renders streak, momentum, warning
- Pattern detection: streak patterns + recent danger (3-day relapse, zero positive habits)

### Vision Page (`app/vision/page.tsx`)
- Hardcoded: Wheel of Life (7 dimensions with satisfaction/alignment scores), Ikigai diagram, goals (week/month/year per dimension), core question
- Not connected to hub in any way
- Vision page redesign is a SEPARATE future feature — not in scope here

### Background Services (launchd daemons running locally)
- `com.ash.voice-inbox` — `scripts/voice-inbox.sh`, polls every 5s, processes GitHub issues -> classifies via `claude --print` -> writes CSVs -> commits -> ntfy push notification
- `com.ash.idea-pipeline` — `scripts/idea-pipeline.sh`, polls every 60s, picks up ideas from inbox.csv -> investigates + implements via `claude --print` -> opens PR
- Both use shared writer lock at `/tmp/tracker-csv-writer.lock.d`
- Both invoke `claude --print --permission-mode bypassPermissions` with system prompts from `.claude/prompts/`

### Key File Paths
- Hub page: `app/app/page.tsx`
- Hub API: `app/app/api/hub/route.ts`
- Insight engine: `app/app/lib/insight.ts`
- CSV utilities: `app/app/lib/csv.ts`
- Config: `app/app/lib/config.ts`
- DailyInsight component: `app/app/components/DailyInsight.tsx`
- Quotes data: `data/quotes.csv`
- Signals data: `data/daily_signals.csv`
- Reflections data: `data/reflections.csv`
- Plan data: `data/plan.csv`
- Todos data: `data/todos.csv`
- Voice inbox script: `scripts/voice-inbox.sh`
- Voice inbox prompt: `.claude/prompts/voice-inbox.md`
- Idea pipeline script: `scripts/idea-pipeline.sh`
- Idea pipeline prompt: `.claude/prompts/idea-pipeline.md`
- App intent: `docs/app-intent.md`
- Spec template: `docs/feature-spec-template.md`
- Execution playbook: `docs/execution-playbook.md`
- Architecture: `docs/architecture.md`

## Decisions Locked

| # | Decision | Detail |
|---|----------|--------|
| 1 | Unified briefing card | Check-in status + AI insight + quote merged into one top-of-hub card. Replaces current check-in card + standalone quote. |
| 2 | Remove "/checkin" instruction | No "Run /checkin in Claude Code to start" text on the card. |
| 3 | No yesterday habit recap in card | Daily habits grid is already visible below — no duplication needed. |
| 4 | AI insight is data-driven, not LLM-at-request-time | Insight computed from CSV data. No Claude API call at page load. |
| 5 | Pre-computed briefing via Claude Code subscription | A background process generates the briefing text using `claude --print`, writes to a file (e.g., `data/briefing.json`). Hub reads this file. Same pattern as voice-inbox and idea-pipeline. |
| 6 | State detection taxonomy | System auto-detects day type: `recovery`, `momentum`, `neutral`, `danger`, `explore`, `disruption`. No manual tagging. |
| 7 | State detected from signals + plan data | Relapses, streaks, habit trends from signals. Travel/schedule disruption from plan.csv. Recent signals weighted heavier than older ones. |
| 8 | Insight content style | Forward-looking reframe + concrete priorities. Example: "Yesterday broke a 5-day streak. Today the most important things are X, Y, Z for aligning with vision." Pattern-naming is good but emphasis on what to do today. |
| 9 | Quote matching by analysis, not tags | No state tags on quotes. The briefing generator analyzes current state and picks a quote that fits through reasoning over quote content + context. Quotes stay domain-tagged only. |
| 10 | DailyInsight component removed | Fold useful data (streaks, patterns, warnings) into new briefing card. Kill separate DailyInsight section. |
| 11 | Vision page is separate scope | Vision page redesign/connection is a future feature. This spec only builds the briefing card and generation pipeline. |
| 12 | Insight sources | Core docs (app-intent, life-playbook), daily_signals.csv, reflections.csv, plan.csv, todos.csv, quotes.csv. Recent signals weighted heavier. |

## Decisions Still TBD (resolve before writing spec)

| # | Question | Options discussed | Notes |
|---|----------|-------------------|-------|
| 1 | Briefing generation trigger | Option A: New launchd daemon (`briefing-pipeline.sh`, polls every 60s, regenerates if CSVs changed). Option B: Post-processing step added to existing `voice-inbox.sh` (regenerate after each voice capture). Option C: Hybrid — voice-inbox triggers it + standalone daemon as fallback. | User rejected manual options. Wants automatic. Explore leveraging existing voice-inbox daemon vs new daemon. |
| 2 | Briefing output format | `data/briefing.json` with structured fields (state, insight_text, quote, priorities) vs flat text file | JSON is more flexible for the hub to consume. |
| 3 | Card layout / visual contract | Not yet discussed. Need: what sections appear in what order, how state affects visual treatment (e.g., red border on danger days?), tabs for day/week/month or no tabs. | User mentioned possibly having day/week/month tabs but didn't commit. |
| 4 | Tabs (day/week/month) | User asked about this but deferred. Does the card switch content for weekly/monthly check-in views? Or is this just the daily briefing? | Likely daily-only for v1, weekly/monthly as future enhancement. Confirm. |
| 5 | Explore/disruption detection specifics | Auto-detect from plan.csv travel dates (Poland Apr 1 - May 15 already exists). What about non-travel disruptions? | User liked auto-detection from plan data. Non-travel disruption rules TBD. |
| 6 | Briefing prompt design | What context gets sent to `claude --print`? All CSVs? Last N days? Which core docs? | Need to define the context payload for the briefing generation prompt. |
| 7 | Staleness handling | What does the hub show if briefing.json is stale (e.g., daemon not running)? | Fallback to current rule-based insight? Show "last updated X ago"? |
| 8 | Async agent self-verification | How does the briefing pipeline verify its own output before writing? Can it validate schema, detect hallucinated data, or flag low-confidence briefings? What does a "failed generation" look like and how does the system recover? | Detailed patterns documented in `docs/specs/async-agent-verification-patterns.md`. Key approach: write to temp file → shell schema validation → agent self-check (verified flag) → atomic swap to briefing.json. Never overwrite good with bad. Launchd cycle = retry loop. |
| 9 | ntfy reliability concerns | Both existing pipelines silently swallow ntfy failures (`|| log "ntfy push failed"`). Should the briefing pipeline send notifications? If so, how to handle ntfy unreliability? | Options: no notifications (hub just reads file), retry with backoff, or use a different notification channel. User reports ntfy has been unreliable — investigate root cause before adding more ntfy dependencies. |

## State Detection Taxonomy

| State | Trigger | Tone |
|-------|---------|------|
| `recovery` | Relapse yesterday or streak broken | Reframe + what matters today |
| `momentum` | 3+ day clean streak, habits trending up | Protect the streak, build on it |
| `neutral` | Mixed signals, no strong pattern | Steady, pick one thing to own |
| `danger` | Multiple relapses in 3 days | Direct warning, one small win |
| `explore` | Travel upcoming, life transition, opportunity window | Maximize experience, stay grounded |
| `disruption` | Routine broken (travel, schedule change), habits at risk | Anchor habits, minimum viable discipline |

## Briefing Generation Architecture (proposed)

```
                  ┌─────────────────────────┐
                  │  launchd daemon (new)    │
                  │  briefing-pipeline.sh    │
                  │  polls every 60s         │
                  └────────┬────────────────┘
                           │
              CSV modified? (stat check)
                           │ yes
                           ▼
              ┌─────────────────────────┐
              │  claude --print          │
              │  + briefing prompt       │
              │  + CSV context payload   │
              │  + core docs context     │
              └────────┬────────────────┘
                       │
                       ▼
              ┌─────────────────────────┐
              │  data/briefing.json      │
              │  { state, insight,       │
              │    quote, priorities }   │
              └────────┬────────────────┘
                       │
              Hub reads on page load
                       │
                       ▼
              ┌─────────────────────────┐
              │  Briefing Card (top)     │
              │  AI insight + quote +    │
              │  check-in status         │
              └─────────────────────────┘
```

Alternative: hook into voice-inbox.sh as post-processing step instead of new daemon.

## Infrastructure Analysis (for deciding TBD #1)

### What's actually running

| Service | Plist | Script | Interval | Status |
|---------|-------|--------|----------|--------|
| `com.ash.voice-inbox` | `~/Library/LaunchAgents/com.ash.voice-inbox.plist` | `scripts/voice-inbox.sh` | 5s | Running, last processed #85 on Mar 6 |
| `com.ash.idea-pipeline` | `~/Library/LaunchAgents/com.ash.idea-pipeline.plist` | `scripts/idea-pipeline.sh` | 60s | Running but skipping (tracked changes on main) |

### Shared infrastructure pattern
- Both use `set -euo pipefail`, process lock files, shared CSV writer lock (`/tmp/tracker-csv-writer.lock.d`)
- Both call `claude --print --permission-mode bypassPermissions` with prompts from `.claude/prompts/`
- Both use `ntfy.sh/ash-9f2k7x3m` for push notifications
- Both do `git pull --rebase` at start, `git push` at end
- Idea-pipeline uses worktrees to avoid touching main's working tree

### ntfy observations
- Both scripts silently swallow ntfy failures: `|| log "ntfy push failed"`
- No ntfy errors appear in logs (grep returned empty) — either ntfy is working or failures are silent
- ntfy endpoint responds (HTTP 302 on GET — normal)
- Voice-inbox has schema validation for ntfy payload (type, title, body, tags) with fallback
- User reports ntfy has been unreliable — may be iOS-side delivery issues, not server-side
- Key question: is the issue with ntfy.sh service, iOS app, or notification payload?

### Option comparison for briefing trigger

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| **New launchd daemon** (`briefing-pipeline.sh`) | Decoupled, runs independently, same proven pattern | Third daemon competing for writer lock, another `claude --print` invocation consuming subscription | High — cleanest separation |
| **Post-process in voice-inbox.sh** | No new daemon, briefing refreshes when signals change | Couples briefing to voice captures only, makes voice-inbox slower, doesn't trigger on manual CSV edits or /checkin | Medium — misses non-voice triggers |
| **Post-process in BOTH pipelines** | Covers voice + idea triggers | Duplicated logic, still misses /checkin and manual edits | Low |
| **File-watcher in new daemon** (stat-based, no polling GitHub) | Lightweight, triggers on ANY CSV change (voice, /checkin, manual), no GitHub API calls | New daemon, but simpler than voice/idea pipelines | Highest — catches all triggers |

Recommendation: **New lightweight daemon** that only does stat checks on CSV files + `claude --print` for briefing generation. Simpler than voice-inbox (no GitHub polling, no issue processing). Just: "did any CSV change? → regenerate briefing."

## Resume Instructions

To continue this interview in a fresh session:

1. Read this file first
2. Read `docs/feature-spec-template.md` for spec structure
3. Read `docs/execution-playbook.md` for execution process
4. Resolve the TBD decisions above (7 items)
5. Lock all decisions
6. Write the final spec at `docs/specs/context-aware-briefing-card.md`
7. Then execute per playbook Phase 3

Key context the next session needs:
- The user does NOT want manual triggers — everything must be automatic
- The user does NOT want Claude API costs — use existing Claude Code subscription via `claude --print`
- Two daemons already run locally using this exact pattern (voice-inbox, idea-pipeline)
- Vision page connection is OUT OF SCOPE — future feature
- Quotes stay domain-tagged, no state tags — selection is by content analysis during briefing generation
- DailyInsight component appears in code but user says it's already removed from the surface — verify and clean up
- Async agent verification patterns documented in `docs/specs/async-agent-verification-patterns.md`
- ntfy has reliability concerns — briefing pipeline should NOT depend on ntfy for delivery; hub reads briefing.json directly
- Recommended trigger: new lightweight launchd daemon (stat-based CSV watcher, no GitHub polling), simplest of all three pipelines
- User prefers leveraging existing infrastructure pattern (launchd + claude --print + writer lock) over new approaches
