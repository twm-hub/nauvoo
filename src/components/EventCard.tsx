import { IonCard, IonCardContent, IonIcon, IonText, IonImg } from '@ionic/react';
import { timeOutline, locationOutline, openOutline } from 'ionicons/icons';
import { format } from 'date-fns';
import { CalendarEvent, Location } from '../types';
import './EventCard.css';

interface EventCardProps {
  event: CalendarEvent;
  matchedLocation?: Location | null;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, matchedLocation, onClick }) => {
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');

  const handleSiteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchedLocation?.detailUrl) {
      window.open(matchedLocation.detailUrl, '_blank');
    }
  };

  return (
    <IonCard onClick={onClick} className="event-card">
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
