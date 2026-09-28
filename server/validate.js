import { isValidHHMM, isValidISODate } from '../shared/dates.js';

export const PROPERTY_TYPES = ['house', 'townhouse', 'business', 'other'];
export const WATER_ACCESS = ['yes', 'no', 'unsure'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function line(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function paragraph(value, max) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
}

/** Cleans a booking request body. Returns field errors keyed like the form fields. */
export function validateBooking(body) {
  const errors = {};
  const c = body?.customer ?? {};

  const customer = {
    name: line(c.name, 80),
    email: line(c.email, 120).toLowerCase(),
    phone: line(c.phone, 25),
    address: line(c.address, 160),
    city: line(c.city, 80),
    postalCode: line(c.postalCode, 12),
    propertyType: PROPERTY_TYPES.includes(c.propertyType) ? c.propertyType : null,
    waterAccess: WATER_ACCESS.includes(c.waterAccess) ? c.waterAccess : null,
  };

  if (customer.name.length < 2) errors.name = 'Please tell us your name.';
  if (!EMAIL.test(customer.email)) errors.email = "That email address doesn't look right.";
  const digits = customer.phone.replace(/\D/g, '').length;
  if (digits < 7 || /[^\d+()\-.\s]/.test(customer.phone)) errors.phone = 'Please enter a phone number we can call.';
  if (customer.address.length < 4) errors.address = 'Please enter the street address.';
  if (customer.city.length < 2) errors.city = 'Please enter the town or city.';
  if (customer.postalCode.length < 3) errors.postalCode = 'Please enter the ZIP / postal code.';
  if (!customer.propertyType) errors.propertyType = 'Choose a property type.';
  if (!customer.waterAccess) errors.waterAccess = 'Let us know about outdoor water.';

  const items = Array.isArray(body?.items)
    ? body.items.slice(0, 20).map((item) => ({
        serviceId: String(item?.serviceId ?? '').slice(0, 40),
        tierId: item?.tierId == null ? undefined : String(item.tierId).slice(0, 40),
        qty: item?.qty == null ? undefined : Number(item.qty),
      }))
    : [];
  if (!items.length) errors.items = 'Pick at least one service.';

  if (!isValidISODate(body?.date)) errors.date = 'Pick a date.';
  if (!isValidHHMM(body?.time)) errors.time = 'Pick a time.';
  if (body?.agree !== true) errors.agree = 'Please accept the booking terms.';

  return {
    errors,
    value: {
      items,
      date: body?.date,
      time: body?.time,
      customer,
      notes: paragraph(body?.notes, 1000),
      promoCode: line(body?.promoCode, 32),
    },
  };
}
