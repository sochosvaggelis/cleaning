import { useState } from 'react';
import { business } from '@shared/business.js';
import { formatDateLong, formatTime } from '@shared/dates.js';
import { formatDuration, formatMoney } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';

function PromoField({ promo, outranked, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ busy: false, error: null });

  if (promo) {
    return (
      <div className="promo promo--applied">
        <Icon name="tag" size={16} />
        <span>
          <strong>{promo.code}</strong> applied
          {outranked && <small>Your bundle discount is bigger, so we're using that instead.</small>}
        </span>
        <button type="button" className="link-btn" onClick={onRemove}>
          Remove
        </button>
      </div>
    );
  }

  const apply = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    setStatus({ busy: true, error: null });
    try {
      const { promo: found } = await api('/promo', { method: 'POST', body: { code } });
      onApply(found);
      setCode('');
      setStatus({ busy: false, error: null });
    } catch (err) {
      setStatus({ busy: false, error: err.message });
    }
  };

  return (
    <form className="promo" onSubmit={apply}>
      <label htmlFor="promo-code" className="visually-hidden">
        Promo code
      </label>
      <input
        id="promo-code"
        placeholder="Promo code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        autoComplete="off"
      />
      <button type="submit" className="btn btn--sm btn--ghost" disabled={status.busy || !code.trim()}>
        {status.busy ? '…' : 'Apply'}
      </button>
      {status.error && <span className="promo__error">{status.error}</span>}
    </form>
  );
}

export function QuoteSummary({ quote, quoteError, promo, onPromoApply, onPromoRemove, date, time }) {
  return (
    <aside className="summary" aria-label="Your quote">
      <h4 className="summary__title">Your quote</h4>
      {!quote ? (
        <p className="summary__empty">{quoteError || 'Pick a service to see your price.'}</p>
      ) : (
        <>
          <ul className="summary__lines">
            {quote.lines.map((line) => (
              <li key={line.serviceId}>
                <span>
                  {line.name}
                  <small>{line.option}</small>
                </span>
                <span>{formatMoney(line.cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(quote.subtotalCents)}</dd>
            </div>
            {quote.discount && (
              <div className="is-discount">
                <dt>{quote.discount.label}</dt>
                <dd>−{formatMoney(quote.discount.cents)}</dd>
              </div>
            )}
            {quote.adjustmentCents > 0 && (
              <div>
                <dt>Minimum visit charge</dt>
                <dd>+{formatMoney(quote.adjustmentCents)}</dd>
              </div>
            )}
            <div className="summary__total">
              <dt>Total</dt>
              <dd>{formatMoney(quote.totalCents)}</dd>
            </div>
          </dl>
          <ul className="summary__meta">
            <li>
              <Icon name="clock" size={16} /> About {formatDuration(quote.minutes)} on site
            </li>
            {date && time && (
              <li>
                <Icon name="calendar" size={16} /> {formatDateLong(date)}, {formatTime(time)}
              </li>
            )}
          </ul>
        </>
      )}
      <PromoField promo={promo} outranked={quote?.promoOutranked} onApply={onPromoApply} onRemove={onPromoRemove} />
      <p className="summary__note">
        <Icon name="shield" size={16} /> {business.payment}
      </p>
    </aside>
  );
}
