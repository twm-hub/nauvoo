import ICAL from 'ical.js';
import { CalendarEvent } from '../types';

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
 * Parse ICS data string into CalendarEvent array
 */
export function parseICSData(icsData: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  const events: CalendarEvent[] = vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);

    // Parse geo coordinates if available
    const geoProp = vevent.getFirstProperty('geo');
    let geo: { lat: number; lng: number } | undefined;
    if (geoProp) {
      const geoValue = geoProp.getFirstValue();
      if (Array.isArray(geoValue) && geoValue.length === 2) {
        geo = {
          lat: parseFloat(geoValue[0]),
          lng: parseFloat(geoValue[1]),
        };
      }
    }

    // Parse categories
    const categoriesProp = vevent.getFirstProperty('categories');
    let categories: string[] | undefined;
    if (categoriesProp) {
      const catValue = categoriesProp.getFirstValue();
      if (typeof catValue === 'string') {
        categories = catValue.split(',').map((c) => c.trim());
      } else if (Array.isArray(catValue)) {
        categories = catValue;
      }
    }

    return {
      uid: event.uid,
      summary: event.summary || 'Untitled Event',
      description: event.description || '',
      location: event.location || '',
      start: event.startDate.toJSDate(),
      end: event.endDate.toJSDate(),
      geo,
      categories,
    };
  });

  // Sort by start date
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return events;
}

/**
 * Group events by date
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const dateKey = event.start.toISOString().split('T')[0];
    const existing = grouped.get(dateKey) || [];
    existing.push(event);
    grouped.set(dateKey, existing);
  });

  return grouped;
}

/**
 * Filter events to only include future events (from today onwards)
 */
export function filterFutureEvents(events: CalendarEvent[]): CalendarEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events.filter((event) => event.start >= now);
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
 * Match an event to a location by GPS proximity or name matching
 */
export function matchEventToLocation<T extends { name: string; lat: number; lng: number }>(
  event: CalendarEvent,
  locations: T[],
  radiusKm: number = 0.5
): T | null {
  // First try GPS matching if event has geo coordinates
  if (event.geo) {
    for (const location of locations) {
      const distance = getDistanceKm(
        event.geo.lat,
        event.geo.lng,
        location.lat,
        location.lng
      );
      if (distance <= radiusKm) {
        return location;
      }
    }
  }

  // Fall back to name matching
  if (event.location) {
    const eventLocationLower = event.location.toLowerCase();

    // Try exact match first
    for (const location of locations) {
      if (eventLocationLower.includes(location.name.toLowerCase()) ||
          location.name.toLowerCase().includes(eventLocationLower)) {
        return location;
      }
    }

    // Try partial match (first significant word)
    const eventWords = eventLocationLower.split(/[\s,]+/).filter(w => w.length > 3);
    for (const location of locations) {
      const locationWords = location.name.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
      for (const eventWord of eventWords) {
        for (const locationWord of locationWords) {
          if (eventWord === locationWord) {
            return location;
          }
        }
      }
    }
  }

  return null;
}
