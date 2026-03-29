Status: shipped

# Feature: Health Page Redesign — Weekly Program Chart

## 1. Problem Statement

```
PROBLEM:
- What: The /health page shows a single workout card for "next workout" based on a
        completion-driven A-G rotation. There is no visibility into the full week,
        no superset groupings, and no way to tap into per-exercise history in context.
- Why:  The training program is a fixed Mon-Fri schedule with superset pairs. The
        current single-card view doesn't reflect that structure, and the A-G rotation
        silently falls back to "A" when gym signals lack a workout key (a known data
        quality issue). A fixed day-of-week model eliminates the silent-fallback problem.
- User-facing effect: On page load, a 7-column weekly chart (Mon-Sun) shows the full
        program, today highlighted, with superset pairs visually grouped. Tapping a
        column filters the exercise history below to that day's exercises.
```

## 2. Affected Files

```
SCOPE:
- Files to modify:
    app/app/lib/config.ts              — add WEEKLY_PROGRAM constant (exercise pairs, sets/reps)
    app/app/lib/csv.ts                 — replace getNextWorkout() with getTodayWorkout()
    app/app/api/health/route.ts        — return weekly program + per-day exercise history
    app/app/health/page.tsx            — full redesign: weekly chart + filtered history
    app/app/components/ExerciseHistory.tsx — accept optional exerciseIds filter prop
    scripts/precompute-checkin.js      — update WORKOUT_CYCLE day-of-week lookup

- Files to create:
    app/app/components/WeeklyProgramChart.tsx — new component for the 7-column chart

- Files that must NOT change:
    app/app/lib/csv.ts (all non-workout functions)
    app/app/api/daily-signals/route.ts
    app/app/api/plan/route.ts
    app/app/api/todos/route.ts
    app/app/api/hub/route.ts
    app/app/plan/ (all files under this directory)
    app/app/components/DayView.tsx
    app/app/components/WeekView.tsx
    app/app/components/MonthView.tsx
    app/app/components/YearView.tsx
    app/app/components/BottomNav.tsx
    data/*.csv (no schema changes)
    scripts/voice-inbox.sh
    scripts/precompute-plan.js
    scripts/briefing-pipeline.sh
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page/route: /health
- Viewport: 390x844 (iPhone — primary), 1280x800 (desktop)

What the user SHOULD see:

Page structure (top to bottom):
  1. "Health" h1 heading
  2. Weekly program chart — horizontal scroll container, 7 columns
  3. Exercise history section — filtered to selected column's exercises

Weekly chart columns (Mon-Sun):
  - Each column: min-w-[140px], rounded-xl, bg-zinc-900/60, border border-white/10
  - Column header: day name (Mon/Tue/…/Sat/Sun) + date number (e.g. "28")
  - Today column: border-l-2 border-blue-500, bg-zinc-800, blue date pill
    (text-blue-400 date number on bg-blue-500/20 rounded pill)
  - Completed days (gym=1 signal): green checkmark (✓) in header, all exercise
    names text-zinc-500
  - Sat/Sun columns: "Rest" label centered, greyed out (text-zinc-600), no exercise rows
  - Pair A rows: left accent stripe bg-violet-500, cell bg-violet-500/10
  - Pair B rows: left accent stripe bg-amber-500, cell bg-amber-500/10
  - Finisher row: bg-zinc-800/60, no colored stripe
  - Exercise cell content: name (text-xs, truncate) + scheme (text-[10px] text-zinc-500)
    e.g. "Power Clean" + "5×3"

Selection state:
  - On tap/click of a column: ring-1 ring-zinc-500 on that column
  - Exercise history section below updates to show exercises matching that day
  - On load: today's column is selected by default

Exercise history (below chart):
  - Shows only exercises that appear in the selected day's program
  - Per exercise: name, last 2-3 sessions (date, weight×reps), overload delta
  - If no history for selected exercises: "No history yet for [Day] exercises."
  - Structure follows existing ExerciseHistory component pattern

What the user should NOT see:
  - Stats row (Gym Streak / Last 7 Days / Eating) — removed
  - WorkoutCard component — removed
  - WeightChart component — removed
  - GroceryCard component — removed
  - No console errors
  - No layout overflow (chart scrolls horizontally, page scrolls vertically)
  - No "next workout" single-card view
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Build passes: cd app && npm run build — zero TypeScript/Next.js errors
- [ ] /health loads without console errors; 7 columns render (Mon-Sun visible via scroll)
- [ ] Today's column is highlighted: border-l-2 border-blue-500, blue date pill
- [ ] Superset pairs render: Pair A = violet stripe, Pair B = amber stripe, Finisher = neutral
- [ ] Tapping a column selects it (ring-1 ring-zinc-500) and exercise history filters to
      that day's exercises
- [ ] Sat/Sun columns show "Rest" with no exercise rows
- [ ] Completed days (gym=1 in daily_signals) show ✓ in header and dimmed exercise names
- [ ] No files modified outside declared scope (git diff --stat check)
- [ ] scripts/precompute-checkin.js still produces valid JSON output after changes
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `cd app && npm run build` output | Fix code, rebuild — do not report done until clean |
| Console error | Browser console on /health load | Trace to source, fix before proceeding |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| API failure | Network tab — /api/health non-200 | Fix route handler, check types |
| Missing today highlight | No blue styling on today column | Re-check isToday logic in WeeklyProgramChart |
| Scope violation | `git diff --stat` shows unexpected files | Revert unintended changes immediately |
| Criterion not met | Walk success criteria list | Re-read spec, implement missing piece |
| Regression in /plan | Navigate /plan/day — any visual break | Revert health page changes that bled across |
| precompute-checkin broken | `node scripts/precompute-checkin.js` throws | Fix rotation lookup, ensure valid JSON output |

## 6. Invariants

```
INVARIANTS:
- data/*.csv files must not be modified or have schema changes
- All non-workout functions in app/app/lib/csv.ts must be preserved exactly
- /plan, /vision, /resources routes must be visually unchanged after this work
- The voice intake pipeline (scripts/voice-inbox.sh, inbox.csv) must remain untouched
- workouts.csv schema (date,workout,exercise,set,weight,reps,notes) must not change
- daily_signals.csv schema must not change — gym=1/0 signals remain the completion record
- getTodayWorkout() must never write to any file — read-only function
- ExerciseHistory component must remain usable without a filter (backward-compatible prop)
- No new top-level routes created
- No new npm dependencies added
```

## 7. Per-File Checkpoints

After completing each file, answer YES/NO before proceeding. Stop and explain any NO.

**config.ts**
- [ ] WEEKLY_PROGRAM is a new constant, not replacing existing config fields
- [ ] All existing exports (HABIT_CONFIG, config, normalizeWorkoutKey, RotationDay, etc.) preserved unchanged
- [ ] Exercise IDs in WEEKLY_PROGRAM match IDs in config.exercises (e.g. "barbell_row", "incline_bench")
- [ ] Sets/reps schemes match the spec table below exactly

**csv.ts**
- [ ] Only the gym rotation section modified (lines ~672-700)
- [ ] getNextWorkout() replaced by getTodayWorkout() — old function removed, not kept alongside
- [ ] getTodayWorkout() accepts (weekday: number) — 0=Sun, 1=Mon, …, 6=Sat
- [ ] getTodayWorkout() returns the program day key string ("Mon"/"Tue"/…) or null for Sat/Sun
- [ ] All other exports from csv.ts are untouched and still compile

**api/health/route.ts**
- [ ] Old getNextWorkout() call replaced with getTodayWorkout()
- [ ] Response shape includes weeklyProgram array (see §8 API shape)
- [ ] Response still includes exerciseProgress and workoutHistory for ExerciseHistory
- [ ] Old displayWorkout / WorkoutCard-oriented fields (templateKey, displayTemplate,
      displayExercises, totalSets, cardioInfo, isCardio, exerciseTargets) removed from response
      (they are only consumed by WorkoutCard which is being removed)

**WeeklyProgramChart.tsx (new)**
- [ ] Self-contained — no cross-component state leakage
- [ ] Accepts weeklyProgram, workoutDays, gymSignals, selectedDay, onSelectDay as props
- [ ] Follows isToday pattern: `toDateStr(new Date())` comparison
- [ ] Follows blue highlight tokens: bg-blue-500/5, border-blue-500/30, text-blue-400
- [ ] Horizontal scroll container uses overflow-x-auto + flex, snap-x snap-mandatory on mobile
- [ ] No inline styles — Tailwind classes only

**ExerciseHistory.tsx**
- [ ] New optional prop `exerciseIds?: string[]` added — backward compatible (undefined = show all)
- [ ] When exerciseIds provided: filters progressEntries and workoutHistory to matching exercises only
- [ ] Existing prop interface and internal logic otherwise unchanged

**health/page.tsx**
- [ ] WorkoutCard, WeightChart, GroceryCard imports removed
- [ ] Stats row (gymStreak, gymLast7, eatingSummary) removed from render
- [ ] No /api/groceries fetch call
- [ ] WeeklyProgramChart + filtered ExerciseHistory are the only rendered sections
- [ ] selectedDay state initialized to today's weekday key

**scripts/precompute-checkin.js**
- [ ] WORKOUT_CYCLE array replaced with DAY_OF_WEEK_MAP object
- [ ] buildCard2 and buildDigest logic updated — last workout label derived from date's weekday
- [ ] Output shape of last_workout unchanged: { date, day, next }
- [ ] node scripts/precompute-checkin.js runs without error after change

## 8. Diff Contracts

### config.ts — add WEEKLY_PROGRAM

**WHAT**: Add `WEEKLY_PROGRAM` constant mapping Mon-Fri to superset pairs + finisher with set schemes.

**WHY**: Training program data is static config (design decision #13). Component needs structured data to render pairs/finisher with correct colors and schemes.

**PRESERVES**: All existing exports — config, HABIT_CONFIG, normalizeWorkoutKey, LEGACY_WORKOUT_ALIASES, extractWorkoutToken, RotationDay type.

**REMOVES**: Nothing.

**RISK**: If an exercise ID in WEEKLY_PROGRAM doesn't match config.exercises, the history filter will silently return no results. Mitigate by using exact IDs from config.exercises.

```typescript
// Add after existing exports in config.ts

export type PairLabel = "A" | "B" | "finisher";

export interface ProgramExercise {
  id: string;        // must match an id in config.exercises
  name: string;      // display name
  scheme: string;    // e.g. "5×3", "4×6-8"
  pair: PairLabel;
}

export interface ProgramDay {
  key: string;       // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  label: string;     // "Monday" etc.
  isRest: boolean;
  exercises: ProgramExercise[];
}

export const WEEKLY_PROGRAM: ProgramDay[] = [
  {
    key: "Mon", label: "Monday", isRest: false,
    exercises: [
      { id: "power_clean",   name: "Power Clean",          scheme: "5×3",    pair: "A" },
      { id: "barbell_row",   name: "Barbell Row",           scheme: "4×6-8",  pair: "A" },
      { id: "incline_bench", name: "Incline Bench",         scheme: "4×6-8",  pair: "B" },
      { id: "lat_pulldown",  name: "Lat Pulldown",          scheme: "3×8-10", pair: "B" },
      { id: "face_pull",     name: "Face Pull",             scheme: "3×12-15",pair: "finisher" },
    ],
  },
  {
    key: "Tue", label: "Tuesday", isRest: false,
    exercises: [
      { id: "squat",         name: "Back Squat",            scheme: "4×6-8",  pair: "A" },
      { id: "rdl",           name: "RDL",                   scheme: "4×6-8",  pair: "A" },
      { id: "pullup",        name: "Pull-Up",               scheme: "3×8-10", pair: "B" },
      { id: "dip",           name: "Dip",                   scheme: "3×8-10", pair: "B" },
      { id: "lat_raise",     name: "Lateral Raise",         scheme: "3×12-15",pair: "finisher" },
    ],
  },
  {
    key: "Wed", label: "Wednesday", isRest: false,
    exercises: [
      { id: "deadlift",      name: "Deadlift",              scheme: "4×6-8",  pair: "A" },
      { id: "barbell_row",   name: "Barbell Row",           scheme: "4×6-8",  pair: "A" },
      { id: "incline_bench", name: "Incline Bench",         scheme: "4×6-8",  pair: "B" },
      { id: "face_pull",     name: "Face Pull",             scheme: "3×12-15",pair: "B" },
      { id: "neck_curl",     name: "Neck Curl",             scheme: "3×12-15",pair: "finisher" },
    ],
  },
  {
    key: "Thu", label: "Thursday", isRest: false,
    exercises: [
      { id: "hang_clean",    name: "Hang Clean",            scheme: "5×3",    pair: "A" },
      { id: "front_squat",   name: "Front Squat",           scheme: "3×8-10", pair: "A" },
      { id: "lunges",        name: "Lunges",                scheme: "3×8-10", pair: "B" },
      { id: "barbell_shrug", name: "Barbell Shrug",         scheme: "3×12-15",pair: "B" },
      { id: "lat_raise",     name: "Lateral Raise",         scheme: "3×12-15",pair: "finisher" },
    ],
  },
  {
    key: "Fri", label: "Friday", isRest: false,
    exercises: [
      { id: "power_clean",   name: "Power Clean",           scheme: "5×3",    pair: "A" },
      { id: "ohp",           name: "OHP",                   scheme: "4×6-8",  pair: "A" },
      { id: "hanging_leg_raise", name: "Hanging Leg Raise", scheme: "3×12-15",pair: "B" },
      { id: "machine_bicep_curl", name: "Machine Bicep Curl", scheme: "3×12-15",pair: "B" },
      { id: "lat_pulldown",  name: "Lat Pulldown",          scheme: "3×8-10", pair: "finisher" },
    ],
  },
  { key: "Sat", label: "Saturday", isRest: true, exercises: [] },
  { key: "Sun", label: "Sunday",   isRest: true, exercises: [] },
];
```

**NOTE**: Some exercise IDs in WEEKLY_PROGRAM (power_clean, hang_clean, dip, deadlift,
barbell_shrug, hanging_leg_raise, neck_curl, face_pull) do not yet exist in config.exercises.
Add them to the relevant category before using them in WEEKLY_PROGRAM:

```typescript
// Add to config.exercises:
power: [
  { id: "power_clean",  name: "Power Clean",    sets: 5, reps: "3"     },
  { id: "hang_clean",   name: "Hang Clean",     sets: 5, reps: "3"     },
],
pull: [
  // existing entries...
  { id: "face_pull",    name: "Face Pull",      sets: 3, reps: "12-15" },
],
legs: [
  // existing entries...
  { id: "deadlift",     name: "Deadlift",       sets: 4, reps: "6-8"   },
  { id: "dip",          name: "Dip",            sets: 3, reps: "8-10"  },
],
core: [
  // existing entries...
  { id: "neck_curl",         name: "Neck Curl",         sets: 3, reps: "12-15" },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", sets: 3, reps: "12-15" },
  { id: "barbell_shrug",     name: "Barbell Shrug",     sets: 3, reps: "12-15" },
],
```

---

### csv.ts — replace getNextWorkout() with getTodayWorkout()

**WHAT**: Remove completion-based getNextWorkout(); add day-of-week getTodayWorkout().

**WHY**: Fixed day-of-week rotation eliminates the silent-fallback-to-"A" bug (see research Q3/Q7). Design decision #13.

**PRESERVES**: Everything outside the ~30-line gym rotation block (lines ~672-700).

**REMOVES**: `getNextWorkout()` function and `GYM_ROTATION` constant.

**RISK**: api/health/route.ts imports getNextWorkout — must update that import simultaneously or build will fail.

```typescript
// REMOVE: GYM_ROTATION constant and getNextWorkout() function (~672-700)

// ADD:
const DOW_TO_PROGRAM_KEY: Record<number, string | null> = {
  0: null,      // Sunday — rest
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: null,      // Saturday — rest
};

/**
 * Returns the program day key for a given weekday number (0=Sun, 6=Sat).
 * Returns null for rest days (Sat/Sun).
 */
