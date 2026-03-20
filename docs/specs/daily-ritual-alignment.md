Status: shipped

# Daily Ritual Alignment

## 1. Problem Statement

```
PROBLEM:
- What: The tracker's core docs (life-playbook.md, app-intent.md, architecture.md, data-schemas.md,
  CLAUDE.md) use a flat 7-domain model that doesn't reflect the 4-pillar vision structure already
  shipped in vision.json. The checkin skill cannot write to vision.json. The plan day view has no
  ritual context. No skill generates plan blocks from the ritual blueprint.
- Why: Three features were deferred during Vision Reinvention (March 2026) — checkin→vision.json
  writes, plan ritual reminder, generative plan blocks. The doc layer is out of sync with the
  data layer, causing agents to reference stale domain models and missing cadence rules.
- User-facing effect: After this ships, (1) core docs accurately describe the 4-pillar model and
  cadence rules, (2) weekly/monthly/quarterly checkins update vision.json fields, (3) the plan day
  view shows ritual context from vision.json, and (4) a morning skill suggests plan blocks from
  the ritual blueprint.
```

## 2. Affected Files

### Phase 1 — Rewrite life-playbook.md
```
SCOPE:
- Modify: docs/life-playbook.md
- Create: none
- Must NOT change: all other files
```

### Phase 2 — Update app-intent.md
```
SCOPE:
- Modify: docs/app-intent.md
- Create: none
- Must NOT change: all other files
```

### Phase 3 — Audit + update architecture.md, data-schemas.md, CLAUDE.md
```
SCOPE:
- Modify: docs/architecture.md, docs/data-schemas.md, CLAUDE.md
- Create: none
- Must NOT change: all other files
```

### Phase 4 — Checkin → vision.json writes
```
SCOPE:
- Modify: .claude/skills/checkin/SKILL.md, app/app/api/vision/route.ts
- Create: none
- Must NOT change: data/vision.json (only written at runtime by checkin skill),
  app/app/vision/page.tsx, app/app/lib/csv.ts (unless adding a PATCH helper)
```

### Phase 5 — Plan ritual reminder strip
```
SCOPE:
- Modify: app/app/components/DayView.tsx
- Create: none
- Must NOT change: app/app/vision/page.tsx, app/app/api/plan/route.ts,
  app/app/api/vision/route.ts, data/vision.json
```

### Phase 6 — Generative plan blocks
```
SCOPE:
- Modify: .claude/skills/checkin/SKILL.md (add ritual block suggestions to daily checkin Option 5)
- Create: none
- Must NOT change: app/app/vision/page.tsx, data/vision.json
```

## 3. Visual Contract

### Phase 5 — Ritual context strip on /plan/day (only UI phase)

```
VISUAL CONTRACT:
- Page/route: /plan/day
- Viewport: 1280x800 (desktop), 390x844 (mobile)

What the user SHOULD see:
- A collapsible "Ritual" strip between the intention banner and the schedule section
- Strip shows the current ritual phase (morning/midday/evening) based on time of day:
  - Before 12:00 PM → morning
  - 12:00 PM – 5:00 PM → midday
  - After 5:00 PM → evening
- Active phase shows its steps as a compact numbered list (max 8 items)
- Below steps: habit stacks as italic hint text
- Strip collapses to a single line showing phase name + step count
- Muted styling: zinc-800 background, zinc-400 text, no bold colors — context, not decoration

What the user should NOT see:
- No console errors
- No layout shift when strip loads (skeleton or fixed height)
- No duplicate ritual content (vision page has its own ritual section — plan strip is a condensed mirror)
- No edit controls (read-only)
- No broken state when vision.json is missing ritualBlueprint
```

## 4. Success Criteria

### Phase 1: life-playbook.md rewrite
- [ ] Playbook uses 4-pillar model (Health, Wealth, Love, Self) with canonical ID mappings
- [ ] Contains operating philosophy section drawn from Abrada frameworks
- [ ] Contains cadence rules table (daily/weekly/monthly/quarterly write scopes)
- [ ] Contains trigger protocol, depletion protocol, recharge menu
- [ ] Contains write routing rules table (what goes where)
- [ ] References vision.json for living content, does not duplicate it
- [ ] All TBD protocols are filled with concrete rules

### Phase 2: app-intent.md update
- [ ] Surface reality table updated to reference ritual interaction flow
- [ ] Cadence contract section added (what writes where when)
- [ ] Deferred work table updated (items marked in-progress or shipped)
- [ ] Surface interaction map added (morning→midday→evening)
- [ ] No conflicts with architecture.md or data-schemas.md

