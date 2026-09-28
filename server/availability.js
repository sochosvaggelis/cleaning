import { business } from '../shared/business.js';
import { daysBetween, hhmmToMinutes, minutesToHHMM, weekdayOf } from '../shared/dates.js';

export const TIME_ZONE =
  process.env.BUSINESS_TIMEZONE || business.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

const nowFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, // throws on startup if the configured zone is invalid, which is what we want
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** The current business-local date ('YYYY-MM-DD') and minutes since midnight. */
export function businessNow(at = new Date()) {
  const parts = Object.fromEntries(nowFormatter.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Minutes from now until a business-local date + 'HH:MM' (negative when it is in the past). */
export function minutesUntil(date, hhmm, now = businessNow()) {
  return daysBetween(now.date, date) * 1440 + hhmmToMinutes(hhmm) - now.minutes;
}

function openingHours(date) {
  const hours = business.hours[weekdayOf(date)];
  return hours ? { open: hhmmToMinutes(hours.open), close: hhmmToMinutes(hours.close) } : null;
}

/** Longest opening day in minutes; jobs longer than this can't be booked online. */
export function longestDayMinutes() {
  return Math.max(
    0,
    ...Object.values(business.hours)
      .filter(Boolean)
      .map((h) => hhmmToMinutes(h.close) - hhmmToMinutes(h.open)),
  );
}

/**
 * Free start times ('HH:MM') on one day for a job lasting `duration` minutes.
 * One crew with one machine, so jobs never overlap, and a buffer is kept between them for travel.
 *
 * @param {string} date business-local 'YYYY-MM-DD'
 * @param {number} duration job length in minutes
 * @param {Array<{startMin: number, durationMin: number}>} busy active bookings on that day
 */
export function freeSlots(date, duration, busy, { blocked = false, now = businessNow() } = {}) {
  const hours = openingHours(date);
  if (!hours || blocked) return [];

  const { slotStepMinutes, bufferMinutes, minLeadHours, maxDaysAhead } = business.booking;
  const dayOffset = daysBetween(now.date, date);
  if (dayOffset < 0 || dayOffset > maxDaysAhead) return [];

  // Earliest allowed start, expressed in minutes after midnight of `date`.
  const earliest = now.minutes + minLeadHours * 60 - dayOffset * 1440;

  const slots = [];
  for (let start = hours.open; start + duration <= hours.close; start += slotStepMinutes) {
    if (start < earliest) continue;
    const end = start + duration;
    const clash = busy.some(
      (job) => start < job.startMin + job.durationMin + bufferMinutes && end + bufferMinutes > job.startMin,
    );
    if (!clash) slots.push(minutesToHHMM(start));
  }
  return slots;
}
