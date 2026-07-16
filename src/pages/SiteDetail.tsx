import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonText,
  IonImg,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { navigateOutline, openOutline, locationOutline } from 'ionicons/icons';
import { useLocation } from '../hooks/useLocations';
import { useConfig } from '../hooks/useConfig';
import { getTypeBadgeClass } from '../types';
import MiniMap from '../components/MiniMap';
import './SiteDetail.css';

const SiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { location, loading, error } = useLocation(id);
  const { config, loading: configLoading } = useConfig();

  const handleNavigate = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleViewOfficial = () => {
    if (location?.detailUrl) {
      window.open(location.detailUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/sites" />
            </IonButtons>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="site-detail-loading">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !location) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/sites" />
            </IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="site-detail-error">
            <IonText color="danger">
              <p>{error || 'Location not found'}</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/sites" />
          </IonButtons>
          <IonTitle>{location.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {/* Hero Image */}
        <IonImg
          src={location.imageUrl}
          alt={location.name}
          className="site-hero-image"
        />

        <div className="site-detail-content ion-padding">
          {/* Type Badge */}
          <span className={`type-badge ${getTypeBadgeClass(location.type)}`}>
            {location.type}
          </span>

          {/* Title */}
          <h1 className="site-title">{location.name}</h1>

          {/* Address */}
          <div className="site-address">
            <IonIcon icon={locationOutline} />
            <IonText color="medium">
              <span>{location.address}</span>
            </IonText>
          </div>

          {/* Description */}
          <p className="site-description">{location.description}</p>

          {/* Action Buttons */}
          <div className="site-actions">
            <IonButton
              expand="block"
              onClick={handleNavigate}
              className="navigate-button"
            >
              <IonIcon slot="start" icon={navigateOutline} />
              Navigate Here
            </IonButton>

            {location.detailUrl && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleViewOfficial}
              >
                <IonIcon slot="start" icon={openOutline} />
                View Official Site
              </IonButton>
            )}
          </div>

          {/* Mini Map */}
          <IonCard className="mini-map-card">
            <IonCardContent className="mini-map-content">
              {!configLoading && config.googleMapsApiKey ? (
                <MiniMap
                  apiKey={config.googleMapsApiKey}
                  lat={location.lat}
                  lng={location.lng}
                  type={location.type}
                  height="220px"
                  interactive
                />
              ) : (
                <div className="mini-map-placeholder">
                  <IonText color="medium">
                    <p>Map</p>
                    <p className="map-coords">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </IonText>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Performance indicator */}
          {location.hasPerformances && (
            <div className="performance-badge">
              <IonText color="warning">
                <p>This location hosts live performances</p>
              </IonText>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SiteDetail;