### Phase 3: Remaining docs audit
- [ ] architecture.md documents vision.json write paths and cadence-aware routing
- [ ] data-schemas.md documents vision.json write semantics per cadence
- [ ] CLAUDE.md domain taxonomy shows 4-pillar mapping alongside canonical 7
- [ ] All docs consistent on domain names, cadences, field references

### Phase 4: Checkin → vision.json writes
- [ ] Build passes (`cd app && npm run build`)
- [ ] `/api/vision` accepts PATCH requests for partial updates
- [ ] Checkin SKILL.md documents weekly vision.json write rules
- [ ] Checkin SKILL.md documents monthly vision.json write rules
- [ ] Checkin SKILL.md documents quarterly vision.json write rules
- [ ] Weekly writes: domains[].actual, domains[].habits, intentions.weekly
- [ ] Monthly writes: identityScript, antiVision, intentions
- [ ] Quarterly writes: full ABT(H) rebuild, ritualBlueprint, habitAudit, inputControl

### Phase 5: Plan ritual reminder strip
- [ ] Build passes (`cd app && npm run build`)
- [ ] /plan/day loads without console errors
- [ ] Ritual strip visible between intention banner and schedule
- [ ] Correct phase displayed based on time of day
- [ ] Strip collapses/expands
- [ ] Graceful fallback when ritualBlueprint is missing

### Phase 6: Generative plan blocks
- [ ] Checkin SKILL.md documents ritual block suggestion flow
- [ ] Suggestions sourced from ritualBlueprint + domains[].habits
- [ ] User confirms before any plan.csv writes
- [ ] No files modified outside declared scope

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Doc inconsistency | Cross-reference domain names, cadences, field names across all 5 docs | Fix the doc that drifted, re-verify all |
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console on /plan/day | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| API failure | `curl -X PATCH /api/vision` returns non-200 | Fix route handler |
| Scope violation | `git diff --stat` per phase | Revert unintended changes |
| Vision.json corruption | Checkin writes invalid JSON or drops fields | Fix merge logic, verify with `cat data/vision.json | jq .` |
| Regression on /vision | Vision page stops loading or shows wrong data | Revert, find non-destructive approach |

## 6. Invariants

```
INVARIANTS:
- The 7 canonical domain IDs (health, career, relationships, finances, fun, personal_growth,
  environment) must remain valid everywhere — the 4-pillar model is an overlay, not a replacement
- Legacy domain IDs in historical CSV rows must not be modified
- vision.json schema must remain backward-compatible — add fields, never remove or rename
- The /vision page must continue to work identically (read-only ritual surface)
- The checkin skill's existing daily flow must not change behavior
- CSV write semantics (append-only, immediate writes) must not change
- No new CSV files
- No new top-level routes
- No new npm dependencies
- Flat navigation preserved — ritual strip is in-page UI, not a new route
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO:

1. Does this file use the 4-pillar model (Health/Wealth/Love/Self) consistently where vision domains are referenced?
2. Does this file preserve the 7 canonical domain IDs where CSV/signal domains are referenced?
3. Did I preserve all existing content that wasn't explicitly marked for removal?
4. Does my diff contain ONLY changes the spec asked for?
5. Can I trace every change to a specific spec item?
6. (Phases 4-6 only) Does `npm run build` still pass?

## 8. Diff Contract

Stated per-phase below in Section 9 (Implementation Order).

## 9. Implementation Order

Six phases. Phases 1-3 are doc rewrites (file-disjoint, can be parallelized). Phases 4-6 are code changes (sequential).

---

### Phase 1: Rewrite life-playbook.md

**WHAT**: Replace the current 7-domain flat playbook with a 4-pillar ritual-aligned playbook.
**WHY**: Design decision #1 (4-pillar model), #3 (playbook = rules, vision.json = content), #4-7 (cadence rules).
**PRESERVES**: Operating priorities (sleep→eating→training→addiction→deep work), recharge menu items, travel planning note, existing health/finances/fun protocol content that is still accurate.
**REMOVES**: TBD placeholders, 7-domain flat structure as primary organization, resources section (belongs in vision.json inputControl).
**RISK**: Over-writing stable rules with aspirational content. Mitigation: playbook = rules only, vision.json = living content.

#### Content to write

The new `docs/life-playbook.md` must contain these sections with this content. Write the full file — do not leave stubs.

```markdown
# Life Playbook

Stable behavioral rules and constraints. This file changes rarely — when a rule is proven wrong or a protocol is refined through monthly/quarterly review.

