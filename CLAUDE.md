# Progress Tracker

Personal life system: weight, addiction recovery, money, travel.

## Architecture

```
CLAUDE.md ◄── ALWAYS LOADED (summary of all pillars)
    │
log.csv ◄──── SOURCE OF TRUTH (all daily tracking)
    │
docs/ ◄─────── DEEP REFERENCE (protocols, science, details)
    │
.claude/skills/ ◄── BEHAVIORS (how Claude helps)
```

## Data

**log.csv** — All tracking data lives here.

```
date,metric,value,notes
```

| metric | values | meaning |
|--------|--------|---------|
| weight | number | lbs |
| lol, weed, poker | 0/1 | 0=relapse, 1=clean |
| gym, sleep, meditate, deep_work, ate_clean | 0/1 | 0=missed, 1=done |
| trigger | text | what caused craving |
| relapse | text | what was relapsed on |

---

# Pillars

## 1. Weight

**Current: 240 lbs | Goal: 200 by Jun 1**

| Metric | Value |
|--------|-------|
| Height | 6'0" |
| Age | 30 |
| BMR | 2,089 cal |
| TDEE (light) | 2,872 cal |

**Protocol:**
- 1,900 cal/day
- 180g protein
- 8k steps

**Rate:** ~2 lbs/week at this deficit

*Deep reference: docs/fitness.md, docs/meals.md*

---

## 2. Addiction Recovery

**90-Day Reset: Feb 1 → May 2**

| Substance | Status |
|-----------|--------|
| League of Legends | Quit cold turkey |
| Weed | Quit cold turkey |
| Poker | Quit cold turkey |

**Why it matters:**
- Dopamine system is fried from high-stimulation inputs
- Need 90 days for receptor restoration
- Normal life feels flat until baseline recovers

**Known triggers:**
| Trigger | Risk | Pattern |
|---------|------|---------|
| Poker loss | HIGH | Loss → dopamine crash → seeks hit |
| Late night + friends | HIGH | Social + late = cascade |
| Boredom, evening | MEDIUM | Unstructured time |

**Emergency protocol:**
1. Recognize: "This is withdrawal, not need"
2. Delay: 10-minute timer
3. Move: Walk, pushups, cold water
4. Remind: "Dopamine is healing"

*Deep reference: docs/addictions.md, docs/dopamine-reset.md*

---

## 3. Money

**Net worth: $500k | Goal: $1M by age 37**

| Year | Age | Projected |
|------|-----|-----------|
| 2026 | 31 | $550k |
| 2028 | 33 | $665k |
| 2030 | 35 | $805k |
| 2032 | 37 | $1M |

**Strategy:** Hold S&P, assume 10% annual return, no contributions needed.

*Deep reference: docs/finance.md*

---

## 4. Travel

**Poland (Basia)** — 3 trips planned for 2026

| Trip | Window |
|------|--------|
| Spring | Apr-May |
| Summer | Jul-Aug |
| Winter | Dec |

**Budget:** ~$1,300/trip (flights + food)

*Deep reference: docs/2026-plans/travel.md*

---

## 5. Fitness Protocol

**Gym 5x/week** (habit > optimization)

| Day | Workout |
|-----|---------|
| Mon | Day A |
| Tue | Day B |
| Wed | Day A |
| Thu | Day B |
| Fri | Day A |

Each session: 30-45 min lift + 20 min sauna/meditation

*Deep reference: docs/workout.md*

---

## 6. Meals

**Elk bowl protocol**

| Meal | Contents |
|------|----------|
| Lunch | 8oz elk, 1c rice, 1c veg |
| Dinner | 8oz elk, 1c rice, 1c veg |
| Snacks | Raw carrots, beets |

**Daily totals:** ~1,400 cal base, 115g protein

*Deep reference: docs/meals.md*

---

# Skills

| Skill | Purpose |
|-------|---------|
| /log | Data entry → log.csv |
| /weekly-review | Accountability, metrics check |

---

# Rules

- **log.csv is truth** — all tracking data
- **CLAUDE.md is context** — always loaded
- **docs/ is reference** — read when needed
- **Minimal by default** — no bloat
- **Delete > comment** — no dead code
