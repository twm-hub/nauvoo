# Historic Nauvoo App - Build Prompt

Use this prompt with Claude Code CLI to build the Historic Nauvoo visitor app.

---

## THE PROMPT

```
Build an Ionic React Progressive Web App for Historic Nauvoo visitors (similar to a Disneyland app). This app helps visitors find locations, view events, and navigate to sites. Please create this as a plan and add phases with testable milestones.  

## PROJECT SETUP
- Framework: Ionic React (latest)
- Backend: Firebase (Auth, Firestore, Storage, Hosting)
- Target: Mobile-first PWA for web browsers on phones
- Project folder: ./nauvoo

## ASSETS PROVIDED (in ./nauvoo folder)
- nauvoo_locations.json - 53 locations with GPS coordinates, descriptions, images, types
- nauvoo_style_guide.html - Complete design system with colors, fonts, components
- nauvoo_quick_reference.md - Quick reference card with all key values

## FIREBASE CONFIGURATION
Set up Firebase with these services:
- Authentication (email/password for admin)
- Firestore database
- Storage (for any uploaded images)
- Hosting

Create a Firestore structure:
- `config` collection with a single `settings` document containing:
  - calendarUrl (ICS feed URL)
  - googleMapsApiKey
  - siteName
  - any other app-wide settings
- `locations` collection (import from nauvoo_locations.json)
- `adminUsers` collection (list of authorized admin email addresses)

## DESIGN SYSTEM (from style guide)
Colors:
- Primary (Nauvoo Brick): #A64B4B
- Secondary (Mississippi River): #34495E  
- Background (Temple Limestone): #F5F1E8
- Accent (Prairie Gold): #D4A84B
- Forest Green: #3D5A4C
- Iron: #3A3A3A
- Parchment: #FBF7F0

Typography:
- Headlines: Playfair Display (Google Fonts)
- Body: Crimson Pro (Google Fonts)

Pin colors by location type:
- Historic Site: #A64B4B (brick red)
- Visitor Amenity: #3D5A4C (forest green)
- Visitors' Center: #34495E (river blue)
- Monument: #5D7B93 (slate)
- Historic Temple: #D4A84B (gold)
- Performance venues: #D4A84B (gold)

## APP STRUCTURE

### Tab Navigation (bottom)
1. Home (calendar icon)
2. Map (map icon)
3. Sites (list icon)
4. Admin (gear icon - only visible if authenticated as admin)

### Page 1: HOME
- Header with "Historic Nauvoo" title and subtle background
- Calendar view showing events from the ICS feed
- Events displayed by day with time, title, and location
- Tapping an event shows details and links to the location page
- Pull-to-refresh to update calendar

### Page 2: MAP
- Full-screen Google Map centered on Nauvoo (40.546, -91.385), zoom 15
- All 53 locations plotted as colored markers (color by type)
- Marker clustering if zoomed out
- Tapping a marker shows info window with:
  - Location name
  - Type badge
  - "View Details" button → navigates to site page
  - "Navigate" button → opens Google Maps directions
- Filter chips at top to show/hide by type
- Special handling for Carthage Jail (25 miles away) - maybe a "Nearby" toggle

### Page 3: SITES LIST
- Searchable/filterable list of all 53 locations
- Each card shows:
  - Thumbnail image
  - Name
  - Type badge (colored)
  - Brief description (truncated)
- Filter tabs or dropdown by type
- Tapping a card → navigates to site detail page

### Page 4: SITE DETAIL (dynamic route /site/:id)
- Hero image at top
- Location name and type badge
- Full description
- "Navigate Here" button (opens Google Maps with directions)
- Mini map showing just this location with a pin
- Events section showing upcoming events at this location (filtered from calendar by matching location/GPS)
- Link to official Church website (detailUrl)
- Back button

### Page 5: ADMIN (protected route)
- Requires Firebase Auth login
- Only accessible to users in adminUsers collection
- Settings form:
  - Google Maps API Key (input field, saved to Firestore)
  - Calendar ICS URL (input field, saved to Firestore)
  - Site name/branding
- Locations management:
  - List of all locations
  - Edit location details (name, description, coordinates, etc.)
  - Upload new images (to Firebase Storage)
- Button to manually refresh/re-import calendar data

## KEY FUNCTIONALITY

### ICS Calendar Parsing
- Fetch the ICS URL from Firestore config
- Parse ICS format to extract events (use ical.js or similar library)
- Display events with proper timezone handling (America/Chicago)
- Match events to locations using GPS coordinates or location name text

### Google Maps Integration
- Load API key from Firestore config (not hardcoded)
- Use @react-google-maps/api for React integration
- Custom styled markers matching the design system
- Navigation via deep link: https://www.google.com/maps/dir/?api=1&destination={lat},{lng}

### PWA Features
- Service worker for offline capability
- Manifest for "Add to Home Screen"
- Cache location data for offline viewing
- App icons in the 1840s style

## TECHNICAL REQUIREMENTS
- Use React Context or Zustand for state management
- Create custom hooks: useLocations, useEvents, useConfig, useAuth
- Implement proper loading states and error handling
- Mobile-responsive design (test at 375px width)
- Lazy load images for performance
- Environment variables for Firebase config

## FILE STRUCTURE
```
src/
  components/
    LocationCard.tsx
    EventCard.tsx
    MapMarker.tsx
    FilterChips.tsx
    AdminGuard.tsx
  pages/
    Home.tsx
    Map.tsx
    Sites.tsx
    SiteDetail.tsx
    Admin.tsx
    Login.tsx
  hooks/
    useLocations.ts
    useEvents.ts
    useConfig.ts
    useAuth.ts
  services/
    firebase.ts
    calendarParser.ts
    mapService.ts
  context/
    AuthContext.tsx
    ConfigContext.tsx
  theme/
    variables.css (Ionic CSS variables with our color scheme)
  data/
    (initial location data for seeding Firestore)
```

## GETTING STARTED
1. Initialize Ionic React project
2. Set up Firebase project and add config
3. Import nauvoo_locations.json into Firestore
4. Configure the design system (colors, fonts)
5. Build the tab navigation structure
6. Implement each page starting with Sites list (simplest)
7. Add map functionality
8. Add calendar parsing
9. Build admin interface
10. Deploy to Firebase Hosting

Start by setting up the project structure, Firebase integration, and the basic tab navigation with the Sites list page.
```

---

## ASSETS CHECKLIST

Before starting, ensure you have these files in your `./nauvoo` folder:

- [ ] `nauvoo_locations.json` - 53 locations with GPS, descriptions, images
- [ ] `nauvoo_style_guide.html` - Visual design system reference
- [ ] `nauvoo_quick_reference.md` - Developer cheat sheet
- [ ] `nauvoo_test_calendar.ics` - Sample calendar events (optional, for testing)

## KEY VALUES AT A GLANCE

**Map Center:** `40.546, -91.385` (zoom 15)

**Calendar ICS URL:**
```
https://calendar.google.com/calendar/ical/c8c2a7828343026ea25f82ebbcd23ad57f0ab4df1ad0c0d324523e44def75b93%40group.calendar.google.com/public/basic.ics
```

**Primary Colors:**
- Brick Red: `#A64B4B`
- River Blue: `#34495E`
- Limestone: `#F5F1E8`
- Gold: `#D4A84B`
- Forest: `#3D5A4C`

**Fonts:**
- Headlines: Playfair Display
- Body: Crimson Pro

**Navigation Deep Link:**
```javascript
window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
```
