/**
 * Promo codes customers can enter while booking. Matched case-insensitively.
 * Kept on the server so private codes (e.g. for a partner) never ship to the browser.
 * Optional `expires` is the last valid day, 'YYYY-MM-DD' (business-local).
 */
export const promoCodes = [
  { code: 'HELLO15', percent: 15, label: 'Launch offer · 15% off' },
  { code: 'NEIGHBOR10', percent: 10, label: 'Neighbor referral · 10% off' },
];

export function findPromo(rawCode, today) {
  const code = String(rawCode ?? '').trim().toUpperCase();
  if (!code) return null;
  const promo = promoCodes.find((p) => p.code.toUpperCase() === code);
  if (!promo) return null;
  if (promo.expires && today > promo.expires) return null;
  return { code: promo.code, percent: promo.percent, label: promo.label };
}
