/**
 * Business settings: the one place to edit company details.
 * Used by both the website (client) and the API (server).
 */
export const business = {
  name: 'Cleanup Co.',
  tagline: 'Pressure washing by two local friends',
  // Contact details shown on the site and in emails. Replace with your own.
  phone: '(555) 555-0142',
  phoneHref: 'tel:+15555550142',
  email: 'hello@cleanupco.example',
  serviceArea: 'Our town and everywhere within 15 miles',
  payment: 'You pay after the job, by card, cash or bank transfer.',

  // Money & dates
  locale: 'en-US',
  currency: 'USD',
  weekStartsOn: 0, // 0 = Sunday, 1 = Monday
  // IANA time zone the business runs in, e.g. 'America/Chicago' or 'Europe/London'.
  // null = use the server's time zone (fine on your own machine; set it when hosting in the cloud).
  timeZone: null,

  // Opening hours per weekday (0 = Sunday … 6 = Saturday). null = closed.
  hours: {
    0: null,
    1: { open: '08:00', close: '18:00' },
    2: { open: '08:00', close: '18:00' },
    3: { open: '08:00', close: '18:00' },
    4: { open: '08:00', close: '18:00' },
    5: { open: '08:00', close: '18:00' },
    6: { open: '09:00', close: '16:00' },
  },

  booking: {
    slotStepMinutes: 30, // start times are offered every 30 minutes
    bufferMinutes: 30, // travel + setup time kept free between two jobs
    minLeadHours: 18, // earliest bookable time, counted from now
    maxDaysAhead: 60, // how far ahead customers can book
    freeCancellationHours: 24, // customers can cancel online until this many hours before
    minimumTotal: 49, // minimum charge per visit (whole currency units)
  },

  // Advertised in the hero and price list. The code must also exist in server/promoCodes.js.
  launchOffer: { code: 'HELLO15', text: '15% off your first clean' },
};