For living content (identity script, domain targets, habits, ritual steps), see `data/vision.json`.

## Operating Philosophy

Drawn from the Reinvention Formula and Reshaping Protocol:

1. **Identity is installed through ritual, not intention.** Your brain believes what's repeated, not what's true. Read the identity script daily. Every action is a vote for who you believe you are.
2. **Inputs shape identity.** Full-spectrum audit: mental, emotional, physical, digital. If it's not helping, it's hurting. Curate mentors, books, media. Purge everything misaligned.
3. **Compress feedback cycles.** Speed of action→feedback→adjustment determines transformation speed. Compressed reps beat spaced perfection. Keep the metal hot, strike repeatedly.
4. **Deformation is the goal.** Permanent change feels like loss. Your current shape is already a deformation (passive, from life). Active deformation = consciously selecting forces and applying them. The uncomfortable phase between identities is signal that force is working.
5. **Evening shapes tomorrow.** Review the day, journal, think about tomorrow. The evening ritual is the setup function for the next morning.

## 4-Pillar Domain Model

| Pillar | Canonical IDs | Covers |
|--------|--------------|--------|
| **Health** | `health` | Body comp, training, nutrition, sleep, emotional regulation |
| **Wealth** | `career`, `finances` | Deep work, output, visibility, skills, income, net worth, spending, compounding |
| **Love** | `relationships` | Partner, friends, family, social |
| **Self** | `personal_growth`, `fun`, `environment` | Reading, reflection, meditation, spirituality, addiction recovery, hobbies, play, home, workspace |

The 7 canonical domain IDs remain the tagging standard in all CSVs. The 4-pillar model is the human-facing overlay used in vision.json, the /vision page, and weekly+ check-ins.

## Daily Structure

- **Work:** ~8:00-4:00 (flexible 7:30-8:30 start, 3:30-4:30 end)
- **WFH** — remote full-time
- **Gym:** morning (5:30-6:30 AM) or midday (11:00 AM) if missed
- **Deep work:** minimum 2 blocks/day during work hours

## Operating Priorities

1. Sleep and recovery quality
2. Eating clean and protein-first defaults
3. Training consistency
4. Addiction avoidance and trigger management
5. Deep work and execution reliability

## Cadence Rules

| Cadence | When | What happens | Where it writes |
|---------|------|-------------|----------------|
| **Daily** | Every day | Log signals (habits, weight, mood). Review vision. Execute plan. | `daily_signals.csv`, `plan.csv` |
| **Weekly** | Sundays | Score card, domain spotlight, update Actual + Habits in vision, set weekly intention/goals, experiment loop, stale review | `daily_signals.csv`, `reflections.csv`, `experiments.csv`, `vision.json` (domains[].actual, domains[].habits, intentions.weekly) |
| **Monthly** | Last Sunday of month | Month trajectory report, rewrite identity script + anti-vision, update intentions, review inputControl + experiments | `daily_signals.csv`, `vision.json` (identityScript, antiVision, intentions) |
| **Quarterly** | Every 3 months | Full ABT(H) rebuild (Becoming + Timeline), ritualBlueprint overhaul, habitAudit, inputControl purge | `vision.json` (all fields) |

### Write Routing Rules

| Data type | Destination | Example |
|-----------|------------|---------|
| Daily signal (binary habit, weight, mood) | `daily_signals.csv` | gym=1, weight=225, feeling=focused |
| Workout sets | `workouts.csv` | squat, set 3, 225 lbs, 5 reps |
| Reflection (win/lesson/change) | `reflections.csv` | health domain, "hit all 6 sessions" |
| Time block | `plan.csv` | 9:00-10:30, Deep work, career |
| Action item | `todos.csv` | "Ship auth refactor", career |
| Experiment | `experiments.csv` | "Morning meditation before gym", 7 days |
| Identity/vision content | `vision.json` | identityScript rewrite, domain actual update |
| Raw capture | `inbox.csv` | Voice note, text note |

Rule: signals and evidence go to CSVs. Identity and direction go to vision.json. Rules go to this playbook. System behavior goes to app-intent.md.

## Surface Interaction Flow

| Time | Surface | Purpose |
|------|---------|---------|
| Morning | `/vision` | Read identity script, review ritual steps, set direction |
| Midday | `/plan` | Execute blocks, midday ritual strip for reset anchors |
| Evening | `/vision` | Review the day, reflect, prepare tomorrow |

## Health Pillar Protocol

