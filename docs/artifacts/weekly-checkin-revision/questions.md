# Research Questions: Weekly Check-in Revision

## Context from prior conversation

- Voice-inbox pipeline is stale and being killed (GitHub Issues, launchd, iOS Shortcuts, ntfy, inbox.csv)
- Briefing pipeline (60s polling) being absorbed into a persistent channel session or scheduled reports
- Report cadence system being designed: morning (activate), afternoon (recalibrate), evening (close), weekly (zoom out), quarterly (strategic)
- Weekly report vs weekly check-in are potentially separate things: report = generated read-only artifact, check-in = interactive flow
- Key insight: daily = signal-level (did I show up?), weekly = pattern-level (am I actually changing?)
- Jarvis/channel session planned as always-on personal assistant (iMessage channel replaces voice pipeline)

## Locked Decisions

- **D1**: Experiment Loop (Phase 5) is killed from weekly.
- **D2**: Auto-detection = default-suggest in menu. On Sundays, `/checkin` menu defaults to weekly (highlighted/suggested) but user still picks.

## Codebase Questions

1. How does the checkin SKILL.md currently detect cadence (daily vs weekly vs monthly)? Is it purely day-of-week + user choice, or does it check `checkin_weekly` signal history?

2. What does the `plan` agent's "week mode" (`3 week`) already do, and does it overlap with the weekly checkin's Phase 6c (Week Sketch)?

3. Does a `weekly-checkin` agent definition already exist in `.claude/agents/`, or is the weekly flow currently executed inline by the checkin skill?

4. What precompute data does `precompute-weekly.js` produce that is NOT already available from `precompute-checkin.js` or `compute-morning-report.js`? (i.e., what's unique to the weekly script?)

5. How does the `process` agent handle re-entry ("Anything else?") — does it return control to the parent, or does it loop internally until the user says "done"?

6. What CSV writes does the weekly checkin perform across all 7 phases? List each phase and the exact file + signal it writes.

7. Does `precompute-weekly.js` use a 7-day or 14-day lookback window? The previous conversation mentions wanting 14 days — is that already implemented?

8. How does the current Phase 6b (Vision Update) call the `/api/vision` endpoint — does it use `curl`, `fetch`, or the MCP GitHub tools? What's the PATCH payload shape?

9. What signals in `daily_signals.csv` are written by the weekly checkin that are NOT written by any other flow? (e.g., `weekly_goal`, `weekly_intention`, `checkin_weekly`, `social_contact`, `weekly_goal_result`)

10. Does `scripts/config.js` export `HABIT_LIST`, `ADDICTION_SIGNALS`, `DOMAINS`, and `LIFESTYLE_SIGNALS`? What are the exact values of `DOMAINS`?

## Core Docs Questions

11. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature — specifically cadence system, weekly check-in, vision.json writes, and subagent delegation?

## Pattern Questions

12. How do existing agents (plan, process, todo) receive context from the checkin skill — via prompt text, file paths, or precomputed JSON piped in?

13. What's the naming/file convention for agent definitions in `.claude/agents/`? Do they all use `model: sonnet`?

## Architecture Questions (from channel/report context)

14. Should the weekly CHECK-IN (interactive, writes CSV + vision.json) and the weekly REPORT (generated HTML artifact, read-only) be separate things? Or should the check-in produce the report as a side effect?

15. What compute from `compute-morning-report.js` is reusable at weekly scale? Specifically: brain state, lag state, cascade risk, streak computation — do these already support arbitrary date ranges or are they hardcoded to "last 7/14 days from today"?

16. Does `scripts/briefing-pipeline.sh` produce anything the weekly check-in needs (state detection, quote, insight), or is its output (`briefing.json`) fully consumed only by the morning report?

17. Side-by-side comparison: what is `precompute-checkin.js` (daily) computing vs `precompute-weekly.js`? Map the overlap, unique fields, and gaps to determine whether weekly needs its own script or can extend the daily one with a `--weekly` flag or separate sections.

18. What inbox.csv references exist across the codebase (SKILL.md, csv.ts, precompute scripts, router, API routes)? Full list for the kill sweep.

## Open Questions

19. Which weekly phases should be interactive (require user input) vs auto-generated (just display data)? The previous conversation proposed: Phases 1-2 auto, Phase 3-4 interactive, Phase 5 killed, Phases 6-7 interactive.

20. What's the right boundary between "weekly check-in" (interactive, user answers questions, writes data) and "weekly report" (generated, pattern-level, read-only)? Should the report generate BEFORE the check-in (so you review it, then act on it) or AFTER (as a summary artifact)?

21. If the channel/Jarvis session is the delivery mechanism, should the weekly check-in be triggerable via iMessage ("weekly checkin") or only via terminal `/checkin weekly`?