export function getTodayWorkout(weekday?: number): string | null {
  const dow = weekday !== undefined ? weekday : new Date().getDay();
  return DOW_TO_PROGRAM_KEY[dow] ?? null;
}
```

**Also update parseWorkoutKey** — it's only used by getNextWorkout. If nothing else imports it, remove it too. Check with grep before removing.

---

### api/health/route.ts — return weekly program + filtered history

**WHAT**: Replace getDisplayWorkout / WorkoutCard-oriented logic with weekly program data.

**WHY**: Page no longer renders WorkoutCard. New WeeklyProgramChart needs: gymCompletionByDate (to determine ✓ state per column), workoutHistory (for ExerciseHistory filtering), weeklyProgram (static, from config).

**PRESERVES**: Weight, exerciseProgress, gymStreak, gymLast7, eatingSummary, gymReflection reads.

**REMOVES**: getDisplayWorkout(), getNextWorkout() call, WorkoutCard-oriented response fields (templateKey, displayTemplate, displayExercises, totalSets, isCardio, cardioInfo, exerciseTargets, rotation, nextWorkout).

**RISK**: If TypeScript types reference the old fields, compilation fails. Remove from HealthData type in types.ts simultaneously.

New response shape from GET /api/health:

```typescript
{
  weight: {
    current: number;
    start: number;
    goal: number;
    deadline: string;
    checkpoints: { month: string; target: number }[];
    history: { date: string; value: number }[];
  };
  weeklyProgram: ProgramDay[];       // WEEKLY_PROGRAM from config — all 7 days
  gymCompletionByDate: string[];     // dates where gym=1 signal exists e.g. ["2026-03-28"]
  workouts: {
    history: WorkoutDay[];           // last 30 sessions (was 20, increase for better history)
  };
  exerciseProgress: Record<string, ExerciseProgressEntry[]>;
  gymToday: boolean;
  gymStreak: number;
  gymLast7: number;
  eatingSummary: { clean: number; total: number };
  gymReflection: ReflectionEntry | null;
}
```

---

### WeeklyProgramChart.tsx (new component)

**WHAT**: 7-column weekly program grid with today highlight, superset color coding, tap-to-select.

**WHY**: Core UI for design decision #1-10.

**PRESERVES**: N/A (new file).

**REMOVES**: N/A.

**RISK**: Horizontal scroll may clip on narrow viewports — test at 390px width.

Props interface:

```typescript
interface WeeklyProgramChartProps {
  weeklyProgram: ProgramDay[];
  gymCompletionByDate: string[];   // ISO date strings
  selectedDayKey: string | null;   // "Mon" | "Tue" | … | null
  onSelectDay: (key: string) => void;
  // The chart derives the current week's dates internally using new Date()
}
```

Column rendering logic:

```typescript
// Derive ISO date string for each column
// today = new Date()
// For each column key (Mon-Sun), compute the date of that weekday in the current week
// Week starts Monday (ISO week). Mon = today - (today.getDay() - 1 + 7) % 7 days ago

