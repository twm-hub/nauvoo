import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppConfig } from '../types';

// Default config for development
const defaultConfig: AppConfig = {
  calendarUrl:
    'https://calendar.google.com/calendar/ical/c8c2a7828343026ea25f82ebbcd23ad57f0ab4df1ad0c0d324523e44def75b93%40group.calendar.google.com/public/basic.ics',
  googleMapsApiKey: '',
  siteName: 'Historic Nauvoo',
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);

        // Try to fetch from Firestore
        try {
          const docRef = doc(db, 'config', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setConfig({
              calendarUrl: data.calendarUrl || defaultConfig.calendarUrl,
              googleMapsApiKey: data.googleMapsApiKey || '',
              siteName: data.siteName || defaultConfig.siteName,
            });
            setLoading(false);
            return;
          }
        } catch (firestoreError) {
          console.log('Firestore not configured, using default config');
        }

        // Use default config
        setConfig(defaultConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load config');
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading, error };
}
