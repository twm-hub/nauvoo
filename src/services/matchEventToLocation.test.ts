import { describe, it, expect } from 'vitest';
import { matchEventToLocation } from './calendarParser';
import { CalendarEvent } from '../types';

/** A few real sites, spelled exactly as our records do. */
const LOCATIONS = [
  { name: 'Cultural Hall', lat: 40.5473917, lng: -91.3917442 },
  { name: 'Seventies Hall', lat: 40.5433225, lng: -91.3947248 },
  { name: 'Heber and Vilate Kimball Home', lat: 40.54544624, lng: -91.38799562 },
  { name: "Historic Nauvoo North Visitors' Center", lat: 40.553452, lng: -91.3897665 },
  { name: "Historic Nauvoo South Visitors' Center", lat: 40.54126483, lng: -91.38939558 },
  { name: 'Outdoor Stage', lat: 40.5540772, lng: -91.3882115 },
  { name: 'Pageant Stage Area', lat: 40.54834455, lng: -91.38889689 },
  { name: 'Partridge Street Wood', lat: 40.548729, lng: -91.3908229 },
  { name: 'Pioneer Pastimes Picnic Area', lat: 40.5499347, lng: -91.3940857 },
  { name: 'Trail of Hope', lat: 40.5432455, lng: -91.3975521 },
  { name: 'William and Caroline Weeks Home', lat: 40.55225245, lng: -91.38755697 },
  { name: 'Main and Kimball Corner', lat: 40.54433823, lng: -91.39147319 },
  { name: 'Red Brick Store', lat: 40.54072184, lng: -91.39314665 },
];

function event(summary: string, location: string): CalendarEvent {
  return {
    uid: 'x',
    summary,
    description: '',
    location,
    start: new Date('2026-07-15T14:30:00Z'),
    end: new Date('2026-07-15T15:00:00Z'),
  };
}

const match = (summary: string, location: string) =>
  matchEventToLocation(event(summary, location), LOCATIONS)?.name ?? null;

describe('matchEventToLocation', () => {
  it('reads a site named plainly in the text', () => {
    expect(match('Women of Nauvoo', 'Behind the Red Brick Store')).toBe(
      'Red Brick Store'
    );
  });

  it('understands the nicknames the calendar uses', () => {
    expect(match('Go Ye Into All the World', "70's Hall")).toBe('Seventies Hall');
    expect(
      match('Temple City Tour', 'The vignette takes place in the shaded yard behind the Weeks Home.')
    ).toBe('William and Caroline Weeks Home');
    expect(match('British Pageant', 'Pageant Stage')).toBe('Pageant Stage Area');
  });

  it('knows the Nauvoo Performance Center is the North Visitors\' Center', () => {
    expect(
      match('Love of the Savior Concert', 'West Theater of the Nauvoo Performance Center. Ticketed guests...')
    ).toBe("Historic Nauvoo North Visitors' Center");
  });

  it('takes the real venue, not the wet-weather fallback named later', () => {
    // This exact description used to match the Cultural Hall -- the backup.
    expect(
      match(
        'Youth of Zion',
        'Held in an open area behind the Heber and Vilate Kimball Home. There are a limited ' +
          'number of benches. In inclement weather it may be moved to the Cultural Hall.'
      )
    ).toBe('Heber and Vilate Kimball Home');
  });

  it('takes the outdoor theatre, not the building it sits east of', () => {
    expect(
      match(
        'Sunset by the Mississippi',
        'Outdoor theater east of the Nauvoo Performance Center. Seating is first come, first served.'
      )
    ).toBe('Outdoor Stage');
  });

  it('uses the title when the title is itself a site', () => {
    // The text says to gather at the Seventies Hall, but the event is the trail.
    expect(
      match('Trail of Hope', "Begin at 70's Hall. This is a mobile performance that requires guests to walk 0.3 miles.")
    ).toBe('Trail of Hope');
  });

  it('matches a street corner that is a real gathering place', () => {
    expect(
      match('Jesus Loves Me', 'Corner of Main and Kimball streets (under the large tree)')
    ).toBe('Main and Kimball Corner');
  });

  it('prefers the site named first when a route names two', () => {
    expect(
      match('Welcome Parade', 'Begins at the Cultural Hall on Main street and ends at Main & Kimball streets')
    ).toBe('Cultural Hall');
  });

  it('tells north from south when both centres share most of their name', () => {
    expect(match('Songs of the Heart', 'Held in the South Visitors’ Center.')).toBe(
      "Historic Nauvoo South Visitors' Center"
    );
    expect(match('House of the Lord', "West Theater of the North Visitor's Center.")).toBe(
      "Historic Nauvoo North Visitors' Center"
    );
  });

  it('shows nothing rather than guessing when the venue is not ours', () => {
    expect(match('Love Of the Savior Concert', 'Grand Theatre, 26 N 6th St, Keokuk, IA')).toBeNull();
  });

  it('never matches on a single shared word', () => {
    // "Nauvoo" appears in nearly every description and in five site names. It
    // used to pin nine unrelated events to the North Visitors' Center.
    expect(match('Some Event', 'Somewhere in Nauvoo, Illinois')).toBeNull();
    expect(match('Some Event', 'A hall in Nauvoo')).toBeNull();
    expect(match('Some Event', 'Main Street, Nauvoo, IL 62354')).toBeNull();
  });

  it('does not find a site name inside a longer word', () => {
    expect(match('Some Event', 'Meet at the Outdoor Stagecoach stop')).toBeNull();
  });

  it('uses GPS when the feed ever supplies it', () => {
    const e = event('Anything', 'no recognisable place here');
    e.geo = { lat: 40.5473917, lng: -91.3917442 }; // on the Cultural Hall
    expect(matchEventToLocation(e, LOCATIONS)?.name).toBe('Cultural Hall');
  });

  it('picks the closest site when GPS lands near several', () => {
    const e = event('Anything', '');
    e.geo = { lat: 40.5433, lng: -91.3947 }; // right by the Seventies Hall
    expect(matchEventToLocation(e, LOCATIONS)?.name).toBe('Seventies Hall');
  });
});
