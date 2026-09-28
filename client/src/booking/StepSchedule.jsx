import { useEffect, useMemo, useRef, useState } from 'react';
import { business } from '@shared/business.js';
import {
  addDays,
  addMonths,
  formatDateLong,
  formatMonth,
  formatTime,
  formatWeekdayShort,
  startOfMonth,
  weekdayOf,
} from '@shared/dates.js';
import { formatDuration } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { api, localToday } from '../lib/api.js';

const GRID_DAYS = 42;

function gridStartFor(month) {
  const offset = (weekdayOf(month) - business.weekStartsOn + 7) % 7;
  return addDays(month, -offset);
}

export function StepSchedule({ minutes, date, time, onChange, refreshKey }) {
  const [month, setMonth] = useState(() => startOfMonth(date ?? localToday()));
  const [data, setData] = useState({ status: 'loading' });
  const cache = useRef(new Map());
  const autoPicked = useRef(false);

  const gridStart = gridStartFor(month);
  const cacheKey = `${gridStart}|${minutes}|${refreshKey}`;

  useEffect(() => {
    if (cache.current.has(cacheKey)) {
      setData({ status: 'ready', ...cache.current.get(cacheKey) });
      return undefined;
    }
    const controller = new AbortController();
    setData((prev) => ({ ...prev, status: 'loading' }));
    api(`/availability?from=${gridStart}&days=${GRID_DAYS}&duration=${minutes}`, { signal: controller.signal })
      .then((result) => {
        cache.current.set(cacheKey, result);
        setData({ status: 'ready', ...result });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setData({ status: 'error', error: err.message });
      });
    return () => controller.abort();
  }, [cacheKey, gridStart, minutes]);

  const slotsByDate = useMemo(
    () => new Map((data.days ?? []).map((d) => [d.date, d.slots])),
    [data.days],
  );

  // Save a click: once availability loads, pre-select the first open day of the month.
  useEffect(() => {
    if (data.status !== 'ready' || date || autoPicked.current) return;
    const first = (data.days ?? []).find((d) => d.date.startsWith(month.slice(0, 7)) && d.slots.length);
    if (first) {
      autoPicked.current = true;
      onChange({ date: first.date, time: null });
    }
  }, [data, date, month, onChange]);

  const today = data.today ?? localToday();
  const canGoBack = month > startOfMonth(today);
  const canGoForward = !data.maxDate || month < startOfMonth(data.maxDate);
  const dateShown = Boolean(date) && slotsByDate.has(date); // the chosen day is in the visible grid
  const daySlots = dateShown ? slotsByDate.get(date) : [];
  const monthHasSlots = (data.days ?? []).some((d) => d.date.startsWith(month.slice(0, 7)) && d.slots.length);
  const morning = daySlots.filter((s) => s < '12:00');
  const afternoon = daySlots.filter((s) => s >= '12:00');

  if (data.status === 'ready' && data.tooLong) {
    return (
      <div className="step">
        <h3 className="step__title">Let's plan this one together</h3>
        <div className="notice">
          <Icon name="info" />
          <p>
            Your selection takes about {formatDuration(minutes)}, which is more than one working day. Give us a call on{' '}
            <a href={business.phoneHref}>{business.phone}</a> and we'll plan it over two visits, or go back and split it
            into two bookings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="step">
      <h3 className="step__title">When suits you?</h3>
      <p className="step__hint">
        <Icon name="clock" size={16} /> Your job takes about <strong>{formatDuration(minutes)}</strong>. Times are
        when we arrive.
      </p>

      <div className="schedule">
        <div className="calendar" aria-busy={data.status === 'loading'}>
          <div className="calendar__head">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMonth(addMonths(month, -1))}
              disabled={!canGoBack}
              aria-label="Previous month"
            >
              <Icon name="chevronLeft" />
            </button>
            <strong aria-live="polite">{formatMonth(month)}</strong>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMonth(addMonths(month, 1))}
              disabled={!canGoForward}
              aria-label="Next month"
            >
              <Icon name="chevronRight" />
            </button>
          </div>
          <div className="calendar__grid">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="calendar__dow" aria-hidden="true">
                {formatWeekdayShort(addDays(gridStart, i))}
              </span>
            ))}
            {Array.from({ length: GRID_DAYS }, (_, i) => {
              const day = addDays(gridStart, i);
              const inMonth = day.startsWith(month.slice(0, 7));
              const free = slotsByDate.get(day)?.length ?? 0;
              const selected = day === date;
              return (
                <button
                  key={day}
                  type="button"
                  className={[
                    'calendar__day',
                    inMonth ? '' : 'is-outside',
                    free ? 'is-free' : '',
                    selected ? 'is-selected' : '',
                    day === today ? 'is-today' : '',
                  ].join(' ')}
                  disabled={!free}
                  aria-pressed={selected}
                  aria-label={`${formatDateLong(day)}${free ? `, ${free} times free` : ', unavailable'}`}
                  onClick={() => onChange({ date: day, time: null })}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
          {data.status === 'loading' && <div className="calendar__loading">Checking availability…</div>}
        </div>

        <div className="slots">
          {data.status === 'error' && (
            <div className="notice notice--error">
              <Icon name="alert" />
              <p>{data.error}</p>
            </div>
          )}
          {data.status === 'ready' && !monthHasSlots && (
            <div className="notice">
              <Icon name="calendar" />
              <p>
                No free times left in {formatMonth(month)}.{' '}
                {canGoForward && (
                  <button type="button" className="link-btn" onClick={() => setMonth(addMonths(month, 1))}>
                    Try next month →
                  </button>
                )}
              </p>
            </div>
          )}
          {dateShown && (
            <>
              <p className="slots__date">{formatDateLong(date)}</p>
              {[
                ['Morning', morning],
                ['Afternoon', afternoon],
              ].map(
                ([label, list]) =>
                  list.length > 0 && (
                    <div key={label} className="slots__group">
                      <span className="slots__label">{label}</span>
                      <div className="slots__grid">
                        {list.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={`slot ${slot === time ? 'is-selected' : ''}`}
                            aria-pressed={slot === time}
                            onClick={() => onChange({ date, time: slot })}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ),
              )}
              {data.status === 'ready' && daySlots.length === 0 && (
                <p className="step__hint">That day just filled up. Please pick another.</p>
              )}
            </>
          )}
          {!dateShown && data.status === 'ready' && monthHasSlots && (
            <p className="step__hint">Pick a highlighted day to see open times.</p>
          )}
        </div>
      </div>
    </div>
  );
}
