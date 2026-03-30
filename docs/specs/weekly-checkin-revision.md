Status: in-progress

# Feature Spec: Weekly Check-in Revision

## 1. Problem Statement

```
PROBLEM:
- What: The weekly check-in runs entirely inline inside checkin SKILL.md
  (~300 lines, 9 phases), with zero agent delegation. Phase 4.5 (inbox
  triage) and Phase 5 (experiments) are included but should be killed.
  Phase 6c (week sketch) duplicates the plan agent's week mode verbatim.
  There is no pre-read report — the user enters the interactive flow with
  no quantitative context in hand.

- Why: The monolithic inline approach causes context-window bloat, makes
  phases non-testable in isolation, includes dead phases (experiments,
  inbox) that create friction, and skips the Abrada weekly practices
  (Feedback Loop Audit, B×A×D Check, Inversion Quick-Scan) that make
  the review actionable.

- User-facing effect: After this change the user gets:
  1. A self-contained weekly report HTML artifact to read before the
     interactive check-in (same slot as morning report on Sundays).
  2. A focused reflect agent covering 5 phases: domain reflection,
     feedback loop, B×A×D, inversion scan, social contact.
  3. A focused vision agent covering goal review, new goals, intention,
     and ABT(H) update.
  4. Week sketch delegated to the existing plan agent (no duplicate code).
  5. Inbox triage and experiment loop removed entirely from weekly.
  6. checkin SKILL.md weekly section reduced to ~30-line thin orchestrator.
```

## 2. Scope

```
SCOPE:

Files to modify:
  - scripts/precompute-weekly.js          (add --html flag + new HTML output)
  - .claude/skills/checkin/SKILL.md       (replace ~300-line weekly section)

Files to create:
  - .claude/agents/weekly-reflect.md
  - .claude/agents/weekly-vision.md

Files that must NOT change:
  - scripts/precompute-checkin.js         (daily only — no weekly concerns)
  - scripts/csv-utils.js                  (shared utility — no new logic here)
  - scripts/precompute-plan.js            (plan agent's script — unchanged)
  - .claude/agents/plan.md                (existing, delegated to as-is)
  - .claude/agents/process.md
  - app/app/lib/csv.ts
  - app/app/api/vision/route.ts
  - data/*.csv                            (CSVs are written at runtime, not edited)
  - data/vision.json                      (written at runtime, not edited)
  - All other files not in scope above
```

Phase 5 (Kill inbox references) from the design doc is explicitly OUT OF SCOPE
for this spec. It is a separate cleanup task.

## 3. Visual Contract

This feature has no app UI changes. The "visual contract" is the user-facing
terminal flow for `/checkin weekly`.

### 3a. Weekly Report (generated artifact)

```
WHAT USER SEES BEFORE INTERACTIVE CHECK-IN:
  A file written to: data/artifacts/weekly-report-YYYY-MM-DD.html
  The checkin SKILL prints:
    "Weekly report written: data/artifacts/weekly-report-2026-03-30.html
     Open it, read it, then type 'continue'."
  User types "continue" to proceed.

HTML ARTIFACT CONTAINS (sections in order):
  1. Header: "Week of Mon Mar 24 – Sun Mar 30" with run timestamp
  2. Score Card: week-over-week bar charts per habit (this week vs last week)
     — rendered from display.score_card text already produced by the script
  3. Trajectory Deltas: per-signal arrow (↑ ↗ → ↘ ↓) with raw counts
  4. Streak Momentum: growing vs fragile streaks with current lengths
  5. Comeback Speed: days-to-return after each miss (per habit)
  6. Domain Balance: signal coverage % per pillar (Health/Wealth/Love/Self)
  7. Identity-Action Gap: vision.json habit list vs actual completion rate
  8. Plan Accuracy: planned blocks vs completed %, overplanning flag if >60%
  9. Reflection Coverage: which domains have reflections this week (green/red)
  Styling: clean sans-serif, dark background (#1a1a1a), white text,
           consistent with data/artifacts/morning-report-*.html style.
```

### 3b. Interactive Flow (terminal)

