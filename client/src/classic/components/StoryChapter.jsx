import { serviceById } from '@shared/catalog.js';
import { formatMoney, startingPriceCents } from '@shared/pricing.js';
import { defaultItem, useBooking } from '../../booking/BookingContext.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Reveal } from '../../components/Reveal.jsx';

export function StoryChapter({ story }) {
  const { upsert, has, goToBooking } = useBooking();
  const lead = serviceById[story.serviceIds[0]];

  return (
    <section className={`chapter chapter--${story.side}`} data-chapter={story.chapter} id={story.anchor}>
      <div className="chapter__sticky">
        <Reveal as="article" className="story-card">
          <div className="story-card__top">
            <span className="story-card__num">0{story.chapter}</span>
            <span className="eyebrow">{story.eyebrow}</span>
          </div>
          <h2 className="story-card__title">{story.title}</h2>
          <p className="story-card__text">{story.text}</p>
          <ul className="checklist">
            {lead.includes.map((line) => (
              <li key={line}>
                <Icon name="check" size={16} />
                {line}
              </li>
            ))}
          </ul>
          <div className="story-card__services">
            {story.serviceIds.map((id) => {
              const service = serviceById[id];
              const added = has(id);
              return (
                <div className="mini-service" key={id}>
                  <Icon name={service.icon} className="mini-service__icon" />
                  <div className="mini-service__text">
                    <strong>{service.name}</strong>
                    <span>
                      from {formatMoney(startingPriceCents(service))}
                      {service.unit ? ` per ${service.unit.label}` : ''}
                    </span>
                  </div>
                  {added ? (
                    <button type="button" className="btn btn--sm btn--done" onClick={goToBooking}>
                      <Icon name="check" size={16} /> Added
                    </button>
                  ) : (
                    <button type="button" className="btn btn--sm btn--primary" onClick={() => upsert(defaultItem(service))}>
                      <Icon name="plus" size={16} /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