// isToday: toDateStr(date) === toDateStr(new Date())
// isCompleted: gymCompletionByDate.includes(toDateStr(date))
// isSelected: key === selectedDayKey
```

Pair styling map:

```typescript
const PAIR_STYLES: Record<PairLabel, { stripe: string; bg: string }> = {
  A:        { stripe: "bg-violet-500", bg: "bg-violet-500/10" },
  B:        { stripe: "bg-amber-500",  bg: "bg-amber-500/10"  },
  finisher: { stripe: "",              bg: "bg-zinc-800/60"   },
};
```

Column container classes (build by condition):

```
base:      "relative flex flex-col min-w-[140px] rounded-xl border overflow-hidden cursor-pointer snap-start"
default:   "bg-zinc-900/60 border-white/10"
today:     "bg-zinc-800 border-blue-500/30 border-l-2 border-l-blue-500"
selected:  add "ring-1 ring-zinc-500"
rest:      "opacity-50 cursor-default"
```

Exercise row rendering:

```tsx
// For each exercise in day.exercises:
<div className={`flex items-stretch ${PAIR_STYLES[exercise.pair].bg}`}>
  {exercise.pair !== "finisher" && (
    <div className={`w-0.5 shrink-0 ${PAIR_STYLES[exercise.pair].stripe}`} />
  )}
  <div className="px-2 py-1 flex-1 min-w-0">
    <p className={`text-xs truncate ${isCompleted ? "text-zinc-500" : "text-zinc-300"}`}>
      {exercise.name}
    </p>
    <p className="text-[10px] text-zinc-500">{exercise.scheme}</p>
  </div>
