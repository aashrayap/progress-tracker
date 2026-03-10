import { config } from "../lib/config";
import type {
  ExerciseTarget,
  GymReflection,
  PrescribedExercise,
  WorkoutDay,
  WorkoutSet,
} from "../lib/types";

interface WorkoutCardProps {
  gymToday: boolean;
  templateKey: string;
  totalSets: number;
  prescribedExercises: PrescribedExercise[];
  todayWorkout: WorkoutDay | null;
  cardioFinisherMin?: number;
  gymReflection: GymReflection | null;
  onMarkDone: () => void;
  isCardio: boolean;
  cardioInfo: { label: string; detail: string; minutes: number } | null;
  rotation: { key: string; kind: string; label: string; detail: string; minutes?: number }[];
  exerciseTargets: ExerciseTarget[];
}

function formatSet(set: WorkoutSet): string {
  const hasWeight = set.weight > 0;
  const hasReps = set.reps > 0;

  if (hasWeight && hasReps) return `${set.weight}lbs x ${set.reps}`;
  if (hasWeight) return `${set.weight}lbs`;
  if (hasReps) return `${set.reps} reps`;
  if (set.notes) return "logged";
  return "pending";
}

function getRotationTooltip(key: string): string {
  const template = config.workoutTemplates[key];
  if (template) {
    const allExercises = Object.values(config.exercises).flat();
    return template
      .map((id) => allExercises.find((e) => e.id === id)?.name || id)
      .join(", ");
  }
  const cardio = config.cardioTemplates[key];
  if (cardio) return `${cardio.detail} (${cardio.minutes} min)`;
  return "";
}

export default function WorkoutCard({
  gymToday,
  templateKey,
  totalSets,
  prescribedExercises,
  todayWorkout,
  cardioFinisherMin = 0,
  gymReflection,
  onMarkDone,
  isCardio,
  cardioInfo,
  rotation,
  exerciseTargets,
}: WorkoutCardProps) {
  const homeDose = `${config.trainingPlan.homeDose.pullupsPerDay} pull-ups / ${config.trainingPlan.homeDose.pushupsPerDay} push-ups`;

  return (
    <section className="mb-6 p-5 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {gymToday ? "Today's Workout" : "Next Workout"}
          </h2>
          <p className="text-sm text-zinc-400">
            {isCardio && cardioInfo
              ? `${cardioInfo.label} · ${cardioInfo.minutes} min`
              : `Day ${templateKey} · ${totalSets} sets · ~30 min${cardioFinisherMin > 0 ? ` + ${cardioFinisherMin} min cardio` : ""}`}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Home dose: {homeDose}</p>
        </div>
        {gymToday ? (
          <span className="px-3 py-1 text-sm rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Done
          </span>
        ) : (
          <button
            onClick={onMarkDone}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/35 transition-colors"
          >
            Mark Done
          </button>
        )}
      </div>

      <details className="mb-4 rounded-xl border border-white/10 bg-zinc-800/40 px-3 py-2">
        <summary className="text-xs text-blue-300 cursor-pointer select-none">
          ⓘ Rotation (A-G)
        </summary>
        <div className="mt-2 space-y-1 text-xs text-zinc-300">
          {rotation.map((entry) => (
            <p key={entry.key} className={`${entry.key === templateKey ? "text-emerald-400 font-medium" : ""} cursor-default group/row relative`} title={getRotationTooltip(entry.key)}>
              <span className="text-zinc-500">{entry.key}:</span> {entry.label}
              {entry.key === templateKey && " ← next"}
              <span className="hidden group-hover/row:inline text-zinc-500 ml-1">— {getRotationTooltip(entry.key)}</span>
            </p>
          ))}
        </div>
      </details>

      {isCardio && cardioInfo ? (
        <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20">
          <h3 className="text-base font-medium">{cardioInfo.label}</h3>
          <p className="text-sm text-zinc-400 mt-1">{cardioInfo.detail}</p>
          <p className="text-sm text-blue-400 mt-2">{cardioInfo.minutes} minutes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescribedExercises.map((exercise) => {
            const todayExercise = todayWorkout?.exercises.find((logged) => logged.id === exercise.id);
            const hasLoggedSets = Boolean(todayExercise && todayExercise.sets.length > 0);
            const target = exerciseTargets.find((t) => t.id === exercise.id);

            return (
              <div
                key={exercise.id}
                className={`p-4 rounded-xl border ${
                  hasLoggedSets
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-zinc-800/50 border-white/10"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">{exercise.name}</h3>
                  <div className="text-right">
                    <span className="text-sm text-zinc-400">
                      {exercise.sets} x {exercise.reps}
                    </span>
                    {target && target.note && target.lastDate && (
                      <p className="text-xs text-amber-400/80">{target.note}</p>
                    )}
                  </div>
                </div>

                {hasLoggedSets && todayExercise && (
                  <div className="mt-3 space-y-1.5">
                    {todayExercise.sets.map((set) => (
                      <div key={set.set} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-zinc-400 w-8">Set {set.set}</span>
                        <span className="font-mono text-emerald-400">{formatSet(set)}</span>
                        {set.notes && <span className="text-xs text-zinc-400">{set.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {!hasLoggedSets && target && target.lastSets.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Today&apos;s target</p>
                      <div className="space-y-1">
                        {target.targetSets.map((ts, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-xs text-zinc-500 w-8">Set {i + 1}</span>
                            <span className="font-mono text-amber-400">
                              {ts.weight > 0 ? `${ts.weight}lbs x ${ts.reps}` : ts.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Last ({target.lastDate})</p>
                      <div className="space-y-1">
                        {target.lastSets.map((ls, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-xs text-zinc-600 w-8">Set {i + 1}</span>
                            <span className="font-mono text-zinc-500">
                              {ls.weight > 0 ? `${ls.weight}lbs x ${ls.reps}` : `${ls.reps} reps`}
                            </span>
                            {ls.notes && <span className="text-xs text-zinc-600">{ls.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!hasLoggedSets && (!target || target.lastSets.length === 0) && (
                  <p className="mt-2 text-xs text-zinc-600">First session — voice log sets at the gym</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {gymReflection && (
        <details className="mt-4 rounded-xl border border-white/10 bg-zinc-800/40 px-3 py-2">
          <summary className="text-xs text-zinc-400 cursor-pointer select-none">
            Last session reflection
          </summary>
          <div className="mt-2 space-y-1 text-sm text-zinc-300">
            <p>Win: {gymReflection.win || "-"}</p>
            <p>Lesson: {gymReflection.lesson || "-"}</p>
            <p>Change: {gymReflection.change || "-"}</p>
          </div>
        </details>
      )}
    </section>
  );
}