- Maintain a sustainable calorie deficit with high protein.
- Keep training completion-based and log set-level data in `data/workouts.csv`.
- Progress using simple repeatable rules (small load increases, deload after repeated misses).
- Preserve consistency over optimization.
- Default meal system with predictable groceries. Keep meal decisions low-friction and repeatable.
- Capture outlier meals and observed effects for reflection.
- Sleep and emotional regulation rules that can be followed during stress windows.

## Wealth Pillar Protocol

- Minimum 2 deep work blocks/day during work hours. 1 creative/reflective, at least 1 action/shipping.
- AI fluency as a career multiplier — study and apply AI to domains of interest.
- Visible output over invisible effort. Ship things.
- Follow long-horizon compounding strategy for finances. Prefer low-complexity, low-decision systems.
- Track major financial changes as explicit notes/todos.

## Love Pillar Protocol

- Reduce isolation with deliberate weekly social contact. One social plan initiated per week.
- Partner communication: check in 2-3x/week with prepared topics. One thoughtful daily text.
- Family connection: smile, ask about them, show gratitude daily.
- Quality of social circle matters — kind, happy, self-motivated, genuine people.

## Self Pillar Protocol

- Daily meditation as spiritual and awareness practice (non-negotiable).
- Daily journaling — morning thoughts, evening review.
- Reading and learning loops that produce behavior change, not just consumption.
- Positive-sum leisure over numbing or isolating defaults.
- Zero-negotiation boundaries for known relapse behaviors (addiction recovery).
- Track triggers and relapse signals in `data/daily_signals.csv`.

### Trigger Protocol

When an urge or trigger fires:

1. **Recognize** — name the urge state out loud or in writing
2. **Delay** — set a 10-minute timer, do not act
3. **Shift** — physically change state (see Recharge Menu)
4. **Re-anchor** — read anti-vision from vision.json, then re-read identity script

### Depletion Protocol

When fried after work and tempted by dopamine defaults:

1. Check the recharge menu before deciding
2. If nothing appeals after 5 minutes, then decide — but the 5 minutes of trying comes first
3. Never default to destructive habits (see habitAudit.destructive in vision.json)

### Recharge Menu

Activities that restore energy without relapse cost:
- Walk with Cooper
- Read a book
- Cook something
- Meditate
- Call someone
- Cold shower or breathwork
- Journal

### Travel Planning (sub-concern: finances + fun + relationships)

Plan windows ahead of time, track costs, and attach decisions to calendar blocks. Keep planned trips visible in `data/plan.csv` and related todos.
```

---

### Phase 2: Update app-intent.md

**WHAT**: Add cadence contract, surface interaction map, update deferred work table, update surface reality.
**WHY**: Design decisions #2 (vision = morning ritual surface), #8 (surface interaction), #10 (unblock deferred work).
**PRESERVES**: Objective, desired outcomes, health metrics, distillation rules, decisions log structure.
**REMOVES**: Nothing — this is additive + updates to existing sections.
**RISK**: Cadence contract conflicting with checkin skill. Mitigation: checkin skill is updated in Phase 4 to match.

#### Changes to make

1. **Surface Reality table** — update the Vision row description and add interaction pattern column:

Replace the current Surface Reality table with:

```markdown
## Surface Reality (March 2026)

| Surface | Usage | Gravity | Ritual Role |
|---------|-------|---------|-------------|
| Vision | Daily | High — single entry point, ritual surface | Morning: direction + identity. Evening: review + reflect. |
| Plan | Daily | Medium — execution surface | Midday: execute blocks + ritual reset strip. |
| Health | Daily | High — workout logging, body metrics | On-demand: log workouts, track weight. |
| Resources | Rare | Low — passive storage | On-demand: reference material. |

### Surface Interaction Map

| Time | Surface | Action |
|------|---------|--------|
| Morning (before 12:00) | `/vision` | Read identity script, review morning ritual steps, set daily intention via `/checkin` |
| Midday (12:00-5:00) | `/plan` | Execute plan blocks, midday ritual strip shows reset anchors |
| Evening (after 5:00) | `/vision` | Review day, evening ritual steps, reflect, prepare tomorrow |
```

2. **Cadence Contract** — add new section after "Current Direction":

```markdown
## Cadence Contract

What writes where, at what frequency. See `docs/life-playbook.md` for the full cadence rules table.

