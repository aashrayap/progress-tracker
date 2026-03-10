Status: draft

# Feature: Context-Aware Briefing Card

## 1. Problem Statement

```
PROBLEM:
- What: The hub's top section (check-in status card + standalone quote) is static and context-blind.
       On a relapse day the user sees the same generic quote as on a 10-day streak.
       There is no AI-driven insight connecting recent signals to long-term vision.
- Why: The user needs a unified "morning briefing" that reflects actual state
       and tells him what matters today. A feedback loop lets the system improve over time.
- User-facing effect: Opening the hub shows a personalized briefing with detected state,
       AI-generated insight, today's priorities, a contextually matched quote,
       and a feedback mechanism.
```

## 2. Affected Files

```
SCOPE:

Files to create:
- scripts/briefing-pipeline.sh                          (launchd daemon script)
- .claude/prompts/briefing-pipeline.md                  (system prompt for briefing generation)
- ~/Library/LaunchAgents/com.ash.briefing-pipeline.plist (launchd plist)
- data/briefing.json                                    (pipeline output, hub reads this)
- data/briefing_feedback.csv                            (user feedback storage)
- app/app/components/BriefingCard.tsx                    (new unified card component)
- app/app/api/hub/briefing-feedback/route.ts            (POST endpoint for feedback)

Files to modify:
- app/app/page.tsx              (replace check-in card + quote with BriefingCard)
- app/app/api/hub/route.ts      (serve briefing.json data to frontend)
- app/app/lib/csv.ts            (add readBriefing(), readBriefingFeedback(), appendBriefingFeedback())

Files to delete:
- app/app/components/DailyInsight.tsx  (folded into BriefingCard)

Files that must NOT change:
- app/app/components/HabitGrid.tsx
- app/app/components/TodayQueue.tsx
- app/app/components/RecoveryCard.tsx
- app/app/components/NinetyDayReset.tsx
- app/vision/page.tsx
- data/daily_signals.csv (read-only for this feature)
- data/reflections.csv (read-only for this feature)
- data/plan.csv (read-only for this feature)
- data/todos.csv (read-only for this feature)
- data/quotes.csv (read-only for this feature)
- scripts/voice-inbox.sh
- scripts/idea-pipeline.sh
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page: / (hub)
- Viewport: 1280x800

What the user SHOULD see:
- BriefingCard as the FIRST card on the hub page
- State label (e.g., "MOMENTUM", "RECOVERY") with colored left accent bar:
    momentum=green, neutral=amber, danger=red, recovery=grey, explore=blue, disruption=blue
- AI insight paragraph (2-4 sentences, forward-looking, references real data)
- "Today:" section with 2-4 bullet priorities drawn from todos/plan
- Horizontal divider
- Quote block (italic, with attribution)
- Horizontal divider
- Feedback row: [checkmark button] [x button] [text input placeholder: "optional feedback..."]
- "Updated X ago" timestamp in subtle text
- All existing cards below (Today Queue, Recovery, Habits, 90-Day, Reflections) unchanged

What the user should NOT see:
- Old check-in status card ("Run /checkin in Claude Code to start")
- Standalone quote card (quote is now inside BriefingCard)
- DailyInsight component (deleted)
- Console errors
- Empty/broken state when briefing.json doesn't exist yet (show fallback)
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Build passes (zero errors, zero type errors)
- [ ] Hub loads with BriefingCard as first element, no console errors
- [ ] BriefingCard shows state label, insight, priorities, quote, feedback row
- [ ] State accent color matches the state value in briefing.json
- [ ] Feedback ✓/✗ sends POST to /api/hub/briefing-feedback, appends to briefing_feedback.csv
- [ ] briefing-pipeline.sh generates valid briefing.json when CSVs exist
- [ ] Pipeline skips generation when CSVs haven't changed (idempotency via input hash)
- [ ] Pipeline validates output before writing (temp file → validate → atomic swap)
- [ ] If briefing.json is missing or >24h stale, hub shows fallback from lib/insight.ts
- [ ] Old check-in card, standalone quote, and DailyInsight component are removed
- [ ] No files modified outside declared scope
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console check | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| BriefingCard not first | DOM inspection | Fix page.tsx ordering |
| Feedback POST fails | Network request check | Fix API route |
| briefing.json invalid | Shell validation in pipeline | Fix prompt or validation logic |
| Pipeline writes bad data | Schema check fails | Keep old briefing.json, log error |
| Stale fallback not shown | Set briefing.json date to yesterday, reload | Fix staleness check |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Regression on other cards | Screenshot comparison | Revert, find non-destructive approach |

## 6. Invariants

```
INVARIANTS:
- Today Queue, Recovery Card, Habit Grid, 90-Day Reset, Reflections must render identically
- Vision page must not be touched
- Existing CSV data files are read-only (no schema changes, no row modifications)
- voice-inbox.sh and idea-pipeline.sh must not be modified
- Shared writer lock pattern (/tmp/tracker-csv-writer.lock.d) must be used by new pipeline
- Layer boundaries: surfaces consume intelligence, intelligence reads foundation
- Quote selection happens in the briefing prompt (Claude reasons over content), not in code
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO:
- Does this file reference only the canonical vocabulary (state taxonomy, CSV schemas)?
- Did I preserve all existing content not explicitly marked for removal?
- Does my diff contain ONLY changes this spec asked for?
- Can I trace every change to a specific spec section?
- Does the new pipeline script follow the same patterns as voice-inbox.sh and idea-pipeline.sh?

