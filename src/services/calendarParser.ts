import ICAL from 'ical.js';
import { CalendarEvent } from '../types';
import { nauvooDateKey } from '../utils/nauvooTime';
import { LOCATION_ALIASES } from './locationAliases';

/** How many days ahead repeating events are expanded into individual occurrences. */
const DEFAULT_EXPANSION_DAYS = 30;

/** Slack on each end of the default window to absorb viewer/Nauvoo day offsets. */
const BUFFER_DAYS = 1;

/** Safety valve so a malformed or endless repeat rule can't spin forever. */
const MAX_OCCURRENCES_PER_EVENT = 500;

export interface ParseOptions {
  /** Start of the expansion window. Defaults to the start of today. */
  windowStart?: Date;
  /** Length of the expansion window in days. */
  windowDays?: number;
}

/**
 * Parse an ICS calendar feed and return structured events
 */
export async function parseCalendarFeed(icsUrl: string): Promise<CalendarEvent[]> {
  try {
    // Fetch the ICS data
    const response = await fetch(icsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }

    const icsData = await response.text();
    return parseICSData(icsData);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    throw error;
  }
}

/**
 * Read the GEO property off a VEVENT component, if present.
 */
function readGeo(component: ICAL.Component): { lat: number; lng: number } | undefined {
  const geoProp = component.getFirstProperty('geo');
  if (!geoProp) return undefined;

  const geoValue = geoProp.getFirstValue();
  if (Array.isArray(geoValue) && geoValue.length === 2) {
    return { lat: parseFloat(geoValue[0]), lng: parseFloat(geoValue[1]) };
  }
  return undefined;
}

/**
 * Read the CATEGORIES property off a VEVENT component, if present.
 */
function readCategories(component: ICAL.Component): string[] | undefined {
  const categoriesProp = component.getFirstProperty('categories');
  if (!categoriesProp) return undefined;

  const catValue = categoriesProp.getFirstValue();
  if (typeof catValue === 'string') {
    return catValue.split(',').map((c) => c.trim());
  }
  if (Array.isArray(catValue)) {
    return catValue;
  }
  return undefined;
}

/**
 * Build a CalendarEvent from an ICAL.Event plus a concrete start/end pair.
 *
 * `uid` is suffixed with the occurrence start for repeating events: a repeating
 * event shares one UID across every occurrence, but callers use uid as a unique
 * key, so the raw UID would collapse a whole series into a single entry.
 */
function toCalendarEvent(
  source: ICAL.Event,
  component: ICAL.Component,
  start: Date,
  end: Date,
  isOccurrence: boolean
): CalendarEvent {
  return {
    uid: isOccurrence ? `${source.uid}::${start.toISOString()}` : source.uid,
    summary: source.summary || 'Untitled Event',
    description: source.description || '',
    location: source.location || '',
    start,
    end,
    geo: readGeo(component),
    categories: readCategories(component),
  };
}

/**
 * Parse ICS data string into CalendarEvent array.
 *
 * Repeating events are stored once, stamped with the date of their first
 * occurrence and a rule describing how they repeat. Reading only that stamped
 * date makes a series that started long ago look like a stale past event, so
 * each series is expanded into its individual occurrences within the window.
 */
export function parseICSData(
  icsData: string,
  options: ParseOptions = {}
): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  // The window is a coarse bound on how far repeat rules are expanded; the
  // defaults carry a day of slack on each end because the viewer's midnight
  // can fall either side of Nauvoo's. filterFutureEvents does the exact
  // trimming in Nauvoo time.
  const windowStart =
    options.windowStart ?? addDays(startOfDay(new Date()), -BUFFER_DAYS);
  const windowDays =
    options.windowDays ?? DEFAULT_EXPANSION_DAYS + BUFFER_DAYS * 2;
  const windowEnd = addDays(windowStart, windowDays);

  // A series can carry "exceptions": single occurrences that were moved or
  // edited. They arrive as separate VEVENTs sharing the series UID, and must be
  // attached to their series so expansion reports the edited version.
  const series: ICAL.Event[] = [];
  const exceptions: ICAL.Event[] = [];

  for (const vevent of vevents) {
    let event: ICAL.Event;
    try {
      event = new ICAL.Event(vevent);
    } catch {
      continue; // skip malformed entries rather than failing the whole feed
    }
    if (!event.startDate) continue;

    if (event.isRecurrenceException()) {
      exceptions.push(event);
    } else {
      series.push(event);
    }
  }

  const byUid = new Map<string, ICAL.Event>();
  series.forEach((event) => byUid.set(event.uid, event));

  for (const exception of exceptions) {
    const parent = byUid.get(exception.uid);
    if (parent) {
      try {
        parent.relateException(exception);
      } catch {
        // An exception we can't attach is still a real event; keep it standalone.
        series.push(exception);
      }
    } else {
      series.push(exception);
    }
  }

  const events: CalendarEvent[] = [];

  for (const event of series) {
    if (!event.isRecurring()) {
      events.push(
        toCalendarEvent(
          event,
          event.component,
          event.startDate.toJSDate(),
          event.endDate.toJSDate(),
          false
        )
      );
      continue;
    }

    const iterator = event.iterator();
    let next: ICAL.Time | null;
    let count = 0;

    while ((next = iterator.next())) {
      if (++count > MAX_OCCURRENCES_PER_EVENT) break;

      const startDate = next.toJSDate();
      if (startDate > windowEnd) break;
      if (startDate < windowStart) continue;

      try {
        const details = event.getOccurrenceDetails(next);
        events.push(
          toCalendarEvent(
            details.item,
            details.item.component,
            details.startDate.toJSDate(),
            details.endDate.toJSDate(),
            true
          )
        );
      } catch {
        continue; // skip an occurrence we can't resolve
      }
    }
  }

  // Sort by start date
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return events;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Group events by the Nauvoo calendar day they fall on.
 *
 * Keying off the viewer's day (or worse, the UTC day) files an evening event
 * under the wrong heading: 7:30 PM in Nauvoo is already past midnight UTC.
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const dateKey = nauvooDateKey(event.start);
    const existing = grouped.get(dateKey) || [];
    existing.push(event);
    grouped.set(dateKey, existing);
  });

  return grouped;
}

