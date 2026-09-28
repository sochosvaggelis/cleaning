import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { priceSelection } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { useBooking } from './BookingContext.jsx';
import { BookingSuccess } from './BookingSuccess.jsx';
import { QuoteSummary } from './QuoteSummary.jsx';
import { emptyDetails, StepDetails, validateDetails } from './StepDetails.jsx';
import { StepReview } from './StepReview.jsx';
import { StepSchedule } from './StepSchedule.jsx';
import { StepServices } from './StepServices.jsx';

const STEPS = ['Services', 'Date & time', 'Your details', 'Confirm'];

export function BookingWizard() {
  const { selection, clear } = useBooking();
  const [step, setStep] = useState(0);
  const [promo, setPromo] = useState(null);
  const [slot, setSlot] = useState({ date: null, time: null });
  const [details, setDetails] = useState(emptyDetails);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const topRef = useRef(null);
  const firstRender = useRef(true);

  const { quote, quoteError } = useMemo(() => {
    if (!selection.length) return { quote: null, quoteError: null };
    try {
      return { quote: priceSelection(selection, { promo }), quoteError: null };
    } catch (err) {
      return { quote: null, quoteError: err.message };
    }
  }, [selection, promo]);

  const minutes = quote?.minutes ?? 0;

  // A different job length can make the chosen start time impossible, so ask again.
  useEffect(() => {
    setSlot((s) => (s.time ? { ...s, time: null } : s));
  }, [minutes]);

  // Keep the visitor on a step they can actually complete.
  useEffect(() => {
    if (result) return;
    if (!quote && step > 0) setStep(0);
    else if (!slot.time && step > 1) setStep(1);
  }, [quote, slot.time, step, result]);

  // Bring the top of the wizard into view when the step changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, result]);

  const onSlotChange = useCallback((next) => setSlot(next), []);

  const canContinue = [Boolean(quote), Boolean(slot.date && slot.time), true, true][step];

  const next = () => {
    setError(null);
    if (step === 2) {
      const errors = validateDetails(details);
      setFieldErrors(errors);
      if (Object.keys(errors).length) {
        requestAnimationFrame(() => document.querySelector('.field--error input, .field--error select')?.focus());
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await api('/bookings', {
        method: 'POST',
        body: {
          items: selection,
          date: slot.date,
          time: slot.time,
          customer: {
            name: details.name,
            email: details.email,
            phone: details.phone,
            address: details.address,
            city: details.city,
            postalCode: details.postalCode,
            propertyType: details.propertyType,
            waterAccess: details.waterAccess,
          },
          notes: details.notes,
          promoCode: promo?.code ?? '',
          agree: details.agree,
          company: details.company,
        },
      });
      setResult(data);
      clear();
    } catch (err) {
      setError(err.message);
      if (err.data?.code === 'SLOT_TAKEN') {
        setSlot((s) => ({ ...s, time: null }));
        setAvailabilityVersion((v) => v + 1);
        setStep(1);
      } else if (err.data?.fields) {
        setFieldErrors(err.data.fields);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setStep(0);
    setSlot({ date: null, time: null });
    setDetails((d) => ({ ...emptyDetails, name: d.name, email: d.email, phone: d.phone }));
    setPromo(null);
    setFieldErrors({});
    setError(null);
  };

  if (result) {
    return (
      <div className="wizard" ref={topRef}>
        <BookingSuccess booking={result.booking} manageUrl={result.manageUrl} onReset={reset} />
      </div>
    );
  }

  return (
    <div className="wizard" ref={topRef}>
      <ol className="wizard__steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}>
            <button
              type="button"
              onClick={() => setStep(index)}
              disabled={index > step}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="wizard__num">{index < step ? <Icon name="check" size={14} strokeWidth={3} /> : index + 1}</span>
              <span className="wizard__label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="wizard__body">
        <div className="wizard__main">
          {error && (
            <div className="notice notice--error" role="alert">
              <Icon name="alert" />
              <p>{error}</p>
            </div>
          )}

          {step === 0 && <StepServices />}
          {step === 1 && quote && (
            <StepSchedule
              minutes={minutes}
              date={slot.date}
              time={slot.time}
              onChange={onSlotChange}
              refreshKey={availabilityVersion}
            />
          )}
          {step === 2 && <StepDetails details={details} errors={fieldErrors} onChange={setDetails} />}
          {step === 3 && quote && (
            <StepReview quote={quote} date={slot.date} time={slot.time} details={details} onEdit={setStep} />
          )}

          <div className="wizard__nav">
            {step > 0 && (
              <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
                <Icon name="arrowLeft" size={18} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn--primary" onClick={next} disabled={!canContinue}>
                Continue <Icon name="arrowRight" size={18} />
              </button>
            ) : (
              <button type="button" className="btn btn--primary btn--lg" onClick={submit} disabled={submitting}>
                {submitting ? 'Sending…' : 'Request booking'}
                {!submitting && <Icon name="check" size={18} />}
              </button>
            )}
          </div>
        </div>

        <QuoteSummary
          quote={quote}
          quoteError={quoteError}
          promo={promo}
          onPromoApply={setPromo}
          onPromoRemove={() => setPromo(null)}
          date={slot.date}
          time={slot.time}
        />
      </div>
    </div>
  );
}
