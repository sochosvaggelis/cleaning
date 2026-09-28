import { business } from '@shared/business.js';
import { BookingWizard } from '../booking/BookingWizard.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

// Set VITE_PREVIEW_NOTICE=true when building (see render.yaml) while bookings made online aren't kept.
const isPreview = import.meta.env.VITE_PREVIEW_NOTICE === 'true';

export function BookingSection() {
  return (
    <section className="section booking" id="book" aria-labelledby="book-title">
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="eyebrow">Online booking</p>
          <h2 id="book-title">Book your clean</h2>
          <p>
            Pick your services, choose a time and you're done. Prefer to talk? Call{' '}
            <a href={business.phoneHref}>{business.phone}</a>.
          </p>
        </Reveal>
        {isPreview && (
          <div className="notice notice--warn preview-notice" role="note">
            <Icon name="info" />
            <p>
              This is a preview of our new website. Online booking isn't live yet, so requests made here may not
              reach us. To book, please call <a href={business.phoneHref}>{business.phone}</a>.
            </p>
          </div>
        )}
        <BookingWizard />
      </div>
    </section>
  );
}
