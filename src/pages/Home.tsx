import { useMemo, useState, useEffect } from 'react';
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
  IonIcon,
  RefresherEventDetail,
} from '@ionic/react';
import { chevronDown, chevronForward } from 'ionicons/icons';
import { format } from 'date-fns';
import { useEvents } from '../hooks/useEvents';
import { useLocations } from '../hooks/useLocations';
import { matchEventToLocation } from '../services/calendarParser';
import { Location } from '../types';
import {
  nauvooDateKey,
  shiftDateKey,
  dateKeyToDate,
  hasPassed,
} from '../utils/nauvooTime';
import EventCard from '../components/EventCard';
import NauvooClock from '../components/NauvooClock';
import './Home.css';

/** How often the list re-checks which events have finished. */
const PASSED_CHECK_INTERVAL_MS = 30000;

const Home: React.FC = () => {
  const { events, eventsByDate, loading, error, usingSampleData, refresh } =
    useEvents();
  const { locations } = useLocations();

  // Days whose finished events the visitor has chosen to reveal. Collapsed by
  // default: by evening most of the day is behind you and only clutters the list.
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const togglePastEvents = (dateKey: string) => {
    setExpandedDays((previous) => {
      const next = new Set(previous);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  // Re-checked on a timer so events dim as the day goes by, without a reload.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(new Date()),
      PASSED_CHECK_INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, []);

  // "Today" means today in Nauvoo, not on the viewer's device.
  const todayKey = nauvooDateKey(now);
  const tomorrowKey = shiftDateKey(todayKey, 1);

  // Format date header
  const formatDateHeader = (dateKey: string): string => {
    const dayAndDate = format(dateKeyToDate(dateKey), 'EEEE, MMMM d');
    if (dateKey === todayKey) {
      return `Today, ${dayAndDate}`;
    }
    if (dateKey === tomorrowKey) {
      return `Tomorrow, ${dayAndDate}`;
    }
    return dayAndDate;
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
            <NauvooClock />
          </div>

          {usingSampleData && (
            <div className="events-sample-notice ion-padding">
              <IonText color="warning">
                <p>
                  <strong>Sample data.</strong> These are placeholder events,
                  not the real Historic Nauvoo calendar.
                </p>
              </IonText>
            </div>
          )}

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
                const pastEvents = dayEvents.filter((event) =>
                  hasPassed(event.end, now)
                );
                const remainingEvents = dayEvents.filter(
                  (event) => !hasPassed(event.end, now)
                );
                const isExpanded = expandedDays.has(dateKey);

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
                      {pastEvents.length > 0 && (
                        <div className="past-events">
                          <button
                            className="past-events-toggle"
                            onClick={() => togglePastEvents(dateKey)}
                            aria-expanded={isExpanded}
                          >
                            <IonIcon
                              icon={isExpanded ? chevronDown : chevronForward}
                            />
                            <span>
                              {pastEvents.length} earlier event
                              {pastEvents.length !== 1 ? 's' : ''}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="past-events-list">
                              {pastEvents.map((event) => (
                                <EventCard
                                  key={event.uid}
                                  event={event}
                                  matchedLocation={eventLocationMap.get(event.uid)}
                                  isPast
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {remainingEvents.map((event) => (
                        <EventCard
                          key={event.uid}
                          event={event}
                          matchedLocation={eventLocationMap.get(event.uid)}
                        />
                      ))}

                      {remainingEvents.length === 0 && (
                        <div className="day-all-done">
                          <IonText color="medium">
                            <p>Everything for today has finished.</p>
                          </IonText>
                        </div>
                      )}
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
