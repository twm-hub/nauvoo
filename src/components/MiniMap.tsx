import { IonText, IonSpinner } from '@ionic/react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { LocationType } from '../types';
import './MiniMap.css';

interface MiniMapProps {
  apiKey: string;
  lat: number;
  lng: number;
  type: LocationType;
  height?: string;
  /** Allow panning and zooming. Off by default so the map can't swallow scrolls. */
  interactive?: boolean;
}

const MARKER_COLORS: Record<LocationType, string> = {
  'Historic Site': 'red',
  'Visitor Amenity': 'green',
  "Visitors' Center": 'blue',
  Monument: 'purple',
  'Historic Temple': 'yellow',
  Meetinghouse: 'blue',
  'Wagon Depot': 'green',
};

/**
 * A small, non-interactive map pinned to one place.
 *
 * Shared by the site page and the expanded event card so both pin a place the
 * same way and the Google Maps script is loaded once (the shared `id` below is
 * what keeps useJsApiLoader from loading it twice).
 */
const MiniMap: React.FC<MiniMapProps> = ({
  apiKey,
  lat,
  lng,
  type,
  height = '150px',
  interactive = false,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="mini-map-placeholder" style={{ height }}>
        <IonText color="medium">
          <p>Map unavailable</p>
        </IonText>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mini-map-placeholder" style={{ height }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height, borderRadius: '4px' }}
      center={{ lat, lng }}
      zoom={16}
      options={{
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: interactive,
        // 'greedy' so a one-finger drag pans the map instead of scrolling the
        // page out from under it.
        gestureHandling: interactive ? 'greedy' : 'none',
        keyboardShortcuts: interactive,
        clickableIcons: interactive,
      }}
    >
      <MarkerF
        position={{ lat, lng }}
        icon={`https://maps.google.com/mapfiles/ms/icons/${
          MARKER_COLORS[type] ?? 'red'
        }-dot.png`}
      />
    </GoogleMap>
  );
};

export default MiniMap;
