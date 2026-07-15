import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import {
  parseICSData,
  filterFutureEvents,
  groupEventsByDate,
} from '../services/calendarParser';

// Sample data for local development only. Never used in a deployed build:
// falling back to it in production is what disguised a broken calendar
// connection as an empty calendar.
import testCalendarData from '../../nauvoo_test_calendar.ics?raw';

/**
 * Served by the `calendar` Cloud Function via a hosting rewrite. Outlook
 * refuses browser requests for the published calendar, so it is relayed
 * through our own origin instead of fetched directly.
 */
const CALENDAR_ENDPOINT = '/api/calendar';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(CALENDAR_ENDPOINT);
      if (!response.ok) {
        throw new Error(
          `Calendar request failed (${response.status} ${response.statusText})`
        );
      }

      const icsData = await response.text();
      const parsed = parseICSData(icsData);

      setEvents(filterFutureEvents(parsed));
      setUsingSampleData(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load events';

      if (import.meta.env.DEV) {
        console.warn(
          `[useEvents] ${message}\n` +
            'Falling back to bundled SAMPLE events. These are not real ' +
            'Historic Nauvoo events. Run the Firebase emulator to see live data.'
        );
        setEvents(filterFutureEvents(parseICSData(testCalendarData)));
        setUsingSampleData(true);
        setError(null);
      } else {
        console.error('[useEvents] Failed to load calendar:', err);
        setEvents([]);
        setUsingSampleData(false);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Helper to get events grouped by date
  const eventsByDate = groupEventsByDate(events);

  return {
    events,
    eventsByDate,
    loading,
    error,
    usingSampleData,
    refresh: load,
  };
}
