import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

const STEPS = [
  { icon: 'tag', title: 'Pick & price', text: 'Choose what needs cleaning and see your exact price instantly.' },
  { icon: 'calendar', title: 'Choose a time', text: 'Grab any open slot. We confirm by email, usually within a few hours.' },
  { icon: 'wand', title: 'We make it shine', text: 'We bring the equipment and soaps. You just need an outdoor tap.' },
  { icon: 'star', title: 'Pay when happy', text: "Pay after the job. If something isn't right, we come back and fix it." },
];

export function HowItWorks() {
  return (
    <section className="section section--soft how" id="how" aria-labelledby="how-title">
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Booked in a minute. Clean by the afternoon.</h2>
        </Reveal>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} className="step-card" delay={index * 90}>
              <span className="step-card__icon">
                <Icon name={step.icon} size={24} />
              </span>
              <span className="step-card__num">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
