# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Historic Nauvoo is an Ionic React PWA for visitors to Historic Nauvoo, Illinois. It displays historic sites, a calendar of events, and an interactive map.

**Live URL:** https://historic-nauvoo-app.web.app
**Firebase Project:** historic-nauvoo-app

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run test.unit    # Vitest unit tests
npm run test.e2e     # Cypress end-to-end tests
npm run seed         # Seed Firestore with location data

firebase deploy --only hosting   # Deploy to Firebase Hosting
```

## Architecture

### Data Flow
- **Locations**: Fetched from Firestore `locations` collection, with fallback to `nauvoo_locations.json`
- **Events**: Parsed from Google Calendar ICS feed via `calendarParser.ts` using ical.js
- **Config**: App settings (calendar URL, Maps API key) stored in Firestore `config/settings`

### Key Hooks
- `useLocations()` - Fetches all 53 historic sites
- `useEvents()` - Fetches and parses calendar events, groups by date
- `useConfig()` - Loads app configuration from Firestore
- `useAuth()` - Firebase authentication state

### Event-to-Location Matching
Events are matched to locations via `matchEventToLocation()` in `calendarParser.ts`:
1. GPS proximity matching (if event has geo coordinates)
2. Name-based fuzzy matching as fallback

### Tab Structure
- **Home** - Calendar events with site thumbnails and links
- **Map** - Google Maps with all locations as colored markers
- **Sites** - Searchable/filterable list of locations
- **Admin** - Protected settings panel (Firebase Auth)

## Firestore Structure

```
config/settings     → { calendarUrl, googleMapsApiKey, siteName }
locations/{id}      → Location objects (id, name, type, lat, lng, imageUrl, detailUrl, ...)
adminUsers/{id}     → { email }
```

## Design System

Colors defined in `src/theme/variables.css`:
- Primary (Nauvoo Brick): `#A64B4B`
- Secondary (Mississippi River): `#34495E`
- Background (Temple Limestone): `#F5F1E8`
- Accent (Prairie Gold): `#D4A84B`

Fonts: Playfair Display (headings), Crimson Pro (body)

Map pin colors are defined in `src/types/index.ts` as `PIN_COLORS` by location type.

## Location Types

Historic Site, Visitor Amenity, Visitors' Center, Monument, Historic Temple, Meetinghouse, Wagon Depot
