import { useEffect, useMemo, useState } from 'react';
import { formatMoney, priceSelection } from '@shared/pricing.js';
import { useBooking } from '../booking/BookingContext.jsx';
import { Icon } from './Icon.jsx';

/** Bottom bar that follows the visitor once they've picked something, until they reach the booking form. */
export function FloatingCart() {
  const { selection, goToBooking } = useBooking();
  const [bookingVisible, setBookingVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('book');
    if (!target) return undefined;
    const observer = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -20% 0px',
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const quote = useMemo(() => {
    try {
      return selection.length ? priceSelection(selection) : null;
    } catch {
      return null;
    }
  }, [selection]);

  const visible = selection.length > 0 && !bookingVisible;
  const count = selection.length;

  return (
    <div className={`cart ${visible ? 'cart--visible' : ''}`} aria-hidden={!visible}>
      <button type="button" className="cart__button" onClick={goToBooking} tabIndex={visible ? 0 : -1}>
        <span className="cart__count">{count}</span>
        <span className="cart__text">
          {count === 1 ? '1 service' : `${count} services`}
          {quote && <strong> · {formatMoney(quote.totalCents)}</strong>}
        </span>
        <span className="cart__cta">
          Book now <Icon name="arrowRight" size={16} />
        </span>
      </button>
    </div>
  );
}
