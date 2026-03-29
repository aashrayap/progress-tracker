# Training Program Redesign

## Goal

Redesign gym rotation from generic push/pull/legs to a power/athletic physique program aligned with vision identity ("200lb Olympic lifter, lean, strong, disciplined").

## Design Principles

- **Hamza aesthetic priorities:** lateral delts > upper traps > neck > upper chest > lats > abs
- **Olympic lift integration:** cleans on 3 of 5 lift days (power clean, hang clean, clean & press)
- **Compound-first:** 3-4 compounds per session, finishers are light high-rep isolation
- **Superset format:** pair non-competing muscles or same-equipment exercises (A1↔A2, B1↔B2) to cut session time ~40%
- **7-day fixed schedule:** 5 lift + 2 recovery (Wed/Sun)

## Master Exercise List

### Compounds (15)

| Category | Exercise | Notes |
|----------|----------|-------|
| Power | Power Clean | Current, keep |
| Power | Hang Clean | Variation, less technical |
| Power | Clean & Press | Clean + OHP combined |
| Upper Push | Incline Bench Press | Upper chest priority |
| Upper Push | Overhead Press | Shoulder mass |
| Upper Push | Incline Dumbbell Press | Deeper stretch, upper chest |
| Upper Push | Dip | Chest/tricep compound |
| Upper Pull | Pull-Up / Chin-Up | Lat width |
| Upper Pull | Barbell Row | Back thickness |
| Upper Pull | Lat Pulldown | Lat width, lighter days |
| Upper Pull | Cable Row | Variety |
| Lower | Back Squat | 1x/week |
| Lower | Front Squat | Rack superset candidate |
| Lower | Romanian Deadlift | Posterior chain |
| Lower | Trap Bar Deadlift | Power + posterior |

### Finishers (6)

| Exercise | Target | Freq |
|----------|--------|------|
| Lateral Raise | Lateral delts (Hamza #3) | 2x/week |
| Face Pull | Rear delts + traps, posture | 2x/week |
| Barbell Shrug | Upper traps direct | 1x/week (+3x cleans) |
| Neck Curl/Extension | Neck (Hamza #1) | 1x/week |
| Machine Bicep Curl | Arm aesthetics | 1x/week |
| Hanging Leg Raise | Abs | 2x/week |

### Dropped

- Flat Bench Press — replaced by incline (upper chest > lower chest)
- Lunges — cut for slot efficiency
- Push-Up (programmed) — stays as home dose only

### Home Dose (daily, unchanged)

- 6 pull-ups
- 20 push-ups

## 7-Day Groupings

Optimized for superset equipment proximity.

### Monday — Power + Pull (barbell/floor area)

| Pair | A1 | A2 | Why |
|------|----|----|-----|
| A | Power Clean | Barbell Row | Same barbell, floor |
| B | Pull-Up | Barbell Shrug | Bar area |
| Finisher | Face Pull | | |

### Tuesday — Push + Pull (bench/cable area)

| Pair | A1 | A2 | Why |
|------|----|----|-----|
| A | Incline Bench | Cable Row | Bench + cable |
| B | OHP | Lateral Raise | Standing, grab DBs |
| Finisher | Neck Curl | | |

### Wednesday — Recovery

Zone 2 cardio / walk Cooper.

### Thursday — Power + Lower (rack)

| Pair | A1 | A2 | Why |
|------|----|----|-----|
| A | Hang Clean | Front Squat | Both in the rack |
| B | Trap Bar DL | Hanging Leg Raise | Floor + bar |
| Finisher | Lateral Raise | | |

### Friday — Push + Pull (bodyweight + bench)

| Pair | A1 | A2 | Why |
|------|----|----|-----|
| A | Incline DB Press | Lat Pulldown | Bench + cable |
| B | Dip | Pull-Up | Same station |
| Finisher | Machine Bicep Curl | | |

### Saturday — Power + Lower (rack/barbell)

| Pair | A1 | A2 | Why |
|------|----|----|-----|
| A | Clean & Press | Back Squat | Both rack |
| B | RDL | Face Pull | Barbell + cable |
| Finisher | Hanging Leg Raise | | |

### Sunday — Recovery

Walk Cooper / stretch / mobility.

## Weekly Muscle Frequency

| Muscle Group | Frequency | Source |
|---|---|---|
| Cleans/power | 3x | Mon, Thu, Sat |
| Lats/back | 3x | Mon, Fri, + home pull-ups |
| Upper chest | 2x | Tue, Fri |
| Shoulders | 2x | Tue, Fri |
| Lateral delts | 2x | Tue, Thu (finisher) |
| Upper traps | 4x | 3x cleans + Mon shrugs |
| Legs | 2x | Thu, Sat |
| Abs/core | 2x | Thu, Sat (finisher) |
| Neck | 1x | Tue (finisher) |

## Status

- [x] Research (Hamza aesthetic + athletic physique priorities)
- [x] Master exercise list locked
- [x] 7-day groupings drafted
- [x] User final approval on groupings
- [x] Update `config.ts` (WEEKLY_PROGRAM, exercises, day-of-week rotation)
- [x] Update rotation display in health page (7-column weekly chart)
- [x] Test gym rotation logic with new cycle
