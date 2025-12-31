/**
 * Firestore Seed Script
 *
 * This script imports location data from nauvoo_locations.json into Firestore.
 * Run with: npx ts-node scripts/seedFirestore.ts
 *
 * Prerequisites:
 * 1. Set up Firebase project
 * 2. Update .env with your Firebase credentials
 * 3. Enable Firestore in Firebase Console
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables (for Node.js)
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function seedFirestore() {
  console.log('Starting Firestore seed...');

  // Check for Firebase config
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-project-id') {
    console.error('Error: Please configure Firebase credentials in .env file');
    process.exit(1);
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Read locations data
  const locationsPath = path.join(__dirname, '..', 'nauvoo_locations.json');
  const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const locations = locationsData.locations;

  console.log(`Found ${locations.length} locations to import...`);

  // Import locations
  for (const location of locations) {
    const docRef = doc(db, 'locations', location.id.toString());
    await setDoc(docRef, location);
    console.log(`  Imported: ${location.name}`);
  }

  // Create default config document
  const configRef = doc(db, 'config', 'settings');
  await setDoc(configRef, {
    calendarUrl: locationsData.metadata.calendarUrl,
    googleMapsApiKey: '', // User will set this via admin panel
    siteName: 'Historic Nauvoo',
    mapCenter: locationsData.metadata.mapCenter,
    defaultZoom: locationsData.metadata.defaultZoom,
  });
  console.log('Created config/settings document');

  console.log('\nFirestore seed completed successfully!');
  console.log(`\nNext steps:
  1. Go to Firebase Console > Firestore to verify data
  2. Add your Google Maps API key via the Admin panel
  3. Add admin users to the 'adminUsers' collection`);
}

seedFirestore().catch(console.error);
