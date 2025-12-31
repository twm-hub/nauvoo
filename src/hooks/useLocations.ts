import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Location } from '../types';

// For development without Firebase, use local data
import locationsData from '../../nauvoo_locations.json';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);

        // Try to fetch from Firestore first
        try {
          const querySnapshot = await getDocs(collection(db, 'locations'));
          if (!querySnapshot.empty) {
            const firestoreLocations = querySnapshot.docs.map(
              (doc) => doc.data() as Location
            );
            setLocations(firestoreLocations);
            setLoading(false);
            return;
          }
        } catch (firestoreError) {
          console.log('Firestore not configured, using local data');
        }

        // Fallback to local JSON data
        setLocations(locationsData.locations as Location[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  return { locations, loading, error };
}

export function useLocation(id: string | number) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocation() {
      try {
        setLoading(true);
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;

        // Try Firestore first
        try {
          const docRef = doc(db, 'locations', numId.toString());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLocation(docSnap.data() as Location);
            setLoading(false);
            return;
          }
        } catch (firestoreError) {
          console.log('Firestore not configured, using local data');
        }

        // Fallback to local data
        const localLocation = (locationsData.locations as Location[]).find(
          (loc) => loc.id === numId
        );
        if (localLocation) {
          setLocation(localLocation);
        } else {
          setError('Location not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load location');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchLocation();
    }
  }, [id]);

  return { location, loading, error };
}