/**
 * Filter events down to Nauvoo's today and later.
 *
 * Today's earlier events are kept deliberately: they are shown greyed out
 * rather than hidden, so a visitor can see what they have already missed.
 */
export function filterFutureEvents(
  events: CalendarEvent[],
  now: Date = new Date()
): CalendarEvent[] {
  const todayKey = nauvooDateKey(now);

  // Both sides are YYYY-MM-DD, so a plain string compare orders them correctly.
  return events.filter((event) => nauvooDateKey(event.start) >= todayKey);
}

/**
 * Find events at a specific location (by GPS proximity)
 */
export function findEventsAtLocation(
  events: CalendarEvent[],
  lat: number,
  lng: number,
  radiusKm: number = 0.5
): CalendarEvent[] {
  return events.filter((event) => {
    if (!event.geo) return false;

    const distance = getDistanceKm(
      lat,
      lng,
      event.geo.lat,
      event.geo.lng
    );

    return distance <= radiusKm;
  });
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Fold the curly quotes, casing and spacing differences between how the
 * calendar writes a place and how our records spell it.
 */
function normalizeForMatching(text: string): string {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Where in `haystack` does `phrase` first appear as whole words? -1 if never.
 *
 * Whole words matter: "Outdoor Stage" must not be found inside some longer word,
 * and a bare "St" must never match "Stoddard".
 */
function firstWholeWordIndex(haystack: string, phrase: string): number {
  const match = new RegExp(`(?<![a-z0-9])${escapeRegExp(phrase)}(?![a-z0-9])`).exec(
    haystack
  );
  return match ? match.index : -1;
}

/**
 * Work out which of our sites an event is being held at.
 *
 * The calendar gives us nothing but a sentence written for visitors, so the
 * place has to be read out of the words. Three rules, in order:
 *
 *   1. GPS, if the feed ever starts supplying it (today's never does).
 *   2. The event's title, when it is itself the name of a site. "Trail of Hope"
 *      is the trail, even though its text says to gather at the Seventies Hall.
 *   3. The first site named in the description. First matters: a description
 *      like "behind the Kimball Home ... may be moved to the Cultural Hall"
 *      names the real venue before the wet-weather fallback.
 *
 * When no known site is named, this returns null and the event shows without a
 * photo. That is deliberate. The previous version matched any shared word over
 * three letters, so "Nauvoo" -- which appears in nearly every description --
 * pinned nine unrelated events to the North Visitors' Center. A missing photo
 * is honest; a confident wrong one is not.
 */
export function matchEventToLocation<T extends { name: string; lat: number; lng: number }>(
  event: CalendarEvent,
  locations: T[],
  radiusKm: number = 0.5
): T | null {
  // 1. GPS, when the feed provides it.
  if (event.geo) {
    let closest: T | null = null;
    let closestDistance = Infinity;
    for (const location of locations) {
      const distance = getDistanceKm(
        event.geo.lat,
        event.geo.lng,
        location.lat,
        location.lng
      );
      if (distance <= radiusKm && distance < closestDistance) {
        closest = location;
        closestDistance = distance;
      }
    }
    if (closest) return closest;
  }

  const byName = new Map<string, T>();
  locations.forEach((location) =>
    byName.set(normalizeForMatching(location.name), location)
  );

  // 2. The title is itself a site name.
  const title = normalizeForMatching(event.summary || '');
  const titleMatch = byName.get(title);
  if (titleMatch) return titleMatch;

  if (!event.location) return null;
  const haystack = normalizeForMatching(event.location);

  // 3. The first site named in the description. Every site is searched for under
  // its own name and any alias; on a tie the longer phrase wins, so "Historic
  // Nauvoo South Visitors' Center" beats a bare "visitors' center".
  let best: T | null = null;
  let bestIndex = Infinity;
  let bestLength = 0;

  for (const location of locations) {
    const phrases = [
      normalizeForMatching(location.name),
      ...(LOCATION_ALIASES[location.name] ?? []).map(normalizeForMatching),
    ];

    for (const phrase of phrases) {
      if (!phrase) continue;
      const index = firstWholeWordIndex(haystack, phrase);
      if (index === -1) continue;

      if (index < bestIndex || (index === bestIndex && phrase.length > bestLength)) {
        best = location;
        bestIndex = index;
        bestLength = phrase.length;
      }
    }
  }

  return best;
}
