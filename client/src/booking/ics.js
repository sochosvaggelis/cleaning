import { business } from '@shared/business.js';

const pad = (n) => String(n).padStart(2, '0');
const escapeText = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Downloads an .ics file so the customer can drop the appointment into their calendar. */
export function downloadIcs(booking) {
  const day = booking.date.replace(/-/g, '');
  const stamp = (minutes) => `${day}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const services = booking.items.map((l) => `${l.name} (${l.option})`).join(', ');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${business.name}//Booking//EN`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@cleanup-co`,
    `DTSTAMP:${now}`,
    `DTSTART:${stamp(booking.startMin)}`,
    `DTEND:${stamp(booking.startMin + booking.durationMin)}`,
    `SUMMARY:${escapeText(`${business.name}: pressure washing`)}`,
    `DESCRIPTION:${escapeText(`Booking ${booking.reference}\n${services}\nQuestions? ${business.phone}`)}`,
    `LOCATION:${escapeText(`${booking.customer.address}, ${booking.customer.city} ${booking.customer.postalCode}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.reference}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
