# Historic Nauvoo App - Carryover Prompt

Use this prompt to continue development in a new Claude Code session.

---

## Project Summary

This is an **Ionic React PWA** for Historic Nauvoo visitors (similar to a Disneyland app). It helps visitors find locations, view events, and navigate to historic sites.

**Status: Fully functional and configured**

## Tech Stack
- **Frontend:** Ionic React (TypeScript)
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **Maps:** Google Maps API (@react-google-maps/api)
- **Calendar:** ICS parsing with ical.js

## Firebase Project
- **Project ID:** `historic-nauvoo-app`
- **Admin Account:** `themursets@gmail.com` / `Nauvoo2024!`
- **Firestore:** 53 locations seeded, config document with API keys

## Project Structure
```
/Users/passwordis0000/nauvoo/
├── src/
│   ├── pages/
│   │   ├── Home.tsx        # Events calendar from ICS feed
│   │   ├── Map.tsx         # Google Maps with 53 location pins
│   │   ├── Sites.tsx       # Searchable/filterable location list
│   │   ├── SiteDetail.tsx  # Location detail with mini map
│   │   ├── Admin.tsx       # Settings management (API keys, etc.)
│   │   └── Login.tsx       # Firebase auth login
│   ├── components/
│   │   ├── LocationCard.tsx
│   │   ├── EventCard.tsx
│   │   ├── FilterChips.tsx
│   │   └── AdminGuard.tsx
│   ├── hooks/
│   │   ├── useLocations.ts  # Fetch from Firestore/local JSON
│   │   ├── useEvents.ts     # Parse ICS calendar
│   │   ├── useConfig.ts     # App config from Firestore
│   │   └── useAuth.ts       # Firebase authentication
│   ├── services/
│   │   ├── firebase.ts
│   │   └── calendarParser.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   └── theme/
│       └── variables.css    # Nauvoo design system
├── nauvoo_locations.json    # 53 locations with GPS, descriptions
├── nauvoo_test_calendar.ics # Sample events
├── nauvoo_style_guide.html  # Design reference
├── firebase.json            # Hosting config
├── firestore.rules          # Security rules (deployed)
└── .env                     # Firebase credentials (configured)
```

## Key Features Implemented
1. **Home Tab:** Events calendar with pull-to-refresh, events grouped by day
2. **Map Tab:** Full Google Maps with colored pins by type, filter chips, info windows
3. **Sites Tab:** Search + filter by type, cards with images
4. **Site Detail:** Hero image, description, Navigate button, mini Google Map
5. **Admin Tab:** Protected by Firebase Auth, manage API keys and calendar URL

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
firebase deploy --only hosting  # Deploy to Firebase
```

## Current Dev Server
Running at: **http://localhost:5175/**

## Recent Fixes
- Fixed Google Maps "Loader must not be called again with different options" error by separating map components to only mount after API key is loaded from Firestore

## Design System
- **Primary (Nauvoo Brick):** #A64B4B
- **Secondary (River):** #34495E
- **Background (Limestone):** #F5F1E8
- **Accent (Gold):** #D4A84B
- **Forest Green:** #3D5A4C
- **Fonts:** Playfair Display (headlines), Crimson Pro (body)

## What's Working
- ✅ All 4 tabs functional
- ✅ Firebase Auth
- ✅ Firestore with 53 locations
- ✅ Google Maps on Map page and Site Detail mini maps
- ✅ Calendar parsing from ICS
- ✅ Admin panel for settings

## To Continue Development
Just reference this file or paste its contents to continue where we left off.
