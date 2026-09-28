import { useEffect, useState } from 'react';
import { formatDateShort } from '@shared/dates.js';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';

/** Days off: no online bookings are offered on these dates. */
export function BlockedDates({ today }) {
  const [list, setList] = useState([]);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/admin/blocked-dates')
      .then((data) => setList(data.blocked))
      .catch((err) => setError(err.message));
  }, []);

  const add = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await api('/admin/blocked-dates', { method: 'POST', body: { date, reason } });
      setList(data.blocked);
      setMessage(
        data.bookingsThatDay
          ? `Heads up: you already have ${data.bookingsThatDay} booking(s) on that day. Contact those customers to move them.`
          : null,
      );
      setDate('');
      setReason('');
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (day) => {
    try {
      const data = await api(`/admin/blocked-dates/${day}`, { method: 'DELETE' });
      setList(data.blocked);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel blocked">
      <h2 className="panel__title">
        <Icon name="calendar" size={20} /> Days off
      </h2>
      <p className="muted small">Block a day and customers can't book it online. Existing bookings stay.</p>
      <form className="blocked__form" onSubmit={add}>
        <input type="date" value={date} min={today ?? undefined} onChange={(e) => setDate(e.target.value)} required aria-label="Date" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" maxLength={120} aria-label="Reason" />
        <button type="submit" className="btn btn--primary btn--sm" disabled={!date}>
          Block day
        </button>
      </form>
      {message && <p className="notice notice--warn small">{message}</p>}
      {error && <p className="field__error">{error}</p>}
      {list.length === 0 ? (
        <p className="muted small">No days blocked.</p>
      ) : (
        <ul className="blocked__list">
          {list.map((item) => (
            <li key={item.date}>
              <span>
                <strong>{formatDateShort(item.date)}</strong>
                {item.reason && <span className="muted"> · {item.reason}</span>}
              </span>
              <button type="button" className="icon-btn" onClick={() => remove(item.date)} aria-label={`Unblock ${item.date}`}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
