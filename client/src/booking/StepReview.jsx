import { formatDateLong, formatTime } from '@shared/dates.js';
import { formatDuration, formatMoney } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { PROPERTY_TYPES, WATER_OPTIONS } from './StepDetails.jsx';

export function StepReview({ quote, date, time, details, onEdit }) {
  const property = PROPERTY_TYPES.find((o) => o.value === details.propertyType)?.label;
  const water = WATER_OPTIONS.find((o) => o.value === details.waterAccess)?.label;

  return (
    <div className="step">
      <h3 className="step__title">Check everything looks right</h3>
      <div className="review">
        <section className="review__block">
          <header>
            <h4>
              <Icon name="sparkle" size={18} /> Services
            </h4>
            <button type="button" className="link-btn" onClick={() => onEdit(0)}>
              Edit
            </button>
          </header>
          <ul>
            {quote.lines.map((line) => (
              <li key={line.serviceId}>
                {line.name} <span className="muted">· {line.option}</span>
              </li>
            ))}
          </ul>
          <p className="review__total">
            {formatMoney(quote.totalCents)}
            {quote.discount && <span className="muted"> after {quote.discount.label.toLowerCase()}</span>}
          </p>
        </section>

        <section className="review__block">
          <header>
            <h4>
              <Icon name="calendar" size={18} /> When
            </h4>
            <button type="button" className="link-btn" onClick={() => onEdit(1)}>
              Edit
            </button>
          </header>
          <p>
            {formatDateLong(date)} at {formatTime(time)}
            <br />
            <span className="muted">About {formatDuration(quote.minutes)} on site</span>
          </p>
        </section>

        <section className="review__block">
          <header>
            <h4>
              <Icon name="mapPin" size={18} /> Where & who
            </h4>
            <button type="button" className="link-btn" onClick={() => onEdit(2)}>
              Edit
            </button>
          </header>
          <p>
            {details.address}, {details.city} {details.postalCode}
            <br />
            <span className="muted">
              {property} · outdoor tap: {water}
            </span>
          </p>
          <p>
            {details.name}
            <br />
            <span className="muted">
              {details.email} · {details.phone}
            </span>
          </p>
          {details.notes.trim() && <p className="review__notes">“{details.notes.trim()}”</p>}
        </section>
      </div>
    </div>
  );
}
