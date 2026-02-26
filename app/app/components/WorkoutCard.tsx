interface WorkoutSet {
  set: number;
  weight: number;
  reps: number;
  notes: string;
}

interface GroupedExercise {
  name: string;
  id: string;
  sets: WorkoutSet[];
}

interface WorkoutDay {
  date: string;
  workout: string;
  exercises: GroupedExercise[];
}

interface PrescribedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutCardProps {
  gymToday: boolean;
  templateKey: string;
  totalSets: number;
  prescribedExercises: PrescribedExercise[];
  todayWorkout: WorkoutDay | null;
  onMarkDone: () => void;
}

export default function WorkoutCard({
  gymToday,
  templateKey,
  totalSets,
  prescribedExercises,
  todayWorkout,
  onMarkDone,
}: WorkoutCardProps) {
  return (
    <section className="mb-6 p-5 bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {gymToday ? "Today's Workout" : "Next Workout"}
          </h2>
          <p className="text-sm text-zinc-500">
            Day {templateKey} · {totalSets} sets · ~30 min
          </p>
        </div>
        {gymToday ? (
          <span className="px-3 py-1 text-sm rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Done
          </span>
        ) : (
          <button
            onClick={onMarkDone}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/35 transition-colors"
          >
            Mark Done
          </button>
        )}
      </div>

      <div className="space-y-4">
        {prescribedExercises.map((ex) => {
          const todayEx = todayWorkout?.exercises.find((e) => e.id === ex.id);
          const hasLoggedSets = todayEx && todayEx.sets.length > 0;

          return (
            <div
              key={ex.id}
              className={`p-4 rounded-lg border ${
                hasLoggedSets
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-zinc-800/50 border-zinc-700/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium">{ex.name}</h3>
                <span className="text-sm text-zinc-400">
                  {ex.sets} x {ex.reps}
                </span>
              </div>

              {hasLoggedSets && (
                <div className="mt-3 space-y-1.5">
                  {todayEx.sets.map((s) => (
                    <div
                      key={s.set}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-xs text-zinc-500 w-8">
                        Set {s.set}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {s.weight}lbs x {s.reps}
                      </span>
                      {s.notes && (
                        <span className="text-xs text-zinc-500">
                          {s.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!hasLoggedSets && (
                <p className="mt-2 text-xs text-zinc-600">
                  Voice log sets at the gym
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
