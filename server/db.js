import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ROOT_DIR } from './env.js';

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'cleanup.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS bookings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    reference        TEXT    NOT NULL UNIQUE,
    token            TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    date             TEXT    NOT NULL,
    start_time       TEXT    NOT NULL,
    start_min        INTEGER NOT NULL,
    duration_min     INTEGER NOT NULL,
    items_json       TEXT    NOT NULL,
    subtotal_cents   INTEGER NOT NULL,
    discount_cents   INTEGER NOT NULL DEFAULT 0,
    discount_label   TEXT,
    adjustment_cents INTEGER NOT NULL DEFAULT 0,
    total_cents      INTEGER NOT NULL,
    promo_code       TEXT,
    customer_name    TEXT    NOT NULL,
    customer_email   TEXT    NOT NULL,
    customer_phone   TEXT    NOT NULL,
    address          TEXT    NOT NULL,
    city             TEXT    NOT NULL,
    postal_code      TEXT    NOT NULL,
    property_type    TEXT    NOT NULL,
    water_access     TEXT    NOT NULL,
    notes            TEXT    NOT NULL DEFAULT '',
    admin_notes      TEXT    NOT NULL DEFAULT '',
    cancelled_by     TEXT,
    created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS bookings_date_status ON bookings (date, status);

  CREATE TABLE IF NOT EXISTS blocked_dates (
    date       TEXT PRIMARY KEY,
    reason     TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`);

function prepare(sql) {
  const statement = db.prepare(sql);
  statement.setAllowBareNamedParameters?.(true);
  return statement;
}

const ACTIVE = `status IN ('pending', 'confirmed')`;

const q = {
  insert: prepare(`
    INSERT INTO bookings (
      reference, token, status, date, start_time, start_min, duration_min, items_json,
      subtotal_cents, discount_cents, discount_label, adjustment_cents, total_cents, promo_code,
      customer_name, customer_email, customer_phone, address, city, postal_code,
      property_type, water_access, notes
    ) VALUES (
      :reference, :token, :status, :date, :start_time, :start_min, :duration_min, :items_json,
      :subtotal_cents, :discount_cents, :discount_label, :adjustment_cents, :total_cents, :promo_code,
      :customer_name, :customer_email, :customer_phone, :address, :city, :postal_code,
      :property_type, :water_access, :notes
    )`),
  byId: prepare(`SELECT * FROM bookings WHERE id = ?`),
  byReference: prepare(`SELECT * FROM bookings WHERE reference = ?`),
  referenceExists: prepare(`SELECT 1 FROM bookings WHERE reference = ?`),
  activeOn: prepare(`SELECT start_min, duration_min FROM bookings WHERE date = ? AND ${ACTIVE}`),
  activeBetween: prepare(
    `SELECT date, start_min, duration_min FROM bookings WHERE date BETWEEN ? AND ? AND ${ACTIVE}`,
  ),
  listAll: prepare(`SELECT * FROM bookings ORDER BY date DESC, start_min DESC LIMIT ?`),
  update: prepare(`
    UPDATE bookings
       SET status = :status, admin_notes = :admin_notes, cancelled_by = :cancelled_by,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = :id`),
  blockedList: prepare(`SELECT date, reason FROM blocked_dates WHERE date >= ? ORDER BY date`),
  blockedBetween: prepare(`SELECT date FROM blocked_dates WHERE date BETWEEN ? AND ?`),
  blockedOn: prepare(`SELECT 1 FROM blocked_dates WHERE date = ?`),
  blockAdd: prepare(`
    INSERT INTO blocked_dates (date, reason) VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET reason = excluded.reason`),
  blockRemove: prepare(`DELETE FROM blocked_dates WHERE date = ?`),
};

/** Runs `fn` inside a write transaction. node:sqlite is synchronous, so keep `fn` synchronous too. */
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    if (db.isTransaction !== false) {
      try {
        db.exec('ROLLBACK');
      } catch {
        /* already rolled back */
      }
    }
    throw err;
  }
}

function toBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    reference: row.reference,
    token: row.token,
    status: row.status,
    date: row.date,
    time: row.start_time,
    startMin: row.start_min,
    durationMin: row.duration_min,
    items: JSON.parse(row.items_json),
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    discountLabel: row.discount_label,
    adjustmentCents: row.adjustment_cents,
    totalCents: row.total_cents,
    promoCode: row.promo_code,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      propertyType: row.property_type,
      waterAccess: row.water_access,
    },
    notes: row.notes,
    adminNotes: row.admin_notes,
    cancelledBy: row.cancelled_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bookings = {
  create(data) {
    const { lastInsertRowid } = q.insert.run(data);
    return toBooking(q.byId.get(lastInsertRowid));
  },
  byId: (id) => toBooking(q.byId.get(id)),
  byReference: (reference) => toBooking(q.byReference.get(reference)),
  referenceExists: (reference) => Boolean(q.referenceExists.get(reference)),
  /** Active (pending/confirmed) jobs on one day, shaped for the slot calculator. */
  activeOn: (date) => q.activeOn.all(date).map((r) => ({ startMin: r.start_min, durationMin: r.duration_min })),
  activeBetween(from, to) {
    const byDate = new Map();
    for (const r of q.activeBetween.all(from, to)) {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push({ startMin: r.start_min, durationMin: r.duration_min });
    }
    return byDate;
  },
  list: (limit = 1000) => q.listAll.all(limit).map(toBooking),
  update(id, { status, adminNotes, cancelledBy }) {
    q.update.run({ id, status, admin_notes: adminNotes, cancelled_by: cancelledBy ?? null });
    return toBooking(q.byId.get(id));
  },
};

export const blockedDates = {
  list: (fromDate) => q.blockedList.all(fromDate).map((r) => ({ date: r.date, reason: r.reason })),
  between: (from, to) => new Set(q.blockedBetween.all(from, to).map((r) => r.date)),
  has: (date) => Boolean(q.blockedOn.get(date)),
  add: (date, reason) => q.blockAdd.run(date, reason),
  remove: (date) => q.blockRemove.run(date).changes > 0,
};
