# Research: Daily Ritual Alignment

## Flagged Items
- Q12: Medium confidence — exact checkin → reflections.csv flow not fully traced
- Q17: Medium confidence — ritual review exists but is passive (read-only checkboxes), not active guided reinforcement
- Q19: Medium confidence — feedback loop structure exists but loop-closing is explicitly called out as a gap in app-intent.md

## Findings

### Q1: What does the current vision page display?
- **Answer**: `/vision` page is the consolidated daily entry point. Displays: identity script + core traits, 4-domain vision cards (health/wealth/love/self) with Actual→Becoming→Timeline + habits, 90-day habit grid with daily scoring, daily/weekly intentions, briefing card (state + priorities), experiments tracker, ritual blueprint tabs (morning/midday/evening) with review checkboxes that log `vision_reviewed` signals, and a motivation quote.
- **Confidence**: high
- **Evidence**: `app/app/vision/page.tsx`
- **Conflicts**: none
- **Open**: none

### Q2: What does vision.json contain?
- **Answer**: 6 top-level keys: `identityScript` (coreTraits, nonNegotiables, languageRules.use/forbid, physicalPresence, socialFilter, decisionStyle), `antiVision`, `domains` (4 domains with id/label/hex/canonicalIds/actual/becoming/timeline/habits), `intentions` (daily/weekly mantras), `ritualBlueprint` (morning/midday/evening with steps + habitStacks), `inputControl` (mentors/books/podcasts/playlists/nutritionRules/purgeList), `distractions` (digital/physical/social/mental + triggerReplacements), `habitAudit` (productive/neutral/destructive).
- **Confidence**: high
- **Evidence**: `data/vision.json`, `app/app/lib/types.ts:191-262`
- **Conflicts**: none
- **Open**: none

### Q3: What does /plan display?
- **Answer**: `/plan` redirects to `/plan/day`. Sub-routes: day/week/month/year. PlanProvider wrapper manages zoom, date focus, breadcrumbs, todos sidebar.
- **Confidence**: high
- **Evidence**: `app/app/plan/page.tsx`, `app/app/plan/layout.tsx`, route files
- **Conflicts**: none
- **Open**: none

### Q4: Does plan day view have morning/afternoon/evening sections?
- **Answer**: No predefined sections. Uses continuous time blocks (decimal hours). All-day events in banner, timed events sorted by start time, NowLine for current time, optional intention banner with daily/weekly mantras.
- **Confidence**: high
- **Evidence**: `app/app/components/DayView.tsx`
- **Conflicts**: none
- **Open**: none

### Q5: What does the hub route display?
- **Answer**: `/` redirects to `/vision`. No separate Hub — vision page absorbed Hub functionality in March 2026 consolidation.
- **Confidence**: high
- **Evidence**: `app/app/page.tsx`
- **Conflicts**: none
- **Open**: none

### Q6: What does /checkin capture?
- **Answer**: Sleep (first question), daily habits (gym, meditate, deep_work, ate_clean, weed, lol, poker, clarity), mood, reflections (win/lesson/change per domain), inbox triage, plan updates. Writes to daily_signals.csv, reflections.csv, todos.csv. Logs checkin_daily/weekly/monthly completion flags.
- **Confidence**: high
- **Evidence**: `.claude/skills/checkin/SKILL.md:51-78`
- **Conflicts**: none
- **Open**: none

### Q7: What does the briefing pipeline produce?
- **Answer**: Generates `data/briefing.json` via Claude CLI every 60s. Reads daily_signals, reflections, plan, todos, quotes, briefing_feedback CSVs. Output: state (recovery|momentum|neutral|danger|explore|disruption), insight, priorities (3-4 items), quote, generated_at, input_hash, verified.
- **Confidence**: high
- **Evidence**: `scripts/briefing-pipeline.sh`, `data/briefing.json`
- **Conflicts**: none
- **Open**: none