</div>
```

Column header:

```tsx
<div className="p-2 flex items-center justify-between">
  <span className="text-[11px] font-medium text-zinc-400">{day.key}</span>
  <span className={isToday
    ? "text-xs font-bold text-blue-400 bg-blue-500/20 rounded-full px-1.5 py-0.5"
    : "text-xs text-zinc-500"
  }>
    {dateNum}
  </span>
  {isCompleted && <span className="text-[10px] text-emerald-400">✓</span>}
</div>
```

---

### ExerciseHistory.tsx — add exerciseIds filter prop

**WHAT**: Add optional `exerciseIds?: string[]` prop; when provided, filter displayed data.

**WHY**: Health page needs to show only exercises relevant to the selected day's program. (Design decision #8)

**PRESERVES**: All existing prop fields, internal state, expansion logic, TrendModal, graph metric toggle.

**REMOVES**: Nothing.

**RISK**: If exerciseIds = [] (empty array, e.g. Rest day selected), component should render "No exercises for this day." rather than all exercises.

```typescript
// Add to ExerciseHistoryProps:
exerciseIds?: string[];

// Filter progressEntries when exerciseIds provided:
const filteredProgressEntries = useMemo(() => {
  if (!exerciseIds) return progressEntries;
  if (exerciseIds.length === 0) return [];
  return progressEntries.filter(([id]) => exerciseIds.includes(id));
}, [progressEntries, exerciseIds]);

