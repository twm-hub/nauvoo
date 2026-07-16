/**
 * Firestore Seed Script
 *
 * Imports location data from nauvoo_locations.json into Firestore.
 * Run with: npm run seed
 *
 * Uses the Admin SDK, which authenticates as the project itself rather than as
 * a signed-in user. The client SDK cannot be used here: firestore.rules only
 * permits writes from an authenticated admin, so a client-SDK seed is rejected
 * with PERMISSION_DENIED.
 *
 * Prerequisites:
 * 1. Application Default Credentials:  gcloud auth application-default login
 * 2. VITE_FIREBASE_PROJECT_ID set in .env
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

async function seedFirestore() {
  console.log('Starting Firestore seed...');

  if (!projectId || projectId === 'your-project-id') {
    console.error('Error: VITE_FIREBASE_PROJECT_ID is not set in .env');
    process.exit(1);
  }

  // A service-account key is honoured when present; otherwise fall back to
  // Application Default Credentials.
  const keyPath = path.join(process.cwd(), 'service-account-key.json');
  initializeApp({
    credential: fs.existsSync(keyPath)
      ? cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')))
      : applicationDefault(),
    projectId,
  });

  const db = getFirestore();

  // Read locations data. Resolved from the repo root rather than __dirname,
  // which doesn't exist when this runs as an ES module.
  const locationsPath = path.join(process.cwd(), 'nauvoo_locations.json');
  const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const locations = locationsData.locations;

  console.log(`Found ${locations.length} locations to import...`);

  let written = 0;
  for (const location of locations) {
    await db.collection('locations').doc(location.id.toString()).set(location);
    written++;
  }
  console.log(`  Wrote ${written} location documents`);

  // Seed config only when it doesn't exist yet.
  //
  // This used to overwrite config/settings unconditionally, which reset the
  // calendar URL to whatever was in the JSON and blanked googleMapsApiKey --
  // silently breaking both the calendar and the map on any re-seed. The live
  // values are edited through the Admin panel and must win.
  const configRef = db.collection('config').doc('settings');
  const existingConfig = await configRef.get();

  if (existingConfig.exists) {
    console.log('config/settings already exists - left untouched');
  } else {
    await configRef.set({
      calendarUrl: locationsData.metadata.calendarUrl,
      googleMapsApiKey: '', // User will set this via admin panel
      siteName: 'Historic Nauvoo',
      mapCenter: locationsData.metadata.mapCenter,
      defaultZoom: locationsData.metadata.defaultZoom,
    });
    console.log('Created config/settings document');
  }

  console.log('\nFirestore seed completed successfully!');
}

seedFirestore().catch((error) => {
  console.error(error);
  process.exit(1);
});