## 8. Diff Contract

### scripts/briefing-pipeline.sh (CREATE)
- **WHAT**: New launchd daemon script for briefing generation
- **WHY**: Decision #1 (new lightweight daemon) and #5 (pre-computed via claude --print)
- **PATTERN**: Same as voice-inbox.sh — set -euo pipefail, lock files, writer lock, claude --print, cleanup trap
- **KEY DIFFERENCES FROM VOICE-INBOX**: No GitHub polling. No ntfy. Stat-based CSV change detection. Writes JSON not CSV. Validates before writing.
- **RISK**: Writer lock contention with voice-inbox/idea-pipeline

### .claude/prompts/briefing-pipeline.md (CREATE)
- **WHAT**: System prompt for the briefing generation claude --print call
- **WHY**: Decision #6 (briefing prompt payload), #8 (insight style), #9 (quote by analysis), #15 (feedback loop)
- **INCLUDES**: State taxonomy, tone guide per state, instruction to read CSVs, instruction to pick quote by reasoning, instruction to read recent feedback and adapt, output JSON schema, self-verification checklist
- **CONTEXT PAYLOAD**: Last 14 days daily_signals.csv, last 7 reflections, full plan.csv, full todos.csv, full quotes.csv, recent briefing_feedback.csv, app-intent.md and life-playbook.md summaries
- **RISK**: Prompt too large for context window — monitor token usage

### data/briefing.json (CREATE — by pipeline, not by hand)
- **WHAT**: Pipeline output consumed by hub
- **SCHEMA**:
```json
{
  "state": "momentum|recovery|neutral|danger|explore|disruption",
  "insight": "2-4 sentence AI-generated insight",
  "priorities": ["priority 1", "priority 2", "priority 3"],
  "quote": { "text": "...", "author": "..." },
  "generated_at": "ISO 8601",
  "input_hash": "md5 of CSV mtimes",
  "verified": true
}
```
- **RISK**: First run has no file — hub must handle missing state

### data/briefing_feedback.csv (CREATE)
- **WHAT**: User feedback on briefing quality
- **SCHEMA**: `date,state,rating,feedback_text,briefing_hash`
- **RISK**: None — append-only, read by pipeline

### app/app/components/BriefingCard.tsx (CREATE)
- **WHAT**: Unified briefing card replacing check-in + quote + DailyInsight
- **WHY**: Decision #1 (unified card), #13 (feedback UI)
- **SECTIONS**: State badge + accent → insight → priorities → quote → feedback row → timestamp
- **PRESERVES**: Check-in status info (daily/weekly/monthly) can be shown subtly if data exists
- **RISK**: Styling inconsistency with existing cards

### app/app/api/hub/briefing-feedback/route.ts (CREATE)
- **WHAT**: POST endpoint to receive feedback
- **WHY**: Decision #14 (feedback storage)
- **ACCEPTS**: `{ rating: "good"|"bad", text?: string }`
- **WRITES**: Appends to data/briefing_feedback.csv via csv.ts utility
- **RISK**: None — simple append

### app/app/page.tsx (MODIFY)
- **WHAT**: Replace check-in card + standalone quote with BriefingCard import
- **PRESERVES**: All other cards (Today Queue, Recovery, Habits, 90-Day, Reflections)
- **REMOVES**: Check-in status card JSX, standalone quote rendering, DailyInsight import + usage
- **RISK**: Breaking surrounding layout

### app/app/api/hub/route.ts (MODIFY)
- **WHAT**: Add briefing.json data to hub API response
- **PRESERVES**: All existing API response fields
- **REMOVES**: Old quote selection logic (deterministic rotation)
- **RISK**: Breaking existing consumers of this endpoint