// Filter workoutHistory sessions to only include matching exercises:
const filteredWorkoutHistory = useMemo(() => {
  if (!exerciseIds) return workoutHistory;
  if (exerciseIds.length === 0) return [];
  return workoutHistory
    .map(day => ({
      ...day,
      exercises: day.exercises.filter(e => exerciseIds.includes(e.id))
    }))
    .filter(day => day.exercises.length > 0);
}, [workoutHistory, exerciseIds]);
```

---

### health/page.tsx — redesign

**WHAT**: Full page rebuild — remove WorkoutCard/WeightChart/GroceryCard, add WeeklyProgramChart + filtered ExerciseHistory.

**WHY**: Design decisions #7 (kill sections) + #1 (single screen).

**PRESERVES**: Fetch from /api/health, loading/error states, handleMarkDone for gym=1 signal write (kept — still needed for ✓ state on completed day).

**REMOVES**: groceryData state, /api/groceries fetch, gymStreak/gymLast7/eatingSummary stats row, WorkoutCard, WeightChart, GroceryCard, all grocery handlers.

**RISK**: handleMarkDone posts `context: workouts.displayTemplate` — this field no longer exists in the API response. Update to derive context from selectedDayKey instead.

State:

```typescript
const [data, setData] = useState<HealthData | null>(null);
const [loading, setLoading] = useState(true);
const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

