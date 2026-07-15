/**
 * Everything this app shows is happening in Nauvoo, so times are presented in
 * Nauvoo's timezone rather than the viewer's. A visitor planning their trip
 * from another state should see the 9:30 AM parade as 9:30 AM, not shifted
 * into their own timezone.
 */
export const NAUVOO_TIME_ZONE = 'America/Chicago';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NAUVOO_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
});

const clockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NAUVOO_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

const dateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NAUVOO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "9:30 AM" — the instant as it reads on a clock in Nauvoo. */
export function formatNauvooTime(date: Date): string {
  return timeFormatter.format(date);
}

/** "9:30 AM CDT" — includes the zone so the viewer knows whose clock this is. */
export function formatNauvooClock(date: Date): string {
  return clockFormatter.format(date);
}

/** "2026-07-15" — the calendar day this instant falls on in Nauvoo. */
export function nauvooDateKey(date: Date): string {
  const parts = dateKeyFormatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Shift a YYYY-MM-DD key by whole days. Done in UTC so a daylight-saving
 * boundary can't add or drop an hour and land on the wrong day.
 */
export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate()
  )}`;
}

/**
 * Turn a YYYY-MM-DD key back into a Date for formatting the day heading.
 * Built from local parts so date-fns reads back the same calendar day.
 */
export function dateKeyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** True once the event has finished, judged against real elapsed time. */
export function hasPassed(end: Date, now: Date): boolean {
  return end.getTime() < now.getTime();
}
