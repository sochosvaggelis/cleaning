import { business } from '@shared/business.js';
import { formatMoney } from '@shared/pricing.js';
import { Icon } from '../../components/Icon.jsx';

export function ClassicHero() {
  const { launchOffer } = business;
  return (
    <section className="hero" id="top" data-chapter="0">
      <div className="hero__content">
        <a className="pill" href="#prices">
          <span className="pill__dot" aria-hidden="true" />
          Now booking · {launchOffer.text} with code <strong>{launchOffer.code}</strong>
        </a>
        <h1 className="hero__title">
          Grime out.
          <br />
          <span className="text-gradient">Shine in.</span>
        </h1>
        <p className="hero__lead">
          Driveways, decks, siding, fences and bins, pressure-washed by two local friends who sweat the details.
          Clear prices, and booking online takes about a minute.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href="#book">
            Book a clean <Icon name="arrowRight" size={18} />
          </a>
          <a className="btn btn--glass btn--lg" href="#prices">
            See prices
          </a>
        </div>
        <ul className="hero__facts">
          <li>
            <Icon name="tag" size={17} /> Jobs from {formatMoney(business.booking.minimumTotal * 100)}
          </li>
          <li>
            <Icon name="leaf" size={17} /> Eco-friendly soaps
          </li>
          <li>
            <Icon name="shield" size={17} /> Pay after the job
          </li>
        </ul>
      </div>
      <a className="scroll-cue" href="#services">
        <span className="scroll-cue__mouse" aria-hidden="true" />
        Scroll to start cleaning
      </a>
    </section>
  );
}
