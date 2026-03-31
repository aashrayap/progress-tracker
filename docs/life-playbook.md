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
| **Weekly** | Sundays | Score card, domain spotlight, update Actual + Habits in vision, set weekly intention/goals, stale review | `daily_signals.csv`, `reflections.csv`, `vision.json` (domains[].actual, domains[].habits, intentions.weekly) |
| **Monthly** | Last Sunday of month | Month trajectory report, rewrite identity script + anti-vision, update intentions, review inputControl | `daily_signals.csv`, `vision.json` (identityScript, antiVision, intentions) |
| **Quarterly** | Every 3 months | Full ABT(H) rebuild (Becoming + Timeline), ritualBlueprint overhaul, habitAudit, inputControl purge | `vision.json` (all fields) |

### Write Routing Rules

| Data type | Destination | Example |
|-----------|------------|---------|
| Daily signal (binary habit, weight, mood) | `daily_signals.csv` | gym=1, weight=225, feeling=focused |
| Workout sets | `workouts.csv` | squat, set 3, 225 lbs, 5 reps |
| Reflection (win/lesson/change) | `reflections.csv` | health domain, "hit all 6 sessions" |
| Time block | `plan.csv` | 9:00-10:30, Deep work, career |
| Action item | `todos.csv` | "Ship auth refactor", career |
| Identity/vision content | `vision.json` | identityScript rewrite, domain actual update |

Rule: signals and evidence go to CSVs. Identity and direction go to vision.json. Rules go to this playbook. System behavior goes to app-intent.md.

## Surface Interaction Flow

| Time | Surface | Purpose |
|------|---------|---------|
| Morning | `/plan/day` | Read ritual checklist, identity anchor, review intentions + briefing, run /checkin |
| Midday | `/plan/day` | Execute plan blocks, toggle done, midday ritual reference |
| Evening | `/plan/day` | Review day, run /checkin for decompress + reflect + set tomorrow |
| Sunday | `/vision` | Weekly deep review: full identity, habit grid, ABT(H), run /checkin weekly |

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
