import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Location, getTypeBadgeClass } from '../types';
import './LocationCard.css';

interface LocationCardProps {
  location: Location;
}

const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(`/site/${location.id}`);
  };

  // Truncate description to ~100 characters
  const truncatedDescription =
    location.description.length > 100
      ? location.description.substring(0, 100) + '...'
      : location.description;

  return (
    <IonCard onClick={handleClick} className="location-card">
      <IonImg
        src={location.imageUrl}
        alt={location.name}
        className="location-card-image"
      />
      <IonCardHeader>
        <span className={`type-badge ${getTypeBadgeClass(location.type)}`}>
          {location.type}
        </span>
        <IonCardTitle className="location-card-title">
          {location.name}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText color="medium">
          <p className="location-card-description">{truncatedDescription}</p>
        </IonText>
      </IonCardContent>
    </IonCard>
  );
};

export default LocationCard;
