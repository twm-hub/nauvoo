import { useState, useEffect } from 'react';
import { formatNauvooClock } from '../utils/nauvooTime';
import './NauvooClock.css';

/**
 * The current time in Nauvoo.
 *
 * Ticks in its own state rather than the page's, so the whole event list
 * doesn't re-render every second.
 */
const NauvooClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className="nauvoo-clock"
      aria-label={`Current time in Nauvoo: ${formatNauvooClock(now)}`}
    >
      <span className="nauvoo-clock-label">Current Time in Nauvoo</span>
      <span className="nauvoo-clock-time">{formatNauvooClock(now)}</span>
    </span>
  );
};

export default NauvooClock;