| Cadence | Trigger | vision.json fields written | CSV files written |
|---------|---------|--------------------------|-------------------|
| Daily | `/checkin daily` or app signals | None | daily_signals, plan, reflections |
| Weekly | `/checkin weekly` (Sundays) | domains[].actual, domains[].habits, intentions.weekly | daily_signals, reflections, experiments |
| Monthly | `/checkin monthly` (last Sunday) | identityScript, antiVision, intentions | daily_signals |
| Quarterly | `/checkin quarterly` | All fields (full rebuild) | daily_signals |

Daily checkins do NOT write to vision.json. Vision.json writes start at weekly cadence.
```

3. **Future Work table** — update status:

Replace the existing Future Work table with:

```markdown
## Future Work

| Item | Description | Status |
|------|-------------|--------|
| Checkin → vision.json writes | Weekly/monthly/quarterly checkins update vision.json fields | In progress (Phase 4 of daily-ritual-alignment spec) |
| Plan ritual reminder | Plan day view shows ritual context strip from vision.json | In progress (Phase 5 of daily-ritual-alignment spec) |
| Generative plan blocks | Morning skill auto-suggests plan blocks from ritual blueprint | In progress (Phase 6 of daily-ritual-alignment spec) |
```

4. **Decisions log** — append new row:

```
| 2026-03-20 | 4-pillar model overlays 7 canonical IDs | Health=[health], Wealth=[career,finances], Love=[relationships], Self=[personal_growth,fun,environment]. Pillars are human-facing; canonical IDs stay for CSV tagging. |
| 2026-03-20 | Cadence contract: daily=signals, weekly=A+H, monthly=identity, quarterly=full rebuild | Write scopes locked — see life-playbook.md cadence rules. |
```

---

### Phase 3: Audit + update architecture.md, data-schemas.md, CLAUDE.md

**WHAT**: Add vision.json write paths to architecture, document write semantics in data-schemas, add 4-pillar mapping to CLAUDE.md.
**WHY**: Design decision #9 (core docs audit). All docs must be consistent on domains, cadences, field references.
**PRESERVES**: All existing content in all three files. These are additive changes only.
**REMOVES**: Nothing.
**RISK**: Low — additive only.

#### architecture.md changes

1. Add after the existing `/api/vision` line in the API Surface section:

```markdown
- `/api/vision` (GET + PUT + PATCH — vision.json read/write/partial-update)
```

(Replace the existing line that says `GET + PUT`.)

2. Add a new section after "Write Router":

```markdown
## Vision Write Paths

vision.json is updated through the checkin skill at weekly+ cadences. The API supports three methods:

| Method | Purpose | Consumer |
|--------|---------|----------|
| GET | Read full vision.json | /vision page, /plan day view (ritual strip) |
| PUT | Full replace | Manual JSON edits, quarterly rebuild |
| PATCH | Partial field update | Weekly/monthly checkin writes |

### Cadence-Aware Write Routing

The checkin skill determines which vision.json fields to update based on cadence:

| Cadence | Fields written |
|---------|---------------|
| Weekly | `domains[].actual`, `domains[].habits`, `intentions.weekly` |
| Monthly | `identityScript`, `antiVision`, `intentions` |
| Quarterly | All fields (full rebuild) |

Daily checkins do NOT write to vision.json.
```

#### data-schemas.md changes

1. In the `data/vision.json` section, add after the schema block:

```markdown
### Vision Write Semantics

vision.json is written via `/api/vision` (PUT for full replace, PATCH for partial update).

| Cadence | Writer | Fields | Merge behavior |
|---------|--------|--------|---------------|
| Weekly | `/checkin weekly` | `domains[].actual`, `domains[].habits`, `intentions.weekly` | Deep merge — only specified domain fields update, others preserved |
| Monthly | `/checkin monthly` | `identityScript`, `antiVision`, `intentions` | Top-level key replace — new identityScript replaces old |
| Quarterly | `/checkin quarterly` | All fields | Full replace via PUT |
| Manual | JSON edit | Any | Full replace via PUT |

The `vision_reviewed` signal in daily_signals.csv tracks when the user reviewed vision.json content:
- `signal=vision_reviewed`, `value=1`, `context=morning|afternoon|evening`, `category=personal_growth`
- Logged via ritual blueprint checkboxes on /vision page
- One signal per context per day (morning, afternoon, evening)
```

#### CLAUDE.md changes

1. Add a new section after the existing "Canonical Domain Taxonomy" table:

```markdown
### 4-Pillar Vision Model

The 4-pillar model is the human-facing overlay used in `data/vision.json`, the `/vision` page, and weekly+ check-ins. The 7 canonical IDs remain the tagging standard in all CSVs.

