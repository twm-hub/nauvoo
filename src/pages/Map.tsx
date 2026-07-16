import { useState, useCallback, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonSpinner,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useHistory } from 'react-router-dom';
import { informationCircleOutline } from 'ionicons/icons';
import { useLocations } from '../hooks/useLocations';
import { useConfig } from '../hooks/useConfig';
import { Location, LocationType, PIN_COLORS } from '../types';
import FilterChips from '../components/FilterChips';
import './Map.css';

// Map configuration
// Centroid of the Nauvoo sites (Carthage sits ~30 km away and is reached by
// its own markers). Recomputed after the location coordinates were corrected.
const MAP_CENTER = { lat: 40.5472, lng: -91.3901 };
const DEFAULT_ZOOM = 15;

const containerStyle = {
  width: '100%',
  height: '100%',
};

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

// Map type to Google marker color name
const getMarkerColorName = (type: LocationType): string => {
  switch (type) {
    case 'Historic Site':
      return 'red';
    case 'Visitor Amenity':
      return 'green';
    case 'Visitors\' Center':
      return 'blue';
    case 'Monument':
      return 'purple';
    case 'Historic Temple':
      return 'yellow';
    case 'Meetinghouse':
      return 'blue';
    case 'Wagon Depot':
      return 'green';
    default:
      return 'red';
  }
};

// Get marker icon URL for a location type
const getMarkerIcon = (type: LocationType) => {
  return `https://maps.google.com/mapfiles/ms/icons/${getMarkerColorName(type)}-dot.png`;
};

// Inner component that uses the Google Maps loader - only rendered when API key is available
interface GoogleMapContentProps {
  apiKey: string;
  locations: Location[];
}

const GoogleMapContent: React.FC<GoogleMapContentProps> = ({ apiKey, locations }) => {
  const history = useHistory();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<LocationType[]>([]);
  const [showCarthage, setShowCarthage] = useState(false);

  // Load Google Maps API - only called once with the actual API key
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(location.type);
      const isCarthage = location.name.toLowerCase().includes('carthage');
      if (isCarthage && !showCarthage) return false;
      return matchesType;
    });
  }, [locations, selectedTypes, showCarthage]);

  const handleTypeToggle = (type: LocationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleNavigate = useCallback((location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  }, []);

  const handleViewDetails = useCallback(
    (location: Location) => {
      history.push(`/site/${location.id}`);
    },
    [history]
  );

  if (loadError) {
    return (
      <div className="map-error">
        <IonText color="danger">
          <h2>Map Error</h2>
          <p>Failed to load Google Maps. Please check your API key and billing settings.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            Error: {loadError.message}
          </p>
        </IonText>
      </div>
    );
  }

  return (
    <>
      {/* Filter chips overlay */}
      <div className="map-filters">
        <FilterChips
          types={ALL_TYPES}
          selectedTypes={selectedTypes}
          onToggle={handleTypeToggle}
        />
        <div className="carthage-toggle">
          <IonButton
            fill={showCarthage ? 'solid' : 'outline'}
            size="small"
            onClick={() => setShowCarthage(!showCarthage)}
          >
            {showCarthage ? 'Hide' : 'Show'} Carthage (25 mi)
          </IonButton>
        </div>
      </div>

      {/* Google Map */}
      <div className="map-container">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={MAP_CENTER}
            zoom={DEFAULT_ZOOM}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {filteredLocations.map((location) => (
              <MarkerF
                key={location.id}
                position={{ lat: location.lat, lng: location.lng }}
                icon={getMarkerIcon(location.type)}
                onClick={() => setSelectedLocation(location)}
              />
            ))}

            {selectedLocation && (
              <InfoWindowF
                position={{
                  lat: selectedLocation.lat,
                  lng: selectedLocation.lng,
                }}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="map-info-window">
                  <h3>{selectedLocation.name}</h3>
                  <span className="info-window-type">
                    {selectedLocation.type}
                  </span>
                  <div className="info-window-actions">
                    <button
                      onClick={() => handleViewDetails(selectedLocation)}
                      className="info-window-btn details"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleNavigate(selectedLocation)}
                      className="info-window-btn navigate"
                    >
                      Navigate
                    </button>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="map-loading">
            <IonSpinner name="crescent" />
            <IonText color="medium">Loading Google Maps...</IonText>
          </div>
        )}
      </div>
    </>
  );
};

// Main Map page component
const Map: React.FC = () => {
  const { locations, loading: locationsLoading } = useLocations();
  const { config, loading: configLoading } = useConfig();

  // Show loading while config is being fetched
  if (locationsLoading || configLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Map</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="map-loading">
            <IonSpinner name="crescent" />
            <IonText color="medium">Loading...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // No API key configured
  if (!config.googleMapsApiKey) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Map</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="map-no-key">
            <IonIcon icon={informationCircleOutline} className="map-no-key-icon" />
            <IonText>
              <h2>Map Not Configured</h2>
              <p>
                A Google Maps API key is required to display the interactive map.
              </p>
              <p>
                Administrators can add the API key in the Admin panel settings.
              </p>
            </IonText>
            <IonButton routerLink="/admin" fill="outline">
              Go to Admin
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Render the map with the API key
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <GoogleMapContent apiKey={config.googleMapsApiKey} locations={locations} />
      </IonContent>
    </IonPage>
  );
};

export default Map;
