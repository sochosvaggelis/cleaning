import { useEffect, useState } from 'react';
import { business } from '@shared/business.js';
import { Icon } from '../../components/Icon.jsx';
import { Logo } from '../../components/Logo.jsx';

export function ClassicNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo" aria-label={`${business.name}, back to top`}>
          <Logo />
        </a>
        <nav className="nav__links" aria-label="Sections">
          <a href="#services">Services</a>
          <a href="#prices">Prices</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="nav__phone" href={business.phoneHref}>
          <Icon name="phone" size={16} />
          <span>{business.phone}</span>
        </a>
        <a className="btn btn--primary btn--sm" href="#book">
          Book now
        </a>
      </div>
    </header>
  );
}
