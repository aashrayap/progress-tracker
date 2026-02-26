export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(t: number): string {
  const hour = Math.floor(t);
  const min = t % 1 === 0.5 ? ":30" : "";
  const ampm = hour >= 12 ? "pm" : "am";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}${min}${ampm}`;
}

export function getNextWorkout(log: { metric: string; value: string; notes: string }[], cycle: string[]): string {
  const lastGym = [...log]
    .reverse()
    .find((e) => e.metric === "gym" && e.value === "1" && e.notes);
  const lastTemplate = lastGym?.notes?.replace(/^Day\s*/i, "").trim() || "";
  const lastIdx = cycle.indexOf(lastTemplate);
  return cycle[(lastIdx + 1) % cycle.length];
}
