const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

/**
 * Outlook serves published calendars to servers but not to browsers: a fetch
 * straight from the app is answered with a 503, so the calendar has to be
 * relayed through here.
 *
 * The URL is read from Firestore rather than taken from the request, so this
 * can only ever fetch the calendar the Admin panel points at.
 */
exports.calendar = onRequest(
  { cors: true, timeoutSeconds: 30, memory: '256MiB' },
  async (req, res) => {
    try {
      const snap = await getFirestore().doc('config/settings').get();

      if (!snap.exists) {
        res.status(500).type('text/plain').send('No config/settings document found.');
        return;
      }

      const calendarUrl = snap.data().calendarUrl;
      if (!calendarUrl) {
        res.status(500).type('text/plain').send('No calendarUrl set in config/settings.');
        return;
      }

      const upstream = await fetch(calendarUrl);
      if (!upstream.ok) {
        console.error(`Calendar fetch failed: ${upstream.status} for ${calendarUrl}`);
        res
          .status(502)
          .type('text/plain')
          .send(`Calendar source returned ${upstream.status}.`);
        return;
      }

      const icsData = await upstream.text();

      if (!icsData.includes('BEGIN:VCALENDAR')) {
        console.error(`Calendar source returned non-calendar data for ${calendarUrl}`);
        res.status(502).type('text/plain').send('Calendar source did not return a calendar.');
        return;
      }

      // Cache at the CDN for 15 minutes so the calendar isn't refetched per visitor.
      res.set('Cache-Control', 'public, max-age=300, s-maxage=900');
      res.type('text/calendar; charset=utf-8').status(200).send(icsData);
    } catch (error) {
      console.error('Error relaying calendar:', error);
      res.status(500).type('text/plain').send('Failed to fetch calendar.');
    }
  }
);
