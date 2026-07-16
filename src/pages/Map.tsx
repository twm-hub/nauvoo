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

/**
 * Strip Google's own places off the map so only Historic Nauvoo's pins remain.
 *
 * Roads, their names, water and parkland are kept -- they orient a visitor on
 * foot. What goes is every business, shop, hotel and transit marker, none of
 * which is a Historic Nauvoo site and all of which look like our pins.
 */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // Parks and water are landmarks, not clutter: keep the shapes, drop the pins.
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'water', stylers: [{ visibility: 'on' }] },
];
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

/**
 * Marker icon for a location type.
 *
 * Returned as an object rather than a bare URL so `labelOrigin` can drop the
 * site's name underneath the pin. Google's default puts label text inside the
 * pin, where a name like "Calvin and Sally Pendleton Home and Schoolhouse"
 * cannot fit.
 */
const getMarkerIcon = (type: LocationType): google.maps.Icon => ({
  url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColorName(type)}-dot.png`,
  labelOrigin: new google.maps.Point(16, 40),
});

/** Carthage sits ~30 km from Nauvoo and is shown only on request. */
const isCarthage = (location: Location) =>
  location.name.toLowerCase().includes('carthage');

/**
 * How far from the middle of the sites a pin can be and still shape the opening
 * view. 52 of the 53 Nauvoo sites are within a kilometre of each other; Pioneer
 * Saints Cemetery is 3.5 km east, and framing for it shrinks the historic
 * district visitors actually walk to a thumbnail. It stays on the map -- just
 * outside the first screen.
 */
const FRAMING_RADIUS_M = 1500;

function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Below this, 55 names on top of each other is unreadable, so labels are hidden. */
const LABEL_MIN_ZOOM = 16;

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
  // Off by default: the map is for Historic Nauvoo's sites, and Google's shops
  // and hotels look just like our pins.
  const [showGooglePlaces, setShowGooglePlaces] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [satellite, setSatellite] = useState(false);

  const showLabels = zoom >= LABEL_MIN_ZOOM;

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
      if (isCarthage(location) && !showCarthage) return false;
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
          <IonButton
            fill={showGooglePlaces ? 'solid' : 'outline'}
            size="small"
            onClick={() => setShowGooglePlaces(!showGooglePlaces)}
          >
            {showGooglePlaces ? 'Hide' : 'Show'} other places
          </IonButton>
          <IonButton
            fill={satellite ? 'solid' : 'outline'}
            size="small"
            onClick={() => setSatellite(!satellite)}
          >
            {satellite ? 'Map' : 'Satellite'}
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
            // 'hybrid' rather than 'satellite': it keeps street names over the
            // aerial view, which a visitor navigating on foot still needs.
            mapTypeId={satellite ? 'hybrid' : 'roadmap'}
            onLoad={(map) => {
              setMapRef(map);

              // Open framed on the historic district rather than at a fixed
              // zoom, so it fills whatever screen it lands on -- most of these
              // are phones. Padding clears the header and the tab bar.
              const nauvoo = locations.filter((l) => !isCarthage(l));
              if (!nauvoo.length) return;

              const centre = {
                lat: nauvoo.reduce((sum, l) => sum + l.lat, 0) / nauvoo.length,
                lng: nauvoo.reduce((sum, l) => sum + l.lng, 0) / nauvoo.length,
              };

              const bounds = new google.maps.LatLngBounds();
              nauvoo
                .filter((l) => metresBetween(centre, l) <= FRAMING_RADIUS_M)
                .forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }));

              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { top: 110, right: 50, bottom: 90, left: 50 });
              }
            }}
            // Labels appear once zoomed in far enough to read them.
            onZoomChanged={() => {
              const z = mapRef?.getZoom();
              if (typeof z === 'number') setZoom(z);
            }}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              // Default is bottom-right, where the tab bar covers the minus
              // button. Centred on the right edge keeps both buttons reachable
              // whatever the screen height.
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
              },
              // Google's own map-type and fullscreen controls sit at the top of
              // the map, which our header and filter bar cover. The satellite
              // toggle is a button in the filter bar instead.
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              // Google's own pins (shops, hotels, businesses) compete with ours
              // and none of them are Historic Nauvoo. Streets and their names
              // stay either way: a visitor on foot needs those.
              clickableIcons: showGooglePlaces,
              styles: showGooglePlaces ? undefined : MAP_STYLES,
            }}
          >
            {filteredLocations.map((location) => (
              <MarkerF
                key={location.id}
                position={{ lat: location.lat, lng: location.lng }}
                icon={getMarkerIcon(location.type)}
                label={
                  showLabels
                    ? {
                        text: location.name,
                        className: 'map-pin-label',
                        color: '#2F3E4E',
                        fontSize: '11px',
                        fontWeight: '600',
                      }
                    : undefined
                }
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