### app/app/lib/csv.ts (MODIFY)
- **WHAT**: Add readBriefing(), readBriefingFeedback(), appendBriefingFeedback()
- **PRESERVES**: All existing functions
- **RISK**: None — additive only

### app/app/components/DailyInsight.tsx (DELETE)
- **WHAT**: Remove dead component
- **WHY**: Decision #10 — functionality folded into BriefingCard
- **RISK**: Verify no other imports reference it

## 9. Abort Conditions

- File content doesn't match expected state when first read (e.g., page.tsx structure changed)
- Change requires modifying a file in the "must NOT change" list
- Two spec items conflict
- briefing-pipeline.sh can't acquire writer lock pattern from voice-inbox.sh
- BriefingCard breaks layout of cards below it
- 3 consecutive fix cycles fail on the same issue
- claude --print invocation in pipeline exceeds context window with the specified payload

## 10. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat` — only declared files |
| Browser verification | Yes | Navigate to /, screenshot, console check |
| Feedback test | Yes | Click ✓/✗, verify CSV append |
| Pipeline test | Yes | Run `bash scripts/briefing-pipeline.sh` manually, verify briefing.json |
| Staleness test | Yes | Delete briefing.json, reload hub, verify fallback |
| Regression | Yes | Verify Today Queue, Recovery, Habits, 90-Day, Reflections unchanged |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Always | Summary with evidence |

---

## Implementation Order

1. **Data layer first** (zero UI risk)
   - Create data/briefing_feedback.csv (header only)
   - Add csv.ts functions (readBriefing, readBriefingFeedback, appendBriefingFeedback)

2. **Pipeline** (generates the data)
   - Create .claude/prompts/briefing-pipeline.md
   - Create scripts/briefing-pipeline.sh
   - Test manually: `bash scripts/briefing-pipeline.sh`
   - Verify data/briefing.json is valid

3. **API layer** (serves the data)
   - Modify api/hub/route.ts to include briefing data
   - Create api/hub/briefing-feedback/route.ts

4. **Surface layer** (consumes the data)
   - Create components/BriefingCard.tsx
   - Modify page.tsx: replace check-in + quote + DailyInsight with BriefingCard
   - Delete components/DailyInsight.tsx

5. **Infrastructure** (makes it automatic)
   - Create com.ash.briefing-pipeline.plist
   - Load with launchctl

6. **Verification**
   - Full Chrome verification protocol
   - All gates from section 10

---

## Locked Decisions (complete)

| # | Decision |
|---|----------|
| 1 | Unified briefing card replaces check-in + quote + DailyInsight |
| 2 | Remove "/checkin" instruction text |
| 3 | No yesterday habit recap (grid is below) |
| 4 | AI insight is data-driven, not LLM-at-request-time |
| 5 | Pre-computed via claude --print, writes data/briefing.json |
| 6 | State taxonomy: recovery, momentum, neutral, danger, explore, disruption |
| 7 | State detected by agent reasoning over CSV data (no hardcoded rules) |
| 8 | Insight style: forward-looking reframe + concrete priorities |
| 9 | Quote selected by agent reasoning over content, not by tags |
| 10 | DailyInsight component deleted |
| 11 | Vision page out of scope |
| 12 | Sources: signals, reflections, plan, todos, quotes, app-intent, life-playbook, feedback |
| 13 | Trigger: new lightweight launchd daemon, 60s, stat-based CSV watcher |
| 14 | Output: data/briefing.json with structured fields |
| 15 | Card layout: state badge + accent → insight → priorities → quote → feedback → timestamp |
| 16 | Daily-only for v1 (no week/month tabs) |
| 17 | Staleness: show "updated X ago", fallback to rule-based insight if >24h |
| 18 | Verification: temp file → shell schema validation → atomic swap |
| 19 | No ntfy dependency — hub reads file directly |
| 20 | Feedback: ✓/✗ + optional text → briefing_feedback.csv → pipeline reads for self-improvement |
| 21 | Agent self-verification: pipeline writes to temp file → shell schema validation (JSON parse, required fields, enum check) → agent self-check (verified: true/false flag with cross-reference checklist) → atomic swap. Never overwrite good with bad. Launchd cycle = retry loop. Patterns in docs/specs/async-agent-verification-patterns.md |

## References

- Interview notes: `docs/specs/context-aware-briefing-card-interview.md`
- Verification patterns: `docs/specs/async-agent-verification-patterns.md`
- Spec template: `docs/feature-spec-template.md`
- Execution playbook: `docs/execution-playbook.md`
