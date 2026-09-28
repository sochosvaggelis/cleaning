import { business } from '../shared/business.js';
import { formatDateShort, formatTime } from '../shared/dates.js';
import { formatDuration, formatMoney } from '../shared/pricing.js';

const firstName = (name) => name.split(' ')[0];
const when = (b) => `${formatDateShort(b.date)} at ${formatTime(b.time)}`;
const where = (b) => `${b.customer.address}, ${b.customer.city} ${b.customer.postalCode}`;
const signature = `\n${business.name}\n${business.phone} · ${business.email}`;

function itemsText(b) {
  return b.items.map((l) => `  • ${l.name} (${l.option}): ${formatMoney(l.cents)}`).join('\n');
}

function totalsText(b) {
  const rows = [`  Subtotal: ${formatMoney(b.subtotalCents)}`];
  if (b.discountCents) rows.push(`  ${b.discountLabel}: −${formatMoney(b.discountCents)}`);
  if (b.adjustmentCents) rows.push(`  Minimum visit charge: +${formatMoney(b.adjustmentCents)}`);
  rows.push(`  Total: ${formatMoney(b.totalCents)}`);
  return rows.join('\n');
}

export function customerReceivedEmail(b, manageUrl) {
  return {
    to: b.customer.email,
    subject: `We got your booking request (${b.reference})`,
    text: `Hi ${firstName(b.customer.name)},

Thanks for booking with ${business.name}! Here's what we have down:

When:  ${when(b)} (about ${formatDuration(b.durationMin)})
Where: ${where(b)}

${itemsText(b)}

${totalsText(b)}
${business.payment}

We'll confirm your booking shortly. Need to change or cancel? Use this link:
${manageUrl}

Before we arrive: please make sure we can reach an outdoor water tap, and move cars,
bins and plant pots out of the way if you can.
${signature}`,
  };
}

export function ownerNewBookingEmail(b, adminUrl) {
  return {
    to: null, // filled in by the caller
    replyTo: b.customer.email,
    subject: `New booking request: ${b.customer.name}, ${when(b)} (${formatMoney(b.totalCents)})`,
    text: `New booking request ${b.reference}

When:     ${when(b)} (${formatDuration(b.durationMin)})
Customer: ${b.customer.name}
Phone:    ${b.customer.phone}
Email:    ${b.customer.email}
Address:  ${where(b)}
Property: ${b.customer.propertyType} · outdoor water: ${b.customer.waterAccess}
${b.promoCode ? `Promo:    ${b.promoCode}\n` : ''}
${itemsText(b)}

${totalsText(b)}

Notes from the customer:
${b.notes || '(none)'}

Confirm it in the dashboard: ${adminUrl}`,
  };
}

const statusCopy = {
  confirmed: (b) => ({
    subject: `You're booked in! ${when(b)} (${b.reference})`,
    body: `Good news: your booking is confirmed for ${when(b)}.

We'll bring all the equipment. Just make sure we can reach an outdoor water tap.
If anything changes, reply to this email or call us on ${business.phone}.`,
  }),
  cancelled: (b) => ({
    subject: `Your booking ${b.reference} was cancelled`,
    body: `Your booking for ${when(b)} has been cancelled.

${b.cancelledBy === 'customer' ? 'Sorry to see you go. You can book again any time.' : "If this is unexpected, please give us a call and we'll sort it out."}`,
  }),
  completed: (b) => ({
    subject: `All done, thanks from ${business.name}!`,
    body: `Thanks for letting us make your place shine today!

If you're happy with the result, a quick review or a word to your neighbors would mean the world
to a small business like ours. And if anything isn't perfect, reply to this email and we'll come back
and fix it for free.`,
  }),
};

export function customerStatusEmail(b, manageUrl) {
  const copy = statusCopy[b.status]?.(b);
  if (!copy) return null;
  return {
    to: b.customer.email,
    subject: copy.subject,
    text: `Hi ${firstName(b.customer.name)},

${copy.body}

Booking details: ${manageUrl}
${signature}`,
  };
}

export function ownerCancelledEmail(b) {
  return {
    to: null,
    replyTo: b.customer.email,
    subject: `Cancelled by customer: ${b.customer.name}, ${when(b)}`,
    text: `${b.customer.name} cancelled booking ${b.reference} (${when(b)}, ${formatMoney(b.totalCents)}).
The slot is free again.

Phone: ${b.customer.phone}
Email: ${b.customer.email}`,
  };
}
