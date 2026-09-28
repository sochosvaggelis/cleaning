import { Link } from 'react-router';
import { business } from '@shared/business.js';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';

/** Header for the secondary pages (booking status, admin, 404). */
export function SimpleHeader({ children }) {
  return (
    <header className="simple-header">
      <div className="container simple-header__inner">
        <Link to="/" className="simple-header__logo" aria-label={`${business.name} home`}>
          <Logo />
        </Link>
        <div className="simple-header__actions">
          {children ?? (
            <a className="simple-header__phone" href={business.phoneHref}>
              <Icon name="phone" size={16} />
              <span>{business.phone}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
