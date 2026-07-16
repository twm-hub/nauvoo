import { useState } from 'react';
import { IonCard, IonCardContent, IonIcon, IonText, IonImg } from '@ionic/react';
import {
  timeOutline,
  locationOutline,
  navigateOutline,
  chevronDown,
  chevronForward,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { CalendarEvent, Location } from '../types';
import { formatNauvooTime } from '../utils/nauvooTime';
import { renderDescription, previewDescription } from '../utils/renderDescription';
import { useConfig } from '../hooks/useConfig';
import MiniMap from './MiniMap';
import './EventCard.css';

interface EventCardProps {
  event: CalendarEvent;
  matchedLocation?: Location | null;
  /** Already finished — shown dimmed rather than hidden. */
  isPast?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  matchedLocation,
  isPast = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { config } = useConfig();
  const history = useHistory();

  const startTime = formatNauvooTime(event.start);
  const endTime = formatNauvooTime(event.end);

  // Opens the phone's own map app (Google Maps on Android, Apple or Google Maps
  // on iOS) with walking directions already set, rather than showing another map
  // inside our app.
  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchedLocation) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${matchedLocation.lat},${matchedLocation.lng}`,
      '_blank'
    );
  };

  const handleSitePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchedLocation) history.push(`/site/${matchedLocation.id}`);
  };

  const hasDescription = Boolean(event.description?.trim());

  return (
    <IonCard
      className={`event-card${isPast ? ' event-card-past' : ''}${
        expanded ? ' event-card-expanded' : ''
      }`}
      onClick={() => setExpanded((open) => !open)}
      role="button"
      aria-expanded={expanded}
    >
      {matchedLocation?.imageUrl && (
        <div className={`event-thumbnail${expanded ? ' event-thumbnail-full' : ''}`}>
          <IonImg src={matchedLocation.imageUrl} alt={matchedLocation.name} />
        </div>
      )}

      <IonCardContent>
        <div className="event-time">
          <IonIcon icon={timeOutline} />
          <span>
            {startTime} - {endTime}
          </span>
          <IonIcon
            className="event-expand-chevron"
            icon={expanded ? chevronDown : chevronForward}
          />
        </div>

        <h3 className="event-title">{event.summary}</h3>

        {event.location && (
          <div className="event-location">
            <IonIcon icon={locationOutline} />
            <span>{event.location}</span>
          </div>
        )}

        {hasDescription && !expanded && (
          <IonText color="medium">
            <p className="event-description">
              {previewDescription(event.description)}
            </p>
          </IonText>
        )}

        {expanded && (
          <div className="event-expanded">
            {hasDescription && (
              <IonText color="medium">
                <div className="event-description-full">
                  {renderDescription(event.description)}
                </div>
              </IonText>
            )}

            {matchedLocation && (
              <div className="event-place">
                <h4 className="event-place-name">{matchedLocation.name}</h4>
                {matchedLocation.address && (
                  <p className="event-place-address">{matchedLocation.address}</p>
                )}

                {config.googleMapsApiKey && (
                  <div
                    className="event-map"
                    // The card toggles on click; panning or zooming the map must
                    // not count as a tap on the card.
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MiniMap
                      apiKey={config.googleMapsApiKey}
                      lat={matchedLocation.lat}
                      lng={matchedLocation.lng}
                      type={matchedLocation.type}
                      height="220px"
                      interactive
                    />
                  </div>
                )}

                <div className="event-actions">
                  <button className="event-btn event-btn-primary" onClick={handleDirections}>
                    <IonIcon icon={navigateOutline} />
                    <span>Directions</span>
                  </button>

                  {/* Opens our own site page, which carries the official link. */}
                  <button className="event-btn" onClick={handleSitePage}>
                    <span>About this site</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
      </IonCardContent>
    </IonCard>
  );
};

export default EventCard;
