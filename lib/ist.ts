/**
 * IST (Asia/Kolkata, UTC+5:30) formatting utilities.
 * All timestamps displayed in the app must go through these functions.
 */

const TZ = "Asia/Kolkata";

/** "21 Jun 2026" */
export function fmtISTDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "08:45 PM" — no IST suffix, for use in narrow stat card values */
export function fmtISTTimeShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** "08:45 PM IST" */
export function fmtISTTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const t = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${t} IST`;
}

/** "08:45:23 PM IST" */
export function fmtISTTimeFull(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const t = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
  return `${t} IST`;
}

/** "21 Jun 2026, 08:45 PM IST" */
export function fmtISTFull(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const datePart = fmtISTDate(d);
  const timePart = fmtISTTime(d); // already includes " IST"
  return `${datePart}, ${timePart}`;
}

/** Returns current IST time as "08:45:23 PM IST" */
export function nowISTTimeFull(): string {
  return fmtISTTimeFull(new Date());
}

/** Returns current IST time as "08:45 PM IST" */
export function nowISTTime(): string {
  return fmtISTTime(new Date());
}

/** Returns current IST datetime as "21 Jun 2026, 08:45 PM IST" */
export function nowISTFull(): string {
  return fmtISTFull(new Date());
}