### Q8: What signals exist in daily_signals.csv?
- **Answer**: `weight`, `lol` (0|1), `weed` (0|1), `poker` (0|1), `gym` (0|1), `sleep` (0|1), `meditate` (0|1), `deep_work` (0|1), `ate_clean` (0|1), `clarity` (0|1), `trigger` (text), `relapse` (text), `vision_reviewed` (1 with morning|afternoon|evening context), `intention` (mantra text), `checkin_daily/weekly/monthly` (flags).
- **Confidence**: high
- **Evidence**: `data/daily_signals.csv`, `docs/data-schemas.md:28-47`
- **Conflicts**: none
- **Open**: none

### Q9: What does plan.csv look like?
- **Answer**: `date,start,end,item,done,notes,domain`. Time blocks use decimal hours (9.5 = 9:30AM). All-day events have start=end. Done: empty/1/0. Example blocks: Wake up, Meditate, Journal, Work meeting, Deep work, Gym.
- **Confidence**: high
- **Evidence**: `data/plan.csv`
- **Conflicts**: none
- **Open**: none

### Q10: Does the app have identity script / north star concepts?
- **Answer**: Yes, fully in `data/vision.json`. `identityScript` (coreTraits, nonNegotiables, languageRules, physicalPresence, socialFilter, decisionStyle), `antiVision` (unwanted state), and 4-domain ABT model (actual→becoming→timeline per domain + habits). Currently read-only on vision page.
- **Confidence**: high
- **Evidence**: `data/vision.json`, `app/app/vision/page.tsx`
- **Conflicts**: none
- **Open**: none

### Q11: What does /health display?
- **Answer**: Weight trend, gym streak/last 7 days, today's workout template + set history, weight chart, exercise progress (best sets), recent workout history, eating summary, gym reflection, grocery checklist. Connected via daily_signals (gym=1), workouts.csv (sets), reflections.csv (gym domain), plan.csv (auto-complete "Gym" items).
- **Confidence**: high
- **Evidence**: `app/app/health/page.tsx`
- **Conflicts**: none
- **Open**: none

### Q12: What reflection/review mechanisms exist?
- **Answer**: `/checkin` captures reflections (win/lesson/change per domain) → reflections.csv. `/weekly-review` is read-only (score card, mood arc). Reflections appear on /health as gym-domain cards and feed briefing generation. Vision page has ritual blueprint review checkboxes logging `vision_reviewed` signals.
- **Confidence**: medium
- **Evidence**: `.claude/skills/checkin/SKILL.md`, `.claude/skills/weekly-review/SKILL.md`, `data/reflections.csv`
- **Conflicts**: none
- **Open**: Exact reflection capture flow in checkin

### Q13: Current navigation structure?
- **Answer**: 4 top-level tabs: Vision, Plan, Health, Resources. Sticky top bar. `/` → `/vision`. Flat nav (no nested routes visible to user, `/plan/*` uses in-page breadcrumbs).
- **Confidence**: high
- **Evidence**: `app/app/components/BottomNav.tsx:6-11`, `app/app/page.tsx`
- **Conflicts**: none
- **Open**: none

### Q14: Does experiments.csv exist?
- **Answer**: Yes. Schema: `name,hypothesis,start_date,duration_days,domain,status,verdict,reflection`. One active experiment: "Sensing meditation micro check-ins" (personal_growth, 9 days, started 2026-03-13). Tracks N-of-1 experiments with hypothesis, time-box, verdict.
- **Confidence**: high
- **Evidence**: `data/experiments.csv`
- **Conflicts**: none
- **Open**: none

### Q16: Where does ABT(H) formula live?
- **Answer**: In `vision.json` domains array. Each of 4 domains (health/wealth/love/self) has: `actual` (current state), `becoming` (target state), `timeline` (deadline), `habits` (3-5 habit statements). Example: health becoming="200 lbs with athletic Olympic lifter build", timeline="December 2026". Currently read-only. App-intent notes checkin→vision.json writes are deferred.
- **Confidence**: high
- **Evidence**: `data/vision.json:14-80`, `docs/app-intent.md:119-128`
- **Conflicts**: none
- **Open**: Vision page is read-only — no mechanism to update A (actual) as progress is made

