import { coreServices } from '@shared/catalog.js';
import { formatMoney, startingPriceCents } from '@shared/pricing.js';
import { defaultItem, useBooking } from '../booking/BookingContext.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

export function Services() {
  const { has, upsert, remove } = useBooking();

  return (
    <section className="section" id="services" aria-labelledby="services-title">
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="eyebrow">What we clean</p>
          <h2 id="services-title">Every outdoor surface, cleaned the right way.</h2>
          <p>
            Concrete, stone, wood and siding each need a different pressure, nozzle and soap. We match them to the
            surface, so it gets properly clean without damage.
          </p>
        </Reveal>

        <div className="services-grid">
          {coreServices.map((service, index) => {
            const added = has(service.id);
            return (
              <Reveal as="article" key={service.id} className="service-card" delay={(index % 4) * 60}>
                <span className="service-card__icon">
                  <Icon name={service.icon} size={24} />
                </span>
                <h3>{service.name}</h3>
                <p>{service.blurb}</p>
                <div className="service-card__foot">
                  <span className="service-card__price">
                    from <strong>{formatMoney(startingPriceCents(service))}</strong>
                    {service.unit ? ` / ${service.unit.label}` : ''}
                  </span>
                  <button
                    type="button"
                    className={`chip-btn ${added ? 'chip-btn--done' : ''}`}
                    aria-pressed={added}
                    onClick={() => (added ? remove(service.id) : upsert(defaultItem(service)))}
                  >
                    <Icon name={added ? 'check' : 'plus'} size={15} />
                    {added ? 'Added' : 'Add'}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
