# Progress Tracker

Personal life system: weight, addiction recovery, fitness, money, travel.

## Personal OS Docs

Read these first when starting new work:

1. `docs/personal-os.md` - principles, visual map, operator flow, and phased implementation plan
2. `docs/life-playbook.md` - domain protocols (fitness, meals, addiction, finance, travel)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER (CSVs)                       │
├─────────────┬──────────────┬──────────────┬────────────────┤
│ inbox.csv   │daily_signals │  plan.csv    │ reflections.csv│
│ raw capture │  daily facts │  schedule    │  win/lesson/   │
│ queue       │  + execution │  blocks      │  change        │
├─────────────┴──────────────┴──────────────┴────────────────┤
│ workouts.csv (lift benchmarks) + ideas.csv (triage)        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │ Next.js  │   │ Claude   │   │ Voice Inbox  │
   │ App      │   │ CLI      │   │ Pipeline     │
   │ (app/)   │   │ /log     │   │              │
   │          │   │ /review  │   │ iOS Shortcut │
   │ Reads    │   │ /weekly  │   │ → GH Issue   │
   │ CSVs →   │   │          │   │ → voice-     │
   │ web UI   │   │ Writes   │   │   inbox.sh   │
   │          │   │ to CSVs  │   │ → Claude CLI │
   └──────────┘   └──────────┘   │ → CSV write  │
                                  └──────────────┘
```

### Voice Inbox Pipeline

```
Phone (iOS Shortcut)
  │  dictate voice note
  ▼
GitHub Issue (title: "Voice: ...")
  │  created on aashrayap/progress-tracker
  ▼
voice-inbox.sh (scripts/, runs via launchd every 5s)
  │  polls open issues, filters "Voice" titles
  ▼
Claude CLI (--print, bypassPermissions)
  │  reads .claude/prompts/voice-inbox.md for instructions
  │  parses voice note → writes inbox + routed CSVs
  ▼
CSV write (daily_signals.csv, workouts.csv, reflections.csv, ideas.csv)
  │  git commit + push
  ▼
GitHub Issue closed with summary comment
```

This same pipeline handles workout logging at the gym — voice dictate sets/reps between exercises, each creates an issue, voice-inbox processes them.

#### Launchd Setup

```
Plist: ~/Library/LaunchAgents/com.ash.voice-inbox.plist
Interval: 5s
Logs:
  ~/.local/log/voice-inbox.log       (app log)
  ~/.local/log/voice-inbox-stdout.log (Claude CLI output)
  ~/.local/log/voice-inbox-stderr.log (errors)
```

Reload after changes: `launchctl unload ~/Library/LaunchAgents/com.ash.voice-inbox.plist && launchctl load ~/Library/LaunchAgents/com.ash.voice-inbox.plist`

### Next.js App

```
app/
├── app/
│   ├── page.tsx          ← / (Hub)
│   ├── plan/page.tsx     ← /plan (Calendar planner)
│   ├── api/
│   │   ├── hub/route.ts  ← hub + next-action payload
│   │   ├── daily-signals/← canonical daily facts API
│   │   ├── inbox/route.ts← review queue API
│   │   ├── ideas/route.ts← idea triage API
│   │   ├── health/route.ts← health dashboard API
│   │   ├── reflections/  ← reflection + deep-work APIs
│   │   ├── plan/         ← CRUD for plan.csv
│   │   └── todos/        ← CRUD for todos.csv
│   ├── components/       ← YearView, MonthView, WeekView, DayView, etc.
│   └── lib/
│       ├── config.ts     ← static config (profile, exercises, triggers)
│       └── csv.ts        ← CSV read/write utilities
```

## Data

### daily_signals.csv — Canonical daily signals

```
date,signal,value,unit,context,source,capture_id,category
```

| signal | values | meaning |
|--------|--------|---------|
| weight | number | lbs |
| lol, weed, poker | 0/1 | 0=relapse, 1=clean |
| gym, sleep, meditate, deep_work, ate_clean | 0/1 | 0=missed, 1=done |
| calories | number | daily total |
| trigger | text | what caused craving |
| relapse | text | what was relapsed on |
| reset | 1 | marks a reset day |

### workouts.csv — Set-level gym data (planned)

```
date,workout,exercise,set,weight,reps,notes
```

### plan.csv — Daily schedule

```
date,start,end,item,done,notes
```

### todos.csv — Task backlog

```
id,item,done,created
```

### reflections.csv — Daily micro-reflections

```
date,domain,win,lesson,change
```

| domain | meaning |
|--------|---------|
| gym | workout reflection |
| addiction | recovery reflection |
| deep_work | focused work reflection |
| eating | nutrition reflection |
| sleep | sleep quality reflection |

---

# Pillars

## 1. Weight

**Current: 245 lbs | Goal: 200 by Jun 30**

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

*Deep reference: docs/life-playbook.md*

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

*Deep reference: docs/life-playbook.md*

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

*Deep reference: docs/life-playbook.md*

---

## 4. Travel

**Poland (Basia)** — 3 trips planned for 2026

| Trip | Window |
|------|--------|
| Spring | Apr-May |
| Summer | Jul-Aug |
| Winter | Dec |

**Budget:** ~$1,300/trip (flights + food)

*Deep reference: docs/life-playbook.md*

---

## 5. Fitness Protocol

**Gym 5x/week** (habit > optimization)

Rotation: A → B → C → A → ... (completion-based, not calendar-based)

| Workout | Exercises |
|---------|-----------|
| Day A | squat / bench / lat_pulldown |
| Day B | squat / incline_bench / cable_row |
| Day C | squat / ohp / barbell_row |

Next workout determined by last `gym=1` completion in `daily_signals.csv` (via shared CSV layer and surfaced in `/api/health`)

Each session: 30-35 min compound lifts, 3 exercises x 3 sets

**Cardio:** Daily dog walks, 20-45 min

*Deep reference: docs/life-playbook.md*

---

## 6. Meals

**Elk bowl protocol**

| Meal | Contents |
|------|----------|
| Lunch | 8oz elk, 1c rice, 1c veg |
| Dinner | 8oz elk, 1c rice, 1c veg |
| Snacks | Raw carrots, beets |

**Daily totals:** ~1,400 cal base, 115g protein

*Deep reference: docs/life-playbook.md*

---

# Skills

| Skill | Purpose | Triggers |
|-------|---------|----------|
| /log | Data entry → daily_signals.csv (+ inbox/workouts as needed) | log weight, log day, log trigger, log relapse |
| /reflect | Daily micro-AAR → reflections.csv | reflect, what did I learn, end of day review |
| /weekly-review | Accountability, metrics check | plan the week, weekly review, how did I do |
| /review-notes | Review notes/activity across all CSVs | review notes, what happened, show notes |

---

# Rules

- **CSVs are truth** — inbox.csv (capture), daily_signals.csv (daily facts), plan.csv (schedule), todos.csv (tasks), workouts.csv (benchmarks), reflections.csv (win/lesson/change), ideas.csv (triage)
- **CLAUDE.md is context** — always loaded
- **docs/ is reference** — read when needed
- **Minimal by default** — no bloat
- **Delete > comment** — no dead code
- **Voice-first input** — at gym/on-the-go, iOS Shortcut → GitHub Issue → auto-processed
