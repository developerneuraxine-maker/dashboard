/**
 * Productivity Score = TaskCompletionRate*40% + Attendance*30% + HoursCompliance*30%
 * All inputs are 0–100; output is 0–100.
 */
export function productivityScore(
  taskCompletionRate: number,
  attendance: number,
  hoursCompliance: number
): number {
  const score = taskCompletionRate * 0.4 + attendance * 0.3 + hoursCompliance * 0.3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Hours between two timestamps, as a decimal. */
export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

/** "09h 35m" from decimal hours. */
export function formatHours(decimal: number): string {
  if (decimal <= 0) return "00h 00m";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

/** "09h 35m 12s" from decimal hours. */
export function formatHoursWithSeconds(decimal: number): string {
  if (decimal <= 0) return "00h 00m 00s";
  const totalSeconds = Math.round(decimal * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/** True if clock-in is after the company start time (e.g. "09:30"). */
export function isLate(clockIn: Date, companyStart = "09:30"): boolean {
  const [h, m] = companyStart.split(":").map(Number);
  const cutoff = new Date(clockIn);
  cutoff.setHours(h, m, 0, 0);
  return clockIn.getTime() > cutoff.getTime();
}

/** Task completion rate (0–100) from a status tally. */
export function taskCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
