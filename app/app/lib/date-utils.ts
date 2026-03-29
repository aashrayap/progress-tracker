export function getWeekStart(date?: Date): Date {
  const d = new Date(date ?? new Date());
  const day = d.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekStartStr(date?: Date): string {
  const d = getWeekStart(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
