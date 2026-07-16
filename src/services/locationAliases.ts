/**
 * Names the calendar uses for places, which don't match our site names.
 *
 * The calendar is written for people, not machines: it says "70's Hall" where
 * our records say "Seventies Hall", and "the Weeks Home" for the William and
 * Caroline Weeks Home. Events change daily, so nothing here describes an event
 * -- these are alternative names for places, and places rarely change.
 *
 * Keyed by our exact site name. Add an entry when the calendar starts calling a
 * place something new; no code change is needed.
 */
export const LOCATION_ALIASES: Record<string, string[]> = {
  'Seventies Hall': ["70's hall", '70s hall', 'seventies hall'],

  'William and Caroline Weeks Home': ['weeks home'],

  // The calendar calls the North Visitors' Center the "Nauvoo Performance
  // Center". Two events prove they are one building: both "West Theater of the
  // North Visitor's Center" and "West Theater of the Nauvoo Performance Center"
  // appear, and the Outdoor Stage is described as east of each in turn.
  "Historic Nauvoo North Visitors' Center": [
    'nauvoo performance center',
    'nauvoo performance cntr',
    'performance center',
    'performance cntr',
    "north visitor's center",
    "north visitors' center",
    'north visitor center',
    'north visitors center',
  ],

  "Historic Nauvoo South Visitors' Center": [
    "south visitor's center",
    "south visitors' center",
    'south visitor center',
    'south visitors center',
  ],

  // "Outdoor theater east of the Nauvoo Performance Center" is this stage. Its
  // position was confirmed against the surveyed coordinates: the Outdoor Stage
  // really does sit 157 m east of the Visitors' Center.
  'Outdoor Stage': ['outdoor theater', 'outdoor theatre'],

  'Pageant Stage Area': ['pageant stage'],

  // The calendar says "Grove", our records say "Wood". Confirmed as the same
  // place: it sits 151 m north of the Pageant Stage, exactly as described.
  'Partridge Street Wood': ['partridge street grove'],

  'Pioneer Pastimes Picnic Area': ['pioneer pastimes'],

  'Main and Kimball Corner': [
    'corner of main and kimball',
    'corner of main & kimball',
    'main and kimball streets',
    'main & kimball streets',
  ],
};