```
STEP 1 (orchestrator): Report generated, user reads, types "continue".

STEP 2 (weekly-reflect agent):
  Shows domain spotlight card (2-3 domains, data-selected).
  Phases in sequence: Domain Reflection → Feedback Loop Audit →
  B×A×D Check → Inversion Quick-Scan → Social Contact.
  Writes reflections.csv and daily_signals.csv (social_contact).
  Returns "done" to orchestrator.

STEP 3 (weekly-vision agent):
  Reviews last week's goals, sets new goals (1-3), sets intention.
  Updates vision.json (PATCH) per pillar.
  Writes daily_signals.csv (weekly_goal_result, weekly_goal, weekly_intention).
  Returns "done" to orchestrator.

STEP 4 (plan agent, week mode):
  Existing plan agent, invoked with "3 week" context.
  Shows weekly goals, accepts natural language, writes plan.csv.

STEP 5 (orchestrator close):
  Writes checkin_weekly=1 to daily_signals.csv.
  Prints: "Weekly check-in complete."
```

### What user should NOT see:
- Inbox triage prompts
- Experiment loop prompts
- Phase 6c inline week sketch (now delegated to plan agent)
- Any duplication between weekly-reflect and weekly-vision questions
- No console errors when running `node scripts/precompute-weekly.js --html`
```

## 4. Success Criteria

```
SUCCESS:
- [ ] `node scripts/precompute-weekly.js --html` produces a valid HTML file
      at data/artifacts/weekly-report-YYYY-MM-DD.html
- [ ] `node scripts/precompute-weekly.js` (no flag) still outputs JSON to
      stdout — no regression to existing behavior
- [ ] weekly-reflect.md agent file exists with correct YAML frontmatter
      (name, description, tools, model: sonnet)
- [ ] weekly-vision.md agent file exists with correct YAML frontmatter
      (name, description, tools, model: sonnet)
- [ ] checkin SKILL.md weekly section is ≤ 50 lines (excluding comments)
      and contains no inline Phase 3-6c logic
- [ ] `/checkin weekly` flow produces all 5 required CSV writes:
      reflections.csv rows, social_contact signal, weekly_goal_result
      signal(s), weekly_goal signal(s), weekly_intention signal,
      checkin_weekly=1 signal
- [ ] vision.json is PATCHed via /api/vision by weekly-vision agent
- [ ] Daily check-in flow (`/checkin daily`) is unaffected — no regression
- [ ] `cd app && npm run build` passes with zero errors after all changes
- [ ] No files modified outside declared scope
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build error | `cd app && npm run build` output | Fix TypeScript/import error, rebuild |
| HTML not produced | `ls data/artifacts/weekly-report-*.html` returns nothing | Debug --html flag parsing in precompute-weekly.js |
| JSON regression | `node scripts/precompute-weekly.js 2>/dev/null \| jq .display` fails | --html flag must be off by default; check argv parsing |
| Missing CSV write | Grep daily_signals.csv for expected signal after test run | Re-read agent write instructions, fix missing append |
| vision.json not updated | GET /api/vision, check domains[].actual unchanged | Fix PATCH call in weekly-vision agent |
| Wrong agent model | Grep agent frontmatter for `model:` | Change to `model: sonnet` |
| Inline phases remain | Grep checkin SKILL.md for "Phase 4.5" or "Experiment Loop" | Remove; those phases are killed |
| Phase 6c duplicate | Grep checkin SKILL.md for "Week Sketch" inline logic | Replace with delegation call to plan agent |
| Scope violation | `git diff --name-only` lists file outside declared scope | Revert unintended changes |
| Daily regression | Run `/checkin daily` flow, verify card1+card2 show correctly | checkin SKILL.md daily section must be untouched |

## 6. Invariants

