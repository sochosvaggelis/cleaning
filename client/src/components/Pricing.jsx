import { business } from '@shared/business.js';
import { addonServices, bundleDiscounts, combos, coreServices } from '@shared/catalog.js';
import { formatDuration, formatMoney, priceSelection } from '@shared/pricing.js';
import { defaultItem, useBooking } from '../booking/BookingContext.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

/** Round "+" button that adds an option to the booking, or removes it again. */
function ToggleButton({ name, added, onAdd, onRemove }) {
  return (
    <button
      type="button"
      className={`add-btn ${added ? 'add-btn--done' : ''}`}
      onClick={added ? onRemove : onAdd}
      aria-pressed={added}
      aria-label={added ? `Remove ${name} from booking` : `Add ${name} to booking`}
      title={added ? 'Added. Click to remove' : 'Add to booking'}
    >
      <Icon name={added ? 'check' : 'plus'} size={18} />
    </button>
  );
}

function PriceCard({ service, index }) {
  const { selection, upsert, remove } = useBooking();
  const chosen = selection.find((i) => i.serviceId === service.id);

  return (
    <Reveal as="article" className="price-card" delay={(index % 2) * 80}>
      <header className="price-card__head">
        <span className="price-card__icon">
          <Icon name={service.icon} size={22} />
        </span>
        <h3>{service.name}</h3>
      </header>
      <p className="price-card__blurb">{service.blurb}</p>

      <ul className="tiers">
        {service.tiers?.map((tier) => {
          const added = chosen?.tierId === tier.id;
          return (
            <li key={tier.id} className={`tier ${added ? 'tier--added' : ''}`}>
              <div className="tier__info">
                <span className="tier__label">
                  {tier.label}
                  {tier.popular && <span className="badge">Popular</span>}
                </span>
                <span className="tier__detail">
                  {tier.detail} · ~{formatDuration(tier.minutes)}
                </span>
              </div>
              <span className="tier__price">{formatMoney(tier.price * 100)}</span>
              <ToggleButton
                name={`${service.name} (${tier.label})`}
                added={added}
                onAdd={() => upsert({ serviceId: service.id, tierId: tier.id })}
                onRemove={() => remove(service.id)}
              />
            </li>
          );
        })}
        {service.unit && (
          <li className={`tier ${chosen ? 'tier--added' : ''}`}>
            <div className="tier__info">
              <span className="tier__label">Per {service.unit.label}</span>
              <span className="tier__detail">
                Up to {service.unit.max} per visit · ~{service.unit.minutes} min each
              </span>
            </div>
            <span className="tier__price">{formatMoney(service.unit.price * 100)}</span>
            <ToggleButton
              name={service.name}
              added={Boolean(chosen)}
              onAdd={() => upsert(defaultItem(service))}
              onRemove={() => remove(service.id)}
            />
          </li>
        )}
      </ul>
    </Reveal>
  );
}

function ComboCard({ combo, index }) {
  const { replace, goToBooking } = useBooking();
  const quote = priceSelection(combo.items);

  return (
    <Reveal as="article" className="combo" delay={index * 90}>
      <span className="combo__save">Save {formatMoney(quote.discount?.cents ?? 0)}</span>
      <h4>{combo.name}</h4>
      <p>{combo.blurb}</p>
      <ul>
        {quote.lines.map((line) => (
          <li key={line.serviceId}>
            <Icon name="check" size={15} />
            <span>
              {line.name} <small>{line.option.split(' · ')[0]}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="combo__price">
        <s>{formatMoney(quote.subtotalCents)}</s>
        <strong>{formatMoney(quote.totalCents)}</strong>
      </div>
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => {
          replace(combo.items);
          goToBooking();
        }}
      >
        Book this combo
      </button>
    </Reveal>
  );
}

export function Pricing() {
  const { selection, upsert, remove } = useBooking();
  const { booking, launchOffer } = business;

  return (
    <section className="section section--soft pricing" id="prices" aria-labelledby="prices-title">
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="eyebrow">Price list</p>
          <h2 id="prices-title">Honest prices. No surprises.</h2>
          <p>
            Prices are for typical sizes and include soaps, equipment and cleanup. We check the job when we arrive. If
            it's bigger than you booked, we tell you before we start, never after.
          </p>
        </Reveal>

        <Reveal className="offer">
          <Icon name="sparkle" size={22} />
          <p>
            <strong>Launch offer:</strong> {launchOffer.text}. Use code <code>{launchOffer.code}</code> when you book.
          </p>
        </Reveal>

        <div className="price-grid">
          {coreServices.map((service, index) => (
            <PriceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        <div className="pricing-extras">
          <Reveal as="article" className="extras-card">
            <h3>Add-ons</h3>
            <ul className="addons">
              {addonServices.map((service) => {
                const added = selection.some((i) => i.serviceId === service.id);
                const price = service.unit
                  ? `${formatMoney(service.unit.price * 100)} / ${service.unit.label}`
                  : formatMoney(service.flat.price * 100);
                return (
                  <li key={service.id}>
                    <Icon name={service.icon} size={20} className="addons__icon" />
                    <div className="addons__text">
                      <strong>{service.name}</strong>
                      <span>{service.blurb}</span>
                    </div>
                    <span className="addons__price">{price}</span>
                    <ToggleButton
                      name={service.name}
                      added={added}
                      onAdd={() => upsert(defaultItem(service))}
                      onRemove={() => remove(service.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal as="article" className="extras-card extras-card--accent" delay={90}>
            <h3>Ways to save</h3>
            <ul className="savings">
              {[...bundleDiscounts]
                .sort((a, b) => a.minServices - b.minServices)
                .map((rule) => (
                  <li key={rule.minServices}>
                    <strong>{rule.percent}% off</strong>
                    <span>when you book {rule.minServices}+ services in one visit</span>
                  </li>
                ))}
              <li>
                <strong>{launchOffer.code}</strong>
                <span>{launchOffer.text}</span>
              </li>
            </ul>
            <p className="extras-card__fine">
              The biggest discount applies (they don't stack). Minimum visit {formatMoney(booking.minimumTotal * 100)}.
              Free cancellation up to {booking.freeCancellationHours}h before. {business.payment}
            </p>
          </Reveal>
        </div>

        <Reveal as="h3" className="combos-title">
          Popular combos
        </Reveal>
        <div className="combo-grid">
          {combos.map((combo, index) => (
            <ComboCard key={combo.id} combo={combo} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
