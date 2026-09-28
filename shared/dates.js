import { business } from './business.js';

/*
 * Booking dates are business-local calendar days ('YYYY-MM-DD') and times are 'HH:MM'
 * wall-clock strings. They are never converted between time zones, so the helpers below
 * do their arithmetic in UTC to stay clear of daylight-saving surprises.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(value) {
  return typeof value === 'string' && ISO_DATE.test(value) && toISODate(parseISODate(value)) === value;
}

export function isValidHHMM(value) {
  return typeof value === 'string' && HHMM.test(value);
}

export function addDays(iso, days) {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function weekdayOf(iso) {
  return parseISODate(iso).getUTCDay();
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseISODate(toIso) - parseISODate(fromIso)) / 86_400_000);
}

export function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** First day of the month containing `iso`. */
export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso, months) {
  const d = parseISODate(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISODate(d);
}

const dateFormatters = new Map();
function dateFormatter(options) {
  const key = JSON.stringify(options);
  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat(business.locale, { ...options, timeZone: 'UTC' }));
  }
  return dateFormatters.get(key);
}

/** "Saturday, October 3" */
export function formatDateLong(iso) {
  return dateFormatter({ weekday: 'long', month: 'long', day: 'numeric' }).format(parseISODate(iso));
}

/** "Sat, Oct 3, 2026" */
export function formatDateShort(iso) {
  return dateFormatter({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(parseISODate(iso));
}

/** "October 2026" */
export function formatMonth(iso) {
  return dateFormatter({ month: 'long', year: 'numeric' }).format(parseISODate(iso));
}

/** "Mon" */
export function formatWeekdayShort(iso) {
  return dateFormatter({ weekday: 'short' }).format(parseISODate(iso));
}

/** '14:30' → "2:30 PM" (or "14:30", depending on the locale) */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return dateFormatter({ hour: 'numeric', minute: '2-digit' }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}