```
INVARIANTS:
- daily_signals.csv schema must not change
  (date,signal,value,unit,context,source,capture_id,category)
- reflections.csv schema must not change
  (date,domain,win,lesson,change,archived)
- plan.csv schema must not change
  (date,start,end,item,done,notes,domain)
- vision.json write semantics must not change: weekly = PATCH,
  quarterly = PUT. Never PUT from weekly flow.
- precompute-weekly.js JSON stdout contract must be preserved:
  { display: { score_card }, digest: { mood_arc, triggers,
    habit_by_domain, domain_spotlight_candidates, goals_last_week,
    stale_todos, briefing_feedback } }
- Weekly signals written (weekly_goal, weekly_intention, social_contact,
  checkin_weekly) must use the same field names and categories as today
- Daily check-in flow in checkin SKILL.md must not be modified
- plan agent (plan.md) must not be modified — used as-is
- The 7 canonical domain IDs must be used in all new agent files
  (health, career, relationships, finances, fun, personal_growth, environment)
- Agent frontmatter must use model: sonnet (not haiku)
- Agents self-fetch their own data — checkin orchestrator does NOT pipe JSON
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO before proceeding to the next:

### precompute-weekly.js
- [ ] Does `node scripts/precompute-weekly.js` (no args) still output JSON to stdout?
- [ ] Does `node scripts/precompute-weekly.js --html` write an HTML file to data/artifacts/?
- [ ] Does the HTML file include all 9 required sections (see §3a)?
- [ ] Is the HTML self-contained (no external CDN dependencies)?
- [ ] Did I preserve all existing JSON output fields unchanged?
- [ ] Did I add ONLY the `--html` code path, with no changes to existing logic?

### .claude/agents/weekly-reflect.md
- [ ] Does the YAML frontmatter include name, description, tools, model: sonnet?
- [ ] Does the agent self-fetch data (runs `node scripts/precompute-weekly.js`, reads vision.json)?
- [ ] Does the agent cover all 5 phases: domain reflection, feedback loop, B×A×D, inversion, social?
- [ ] Are write targets correct: reflections.csv + daily_signals.csv only?
- [ ] Does it write social_contact with date = Sunday (week-end date)?
- [ ] Are write formats consistent with the canonical CSV schemas?
- [ ] Does the agent end with a clear return signal to the orchestrator?

### .claude/agents/weekly-vision.md
- [ ] Does the YAML frontmatter include name, description, tools, model: sonnet?
- [ ] Does the agent self-fetch data (runs `node scripts/precompute-weekly.js`, reads vision.json via GET /api/vision)?
- [ ] Does the agent cover all 4 phases: review goals, set goals, set intention, ABT(H) update?
- [ ] Are write targets correct: daily_signals.csv (goal_result, goal, intention) + vision.json (PATCH)?
- [ ] Does the PATCH payload include only `domains` (changed pillars) + `intentions.weekly`?
- [ ] Are write formats consistent with the canonical schemas?

### .claude/skills/checkin/SKILL.md (weekly section only)
- [ ] Is the weekly section ≤ 50 lines (excluding comments)?
- [ ] Does the section contain no inline Phase 3-6c logic?
- [ ] Does it reference the weekly report generation step first?
- [ ] Does it delegate to weekly-reflect, weekly-vision, and plan agents?
- [ ] Does it write checkin_weekly=1 at close?
- [ ] Is the daily check-in section completely untouched?
- [ ] Are inbox.csv and experiments.csv references removed from the weekly section?

## 8. Diff Contract

### Edit 1: scripts/precompute-weekly.js

```
WHAT:    Add --html flag support. When present, write HTML artifact to
         data/artifacts/weekly-report-YYYY-MM-DD.html instead of (in
         addition to) JSON stdout. HTML uses existing computed data.

WHY:     Design decision D5 — extend precompute-weekly.js with --html,
         not a new script. Design decision D6 — report replaces morning
         on Sundays, same artifact path pattern.

PRESERVES: All existing JSON output logic, computations, and stdout
           contract. No changes to getWeekRange(), scoring, spotlight,
           or digest fields.

REMOVES:   Nothing from existing code.

RISK:    argv parsing could interfere with Node's module system if done
         incorrectly. Use process.argv.includes('--html'). HTML file
         write must not suppress stdout (JSON still outputs unless --html
         replaces it — design says "in addition to" for script; for the
         orchestrator use case the HTML is the deliverable, JSON can
         also emit or be suppressed — resolve: when --html is passed,
         write HTML file AND suppress stdout JSON to avoid double output
         confusion. Confirm: orchestrator calls --html for the artifact,
         agents call without flag to get JSON).
```

### Edit 2: .claude/agents/weekly-reflect.md (create)

```
WHAT:    New agent. Handles the reflective half of the weekly check-in:
         domain reflection (2-3 spotlighted domains), feedback loop audit,
         B×A×D check, inversion quick-scan, social contact.

