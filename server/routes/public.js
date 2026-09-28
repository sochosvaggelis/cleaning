import crypto from 'node:crypto';
import { Router } from 'express';
import { business } from '../../shared/business.js';
import { addDays, isValidISODate } from '../../shared/dates.js';
import { priceSelection, QuoteError } from '../../shared/pricing.js';
import { businessNow, freeSlots, longestDayMinutes, minutesUntil, TIME_ZONE } from '../availability.js';
import { blockedDates, bookings, transaction } from '../db.js';
import { customerReceivedEmail, customerStatusEmail, ownerCancelledEmail, ownerNewBookingEmail } from '../emails.js';
import { ownerEmail, sendMailSafely } from '../mailer.js';
import { findPromo } from '../promoCodes.js';
import { rateLimit } from '../rateLimit.js';
import { validateBooking } from '../validate.js';

export const publicRouter = Router();

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I lookalikes

function newReference() {
  for (;;) {
    let code = '';
    for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[crypto.randomInt(REFERENCE_ALPHABET.length)];
    const reference = `CU-${code}`;
    if (!bookings.referenceExists(reference)) return reference;
  }
}

export function siteUrl(req) {
  return (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

export const manageUrl = (req, b) => `${siteUrl(req)}/booking/${b.reference}?token=${b.token}`;

function tokenMatches(booking, token) {
  if (!booking || typeof token !== 'string') return false;
  const a = crypto.createHash('sha256').update(booking.token).digest();
  const b = crypto.createHash('sha256').update(token).digest();
  return crypto.timingSafeEqual(a, b);
}

/** What a customer may see about their own booking. */
function customerView(b) {
  const { token, adminNotes, id, ...rest } = b;
  const cancellable =
    (b.status === 'pending' || b.status === 'confirmed') &&
    minutesUntil(b.date, b.time) >= business.booking.freeCancellationHours * 60;
  return { ...rest, cancellable };
}

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true, timeZone: TIME_ZONE, today: businessNow().date });
});

publicRouter.get('/availability', (req, res) => {
  const { from } = req.query;
  const days = Number(req.query.days ?? 42);
  const duration = Number(req.query.duration);

  if (!isValidISODate(from)) return res.status(400).json({ error: '`from` must be a YYYY-MM-DD date.' });
  if (!Number.isInteger(days) || days < 1 || days > 62) return res.status(400).json({ error: '`days` must be 1–62.' });
  if (!Number.isInteger(duration) || duration < 10 || duration > 24 * 60) {
    return res.status(400).json({ error: '`duration` must be a number of minutes.' });
  }

  const now = businessNow();
  const to = addDays(from, days - 1);
  const busy = bookings.activeBetween(from, to);
  const blocked = blockedDates.between(from, to);

  const result = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(from, i);
    result.push({ date, slots: freeSlots(date, duration, busy.get(date) ?? [], { blocked: blocked.has(date), now }) });
  }

  res.json({
    today: now.date,
    maxDate: addDays(now.date, business.booking.maxDaysAhead),
    tooLong: duration > longestDayMinutes(),
    days: result,
  });
});

const promoLimiter = rateLimit({ windowMs: 10 * 60_000, max: 30, message: 'Too many attempts. Try again later.' });

publicRouter.post('/promo', promoLimiter, (req, res) => {
  const promo = findPromo(req.body?.code, businessNow().date);
  if (!promo) return res.status(404).json({ error: "That code isn't valid (or has expired)." });
  res.json({ promo });
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 8,
  message: 'Too many booking attempts from this connection. Please call us instead.',
});

publicRouter.post('/bookings', bookingLimiter, (req, res) => {
  // Honeypot: real people never see or fill this field.
  if (req.body?.company) return res.status(400).json({ error: 'Your request could not be processed.' });

  const { errors, value } = validateBooking(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields: errors });
  }

  const now = businessNow();
  let promo = null;
  if (value.promoCode) {
    promo = findPromo(value.promoCode, now.date);
    if (!promo) return res.status(400).json({ error: "That promo code isn't valid.", fields: { promoCode: 'Invalid code' } });
  }

  let quote;
  try {
    quote = priceSelection(value.items, { promo });
  } catch (err) {
    if (err instanceof QuoteError) return res.status(400).json({ error: err.message });
    throw err;
  }
  if (quote.minutes > longestDayMinutes()) {
    return res.status(400).json({
      error: `That's more than a day's work, so we'll plan it with you personally. Call ${business.phone}.`,
    });
  }

  const created = transaction(() => {
    const slots = freeSlots(value.date, quote.minutes, bookings.activeOn(value.date), {
      blocked: blockedDates.has(value.date),
      now,
    });
    if (!slots.includes(value.time)) return null;

    const [h, m] = value.time.split(':').map(Number);
    return bookings.create({
      reference: newReference(),
      token: crypto.randomBytes(24).toString('base64url'),
      status: 'pending',
      date: value.date,
      start_time: value.time,
      start_min: h * 60 + m,
      duration_min: quote.minutes,
      items_json: JSON.stringify(quote.lines),
      subtotal_cents: quote.subtotalCents,
      discount_cents: quote.discount?.cents ?? 0,
      discount_label: quote.discount?.label ?? null,
      adjustment_cents: quote.adjustmentCents,
      total_cents: quote.totalCents,
      promo_code: promo?.code ?? null,
      customer_name: value.customer.name,
      customer_email: value.customer.email,
      customer_phone: value.customer.phone,
      address: value.customer.address,
      city: value.customer.city,
      postal_code: value.customer.postalCode,
      property_type: value.customer.propertyType,
      water_access: value.customer.waterAccess,
      notes: value.notes,
    });
  });

  if (!created) {
    return res.status(409).json({
      error: 'Sorry, that time was just taken or is no longer available. Please pick another slot.',
      code: 'SLOT_TAKEN',
    });
  }

  const link = manageUrl(req, created);
  sendMailSafely(customerReceivedEmail(created, link));
  sendMailSafely({ ...ownerNewBookingEmail(created, `${siteUrl(req)}/admin`), to: ownerEmail });

  res.status(201).json({ booking: customerView(created), manageUrl: link });
});

publicRouter.get('/bookings/:reference', (req, res) => {
  const booking = bookings.byReference(String(req.params.reference).toUpperCase());
  if (!tokenMatches(booking, req.query.token)) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ booking: customerView(booking) });
});

publicRouter.post('/bookings/:reference/cancel', (req, res) => {
  const booking = bookings.byReference(String(req.params.reference).toUpperCase());
  if (!tokenMatches(booking, req.body?.token)) return res.status(404).json({ error: 'Booking not found.' });

  if (!customerView(booking).cancellable) {
    return res.status(409).json({
      error: `This booking can no longer be cancelled online. Please call us on ${business.phone}.`,
    });
  }

  const updated = bookings.update(booking.id, {
    status: 'cancelled',
    adminNotes: booking.adminNotes,
    cancelledBy: 'customer',
  });
  sendMailSafely({ ...ownerCancelledEmail(updated), to: ownerEmail });
  sendMailSafely(customerStatusEmail(updated, manageUrl(req, updated)));
  res.json({ booking: customerView(updated) });
});
