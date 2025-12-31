import { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { useConfig } from './useConfig';
import {
  parseICSData,
  filterFutureEvents,
  groupEventsByDate,
} from '../services/calendarParser';

// Import local test calendar for development
import testCalendarData from '../../nauvoo_test_calendar.ics?raw';

export function useEvents() {
  const { config, loading: configLoading } = useConfig();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      if (configLoading) return;

      try {
        setLoading(true);
        setError(null);

        let parsedEvents: CalendarEvent[];

        // Try to fetch from the configured URL
        if (config.calendarUrl) {
          try {
            const response = await fetch(config.calendarUrl);
            if (response.ok) {
              const icsData = await response.text();
              parsedEvents = parseICSData(icsData);
            } else {
              throw new Error('Calendar fetch failed');
            }
          } catch (fetchError) {
            console.log('Using local calendar data for development');
            // Fallback to local test calendar
            parsedEvents = parseICSData(testCalendarData);
          }
        } else {
          // Use local test calendar
          parsedEvents = parseICSData(testCalendarData);
        }

        // Filter to future events and set
        const futureEvents = filterFutureEvents(parsedEvents);
        setEvents(futureEvents);
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [config.calendarUrl, configLoading]);

  // Helper to get events grouped by date
  const eventsByDate = groupEventsByDate(events);

  // Helper to refresh events
  const refresh = async () => {
    setLoading(true);
    try {
      let parsedEvents: CalendarEvent[];

      if (config.calendarUrl) {
        try {
          const response = await fetch(config.calendarUrl);
          if (response.ok) {
            const icsData = await response.text();
            parsedEvents = parseICSData(icsData);
          } else {
            throw new Error('Calendar fetch failed');
          }
        } catch {
          parsedEvents = parseICSData(testCalendarData);
        }
      } else {
        parsedEvents = parseICSData(testCalendarData);
      }

      const futureEvents = filterFutureEvents(parsedEvents);
      setEvents(futureEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh events');
    } finally {
      setLoading(false);
    }
  };

  return {
    events,
    eventsByDate,
    loading,
    error,
    refresh,
  };
}
