import { useEffect, useState } from 'react';
import { formatDateShort, formatTime } from '@shared/dates.js';
import { formatDuration, formatMoney } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { STATUS_TEXT } from '../lib/status.js';

const WATER = { yes: 'Yes', no: 'No, bring a water tank', unsure: 'Not sure' };
const PROPERTY = { house: 'House', townhouse: 'Townhouse / semi', business: 'Business', other: 'Other' };

export function BookingCard({ booking, open, onToggle, onUpdate }) {
  const [notes, setNotes] = useState(booking.adminNotes);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => setNotes(booking.adminNotes), [booking.adminNotes]);

  const act = async (patch) => {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(booking.id, { ...patch, notify });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const active = booking.status === 'pending' || booking.status === 'confirmed';
  const { customer } = booking;
  const fullAddress = `${customer.address}, ${customer.city} ${customer.postalCode}`;

  return (
    <article className={`bcard bcard--${booking.status} ${open ? 'is-open' : ''}`}>
      <button type="button" className="bcard__summary" onClick={onToggle} aria-expanded={open}>
        <span className="bcard__when">
          <strong>{formatDateShort(booking.date)}</strong>
          <span>
            {formatTime(booking.time)} · {formatDuration(booking.durationMin)}
          </span>
        </span>
        <span className="bcard__who">
          <strong>{customer.name}</strong>
          <span>{booking.items.map((i) => i.name).join(', ')}</span>
        </span>
        <span className="bcard__money">{formatMoney(booking.totalCents)}</span>
        <span className={`status-badge status-badge--${booking.status}`}>{STATUS_TEXT[booking.status].short}</span>
        <Icon name="chevronDown" size={20} className="bcard__chevron" />
      </button>

      {open && (
        <div className="bcard__details">
          <div className="bcard__cols">
            <dl className="bcard__facts">
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`}>{customer.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Your booking ${booking.reference}`)}`}>
                    {customer.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {fullAddress} <Icon name="external" size={14} />
                  </a>
                </dd>
              </div>
              <div>
                <dt>Property</dt>
                <dd>{PROPERTY[customer.propertyType] ?? customer.propertyType}</dd>
              </div>
              <div>
                <dt>Outdoor tap</dt>
                <dd className={customer.waterAccess === 'no' ? 'text-warn' : ''}>{WATER[customer.waterAccess]}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>
                  {booking.reference}
                  {booking.promoCode ? ` · code ${booking.promoCode}` : ''}
                </dd>
              </div>
            </dl>

            <ul className="bcard__lines">
              {booking.items.map((line) => (
                <li key={line.serviceId}>
                  <span>
                    {line.name} <small>{line.option}</small>
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
              <li className="bcard__total">
                <span>Total</span>
                <span>{formatMoney(booking.totalCents)}</span>
              </li>
            </ul>
          </div>

          {booking.notes && (
            <p className="bcard__notes">
              <strong>Customer notes:</strong> {booking.notes}
            </p>
          )}

          <div className="field">
            <label htmlFor={`notes-${booking.id}`}>Internal notes (only you see these)</label>
            <textarea id={`notes-${booking.id}`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="field__error">{error}</p>}

          <div className="bcard__actions">
            {booking.status === 'pending' && (
              <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => act({ status: 'confirmed' })}>
                <Icon name="check" size={16} /> Confirm
              </button>
            )}
            {active && (
              <button type="button" className="btn btn--good btn--sm" disabled={busy} onClick={() => act({ status: 'completed' })}>
                <Icon name="sparkle" size={16} /> Mark done
              </button>
            )}
            {active && (
              <button
                type="button"
                className="btn btn--danger-ghost btn--sm"
                disabled={busy}
                onClick={() => window.confirm(`Cancel ${customer.name}'s booking?`) && act({ status: 'cancelled' })}
              >
                Cancel
              </button>
            )}
            {booking.status === 'cancelled' && (
              <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => act({ status: 'pending' })}>
                Restore
              </button>
            )}
            {notes !== booking.adminNotes && (
              <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => act({ adminNotes: notes })}>
                Save notes
              </button>
            )}
            <label className="check check--small">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              <span>Email the customer about status changes</span>
            </label>
            <a className="bcard__link" href={booking.manageUrl} target="_blank" rel="noreferrer">
              Customer's view <Icon name="external" size={14} />
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
