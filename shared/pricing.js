import { business } from './business.js';
import { bundleDiscounts, serviceById } from './catalog.js';

/*
 * The quote engine. The website uses it for live prices and the API runs the exact same code
 * again when a booking is submitted, so the server never trusts a price sent by the browser.
 */

export class QuoteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuoteError';
  }
}

const MAX_ITEMS = 12;

function priceItem(item) {
  const service = serviceById[item?.serviceId];
  if (!service) throw new QuoteError('One of the selected services no longer exists.');
  const base = { serviceId: service.id, category: service.category, name: service.name };

  if (service.tiers) {
    const tier = service.tiers.find((t) => t.id === item.tierId);
    if (!tier) throw new QuoteError(`Please choose a size for ${service.name}.`);
    return {
      ...base,
      tierId: tier.id,
      qty: 1,
      option: `${tier.label} · ${tier.detail}`,
      cents: tier.price * 100,
      minutes: tier.minutes,
    };
  }

  if (service.unit) {
    const unit = service.unit;
    const qty = Number(item.qty ?? unit.default);
    if (!Number.isInteger(qty) || qty < unit.min || qty > unit.max) {
      throw new QuoteError(`Choose between ${unit.min} and ${unit.max} ${unit.plural} for ${service.name}.`);
    }
    return {
      ...base,
      qty,
      option: `${qty} ${qty === 1 ? unit.label : unit.plural}`,
      cents: unit.price * 100 * qty,
      minutes: unit.minutes * qty,
    };
  }

  return { ...base, qty: 1, option: 'Flat rate', cents: service.flat.price * 100, minutes: service.flat.minutes };
}

/**
 * @param {Array<{serviceId: string, tierId?: string, qty?: number}>} selection
 * @param {{promo?: {code: string, percent: number, label: string} | null}} options
 */
export function priceSelection(selection, { promo = null } = {}) {
  if (!Array.isArray(selection) || selection.length === 0) throw new QuoteError('Pick at least one service.');
  if (selection.length > MAX_ITEMS) throw new QuoteError('That is a lot of services for one visit. Please call us.');

  const seen = new Set();
  const lines = selection.map((item) => {
    const line = priceItem(item);
    if (seen.has(line.serviceId)) throw new QuoteError(`${line.name} is listed twice.`);
    seen.add(line.serviceId);
    return line;
  });

  const coreCount = lines.filter((l) => l.category === 'core').length;
  if (coreCount === 0) throw new QuoteError('Add-ons need at least one main service.');

  const subtotalCents = lines.reduce((sum, l) => sum + l.cents, 0);
  const minutes = lines.reduce((sum, l) => sum + l.minutes, 0);

  // Discounts don't stack: the biggest one wins (ties go to the automatic bundle discount).
  const candidates = [];
  const bundle = bundleDiscounts
    .filter((rule) => coreCount >= rule.minServices)
    .sort((a, b) => b.percent - a.percent)[0];
  if (bundle) {
    candidates.push({ type: 'bundle', label: `Bundle discount · ${coreCount} services`, percent: bundle.percent });
  }
  if (promo) {
    candidates.push({ type: 'promo', label: promo.label || `Code ${promo.code}`, percent: promo.percent, code: promo.code });
  }
  const best = candidates.sort((a, b) => b.percent - a.percent)[0] ?? null;

  // Discounts are rounded to whole currency units so totals stay tidy.
  const discountCents = best ? Math.round((subtotalCents * best.percent) / 10000) * 100 : 0;
  let totalCents = subtotalCents - discountCents;

  const minimumCents = business.booking.minimumTotal * 100;
  const adjustmentCents = totalCents < minimumCents ? minimumCents - totalCents : 0;
  totalCents += adjustmentCents;

  return {
    lines,
    coreCount,
    subtotalCents,
    discount: best ? { ...best, cents: discountCents } : null,
    promoOutranked: Boolean(promo && best && best.type !== 'promo'),
    adjustmentCents,
    totalCents,
    minutes,
  };
}

const moneyFormatters = new Map();

export function formatMoney(cents) {
  const digits = cents % 100 === 0 ? 0 : 2;
  if (!moneyFormatters.has(digits)) {
    moneyFormatters.set(
      digits,
      new Intl.NumberFormat(business.locale, {
        style: 'currency',
        currency: business.currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
    );
  }
  return moneyFormatters.get(digits).format(cents / 100);
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function startingPriceCents(service) {
  if (service.tiers) return Math.min(...service.tiers.map((t) => t.price)) * 100;
  if (service.unit) return service.unit.price * 100;
  return service.flat.price * 100;
}
