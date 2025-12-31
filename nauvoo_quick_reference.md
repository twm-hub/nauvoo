# Historic Nauvoo App - Quick Reference Card

## COLORS
| Name | Hex | Usage |
|------|-----|-------|
| Nauvoo Brick | `#A64B4B` | Primary, Historic Site pins |
| Mississippi River | `#34495E` | Secondary, Visitors' Center pins |
| Temple Limestone | `#F5F1E8` | Background |
| Prairie Gold | `#D4A84B` | Accent, Temple & Performance pins |
| Illinois Forest | `#3D5A4C` | Amenity pins |
| Iron | `#3A3A3A` | Text |
| Parchment | `#FBF7F0` | Cards, light backgrounds |
| Slate | `#5D7B93` | Monument pins |

## IONIC CSS VARIABLES
```css
:root {
  --ion-color-primary: #A64B4B;
  --ion-color-secondary: #34495E;
  --ion-color-tertiary: #D4A84B;
  --ion-color-success: #3D5A4C;
  --ion-color-warning: #D4A84B;
  --ion-color-light: #F5F1E8;
  --ion-color-dark: #3A3A3A;
  --ion-background-color: #F5F1E8;
  --ion-text-color: #3A3A3A;
}
```

## FONTS (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Crimson+Pro:wght@400;500;600&display=swap" rel="stylesheet">
```
```css
--ion-font-family: 'Crimson Pro', serif;
h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }
```

## MAP CONFIG
| Setting | Value |
|---------|-------|
| Center Lat | `40.546` |
| Center Lng | `-91.385` |
| Default Zoom | `15` |
| Timezone | `America/Chicago` |

## PIN COLORS BY TYPE
```javascript
const pinColors = {
  "Historic Site": "#A64B4B",
  "Visitor Amenity": "#3D5A4C",
  "Visitors' Center": "#34495E",
  "Monument": "#5D7B93",
  "Historic Temple": "#D4A84B",
  "Meetinghouse": "#34495E",
  "Wagon Depot": "#3D5A4C"
};
```

## CALENDAR URL (ICS)
```
https://calendar.google.com/calendar/ical/c8c2a7828343026ea25f82ebbcd23ad57f0ab4df1ad0c0d324523e44def75b93%40group.calendar.google.com/public/basic.ics
```

## NAVIGATION DEEP LINK
```javascript
const navigateToLocation = (lat, lng, name) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};
```

## LOCATION COUNTS
| Type | Count |
|------|-------|
| Historic Site | 27 |
| Visitor Amenity | 17 |
| Visitors' Center | 3 |
| Monument | 2 |
| Historic Temple | 1 |
| Meetinghouse | 1 |
| Wagon Depot | 1 |
| **Total** | **53** |

## PERFORMANCE VENUES (5)
- Cultural Hall
- Family Living Center
- Outdoor Stage
- Pageant Stage Area
- Seventies Hall

## KEY LOCATIONS
| Location | Lat | Lng | Notes |
|----------|-----|-----|-------|
| Nauvoo Temple | 40.550000 | -91.384700 | Landmark |
| Carthage Jail | 40.415300 | -91.137800 | 25 mi away |
| Pioneer Cemetery | 40.536686 | -91.350606 | 2.5 mi east |
| Cultural Hall | 40.547367 | -91.391717 | Main venue |

## FIRESTORE STRUCTURE
```
firestore/
  config/
    settings {
      calendarUrl: string
      googleMapsApiKey: string
      siteName: string
    }
  locations/
    {locationId} {
      id, name, type, description,
      address, lat, lng,
      imageUrl, detailUrl, hasPerformances
    }
  adminUsers/
    {odcId} {
      email: string
    }
```

## NPM PACKAGES TO INSTALL
```bash
npm install firebase
npm install @react-google-maps/api
npm install ical.js
npm install date-fns
npm install zustand  # or use React Context
```

## USEFUL COMMANDS
```bash
# Start dev server
ionic serve

# Build for production
ionic build --prod

# Deploy to Firebase
firebase deploy

# Initialize Firebase in project
firebase init
```

## FILES IN ./nauvoo FOLDER
- `nauvoo_locations.json` - All 53 locations with data
- `nauvoo_style_guide.html` - Visual design reference
- `nauvoo_test_calendar.ics` - Sample events (if needed)
