import { business } from '@shared/business.js';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

const FAQS = [
  {
    q: 'Do I need to be home?',
    a: "Not at all. As long as we can reach the areas we're cleaning and an outdoor water tap, you can be at work. We'll send you a message when we're done.",
  },
  {
    q: 'Do you bring your own water?',
    a: 'We connect to your outdoor tap. A pressure washer actually uses less water per minute than a regular garden hose, because the pressure does the work.',
  },
  {
    q: 'Will pressure washing damage my surfaces?',
    a: "Not the way we do it. We match the pressure and nozzle to the surface: full power with a surface cleaner for concrete, a gentle fan for wood, and a low-pressure soft wash for siding so it's never forced behind boards.",
  },
  {
    q: 'Are your soaps safe for pets and plants?',
    a: "We use biodegradable cleaners, wet down plants before and after, and rinse thoroughly. Keep pets inside while we work and until surfaces are dry, which is usually within an hour.",
  },
  {
    q: 'Can you remove every oil stain?',
    a: "Honest answer: fresh stains usually lift completely. Old stains that have soaked deep into concrete fade a lot but may leave a shadow. Add our oil stain treatment for the best result.",
  },
  {
    q: 'What if it rains?',
    a: "Light rain doesn't bother us, since we're getting everything wet anyway. If there's a storm or freezing weather we'll move your booking to the next free slot, at no cost.",
  },
  {
    q: 'How and when do I pay?',
    a: `${business.payment} No deposit is needed to book.`,
  },
  {
    q: 'Can I cancel or reschedule?',
    a: `Yes. Cancel for free online up to ${business.booking.freeCancellationHours} hours before your slot using the link in your confirmation email. After that, just give us a call.`,
  },
];

export function Faq() {
  return (
    <section className="section section--soft faq" id="faq" aria-labelledby="faq-title">
      <div className="container container--narrow">
        <Reveal as="header" className="section-head">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title">Good questions, straight answers.</h2>
        </Reveal>
        <div className="faq__list">
          {FAQS.map((item, index) => (
            <Reveal as="details" key={item.q} className="faq__item" delay={index * 40}>
              <summary>
                {item.q}
                <Icon name="chevronDown" size={20} className="faq__chevron" />
              </summary>
              <p>{item.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