// On data load, initialize selectedDayKey to today's program key
useEffect(() => {
  if (data && selectedDayKey === null) {
    const todayKey = getTodayWorkout(); // from csv.ts — returns "Mon"|"Tue"|…|null
    // If rest day (null), default to Monday or first non-rest day
    setSelectedDayKey(todayKey ?? "Mon");
  }
}, [data, selectedDayKey]);
```

Derived values:

```typescript
const selectedDay = data?.weeklyProgram.find(d => d.key === selectedDayKey) ?? null;
const selectedExerciseIds = selectedDay?.exercises.map(e => e.id) ?? [];
```

Render:

```tsx
return (
  <div className="min-h-screen bg-black text-zinc-100">
    <div className="p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Health</h1>
      </header>

      <WeeklyProgramChart
        weeklyProgram={data.weeklyProgram}
        gymCompletionByDate={data.gymCompletionByDate}
        selectedDayKey={selectedDayKey}
        onSelectDay={setSelectedDayKey}
      />

      <ExerciseHistory
        exerciseProgress={data.exerciseProgress}
        workoutHistory={data.workouts.history}
        exerciseIds={selectedExerciseIds}
      />
    </div>
  </div>
);
```

handleMarkDone update:

```typescript
// Derive context from selectedDayKey:
context: selectedDayKey ? `Day ${selectedDayKey}` : "",
category: selectedDayKey ?? "",
```

---

### scripts/precompute-checkin.js — update rotation lookup

**WHAT**: Replace sequential WORKOUT_CYCLE array + idx logic with day-of-week lookup.

**WHY**: getTodayWorkout() is now day-of-week based; checkin script must match (design decision #13 + research Q12).

**PRESERVES**: last_workout output shape: `{ date: string, day: string | null, next: string | null }`. All other buildCard2/buildDigest logic unchanged.

**REMOVES**: WORKOUT_CYCLE array, `(idx + 1) % WORKOUT_CYCLE.length` advancement logic.

**RISK**: last_workout.next is shown to user in checkin card. Must remain meaningful after change.

```javascript
// REMOVE:
const WORKOUT_CYCLE = ["A", "B", "C", "D", "E", "F", "G"];

