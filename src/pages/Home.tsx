import { useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useEvents } from '../hooks/useEvents';
import { useLocations } from '../hooks/useLocations';
import { matchEventToLocation } from '../services/calendarParser';
import { CalendarEvent, Location } from '../types';
import EventCard from '../components/EventCard';
import './Home.css';

const Home: React.FC = () => {
  const { events, eventsByDate, loading, error, refresh } = useEvents();
  const { locations } = useLocations();

  // Format date header
  const formatDateHeader = (dateKey: string): string => {
    const date = parseISO(dateKey);
    if (isToday(date)) {
      return 'Today';
    }
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }
    return format(date, 'EEEE, MMMM d');
  };

  // Get sorted date keys
  const sortedDates = useMemo(() => {
    return Array.from(eventsByDate.keys()).sort();
  }, [eventsByDate]);

  // Create a map of event UID to matched location
  const eventLocationMap = useMemo(() => {
    const map = new Map<string, Location | null>();
    events.forEach((event) => {
      map.set(event.uid, matchEventToLocation(event, locations));
    });
    return map;
  }, [events, locations]);

  // Handle pull-to-refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refresh();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Historic Nauvoo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Historic Nauvoo</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Hero Section */}
        <div className="home-hero">
          <IonText>
            <h2>Welcome</h2>
            <p>Explore the City Beautiful on the Mississippi</p>
          </IonText>
        </div>

        {/* Events Section */}
        <div className="home-events-section">
          <div className="section-header">
            <IonText>
              <h3>Upcoming Events</h3>
            </IonText>
          </div>

          {loading && (
            <div className="events-loading">
              <IonSpinner name="crescent" />
              <IonText color="medium">Loading events...</IonText>
            </div>
          )}

          {error && (
            <div className="events-error ion-padding">
              <IonText color="danger">
                <p>Error loading events: {error}</p>
              </IonText>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="events-empty ion-padding">
              <IonText color="medium">
                <p>No upcoming events scheduled.</p>
                <p>Pull down to refresh.</p>
              </IonText>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="events-list">
              {sortedDates.map((dateKey) => {
                const dayEvents = eventsByDate.get(dateKey) || [];
                return (
                  <div key={dateKey} className="events-day">
                    <div className="day-header">
                      <IonText>
                        <h4>{formatDateHeader(dateKey)}</h4>
                      </IonText>
                      <span className="event-count">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="day-events">
                      {dayEvents.map((event) => (
                        <EventCard
                          key={event.uid}
                          event={event}
                          matchedLocation={eventLocationMap.get(event.uid)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
