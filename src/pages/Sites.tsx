import { useState, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useLocations } from '../hooks/useLocations';
import { LocationType } from '../types';
import LocationCard from '../components/LocationCard';
import FilterChips from '../components/FilterChips';
import './Sites.css';

// All location types
const ALL_TYPES: LocationType[] = [
  'Historic Site',
  'Visitor Amenity',
  'Visitors\' Center',
  'Monument',
  'Historic Temple',
  'Meetinghouse',
  'Wagon Depot',
];

const Sites: React.FC = () => {
  const { locations, loading, error } = useLocations();
  const [searchText, setSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<LocationType[]>([]);

  // Filter locations based on search and type filters
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Search filter
      const matchesSearch =
        searchText === '' ||
        location.name.toLowerCase().includes(searchText.toLowerCase()) ||
        location.description.toLowerCase().includes(searchText.toLowerCase());

      // Type filter (if no types selected, show all)
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(location.type);

      return matchesSearch && matchesType;
    });
  }, [locations, searchText, selectedTypes]);

  // Toggle type filter
  const handleTypeToggle = (type: LocationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sites</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Sites</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonSearchbar
          placeholder="Search locations..."
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value || '')}
          debounce={300}
        />

        <FilterChips
          types={ALL_TYPES}
          selectedTypes={selectedTypes}
          onToggle={handleTypeToggle}
        />

        {loading && (
          <div className="sites-loading">
            <IonSpinner name="crescent" />
            <IonText color="medium">Loading locations...</IonText>
          </div>
        )}

        {error && (
          <div className="sites-error ion-padding">
            <IonText color="danger">
              <p>Error loading locations: {error}</p>
            </IonText>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="sites-count ion-padding-horizontal">
              <IonText color="medium">
                <p>
                  {filteredLocations.length} of {locations.length} locations
                </p>
              </IonText>
            </div>

            <IonGrid className="sites-grid">
              <IonRow>
                {filteredLocations.map((location) => (
                  <IonCol size="12" sizeMd="6" sizeLg="4" key={location.id}>
                    <LocationCard location={location} />
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            {filteredLocations.length === 0 && (
              <div className="sites-empty ion-padding">
                <IonText color="medium">
                  <p>No locations found matching your criteria.</p>
                </IonText>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Sites;