### Q17: Does system support identity reinforcement?
- **Answer**: Partially. Ritual blueprint in vision.json has morning step "Review identity script" and midday step "Review identity script". Vision page displays identity script in collapsible section. Review checkboxes log `vision_reviewed` signal (morning/afternoon/evening). However, review is passive (read-only), not active guided affirmation. No interactive prompts or writing exercises.
- **Confidence**: medium
- **Evidence**: `data/vision.json:85-101`, vision page code, `docs/app-intent.md:120`
- **Conflicts**: none
- **Open**: Whether future skills will add interactive guided review

### Q18: Is there input audit or distraction tracking?
- **Answer**: Static definitions only in vision.json: `inputControl` (approved mentors/books/podcasts/playlists/nutritionRules/purgeList), `distractions` (digital/physical/social/mental categories + triggerReplacements), `habitAudit` (productive/neutral/destructive). NOT tracked over time in daily_signals. Reflections from March 2026 mention "Document consumption channels" as pending.
- **Confidence**: high
- **Evidence**: `data/vision.json:133-191`, `data/reflections.csv`
- **Conflicts**: none
- **Open**: Whether consumption tracking will be added to daily_signals

### Q19: Does system track compressed cycles / feedback loops?
- **Answer**: Partially. Daily signals capture action, reflections capture feedback, but no automated loop-closing exists. Briefing pipeline generates insights from all CSVs but doesn't trace habit→reflection→adjustment chains. Experiments.csv is closest to compressed cycles (hypothesis→verdict). App-intent explicitly calls out: "Capture works; retrieval and loop-closing are the gaps to fix."
- **Confidence**: medium
- **Evidence**: `docs/app-intent.md:56`, `data/experiments.csv`
- **Conflicts**: none
- **Open**: How frequently patterns are re-evaluated

## Patterns Found
- Pattern: Vision page is read-only ritual surface — no edit modals, content authored via JSON or future skills
- Pattern: Write Router side effects chain signals (gym=1 → auto-complete plan item "Gym")
- Pattern: `vision_reviewed` signal logged with morning/afternoon/evening context — already supports 3-phase ritual tracking
- Pattern: Ritual Blueprint in vision.json defines morning/midday/evening steps but app renders them as passive checklists
- Pattern: Briefing pipeline runs continuously (60s interval), generates state-aware insight from all CSVs
- Pattern: Checkin skill is the primary data entry point for habits/signals — covers morning ritual capture
- Pattern: Plan day view has intention banner showing daily/weekly mantras from vision data

## Core Docs Summary

| Doc | Vision Page | Planning System | Daily Rituals | Surface Interaction |
|-----|-------------|-----------------|----------------|---------------------|
| **architecture.md** | Merged Hub+Vision; single entry point; reads /api/vision | /plan shows day/week/month calendar; auto-complete via write router | Voice inbox + write router orchestrate capture-to-action | 4-layer model; surfaces consume don't define; flat nav |
| **data-schemas.md** | Stores Reinvention Formula (ABT(H), identity, ritual, inputs, habits) in vision.json; vision_reviewed signal tracks checkpoints | plan.csv: time blocks with auto-complete side effects for Gym/Sleep/Meditate/Deep work | Ritual blueprint has 3 sections; insights qualified by recurrence/streaks/trends; max 3 active | CSVs are truth; signals flow through router |
| **app-intent.md** | Vision as gravity center; daily startup gives one clear next move; read-only; vision-driven | Plan is medium gravity, occasional use | Operating priorities: sleep(5)→eating(4)→training(3)→addiction(2)→deep_work(1) | Fewer surfaces more gravity; loop-closing is the gap |
| **life-playbook.md** | N/A | Work 8-4, Gym 5:30-6:30AM or 11AM, 2+ deep work blocks | Recharge menu for depletion; interruption sequence for triggers; zero-negotiation boundaries | Operating priorities cascade through insight scoring |

## Open Questions
- How/when does the "actual" field in vision.json domains get updated as progress happens?
- When will checkin→vision.json writes be implemented (currently deferred per app-intent)?
- How should the plan day view surface ritual context (ritual reminders are deferred)?
- Does the evening review need its own dedicated UI or is the vision page review sufficient?
