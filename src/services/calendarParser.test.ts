import { describe, it, expect } from 'vitest';
import { parseICSData, groupEventsByDate } from './calendarParser';

/**
 * Mirrors the shape of the real Historic Nauvoo feed: a series whose stored
 * start date is a year in the past, carried into the present by its repeat
 * rule, plus a one-off event further out.
 */
const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:daily-tour
SUMMARY:Daily Tour
DTSTART:20250715T140000Z
DTEND:20250715T150000Z
RRULE:FREQ=DAILY;UNTIL=20260801T140000Z
LOCATION:Main St
END:VEVENT
BEGIN:VEVENT
UID:one-off
SUMMARY:Autumn Concert
DTSTART:20260901T190000Z
DTEND:20260901T200000Z
END:VEVENT
END:VCALENDAR`;

const WINDOW_START = new Date('2026-07-15T00:00:00Z');

describe('parseICSData', () => {
  it('expands a repeating event into one entry per occurrence', () => {
    const events = parseICSData(ICS, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    const tours = events.filter((e) => e.summary === 'Daily Tour');
    expect(tours).toHaveLength(7);
  });

  it('gives each occurrence a distinct uid', () => {
    const events = parseICSData(ICS, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    const uids = events.map((e) => e.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('carries series details onto each occurrence', () => {
    const events = parseICSData(ICS, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    const tour = events.find((e) => e.summary === 'Daily Tour');
    expect(tour).toBeDefined();
    expect(tour!.location).toBe('Main St');
    expect(tour!.end.getTime() - tour!.start.getTime()).toBe(60 * 60 * 1000);
  });

  it('keeps one-off events outside the expansion window', () => {
    const events = parseICSData(ICS, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    expect(events.some((e) => e.summary === 'Autumn Concert')).toBe(true);
  });

  it('survives filterFutureEvents, which the un-expanded series did not', () => {
    const events = parseICSData(ICS, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    // Every expanded occurrence starts on or after the window start, so none
    // are mistaken for stale past events.
    const stale = events.filter((e) => e.start < WINDOW_START);
    expect(stale).toHaveLength(0);
  });

  it('groups an evening event under its Nauvoo day, not its UTC day', () => {
    // 00:30 UTC on Jul 16 is 7:30 PM on Jul 15 in Nauvoo: the evening Pageant.
    // A UTC-derived key would file it under the 16th, a day early.
    const grouped = groupEventsByDate([
      {
        uid: 'pageant',
        summary: 'British Pageant',
        description: '',
        location: '',
        start: new Date('2026-07-16T00:30:00Z'),
        end: new Date('2026-07-16T02:00:00Z'),
      },
    ]);

    expect([...grouped.keys()]).toEqual(['2026-07-15']);
  });

  it('groups by Nauvoo time regardless of where the viewer is', () => {
    // 14:30 UTC is 9:30 AM in Nauvoo. Whatever zone the viewer's device is in,
    // this event belongs to Jul 15 because that is the day it happens there.
    const grouped = groupEventsByDate([
      {
        uid: 'parade',
        summary: 'Welcome Parade',
        description: '',
        location: '',
        start: new Date('2026-07-15T14:30:00Z'),
        end: new Date('2026-07-15T14:45:00Z'),
      },
    ]);

    expect([...grouped.keys()]).toEqual(['2026-07-15']);
  });

  it('does not hang on an endlessly repeating event', () => {
    const endless = ICS.replace(';UNTIL=20260801T140000Z', '');
    const events = parseICSData(endless, {
      windowStart: WINDOW_START,
      windowDays: 7,
    });

    expect(events.filter((e) => e.summary === 'Daily Tour')).toHaveLength(7);
  });
});