WHY:     Design decision D9 (3-agent decomposition). Extracts Phase 3-4
         from the monolithic checkin SKILL.md. Covers 6 of 8 Abrada
         weekly practices.

PRESERVES: All write semantics from the existing weekly Phase 3 and 4
           (domain reflection → reflections.csv, social contact →
           daily_signals.csv). Signal names and CSV formats unchanged.

REMOVES:   Nothing (new file).

RISK:    Agent may attempt to read vision.json directly as a file rather
         than via GET /api/vision. Both are acceptable — specify file
         read (data/vision.json) for simplicity. Inversion quick-scan
         requires reading antiVision per pillar from vision.json — must
         confirm the field path (vision.json domains[].antiVision per
         the 4-pillar model).
```

### Edit 3: .claude/agents/weekly-vision.md (create)

```
WHAT:    New agent. Handles the forward-looking half of the weekly
         check-in: last week's goal review, new goals, weekly intention,
         and ABT(H) update per pillar.

WHY:     Design decision D9. Extracts Phase 6-6b from checkin SKILL.md.

PRESERVES: All write semantics from existing Phase 6 and 6b — signal
           names (weekly_goal_result, weekly_goal, weekly_intention),
           vision PATCH shape, cadence rule (PATCH not PUT for weekly).

REMOVES:   Nothing (new file).

RISK:    PATCH /api/vision requires the Next.js dev server to be running.
         If server is not running, the PATCH will fail silently. Mitigation:
         agent should attempt curl PATCH and, if it fails, fall back to
         direct file edit of data/vision.json with deep merge. Document
         the fallback in the agent.
```

### Edit 4: .claude/skills/checkin/SKILL.md (weekly section)

```
WHAT:    Replace the existing Weekly Check-in section (Phases 1-7,
         ~300 lines) with a thin 5-step orchestrator (~30 lines).

WHY:     Design decision D9 and Phase 4 of design.md structure outline.
         Reduces context-window load, removes duplicate code (Phase 6c),
         kills dead phases (4.5 inbox, 5 experiments).

PRESERVES: Data Sources section (precompute-weekly.js call), schedule
           rule ("Sundays only"), checkin_weekly=1 close signal.
           All sections OUTSIDE weekly (daily, monthly, quarterly,
           commands, auto-detection, completion flags) must be byte-for-
           byte identical.

REMOVES:   Phase 1 inline display (moved to report), Phase 2 inline mood
           arc (moved to report), Phase 3 domain spotlight inline logic
           (delegated to weekly-reflect agent), Phase 4 social contact
           inline logic (delegated), Phase 4.5 inbox triage entirely,
           Phase 5 experiment loop entirely, Phase 6 goals inline logic
           (delegated to weekly-vision agent), Phase 6b vision update
           inline logic (delegated), Phase 6c week sketch inline logic
           (delegated to plan agent), Phase 7 stale review inline logic.

RISK:    Highest-risk edit. The SKILL.md file has multiple sections —
         a mistake in the replacement could truncate the monthly or
         quarterly sections. Mitigation: identify exact line range of
         the weekly section using grep before editing. Use Edit tool
         with old_string set to the full section header to end marker,
         not line numbers.
```

## 9. Abort Conditions

Stop and ask before proceeding if:

- precompute-weekly.js file content on first read doesn't match the expected
  structure (main() at bottom, stdout JSON write, no existing --html logic)
- checkin SKILL.md structure on first read doesn't have a clear `## Weekly Check-in`
  section with `## Monthly Check-in` as the following section boundary
