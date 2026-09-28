import { business } from '@shared/business.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse / semi' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

export const WATER_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

export const emptyDetails = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  propertyType: 'house',
  waterAccess: 'yes',
  notes: '',
  agree: false,
  company: '', // honeypot, stays empty for humans
};

/** Same rules as the server (server/validate.js), so most mistakes are caught before sending. */
export function validateDetails(d) {
  const errors = {};
  if (d.name.trim().length < 2) errors.name = 'Please tell us your name.';
  if (!EMAIL.test(d.email.trim())) errors.email = "That email address doesn't look right.";
  if (d.phone.replace(/\D/g, '').length < 7 || /[^\d+()\-.\s]/.test(d.phone)) {
    errors.phone = 'Please enter a phone number we can call.';
  }
  if (d.address.trim().length < 4) errors.address = 'Please enter the street address.';
  if (d.city.trim().length < 2) errors.city = 'Please enter the town or city.';
  if (d.postalCode.trim().length < 3) errors.postalCode = 'Please enter the ZIP / postal code.';
  if (!d.agree) errors.agree = 'Please accept the booking terms.';
  return errors;
}

function Field({ id, label, error, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

export function StepDetails({ details, errors, onChange }) {
  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...details, [key]: value });
  };
  const input = (key, props = {}) => ({
    id: `bk-${key}`,
    name: key,
    value: details[key],
    onChange: set(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `bk-${key}-error` : undefined,
    ...props,
  });

  return (
    <div className="step">
      <h3 className="step__title">Where are we cleaning?</h3>
      <p className="step__hint">We only use these details for your booking.</p>

      <div className="form-grid">
        <Field id="bk-name" label="Full name" error={errors.name}>
          <input {...input('name', { autoComplete: 'name', required: true })} />
        </Field>
        <Field id="bk-phone" label="Phone" error={errors.phone}>
          <input {...input('phone', { type: 'tel', autoComplete: 'tel', required: true })} />
        </Field>
        <Field id="bk-email" label="Email" error={errors.email} className="field--wide">
          <input {...input('email', { type: 'email', autoComplete: 'email', required: true })} />
        </Field>
        <Field id="bk-address" label="Street address" error={errors.address} className="field--wide">
          <input {...input('address', { autoComplete: 'street-address', required: true })} />
        </Field>
        <Field id="bk-city" label="Town / city" error={errors.city}>
          <input {...input('city', { autoComplete: 'address-level2', required: true })} />
        </Field>
        <Field id="bk-postalCode" label="ZIP / postal code" error={errors.postalCode}>
          <input {...input('postalCode', { autoComplete: 'postal-code', required: true })} />
        </Field>

        <Field id="bk-propertyType" label="Property type" error={errors.propertyType}>
          <select {...input('propertyType')}>
            {PROPERTY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="field field--radios">
          <legend>Outdoor water tap we can use?</legend>
          <div className="radio-row">
            {WATER_OPTIONS.map((o) => (
              <label key={o.value} className={`radio-pill ${details.waterAccess === o.value ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="waterAccess"
                  value={o.value}
                  checked={details.waterAccess === o.value}
                  onChange={set('waterAccess')}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="bk-notes" label="Anything we should know? (optional)" className="field--wide">
          <textarea
            {...input('notes', {
              rows: 3,
              maxLength: 1000,
              placeholder: 'Gate code, where the tap is, pets, parking, stubborn stains…',
            })}
          />
        </Field>

        {/* Honeypot for bots: hidden from people and screen readers. */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="bk-company">Company</label>
          <input id="bk-company" tabIndex={-1} autoComplete="off" value={details.company} onChange={set('company')} />
        </div>

        <div className={`field field--wide field--check ${errors.agree ? 'field--error' : ''}`}>
          <label className="check">
            <input type="checkbox" checked={details.agree} onChange={set('agree')} aria-invalid={Boolean(errors.agree)} />
            <span>
              I understand this is a booking request: {business.name} confirms it by email. I can cancel for free up to{' '}
              {business.booking.freeCancellationHours} hours before, and I pay after the job.
            </span>
          </label>
          {errors.agree && <span className="field__error">{errors.agree}</span>}
        </div>
      </div>
    </div>
  );
}
