#!/usr/bin/env node
/**
 * Historic Nauvoo - Firebase Setup Script
 *
 * This script:
 * 1. Creates an admin user in Firebase Auth
 * 2. Seeds Firestore with location data
 * 3. Creates the config document
 * 4. Adds the admin user to adminUsers collection
 *
 * Usage: node scripts/setup.mjs <email> <password>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node scripts/setup.mjs <email> <password>');
  console.log('Example: node scripts/setup.mjs admin@example.com MySecurePassword123');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Error: Password must be at least 6 characters');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'service-account-key.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function setup() {
  console.log('\\n🚀 Starting Historic Nauvoo Firebase Setup...\\n');

  // Step 1: Create admin user
  console.log('📧 Creating admin user...');
  let user;
  try {
    user = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
    console.log(`   ✅ Created user: ${user.email} (UID: ${user.uid})`);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`   ℹ️  User ${email} already exists`);
      user = await auth.getUserByEmail(email);
    } else {
      throw error;
    }
  }

  // Step 2: Add user to adminUsers collection
  console.log('\\n🔐 Adding user to adminUsers collection...');
  await db.collection('adminUsers').doc(email).set({
    email,
    createdAt: new Date().toISOString(),
  });
  console.log(`   ✅ Added ${email} to adminUsers`);

  // Step 3: Load and seed locations
  console.log('\\n📍 Seeding location data...');
  const locationsData = JSON.parse(
    readFileSync(join(__dirname, '..', 'nauvoo_locations.json'), 'utf8')
  );
  const locations = locationsData.locations;

  const batch = db.batch();
  for (const location of locations) {
    const docRef = db.collection('locations').doc(location.id.toString());
    batch.set(docRef, location);
  }
  await batch.commit();
  console.log(`   ✅ Seeded ${locations.length} locations`);

  // Step 4: Create config document
  console.log('\\n⚙️  Creating config document...');
  await db.collection('config').doc('settings').set({
    calendarUrl: locationsData.metadata.calendarUrl,
    googleMapsApiKey: '',  // User will add via admin panel
    siteName: 'Historic Nauvoo',
    mapCenter: locationsData.metadata.mapCenter,
    defaultZoom: locationsData.metadata.defaultZoom,
    createdAt: new Date().toISOString(),
  });
  console.log('   ✅ Created config/settings document');

  console.log('\\n✨ Setup complete!\\n');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Go to http://localhost:5173');
  console.log('3. Navigate to Admin tab and sign in');
  console.log('4. Add your Google Maps API key in the settings');
  console.log('');
}

setup().catch((error) => {
  console.error('\\n❌ Setup failed:', error.message);
  process.exit(1);
});
