import { addonServices, coreServices } from '@shared/catalog.js';
import { formatMoney, startingPriceCents } from '@shared/pricing.js';
import { Icon } from '../components/Icon.jsx';
import { defaultItem, useBooking } from './BookingContext.jsx';

function Stepper({ unit, qty, onChange }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(qty - 1)} disabled={qty <= unit.min} aria-label={`Fewer ${unit.plural}`}>
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">
        {qty} {qty === 1 ? unit.label : unit.plural}
      </output>
      <button type="button" onClick={() => onChange(qty + 1)} disabled={qty >= unit.max} aria-label={`More ${unit.plural}`}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

function ServiceOption({ service, item, disabled, onToggle, onChange }) {
  const checked = Boolean(item);
  const from = service.flat
    ? formatMoney(service.flat.price * 100)
    : `from ${formatMoney(startingPriceCents(service))}${service.unit ? ` / ${service.unit.label}` : ''}`;

  return (
    <div className={`svc ${checked ? 'svc--on' : ''} ${disabled ? 'svc--disabled' : ''}`}>
      <label className="svc__head">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(service, checked)} />
        <span className="svc__box" aria-hidden="true">
          <Icon name="check" size={14} strokeWidth={3} />
        </span>
        <Icon name={service.icon} size={22} className="svc__icon" />
        <span className="svc__name">
          {service.name}
          <small>{from}</small>
        </span>
      </label>

      {checked && service.tiers && (
        <fieldset className="svc__tiers">
          <legend className="visually-hidden">{service.name} size</legend>
          {service.tiers.map((tier) => (
            <label key={tier.id} className={`chip ${item.tierId === tier.id ? 'chip--on' : ''}`}>
              <input
                type="radio"
                name={`tier-${service.id}`}
                checked={item.tierId === tier.id}
                onChange={() => onChange({ serviceId: service.id, tierId: tier.id })}
              />
              <span className="chip__label">{tier.label}</span>
              <span className="chip__detail">{tier.detail}</span>
              <span className="chip__price">{formatMoney(tier.price * 100)}</span>
            </label>
          ))}
        </fieldset>
      )}

      {checked && service.unit && (
        <div className="svc__qty">
          <Stepper
            unit={service.unit}
            qty={item.qty ?? service.unit.default}
            onChange={(qty) => onChange({ serviceId: service.id, qty })}
          />
          <span className="svc__qty-price">
            {formatMoney(service.unit.price * 100)} each · {service.blurb}
          </span>
        </div>
      )}
    </div>
  );
}

export function StepServices() {
  const { selection, upsert, remove } = useBooking();
  const byId = new Map(selection.map((i) => [i.serviceId, i]));
  const hasCore = selection.some((i) => coreServices.some((s) => s.id === i.serviceId));

  const toggle = (service, checked) => (checked ? remove(service.id) : upsert(defaultItem(service)));

  return (
    <div className="step">
      <h3 className="step__title">What needs cleaning?</h3>
      <p className="step__hint">Pick as many as you like. 2 services save 10%, 3 or more save 15%.</p>
      <div className="svc-list">
        {coreServices.map((service) => (
          <ServiceOption
            key={service.id}
            service={service}
            item={byId.get(service.id)}
            onToggle={toggle}
            onChange={upsert}
          />
        ))}
      </div>

      <h4 className="step__subtitle">Add-ons</h4>
      {!hasCore && <p className="step__hint">Add-ons go with a main service. Pick one above first.</p>}
      <div className="svc-list svc-list--addons">
        {addonServices.map((service) => (
          <ServiceOption
            key={service.id}
            service={service}
            item={byId.get(service.id)}
            disabled={!hasCore && !byId.has(service.id)}
            onToggle={toggle}
            onChange={upsert}
          />
        ))}
      </div>
    </div>
  );
}