| Pillar | ID | Canonical IDs | Covers |
|--------|-----|--------------|--------|
| Health | `health` | `health` | Body comp, training, nutrition, sleep, emotional regulation |
| Wealth | `wealth` | `career`, `finances` | Deep work, output, visibility, skills, income, net worth |
| Love | `love` | `relationships` | Partner, friends, family, social |
| Self | `self` | `personal_growth`, `fun`, `environment` | Reading, reflection, meditation, addiction recovery, hobbies, home |
```

2. Update the skills table — add cadence info to `/checkin`:

Replace the checkin row with:

```
| `/checkin`       | Guided daily/weekly/monthly/quarterly check-in. Weekly+ writes vision.json. | `checkin`, `check in`, `morning check-in` |
```

---

### Phase 4: Implement checkin → vision.json writes

**WHAT**: Add PATCH endpoint to `/api/vision` and extend checkin skill with weekly/monthly/quarterly vision.json write flows.
**WHY**: Design decisions #4-7 (write scopes), #10 (unblock deferred work). This is the core loop-closing mechanism.
**PRESERVES**: Existing GET and PUT methods on /api/vision. Existing daily checkin flow. All existing checkin skill behavior.
**REMOVES**: Nothing.
**RISK**: PATCH endpoint corrupting vision.json through bad merges. Mitigation: deep merge for domains (match by id), top-level replace for scalar keys, and build-time type checking.

#### API Contract: PATCH /api/vision

Add a PATCH handler to `app/app/api/vision/route.ts`:

```typescript
export async function PATCH(req: Request) {
  const patch = await req.json();
  const current = readVision();
  if (!current) return NextResponse.json({ error: "vision not found" }, { status: 404 });

  // Deep merge domains by id
  if (patch.domains && Array.isArray(patch.domains)) {
    for (const patchDomain of patch.domains) {
      const existing = current.domains.find((d: VisionDomain) => d.id === patchDomain.id);
      if (existing) {
        Object.assign(existing, patchDomain);
      }
    }
    delete patch.domains;
  }

  // Shallow merge remaining top-level keys
  const merged = { ...current, ...patch };
  writeVision(merged as VisionData);
  return NextResponse.json(merged);
}
```

Validation: the response must parse as valid VisionData. The PATCH body is a partial VisionData — only keys present are merged.

#### Checkin Skill: Weekly vision.json writes

Add the following section to `.claude/skills/checkin/SKILL.md` after the existing Phase 6 (Goals & Intention) and before Phase 7 (Stale Review):

```markdown
### Phase 6b: Vision Update (weekly, after goals)

Update vision.json fields based on this week's reflections and progress. Uses PATCH /api/vision.

**Step 1: Update Actual (per pillar)**

For each of the 4 pillars (health, wealth, love, self), using this week's reflections and habit data:

```
─── VISION UPDATE: HEALTH ──────────────────────────────
  Current Actual: "Hit planned gym sessions, run protein-first
  meals, prioritize sleep quality and emotional regulation
  during stress."

  Based on this week: Gym 6/7, Sleep 5/7, Ate clean 5/7.

  Does this still describe where you are? Update or keep?
```

- If user says "keep" → skip
- If user provides update → PATCH `domains[].actual` for that pillar (match by domain id)
- Keep it grounded — actual = current reality, not aspiration

**Step 2: Adjust Habits (per pillar, optional)**

After reviewing actual for each pillar:

```
  Current habits:
  1. Train daily — no excuses for emotion or timing
  2. No substances
  3. Clean eating — protein-first every meal
  ...

  Any habit to add, remove, or reword? (or skip)
```

- If user adjusts → PATCH `domains[].habits` for that pillar
- Keep habits as action statements, not goals

**Step 3: Write**

Send a single PATCH request with all updated fields:
```json
{
  "domains": [
    { "id": "health", "actual": "<updated>", "habits": ["<updated>"] }
  ],
  "intentions": { "weekly": "<from Phase 6 mantra>" }
}
```

Only include pillars that changed. Always include `intentions.weekly` (set in Phase 6).
```

#### Checkin Skill: Monthly vision.json writes

Add the following section to `.claude/skills/checkin/SKILL.md` inside the Monthly Check-in, after Step 3 (Ask) and before Step 4 (Write):

```markdown
### Step 3b: Vision Rewrite (monthly)

Monthly is the time to rewrite identity content. Uses PATCH /api/vision.

**Identity Script rewrite:**

```
─── IDENTITY REWRITE ──────────────────────────────────
  Current identity script:
    Core traits: "The person behind all these domains: grounded,
    positive, present..."

  Based on the last month's trajectory and what you told me
  above, does this still feel right?

  Rewrite your core traits in your own words. (or keep)
```

