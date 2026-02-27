export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

export function formatTime(t: number): string {
  const hour = Math.floor(t);
  const min = t % 1 === 0.5 ? ":30" : "";
  const ampm = hour >= 12 ? "pm" : "am";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}${min}${ampm}`;
}
