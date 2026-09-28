import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { business } from '@shared/business.js';
import { formatDateLong, formatTime } from '@shared/dates.js';
import { formatDuration, formatMoney } from '@shared/pricing.js';
import { downloadIcs } from '../booking/ics.js';
import { Icon } from '../components/Icon.jsx';
import { SimpleHeader } from '../components/SimpleHeader.jsx';
import { api } from '../lib/api.js';
import { STATUS_TEXT } from '../lib/status.js';

export default function BookingStatus() {
  const { reference } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState({ status: 'loading' });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api(`/bookings/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then((data) => setState({ status: 'ready', booking: data.booking }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', error: err.message });
      });
    return () => controller.abort();
  }, [reference, token]);

  const cancel = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const data = await api(`/bookings/${encodeURIComponent(reference)}/cancel`, {
        method: 'POST',
        body: { token },
      });
      setState({ status: 'ready', booking: data.booking });
      setConfirming(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const booking = state.booking;
  const status = booking ? STATUS_TEXT[booking.status] : null;

  return (
    <div className="page page--plain">
      <title>{`Your booking · ${business.name}`}</title>
      <SimpleHeader />
      <main className="container container--narrow page__main">
        {state.status === 'loading' && <p className="muted">Loading your booking…</p>}

        {state.status === 'error' && (
          <div className="panel">
            <h1 className="page__title">We couldn't find that booking</h1>
            <p>
              Please use the link from your confirmation email, or call us on{' '}
              <a href={business.phoneHref}>{business.phone}</a>.
            </p>
            <Link className="btn btn--primary" to="/">
              Back to the website
            </Link>
          </div>
        )}

        {booking && (
          <div className="panel">
            <div className="status-head">
              <div>
                <p className="eyebrow">Booking {booking.reference}</p>
                <h1 className="page__title">{formatDateLong(booking.date)}</h1>
                <p className="muted">
                  {formatTime(booking.time)} · about {formatDuration(booking.durationMin)}
                </p>
              </div>
              <span className={`status-badge status-badge--${booking.status}`}>{status.label}</span>
            </div>
            <p>{status.note}</p>

            <ul className="status-lines">
              {booking.items.map((line) => (
                <li key={line.serviceId}>
                  <span>
                    {line.name}
                    <small>{line.option}</small>
                  </span>
                  <span>{formatMoney(line.cents)}</span>
                </li>
              ))}
              {booking.discountCents > 0 && (
                <li className="is-discount">
                  <span>{booking.discountLabel}</span>
                  <span>−{formatMoney(booking.discountCents)}</span>
                </li>
              )}
              {booking.adjustmentCents > 0 && (
                <li>
                  <span>Minimum visit charge</span>
                  <span>+{formatMoney(booking.adjustmentCents)}</span>
                </li>
              )}
              <li className="status-lines__total">
                <span>Total, paid after the job</span>
                <span>{formatMoney(booking.totalCents)}</span>
              </li>
            </ul>

            <p className="status-address">
              <Icon name="mapPin" size={18} /> {booking.customer.address}, {booking.customer.city}{' '}
              {booking.customer.postalCode}
            </p>

            {actionError && (
              <div className="notice notice--error" role="alert">
                <Icon name="alert" />
                <p>{actionError}</p>
              </div>
            )}

            <div className="status-actions">
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <button type="button" className="btn btn--ghost" onClick={() => downloadIcs(booking)}>
                  <Icon name="calendar" size={18} /> Add to calendar
                </button>
              )}
              {booking.cancellable && !confirming && (
                <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>
                  Cancel booking
                </button>
              )}
              {booking.cancellable && confirming && (
                <div className="confirm-row">
                  <span>Cancel this booking?</span>
                  <button type="button" className="btn btn--danger" onClick={cancel} disabled={busy}>
                    {busy ? 'Cancelling…' : 'Yes, cancel it'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={busy}>
                    Keep it
                  </button>
                </div>
              )}
            </div>
            {!booking.cancellable && (booking.status === 'pending' || booking.status === 'confirmed') && (
              <p className="muted small">
                Need to change something this close to your appointment? Call us on{' '}
                <a href={business.phoneHref}>{business.phone}</a>.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