// ADD:
const DOW_TO_PROGRAM_KEY = { 0: null, 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: null };
const NEXT_DAY_MAP = { Mon: "Tue", Tue: "Wed", Wed: "Thu", Thu: "Fri", Fri: "Mon" };

// In buildCard2 and buildDigest, replace:
//   const dayMatch = lastGym.context?.match(/Day\s*([A-Z])/i);
//   const lastDay = dayMatch ? dayMatch[1].toUpperCase() : null;
//   const idx = WORKOUT_CYCLE.indexOf(lastDay);
//   nextDay = WORKOUT_CYCLE[(idx + 1) % WORKOUT_CYCLE.length];
//
// With:
const lastGymDate = new Date(lastGym.date + "T12:00:00");
const lastDow = lastGymDate.getDay();
const lastDay = DOW_TO_PROGRAM_KEY[lastDow] ?? null;
const nextDay = lastDay ? (NEXT_DAY_MAP[lastDay] ?? null) : null;

// last_workout shape unchanged:
lastWorkout = { date: lastGym.date, day: lastDay, next: nextDay ? `Day ${nextDay}` : null };
```

---

## 9. Abort Conditions

Stop and ask if any of these occur:

- Any file in scope doesn't match the expected state described in this spec when first read (schema change, unexpected existing code)
- A change requires modifying a file outside the declared scope list
- Two spec items conflict (e.g. types.ts needs HealthData update but wasn't listed — stop, update scope, continue)
- A per-file checkpoint answers "no" to any question
- 3 consecutive build fix cycles fail on the same error
- A fix introduces a new build error in a previously clean file
- getTodayWorkout() import would require modifying any plan/ or daily-signals file
- precompute-checkin.js produces invalid JSON after the WORKOUT_CYCLE change
- ExerciseHistory filter change causes existing test in app/app/__tests__/ to fail

**One known scope gap to resolve before starting**: `app/app/lib/types.ts` likely needs `HealthData` interface updated (remove WorkoutCard fields, add weeklyProgram/gymCompletionByDate). This is in scope — update it as part of Phase 2. If it requires touching >3 additional type locations, stop and reassess.

## 10. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` — must be zero errors |
| Type check | Yes | TypeScript errors surfaced by build gate |
| Diff scope check | Yes | `git diff --stat` — only declared files |
| Browser — page load | Yes | Navigate /health, screenshot, compare to visual contract |
| Browser — today highlight | Yes | Verify today column has blue border + date pill |
| Browser — tap interaction | Yes | Tap a non-today column, verify ring appears + history updates |
| Browser — console | Yes | No errors in console on /health |
| Browser — /plan regression | Yes | Navigate /plan/day — verify no visual changes |
| precompute-checkin | Yes | `node scripts/precompute-checkin.js` — valid JSON, no throw |
| Confidence report | Always | Summary with build output + screenshot evidence |

---

## Implementation Order

Execute in vertical phases. Each phase must pass its checkpoints before proceeding.

### Phase 1: Data layer
1. Update `config.ts` — add new exercise IDs to config.exercises, add WEEKLY_PROGRAM constant, add ProgramDay/ProgramExercise/PairLabel types
2. Update `app/app/lib/csv.ts` — remove GYM_ROTATION + getNextWorkout(), add DOW_TO_PROGRAM_KEY + getTodayWorkout()
3. Update `scripts/precompute-checkin.js` — swap WORKOUT_CYCLE for DOW_TO_PROGRAM_KEY
4. Checkpoint: `cd app && npx tsc --noEmit` (type check only) + `node scripts/precompute-checkin.js` must succeed

### Phase 2: API
5. Update `app/app/lib/types.ts` — update HealthData interface to new response shape
6. Update `app/app/api/health/route.ts` — remove getDisplayWorkout(), use getTodayWorkout(), return new shape
7. Checkpoint: `cd app && npm run build` must pass

### Phase 3: UI
8. Create `app/app/components/WeeklyProgramChart.tsx`
9. Update `app/app/components/ExerciseHistory.tsx` — add exerciseIds prop
10. Rewrite `app/app/health/page.tsx`
11. Checkpoint: `cd app && npm run build` must pass

### Phase 4: Verify
12. Browser: navigate /health — screenshot all 7 columns
13. Browser: verify today column blue highlight
14. Browser: tap 2 different columns — verify ring + history filter
15. Browser: /plan/day — verify no regression
16. Console: no errors
17. `git diff --stat` — scope check