Walk through each identityScript field:
- `coreTraits` — who you are at your core
- `nonNegotiables` — what you refuse to skip
- `languageRules` — words to use and forbid
- `physicalPresence` — how you carry yourself
- `socialFilter` — who you surround yourself with
- `decisionStyle` — how you decide under pressure

For each: show current value, ask "rewrite or keep?", accept natural language.

**Anti-Vision rewrite:**

```
─── ANTI-VISION ──────────────────────────────────────
  Current: "Smokes weed. Skips gym for any emotion or timing
  excuse. Watches porn. Isolates. Reactive. Overweight.
  Hates himself."

  Still accurate? Sharpen, expand, or keep?
```

**Intentions update:**

```
─── INTENTIONS ──────────────────────────────────────
  Set a daily mantra for the coming month:
  Set a weekly mantra for the coming month:
```

**Write:** Single PATCH request with all changed fields:
```json
{
  "identityScript": { ...updated fields },
  "antiVision": "<updated>",
  "intentions": { "daily": "<updated>", "weekly": "<updated>" }
}
```

Only include fields that changed.
```

#### Checkin Skill: Quarterly vision.json writes

Add a new section to `.claude/skills/checkin/SKILL.md`:

```markdown
## Quarterly Check-in

Run every 3 months (or `/checkin quarterly` to force on demand).

Quarterly is a full rebuild of vision.json. Uses PUT /api/vision (full replace).

### Step 1: Full ABT(H) Rebuild

For each of the 4 pillars, walk through:

1. **Becoming** — "Where do you want to be in this pillar?" (vivid, specific, measurable)
2. **Timeline** — "By when?" (specific date)
3. **Actual** — "Where are you right now, honestly?"
4. **Habits** — "What daily actions get you from Actual to Becoming?" (3-5 statements)

Show the current values for each. Accept rewrites or keep.

### Step 2: Ritual Blueprint Overhaul

```
─── RITUAL BLUEPRINT ──────────────────────────────────
  Morning steps (current):
  1. Wake — no devices
  2. Journal
  ...

  Keep, rewrite, or adjust?
```

Walk through morning, midday, evening. For each:
- Show current steps and habit stacks
- Accept rewrites, additions, removals

### Step 3: Habit Audit

```
─── HABIT AUDIT ──────────────────────────────────────
  Productive: Gym, Meditation, Deep work, Clean eating, ...
  Neutral: Cooking, Walking Cooper, Reading
  Destructive: Weed, League of Legends, Poker, Porn, ...

  Any changes? Move items between categories, add, remove?
```

### Step 4: Input Control

```
─── INPUT CONTROL ──────────────────────────────────────
  Mentors: Daniel Abrada
  Books: As a Man Thinketh, The Perfume of Silence
  Podcasts: (none)
  Nutrition rules: Protein-first, sustainable deficit, ...
  Purge list: (empty)

  Any updates?
```

### Step 5: Write

Assemble the complete vision.json object from all updated fields (merged with unchanged current values) and PUT to `/api/vision`.

Verify the response parses correctly. If the PUT fails, show the error and do NOT write `checkin_quarterly=1`.

