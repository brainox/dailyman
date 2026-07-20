/** Formats a Date as a local YYYY-MM-DD string (not UTC — avoids off-by-one-day drift). */
export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date per the user's local device clock (spec Assumptions). */
export function todayISO(): string {
  return toISODate(new Date());
}

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Adds (or subtracts, if negative) whole calendar days to an ISO date string. */
export function addDays(dateStr: string, delta: number): string {
  const d = parseISODate(dateStr);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function yesterdayOf(dateStr: string): string {
  return addDays(dateStr, -1);
}

/**
 * The last `n` calendar days ending at `endDateStr` (inclusive), oldest first.
 * Defaults to ending today.
 */
export function lastNDays(n: number, endDateStr: string = todayISO()): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(endDateStr, -i));
  }
  return days;
}
