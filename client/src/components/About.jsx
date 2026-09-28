import { business } from '@shared/business.js';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

const PROMISES = [
  {
    icon: 'shield',
    title: 'Happiness guarantee',
    text: "Missed a spot? Let us know and we'll come back and redo it for free.",
  },
  {
    icon: 'tag',
    title: 'The price you see is the price you pay',
    text: 'If the job turns out bigger than booked, we tell you before we start, never after.',
  },
  {
    icon: 'leaf',
    title: 'Safe for plants, pets and paint',
    text: 'Biodegradable soaps, plants rinsed before and after, and the right pressure for every surface.',
  },
  {
    icon: 'clock',
    title: 'We show up when we say',
    text: "If we're ever running late, we call ahead. You don't even need to be home.",
  },
];

export function About() {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="container about">
        <Reveal className="about__text">
          <p className="eyebrow">Who we are</p>
          <h2 id="about-title">Two local friends who care how your place looks.</h2>
          <p>
            We started {business.name} because we love the moment a grimy surface turns spotless, and because too many
            people get vague quotes and rushed work. With us you get a clear price up front, careful work, and the two
            of us on every job.
          </p>
          <p>
            We're a young business, so every job matters. That's why we don't pack up until you're happy.
          </p>
          <div className="about__actions">
            <a className="btn btn--primary" href="#book">
              Book your clean
            </a>
            <a className="btn btn--ghost" href={business.phoneHref}>
              <Icon name="phone" size={17} /> {business.phone}
            </a>
          </div>
        </Reveal>

        <ul className="promises">
          {PROMISES.map((promise, index) => (
            <Reveal as="li" key={promise.title} className="promise" delay={index * 70}>
              <span className="promise__icon">
                <Icon name={promise.icon} size={22} />
              </span>
              <div>
                <h3>{promise.title}</h3>
                <p>{promise.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