Write `checkin_quarterly=1` to `daily_signals.csv`.
```

---

### Phase 5: Plan ritual reminder strip

**WHAT**: Add a collapsible ritual context strip to the DayView component.
**WHY**: Design decision #8 (midday: /plan with ritual reset strip).
**PRESERVES**: All existing DayView functionality — events, intention banner, schedule, now line, scheduler modal.
**REMOVES**: Nothing.
**RISK**: Fetch failure for /api/vision breaking DayView load. Mitigation: fetch in parallel, render nothing on error.

#### Implementation details

File: `app/app/components/DayView.tsx`

1. Add state for ritual data:
```typescript
const [ritual, setRitual] = useState<{ morning: RitualPhase; midday: RitualPhase; evening: RitualPhase } | null>(null);
```

2. Determine current phase based on time:
```typescript
function getRitualPhase(): "morning" | "midday" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}
```

3. Fetch ritual data from `/api/vision` on mount (parallel with existing intention fetch). Extract `ritualBlueprint` from the response.

4. Render the strip between the intention banner and the schedule section:
```
┌─────────────────────────────────────────────────────┐
│ ▶ Midday Ritual (7 steps)                           │  ← collapsed
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ▼ Midday Ritual                                     │  ← expanded
│                                                     │
│ 1. 10-minute walk                                   │
│ 2. Pull-ups and push-ups                            │
│ 3. Breathwork                                       │
│ 4. Cold shower                                      │
│ 5. Review identity script                           │
│ 6. Quick reflection                                 │
│ 7. Prepare for deep work or rest of day             │
│                                                     │
│ After lunch → walk first                            │  ← habit stacks (italic)
│ After walk → bodyweight movement + breathwork       │
└─────────────────────────────────────────────────────┘
```

5. Styling:
- Background: `bg-zinc-900/40` (slightly lighter than schedule section)
- Border: `border border-white/5`
- Steps: `text-sm text-zinc-400`
- Habit stacks: `text-xs text-zinc-500 italic`
- Collapse toggle: chevron icon, `text-zinc-500`
- Default state: collapsed (user expands on demand)

6. Only show on today's date (not historical dates). If `ritualBlueprint` is missing or empty, render nothing.

7. Type import: use `RitualBlueprint` from `../lib/types`.

---

### Phase 6: Generative plan blocks

**WHAT**: Add ritual-aligned block suggestions to the daily checkin's "Plan today" option.
**WHY**: Design decision #10 (generative plan blocks). Morning skill auto-suggests blocks from ritual blueprint + ABT(H) habits.
**PRESERVES**: Existing checkin Option 5 flow (rollover, context-aware surfacing, confirm plan).
**REMOVES**: Nothing.
**RISK**: Over-suggesting blocks and annoying the user. Mitigation: max 3 suggestions, user confirms each, "skip suggestions" escapes all.

#### Checkin Skill Changes

Add to `.claude/skills/checkin/SKILL.md` inside Option 5 (Plan Today), as a new sub-section between 5.2 and 5.3:

```markdown
#### 5.2b Ritual Block Suggestions (morning only, skippable)

If the current time is before 12:00 PM and the user hasn't already planned ritual-aligned blocks:

1. Read `data/vision.json` via `cat` — extract `ritualBlueprint.morning.steps` and `domains[].habits`
2. Cross-reference with today's existing plan blocks
3. Suggest up to 3 time blocks that aren't already scheduled:

```
Ritual-aligned blocks (from your blueprint + habits):

1. "Wim Hof + Identity Review" — 5:45-6:15 AM (morning ritual)
   → skip / add / adjust time

2. "Deep Work Block 1" — 9:00-10:30 AM (wealth habit: 3 deep work blocks)
   → skip / add / adjust time

3. "Midday Reset" — 12:00-12:30 PM (midday ritual: walk + breathwork)
   → skip / add / adjust time
```

Rules:
- Only suggest in morning mode (before 12:00 PM)
- Max 3 suggestions
- Each maps to a ritual step or domain habit — show the source in parentheses
- Accept "skip suggestions" to bypass all
- For each "add": write to `plan.csv` with the suggested or adjusted time
- Infer `domain` from the source (ritual step → `personal_growth`, domain habit → that domain's canonical ID)
- Do NOT suggest blocks that overlap with existing plan items
- Do NOT suggest blocks for habits already logged today (e.g., don't suggest gym block if gym=1 already)
```

---

## 10. Verification Route

| Gate | Phase 1-3 | Phase 4 | Phase 5 | Phase 6 |
|------|-----------|---------|---------|---------|
| Build | N/A | Yes — `cd app && npm run build` | Yes — `cd app && npm run build` | N/A |
| Diff review | Yes — `git diff --stat` per phase | Yes | Yes | Yes |
| Cross-doc consistency | Yes — verify domain names, cadences, field refs across all 5 docs | Yes — checkin matches cadence contract | N/A | N/A |
| Browser verification | N/A | N/A | Yes — /plan/day screenshot at morning/midday/evening | N/A |
| API test | N/A | Yes — `curl -X PATCH localhost:3000/api/vision -H 'Content-Type: application/json' -d '{"intentions":{"weekly":"test"}}'` | N/A | N/A |
| Spec adherence | Yes — walk each success criterion | Yes | Yes | Yes |
| Confidence report | Always | Always | Always | Always |

## Abort Conditions

- File content doesn't match expected state when first read (doc may have been edited since spec was written)
- Change requires modifying something outside the declared scope for that phase
- Two spec items conflict with each other
- A checkpoint question answer is "no"
- PATCH endpoint corrupts vision.json (fields dropped or type mismatch)
- 3 consecutive fix cycles fail on the same issue
- A fix introduces a new failure
- `npm run build` fails after Phase 4 or 5 changes and the error is in a file outside scope
