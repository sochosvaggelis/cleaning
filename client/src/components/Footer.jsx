import { Link } from 'react-router';
import { business } from '@shared/business.js';
import { openingHours } from '../lib/hours.js';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>{business.tagline}. Driveways, patios, decks, siding, fences and bins, done properly.</p>
          <a className="btn btn--primary" href="#book">
            Book a clean
          </a>
        </div>
        <div>
          <h4>Contact</h4>
          <ul className="footer__list">
            <li>
              <a href={business.phoneHref}>
                <Icon name="phone" size={16} /> {business.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${business.email}`}>
                <Icon name="mail" size={16} /> {business.email}
              </a>
            </li>
            <li>
              <span>
                <Icon name="mapPin" size={16} /> {business.serviceArea}
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4>Hours</h4>
          <ul className="footer__list footer__hours">
            {openingHours().map((row) => (
              <li key={row.days}>
                <span>{row.days}</span>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} {business.name}
        </span>
        <Link to="/admin">Team login</Link>
      </div>
    </footer>
  );
}