- `cd app && npm run build` fails on a file outside declared scope
  (indicates pre-existing error — document it, don't fix it unless trivial)
- Any checkpoint question in §7 answers NO — stop, explain, do not continue
- The PATCH /api/vision payload shape in existing SKILL.md differs from
  what is documented in the research (§Q8) — flag the discrepancy
- Editing checkin SKILL.md would require touching the daily section
  (the sections must be independently bounded)
- 3 consecutive runs of `node scripts/precompute-weekly.js --html` fail
  with the same error
- The vision.json antiVision field path doesn't exist — confirm schema
  before writing inversion scan instructions to the agent
- Any new dependency (npm package) would be required for HTML generation
  (use only Node.js built-ins and existing project deps)

## 10. Implementation Order

Execute phases sequentially. Each phase is an atomic unit — verify its
checkpoint before starting the next.

---

### Phase 1: Extend precompute-weekly.js with --html flag

**Atomic tasks:**

1.1. Read scripts/precompute-weekly.js in full. Confirm structure:
     main() at bottom, stdout write at line ~538, no existing --html.

1.2. Add `--html` detection at top of main():
     ```js
     const htmlMode = process.argv.includes('--html');
     ```

1.3. Add 9 new analysis functions after existing compute logic:
     - `computeTrajectoryDeltas(signals, thisWeek, lastWeek, habits)` →
       per-habit arrow + raw counts
     - `computeStreakMomentum(signals, habits)` → growing vs fragile streaks
       (reuse/adapt existing `computeStreak()` in the file)
     - `computeComebackSpeed(signals, habits)` → avg days to return after miss
     - `computeDomainBalance(habitByDomain)` → coverage % per pillar using
       HABIT_DOMAIN mapping and 4-pillar grouping
     - `computeIdentityActionGap(signals, vision)` → reads data/vision.json,
       compares domains[].habits list vs actual completion this week
     - `computePlanAccuracy(plan, thisWeek)` → done/total plan blocks for
       the week; flag overplanning if planned > 10 blocks
     - `computeReflectionCoverage(reflections, thisWeek, domains)` →
       which of 7 domains have at least one reflection row this week

1.4. Add `generateHTML(data, weekRange)` function that returns a
     self-contained HTML string:
     - Inline CSS only (no external deps), dark background #1a1a1a
     - Sections in order from §3a of this spec
     - Reuse display.score_card as a `<pre>` block for section 2
     - All other sections render from the new analysis functions

1.5. At end of main(), branch on htmlMode:
     ```js
     if (htmlMode) {
       const html = generateHTML(output, { thisWeek, lastWeek });
       const outPath = path.join(DATA_ROOT, 'artifacts',
         `weekly-report-${todayStr()}.html`);
       fs.mkdirSync(path.dirname(outPath), { recursive: true });
       fs.writeFileSync(outPath, html, 'utf8');
       process.stderr.write(`Weekly report: ${outPath}\n`);
       // suppress stdout JSON in html mode
     } else {
       process.stdout.write(JSON.stringify(output, null, 2) + '\n');
     }
     ```

1.6. **Verify:**
     - `node scripts/precompute-weekly.js 2>/dev/null | jq .display.score_card`
       returns non-null string (JSON mode still works)
     - `node scripts/precompute-weekly.js --html` produces
       `data/artifacts/weekly-report-YYYY-MM-DD.html`
     - Open the HTML file, confirm all 9 sections are present
     - Run per-file checkpoints for precompute-weekly.js (§7)

---

### Phase 2: Create .claude/agents/weekly-reflect.md

**Atomic tasks:**

2.1. Read .claude/agents/process.md and .claude/agents/plan.md to confirm
     frontmatter schema and agent structure pattern.

2.2. Create .claude/agents/weekly-reflect.md with YAML frontmatter:
     ```yaml
     ---
     name: weekly-reflect
     description: >
       Weekly reflection agent. Runs after the weekly report is read.
       Covers domain reflection (2-3 spotlighted domains), feedback
       loop audit, B×A×D check, inversion quick-scan, and social
       contact. Writes to reflections.csv and daily_signals.csv.
     tools: Read, Bash, Grep, Write, Edit
     model: sonnet
     ---
     ```

2.3. Agent data-fetch section:
     - Run `node scripts/precompute-weekly.js` (no --html), parse JSON
     - Read data/vision.json directly (file read, not API call)
     - Use `digest.domain_spotlight_candidates` for spotlight selection
     - Use `digest.habit_by_domain` for per-domain habit counts

2.4. Phase A — Domain Reflection (interactive, 2-3 domains):
     - AI picks 2-3 from domain_spotlight_candidates
     - Per domain: show this-week vs last-week habit counts + vision "Now"
       horizon from vision.json domains[].becoming
     - Ask: (1) What went well? (2) What would you do differently?
       (3) Where is lag longest — how to shrink it? (feedback loop)
     - Write each domain to reflections.csv:
       `date=<today>, domain=<domain>, win=<Q1>, lesson=<Q2>, change=<Q3>`

2.5. Phase B — Feedback Loop Audit (one question, after all domain spotlights):
     ```
     FEEDBACK LOOP
       Across all domains: which signal has the longest delay between
       action and feedback? What's one way to shorten it this week?
     ```
     - Capture answer as context for the final reflection write of the
       most-relevant domain (update change= field or add a note)
     - This question is asked ONCE after all domain spotlights, not per domain

2.6. Phase C — B×A×D Check (one question):
     ```
     B×A×D
       Belief × Action × Duration — which multiplier is weakest?
       B: do you believe the approach will work?
       A: are you taking the right actions consistently?
       D: have you given it enough time?
     ```
     - Accept one-line answer. No write required (captured verbally).

2.7. Phase D — Inversion Quick-Scan (per pillar, fast):
     ```
     INVERSION
       For each pillar, what's the single most likely failure mode?
       Health / Wealth / Love / Self — one line each.
       (Use your anti-vision as a reference.)
     ```
     - Read vision.json domains[].antiVision for each pillar to prime
       the user's thinking (show as context, not as questions)
     - No CSV write required — this is a verbal scan

2.8. Phase E — Social Contact (always asked):
     ```
     SOCIAL
       Meaningful social contact this week?
       With who / what?
     ```
     - Write to daily_signals.csv:
       `date=<this Sunday's date>, signal=social_contact, value=0|1,
        unit=, context=<details>, source=chat, capture_id=, category=relationships`
     - Sunday date = end of the current week (from getWeekRange logic:
       if today is Sunday use today, otherwise use most-recent Sunday)

2.9. Agent closes with a summary of what was written, then returns.

2.10. **Verify:**
      - Run per-file checkpoints for weekly-reflect.md (§7)
      - Manually invoke the agent context and confirm it runs
        precompute-weekly.js at startup

---

### Phase 3: Create .claude/agents/weekly-vision.md

**Atomic tasks:**

3.1. Create .claude/agents/weekly-vision.md with YAML frontmatter:
     ```yaml
     ---
     name: weekly-vision
     description: >
       Weekly vision update agent. Reviews last week's goals, sets new
       goals and weekly intention, updates ABT(H) per pillar in
       vision.json. Writes to daily_signals.csv and PATCHes vision.json.
     tools: Read, Bash, Grep, Write, Edit
     model: sonnet
     ---
     ```

3.2. Agent data-fetch section:
     - Run `node scripts/precompute-weekly.js` (no --html), parse JSON
     - Read data/vision.json directly for current ABT(H) per pillar
     - Use `digest.goals_last_week` for goal review

3.3. Phase A — Review Last Week's Goals:
     ```
     LAST WEEK'S GOALS
       [goal 1 text] — ✓ / ✗ / ~?
       [goal 2 text] — ✓ / ✗ / ~?
     ```
     - If no goals_last_week entries, skip phase A silently
     - For each goal: write to daily_signals.csv:
       `signal=weekly_goal_result, value=complete|missed|partial,
        context=<goal text>, category=<domain from goals_last_week entry>`

3.4. Phase B — Set This Week's Goals (1-3):
     ```
     THIS WEEK'S GOALS
       Set 1-3 goals. Connect each to a domain and vision horizon.
     ```
     - For each goal: write to daily_signals.csv:
       `signal=weekly_goal, value=<domain>, context=<goal text>,
        category=<domain>`
     - Infer domain from content; confirm only if genuinely ambiguous

3.5. Phase C — Weekly Intention (mantra):
     ```
     INTENTION
       What's the mantra for this week? (broad direction, not a task)
     ```
     - If answer is task-like, ask once for a mantra rewrite
     - Write to daily_signals.csv:
       `signal=weekly_intention, value=<domain>, context=<mantra text>,
        category=<domain>`
     - Allow skip

3.6. Phase D — ABT(H) Update (per pillar):
     For each of 4 pillars (health, wealth, love, self):
     ```
     VISION UPDATE: HEALTH
       Current Actual: "<domains[health].actual>"
       This week: Gym N/7, Sleep N/7, Ate clean N/7

       Update, or keep?
     ```
     - Show habit data from digest.habit_by_domain for that pillar
     - If "keep" → skip
     - After all pillars, show habits for any pillar that had an actual
       update and ask if any habit needs adding/removing/rewording

3.7. Build PATCH payload — include only changed pillars + intentions.weekly:
     ```json
     {
       "domains": [
         { "id": "health", "actual": "...", "habits": ["..."] }
       ],
       "intentions": { "weekly": "<mantra from Phase C>" }
     }
     ```
     Always include intentions.weekly (even if user skipped — use last value
     if skip; omit intentions key entirely if user explicitly skipped mantra).

3.8. Send PATCH:
     Primary: `curl -s -X PATCH http://localhost:3000/api/vision -H
       'Content-Type: application/json' -d '<payload>'`
     Fallback (if curl returns non-200 or connection refused): read
     data/vision.json, deep-merge the payload manually, write file back.
     Log which path was taken.

3.9. Agent closes with a summary of what was written, then returns.

3.10. **Verify:**
      - Run per-file checkpoints for weekly-vision.md (§7)
      - Confirm PATCH payload shape matches /api/vision contract

---

### Phase 4: Refactor checkin SKILL.md weekly section

**Atomic tasks:**

4.1. Read checkin SKILL.md in full. Identify exact section boundaries:
     - Start: `## Weekly Check-in` (search for this exact heading)
     - End: the line immediately before `## Monthly Check-in`
     - Confirm the section contains the Phase 1-7 summary table at the end

4.2. Replace the entire `## Weekly Check-in` section with the thin
     orchestrator below. Use Edit tool with old_string = full section text
     (from `## Weekly Check-in` to the last line before `## Monthly Check-in`):

     ```markdown
     ## Weekly Check-in

     Run on **Sundays only** (or `/checkin weekly` to force on demand).

     ### Step 1: Generate Weekly Report

     ```bash
     node scripts/precompute-weekly.js --html
     ```

     The script writes `data/artifacts/weekly-report-YYYY-MM-DD.html`.
     Print the path. Tell the user: "Open your weekly report, read it,
     then type 'continue'." Wait for "continue" before proceeding.

     ### Step 2: Delegate to weekly-reflect agent

     Spawn the **weekly-reflect** agent. It self-fetches data, runs the
     interactive reflection phases (domain spotlight, feedback loop,
     B×A×D, inversion scan, social contact), and writes to
     reflections.csv and daily_signals.csv. After it returns, continue.

     ### Step 3: Delegate to weekly-vision agent

     Spawn the **weekly-vision** agent. It self-fetches data, runs goal
     review, sets new goals and intention, updates vision.json via PATCH,
     and writes to daily_signals.csv. After it returns, continue.

     ### Step 4: Delegate to plan agent (week mode)

     Spawn the **plan** agent with week mode: `3 week`. It shows weekly
     goals as context, accepts natural language priorities, and writes
     draft blocks to plan.csv. After it returns, continue.

     ### Step 5: Close

     Write to `daily_signals.csv`:
     `date=<today>, signal=checkin_weekly, value=1, unit=, context=,
      source=chat, capture_id=, category=`

     Print: "Weekly check-in complete."
     ```

4.3. Verify the monthly section immediately follows with no gap.

4.4. Confirm the daily check-in section is byte-for-byte identical to
     what it was before the edit (grep for "Option 1: Log" and
     "Option 2: Process" to confirm they are still present and unchanged).

4.5. **Verify:**
     - `wc -l` the new weekly section — should be ≤ 50 lines
     - Grep for "inbox" in the weekly section — must return 0 results
     - Grep for "Phase 5" in the weekly section — must return 0 results
     - Grep for "Phase 6c" in the weekly section — must return 0 results
     - Run per-file checkpoints for checkin SKILL.md (§7)

---

### Phase 5: Final Verification

5.1. `cd app && npm run build` — must pass with zero errors.

5.2. `node scripts/precompute-weekly.js 2>/dev/null | jq .digest.goals_last_week`
     — must return a valid (possibly empty) array.

5.3. `node scripts/precompute-weekly.js --html` — must produce HTML file.

5.4. `git diff --name-only` — confirm only these files changed:
     - scripts/precompute-weekly.js
     - .claude/skills/checkin/SKILL.md
     - .claude/agents/weekly-reflect.md (new)
     - .claude/agents/weekly-vision.md (new)

5.5. Report to user: files changed, line count of new weekly SKILL.md
     section, HTML artifact path, and any warnings encountered.
