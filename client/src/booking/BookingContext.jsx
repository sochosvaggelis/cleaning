import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { serviceById } from '@shared/catalog.js';

const BookingContext = createContext(null);
const STORAGE_KEY = 'cleanup.selection';

function stillOffered(item) {
  const service = serviceById[item?.serviceId];
  if (!service) return false;
  return service.tiers ? service.tiers.some((t) => t.id === item.tierId) : true;
}

function loadSelection() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter(stillOffered) : [];
  } catch {
    return [];
  }
}

/** The "cart": which services the visitor has picked, shared by every section of the page. */
export function BookingProvider({ children }) {
  const [selection, setSelection] = useState(loadSelection);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      /* private mode etc. */
    }
  }, [selection]);

  const upsert = useCallback((item) => {
    setSelection((prev) => {
      const index = prev.findIndex((i) => i.serviceId === item.serviceId);
      if (index === -1) return [...prev, item];
      const next = prev.slice();
      next[index] = item;
      return next;
    });
  }, []);

  const remove = useCallback((serviceId) => {
    setSelection((prev) => prev.filter((i) => i.serviceId !== serviceId));
  }, []);

  const replace = useCallback((items) => setSelection(items), []);
  const clear = useCallback(() => setSelection([]), []);

  const value = useMemo(
    () => ({
      selection,
      upsert,
      remove,
      replace,
      clear,
      has: (serviceId) => selection.some((i) => i.serviceId === serviceId),
      goToBooking: () => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    }),
    [selection, upsert, remove, replace, clear],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside <BookingProvider>');
  return context;
}

/** The pre-selected option when a service is added with one click. */
export function defaultItem(service) {
  if (service.tiers) {
    return { serviceId: service.id, tierId: (service.tiers.find((t) => t.popular) ?? service.tiers[0]).id };
  }
  if (service.unit) return { serviceId: service.id, qty: service.unit.default };
  return { serviceId: service.id };
}
