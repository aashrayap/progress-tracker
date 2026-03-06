"use client";

export interface HabitLogEntry {
  date: string;
  value: boolean | null;
  context: string;
  workoutSummary?: string;
}

interface HabitLogHistoryProps {
  logs: HabitLogEntry[];
}

function fmtShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m]} ${d}`;
}

export default function HabitLogHistory({ logs }: HabitLogHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-zinc-500">
        No logs in the last 90 days
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">History</p>
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.date} className="flex items-start gap-2 py-1">
            <span className="text-xs text-zinc-400 w-12 shrink-0 pt-0.5">{fmtShortDate(log.date)}</span>
            <span className="shrink-0 pt-0.5">
              {log.value === true ? (
                <span className="text-emerald-400 text-xs">{"\u2713"}</span>
              ) : log.value === false ? (
                <span className="text-red-400 text-xs">{"\u2717"}</span>
              ) : (
                <span className="text-zinc-600 text-xs">{"\u2013"}</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              {log.workoutSummary ? (
                <p className="text-sm text-zinc-300 break-words">{log.workoutSummary}</p>
              ) : log.context ? (
                <p className="text-sm text-zinc-300 break-words">{log.context}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
