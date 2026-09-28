import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateShort, formatTime } from '@shared/dates.js';
import { formatMoney } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { BlockedDates } from './BlockedDates.jsx';
import { BookingCard } from './BookingCard.jsx';

const isActive = (b) => b.status === 'pending' || b.status === 'confirmed';
const byDateAsc = (a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin;
const byDateDesc = (a, b) => byDateAsc(b, a);

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming', test: (b, today) => isActive(b) && b.date >= today, sort: byDateAsc },
  { id: 'pending', label: 'To confirm', test: (b, today) => b.status === 'pending' && b.date >= today, sort: byDateAsc },
  { id: 'overdue', label: 'To close out', test: (b, today) => isActive(b) && b.date < today, sort: byDateDesc },
  { id: 'completed', label: 'Done', test: (b) => b.status === 'completed', sort: byDateDesc },
  { id: 'cancelled', label: 'Cancelled', test: (b) => b.status === 'cancelled', sort: byDateDesc },
  { id: 'all', label: 'All', test: () => true, sort: byDateDesc },
];

export function Dashboard({ refreshSignal, onUnauthorized }) {
  const [data, setData] = useState({ status: 'loading', bookings: [], today: '' });
  const [filter, setFilter] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await api('/admin/bookings');
      setData({ status: 'ready', bookings: result.bookings, today: result.today });
    } catch (err) {
      if (err.status === 401) onUnauthorized();
      else setData((d) => ({ ...d, status: 'error', error: err.message }));
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  const update = async (id, patch) => {
    try {
      const { booking } = await api(`/admin/bookings/${id}`, { method: 'PATCH', body: patch });
      setData((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? booking : b)) }));
    } catch (err) {
      if (err.status === 401) onUnauthorized();
      throw err;
    }
  };

  const { today, bookings } = data;

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => isActive(b) && b.date >= today).sort(byDateAsc);
    const month = today.slice(0, 7);
    return {
      pending: upcoming.filter((b) => b.status === 'pending').length,
      upcoming: upcoming.length,
      next: upcoming[0],
      booked: upcoming.reduce((sum, b) => sum + b.totalCents, 0),
      earned: bookings
        .filter((b) => b.status === 'completed' && b.date.startsWith(month))
        .reduce((sum, b) => sum + b.totalCents, 0),
      overdue: bookings.filter((b) => isActive(b) && b.date < today).length,
    };
  }, [bookings, today]);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => f.test(b, today))
      .filter(
        (b) =>
          !q ||
          [b.reference, b.customer.name, b.customer.email, b.customer.phone, b.customer.address, b.customer.city]
            .join(' ')
            .toLowerCase()
            .includes(q),
      )
      .sort(f.sort);
  }, [bookings, filter, query, today]);

  if (data.status === 'loading') return <p className="muted">Loading bookings…</p>;
  if (data.status === 'error') {
    return (
      <div className="notice notice--error">
        <Icon name="alert" />
        <p>{data.error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats">
        <div className="stat">
          <span className="stat__label">To confirm</span>
          <strong className="stat__value">{stats.pending}</strong>
        </div>
        <div className="stat">
          <span className="stat__label">Upcoming jobs</span>
          <strong className="stat__value">{stats.upcoming}</strong>
          <span className="stat__sub">{formatMoney(stats.booked)} booked</span>
        </div>
        <div className="stat">
          <span className="stat__label">Earned this month</span>
          <strong className="stat__value">{formatMoney(stats.earned)}</strong>
          <span className="stat__sub">from completed jobs</span>
        </div>
        <div className="stat stat--wide">
          <span className="stat__label">Next job</span>
          {stats.next ? (
            <>
              <strong className="stat__value stat__value--sm">
                {formatDateShort(stats.next.date)}, {formatTime(stats.next.time)}
              </strong>
              <span className="stat__sub">
                {stats.next.customer.name} · {stats.next.customer.city}
              </span>
            </>
          ) : (
            <strong className="stat__value stat__value--sm">Nothing booked yet</strong>
          )}
        </div>
      </div>

      {stats.overdue > 0 && (
        <button type="button" className="notice notice--warn notice--button" onClick={() => setFilter('overdue')}>
          <Icon name="info" />
          <span>
            {stats.overdue} past job{stats.overdue === 1 ? '' : 's'} still open. Mark them done or cancelled.
          </span>
        </button>
      )}

      <div className="dashboard__grid">
        <section className="dashboard__list">
          <div className="toolbar">
            <div className="tabs" role="tablist" aria-label="Filter bookings">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  className={`tab ${filter === f.id ? 'is-active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span className="tab__count">{bookings.filter((b) => f.test(b, today)).length}</span>
                </button>
              ))}
            </div>
            <label className="search">
              <Icon name="search" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, address…"
                aria-label="Search bookings"
              />
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <Icon name="sparkle" size={28} />
              <p>{bookings.length ? 'Nothing here.' : 'No bookings yet. Share your website and they will show up here.'}</p>
            </div>
          ) : (
            <div className="bcards">
              {visible.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  open={openId === booking.id}
                  onToggle={() => setOpenId(openId === booking.id ? null : booking.id)}
                  onUpdate={update}
                />
              ))}
            </div>
          )}
        </section>

        <aside>
          <BlockedDates today={today} />
        </aside>
      </div>
    </div>
  );
}
