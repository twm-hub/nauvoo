import { IonCard, IonCardContent, IonIcon, IonText, IonImg } from '@ionic/react';
import { timeOutline, locationOutline, openOutline } from 'ionicons/icons';
import { CalendarEvent, Location } from '../types';
import { formatNauvooTime } from '../utils/nauvooTime';
import './EventCard.css';

interface EventCardProps {
  event: CalendarEvent;
  matchedLocation?: Location | null;
  /** Already finished — shown dimmed rather than hidden. */
  isPast?: boolean;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  matchedLocation,
  isPast = false,
  onClick,
}) => {
  const startTime = formatNauvooTime(event.start);
  const endTime = formatNauvooTime(event.end);

  const handleSiteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchedLocation?.detailUrl) {
      window.open(matchedLocation.detailUrl, '_blank');
    }
  };

  return (
    <IonCard
      onClick={onClick}
      className={`event-card${isPast ? ' event-card-past' : ''}`}
    >
      {matchedLocation?.imageUrl && (
        <div className="event-thumbnail">
          <IonImg src={matchedLocation.imageUrl} alt={matchedLocation.name} />
        </div>
      )}
      <IonCardContent>
        <div className="event-time">
          <IonIcon icon={timeOutline} />
          <span>
            {startTime} - {endTime}
          </span>
        </div>

        <h3 className="event-title">{event.summary}</h3>

        {event.location && (
          <div className="event-location">
            <IonIcon icon={locationOutline} />
            <span>{event.location}</span>
          </div>
        )}

        {event.description && (
          <IonText color="medium">
            <p className="event-description">
              {event.description.length > 120
                ? event.description.substring(0, 120) + '...'
                : event.description}
            </p>
          </IonText>
        )}

        {event.categories && event.categories.length > 0 && (
          <div className="event-categories">
            {event.categories.map((cat, index) => (
              <span key={index} className="event-category">
                {cat}
              </span>
            ))}
          </div>
        )}

        {matchedLocation?.detailUrl && (
          <button className="event-site-link" onClick={handleSiteLink}>
            <span>View Site</span>
            <IonIcon icon={openOutline} />
          </button>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default EventCard;
