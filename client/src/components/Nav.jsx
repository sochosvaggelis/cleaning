import { business } from '@shared/business.js';
import { openingHours } from '../lib/hours.js';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';

export function TopBar() {
  const hours = openingHours({ compact: true })
    .filter((row) => row.label !== 'Closed')
    .map((row) => `${row.days} ${row.label}`)
    .join(' · ');
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <span>
          <Icon name="mapPin" size={15} /> Serving {business.serviceArea.toLowerCase()}
        </span>
        <span className="topbar__right">
          <span className="topbar__hours">
            <Icon name="clock" size={15} /> {hours}
          </span>
          <a href={business.phoneHref}>
            <Icon name="phone" size={15} /> {business.phone}
          </a>
        </span>
      </div>
    </div>
  );
}

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <a href="#top" className="nav__logo" aria-label={`${business.name}, back to top`}>
          <Logo />
        </a>
        <nav className="nav__links" aria-label="Sections">
          <a href="#services">Services</a>
          <a href="#prices">Prices</a>
          <a href="#about">About us</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="nav__phone" href={business.phoneHref} aria-label={`Call ${business.phone}`}>
          <Icon name="phone" size={17} />
        </a>
        <a className="btn btn--primary btn--sm" href="#book">
          Book online
        </a>
      </div>
    </header>
  );
}
