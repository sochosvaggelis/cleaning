import { business } from '@shared/business.js';
import { formatTime } from '@shared/dates.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourOnly = new Intl.DateTimeFormat(business.locale, { hour: 'numeric', timeZone: 'UTC' });

/** "8:00 AM" style, or "8 AM" when `compact` and the time is on the hour. */
function time(hhmm, compact) {
  const [h, m] = hhmm.split(':').map(Number);
  return compact && m === 0 ? hourOnly.format(new Date(Date.UTC(2000, 0, 1, h))) : formatTime(hhmm);
}

/** Groups consecutive days with the same hours: [{ days: 'Mon–Fri', label: '8:00 AM – 6:00 PM' }, …] */
export function openingHours({ compact = false } = {}) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows = [];
  for (const day of order) {
    const h = business.hours[day];
    const label = h ? `${time(h.open, compact)}${compact ? '–' : ' – '}${time(h.close, compact)}` : 'Closed';
    const last = rows[rows.length - 1];
    if (last && last.label === label) last.to = day;
    else rows.push({ from: day, to: day, label });
  }
  return rows.map((r) => ({
    days: r.from === r.to ? DAY_NAMES[r.from] : `${DAY_NAMES[r.from]}–${DAY_NAMES[r.to]}`,
    label: r.label,
  }));
}
