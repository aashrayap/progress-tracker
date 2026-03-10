# For Ash — Quick Reference

Your full toolkit at a glance. Skim this when you forget what's available.

## System Architecture

```
┌─ CAPTURE ─────────────────────────────────────────────┐
│ 📱 Voice/Text → GitHub Issue → voice-inbox.sh (5s)    │
│ 💬 Chat → /checkin, /log (utility)                      │
│ 💡 Ideas → inbox.csv → triaged during /checkin        │
└───────────────────────────────────────────────────────┘
         │
         ▼
┌─ DATA (L1) ──────────────────────────────────────────┐
│ daily_signals  workouts  reflections  todos  plan    │
│ inbox  groceries  resources  code-todos              │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌─ INTELLIGENCE (L2) ──────────────────────────────────┐
│ lib/csv.ts  lib/config.ts  lib/insight.ts  api/*     │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌─ SURFACES (L3) ──────────────────────────────────────┐
│ Vision │ Hub │ Plan │ Health │ Mind │ Resources       │
└──────────────────────────────────────────────────────┘
```

## Daily Rituals

| Command | When | What It Does |
|---------|------|-------------|
| `/checkin` | Morning + afternoon | State scan → backfill → feelings → reflection → plan |
| Voice note | At gym, on the go | Workouts, weight, habits, todos — routed automatically |

## Utilities (`/log`)

`/log` is a quick-fire utility, not a daily ritual. `/checkin` + voice cover 90% of logging.

| Command | When | What It Does |
|---------|------|-------------|
| `/log note "fix X" --file=lib/y.ts --line=42` | Mid-session | Code todo with file context (unique to /log) |
| `/log note "call dentist"` | Mid-session | Life todo |
| `/log weight 225` | Quick one-off | Faster than a full check-in |
| `/log relapse weed` | If needed | Reset streak, log context |

## Thinking Tools

| Command | Core Question |
|---------|--------------|
| `/consider:first-principles [topic]` | Is this actually true, or just assumed? |
| `/consider:inversion [topic]` | What would guarantee failure? |
| `/consider:pareto [topic]` | Which 20% drives 80% of results? |
| `/consider:via-negativa [topic]` | What should I remove? |

Use before decisions in feature interviews, weekly reviews, or when stuck.

## Building Features

```
/feature-interview [topic]
    │
    Audit → Interview → Lock TBDs → Write Spec → Execute (subagents) → Verify → Ship
```

- Spec lands in `docs/specs/`
- Subagents get fresh context + spec as sole source of truth
- Verification: /remove-slop → /audit → diff → build → Chrome

## Codebase Maintenance

| Command | What It Does |
|---------|-------------|
| `/audit` | Health scan — dead files, stale docs, orphaned code |
| `/remove-slop` | Strip AI patterns from current diff |

## Review & Planning

| Command | When | What It Does |
|---------|------|-------------|
| `/review-notes [day/week/month]` | Anytime | Cross-CSV activity summary |
| `/weekly-review` | Sundays | Patterns + priorities + accountability |
| `/checkin weekly` | Sundays | Coach recap + stale todo review |
| `/checkin monthly` | Last Sunday | Trajectory + protocol changes |

## Session Management

| Command | When | What It Does |
|---------|------|-------------|
| `/whats-next` | Before ending a session | Write handoff doc (what worked, what failed, what's next) |
| `@whats-next.md` | Starting a session | Feed last handoff into context |

## Git & Shipping

| Command | What It Does |
|---------|-------------|
| `/ship` | Stage + commit + push |
| `/commit` | Just commit |
| `/commit-push-pr` | Commit + push + open PR |
| `/prep-pr` | Generate commit msg + PR summary |
| `/clean-gone` | Delete local branches removed from remote |

## Other Tools

| Command | What It Does |
|---------|-------------|
| `/understand-codebase` | Visual-first codebase walkthrough |
| `/understand-paper [topic]` | Step-by-step paper breakdown |
| `/codex [prompt]` | Launch Codex CLI in new tab |
| `/docs [topic]` | Search Claude Code documentation |
| `/code-review` | Review a PR with parallel agents |

## Background Daemons

| Service | Interval | What It Does |
|---------|----------|-------------|
| `com.ash.voice-inbox` | 5s | GitHub Issues → classify → CSVs → commit |

## Key Docs

| Doc | Read When |
|-----|-----------|
| `CLAUDE.md` | System rules, layer model, guardrails |
| `docs/app-intent.md` | Product direction, health metrics, decisions |
| `docs/architecture.md` | Data flow, routes, pipelines |
| `docs/data-schemas.md` | CSV headers and write rules |
| `docs/life-playbook.md` | Domain protocols, operating priorities |
| `docs/execution-playbook.md` | Feature execution methodology |
| `docs/feature-spec-template.md` | Spec skeleton (10 sections) |

## Decision Hierarchy

When trade-offs arise:
1. Correctness > speed
2. Simplicity > completeness
3. Working software > docs
4. Explicit constraints > assumptions
5. User-verifiable > agent self-report
