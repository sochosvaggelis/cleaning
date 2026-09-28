import { business } from '@shared/business.js';
import { BookingWizard } from '../booking/BookingWizard.jsx';
import { Reveal } from './Reveal.jsx';

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
        <BookingWizard />
      </div>
    </section>
  );
}
