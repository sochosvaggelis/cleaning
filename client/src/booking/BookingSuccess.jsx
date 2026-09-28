import { Link } from 'react-router';
import { formatDateLong, formatTime } from '@shared/dates.js';
import { formatDuration, formatMoney } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { downloadIcs } from './ics.js';

export function BookingSuccess({ booking, manageUrl, onReset }) {
  const managePath = (() => {
    try {
      const url = new URL(manageUrl);
      return `${url.pathname}${url.search}`;
    } catch {
      return manageUrl;
    }
  })();

  return (
    <div className="success" role="status">
      <div className="success__badge">
        <Icon name="check" size={34} strokeWidth={2.6} />
      </div>
      <h3>Request received!</h3>
      <p className="success__lead">
        Thanks, {booking.customer.name.split(' ')[0]}! We'll confirm by email shortly. Your reference is{' '}
        <strong>{booking.reference}</strong>.
      </p>
      <ul className="success__facts">
        <li>
          <Icon name="calendar" size={18} /> {formatDateLong(booking.date)} at {formatTime(booking.time)}
        </li>
        <li>
          <Icon name="clock" size={18} /> About {formatDuration(booking.durationMin)}
        </li>
        <li>
          <Icon name="mapPin" size={18} /> {booking.customer.address}, {booking.customer.city}
        </li>
        <li>
          <Icon name="tag" size={18} /> {formatMoney(booking.totalCents)}, paid after the job
        </li>
      </ul>
      <div className="success__actions">
        <button type="button" className="btn btn--primary" onClick={() => downloadIcs(booking)}>
          <Icon name="calendar" size={18} /> Add to calendar
        </button>
        <Link className="btn btn--ghost" to={managePath}>
          View or cancel booking
        </Link>
      </div>
      <button type="button" className="link-btn" onClick={onReset}>
        Book another clean
      </button>
    </div>
  );
}
