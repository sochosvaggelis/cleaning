import { Router } from 'express';
import { business } from '../../shared/business.js';
import { isValidISODate } from '../../shared/dates.js';
import { adminConfigured, checkPassword, endSession, isAdmin, requireAdmin, startSession } from '../auth.js';
import { businessNow } from '../availability.js';
import { blockedDates, bookings, transaction } from '../db.js';
import { customerStatusEmail } from '../emails.js';
import { sendMailSafely } from '../mailer.js';
import { rateLimit } from '../rateLimit.js';
import { manageUrl } from './public.js';

export const adminRouter = Router();

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const withLink = (req, b) => ({ ...b, manageUrl: manageUrl(req, b) });

adminRouter.get('/session', (req, res) => {
  res.json({ configured: adminConfigured, authenticated: isAdmin(req) });
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many login attempts. Wait 15 minutes and try again.',
});

adminRouter.post('/login', loginLimiter, (req, res) => {
  if (!adminConfigured) {
    return res.status(503).json({ error: 'Set ADMIN_PASSWORD in the .env file to enable the dashboard.' });
  }
  if (!checkPassword(req.body?.password)) return res.status(401).json({ error: 'Wrong password.' });
  startSession(req, res);
  res.json({ authenticated: true });
});

adminRouter.post('/logout', (req, res) => {
  endSession(req, res);
  res.json({ authenticated: false });
});

// Everything below needs a logged-in admin.
adminRouter.use(requireAdmin);

adminRouter.get('/bookings', (req, res) => {
  res.json({ today: businessNow().date, bookings: bookings.list(2000).map((b) => withLink(req, b)) });
});

adminRouter.patch('/bookings/:id', (req, res) => {
  const id = Number(req.params.id);
  const booking = Number.isInteger(id) ? bookings.byId(id) : null;
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const status = req.body?.status ?? booking.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
  const adminNotes =
    typeof req.body?.adminNotes === 'string' ? req.body.adminNotes.slice(0, 2000) : booking.adminNotes;
  const cancelledBy = status === 'cancelled' ? booking.cancelledBy ?? 'admin' : null;

  const updated = transaction(() => {
    // Bringing a cancelled booking back must not double-book its old slot.
    if (booking.status === 'cancelled' && status !== 'cancelled') {
      const buffer = business.booking.bufferMinutes;
      const start = booking.startMin;
      const end = start + booking.durationMin;
      const clash = bookings
        .activeOn(booking.date)
        .some((job) => start < job.startMin + job.durationMin + buffer && end + buffer > job.startMin);
      if (clash) return null;
    }
    return bookings.update(id, { status, adminNotes, cancelledBy });
  });

  if (!updated) {
    return res.status(409).json({ error: 'Another booking now uses that time, so it cannot be reactivated.' });
  }

  if (status !== booking.status && req.body?.notify !== false) {
    const mail = customerStatusEmail(updated, manageUrl(req, updated));
    if (mail) sendMailSafely(mail);
  }
  res.json({ booking: withLink(req, updated) });
});

adminRouter.get('/blocked-dates', (_req, res) => {
  res.json({ blocked: blockedDates.list(businessNow().date) });
});

adminRouter.post('/blocked-dates', (req, res) => {
  const { date, reason } = req.body ?? {};
  if (!isValidISODate(date)) return res.status(400).json({ error: 'Pick a valid date.' });
  blockedDates.add(date, typeof reason === 'string' ? reason.trim().slice(0, 120) : '');
  res.status(201).json({
    blocked: blockedDates.list(businessNow().date),
    bookingsThatDay: bookings.activeOn(date).length,
  });
});

adminRouter.delete('/blocked-dates/:date', (req, res) => {
  blockedDates.remove(req.params.date);
  res.json({ blocked: blockedDates.list(businessNow().date) });
});
