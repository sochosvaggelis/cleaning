import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { business } from '@shared/business.js';
import { Icon } from './Icon.jsx';

const HeroScene = lazy(() => import('../three/HeroScene.jsx'));

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('3D hero disabled:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Full-width hero. The section is taller than the screen and its content stays pinned,
 * so scrolling through it drives the 3D cleaning animation before the page moves on.
 */
export function Hero() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const meterRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const { launchOffer } = business;

  // Stop rendering 3D frames once the hero is scrolled out of view.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero__sticky" ref={stickyRef}>
        <div className="hero__media" aria-hidden="true">
          <SceneBoundary>
            <Suspense fallback={null}>
              <HeroScene sectionRef={sectionRef} stickyRef={stickyRef} meterRef={meterRef} paused={!visible} />
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="hero__scrim" aria-hidden="true" />

        <div className="container hero__content">
          <a className="hero__offer" href="#prices">
            <span className="hero__offer-tag">New</span>
            {launchOffer.text} with code <strong>{launchOffer.code}</strong>
          </a>
          <h1 className="hero__title">Make your home look new again.</h1>
          <p className="hero__lead">
            Driveways, patios, decks, siding, fences and bins, pressure-washed by two local friends who take pride
            in every job. Upfront prices and easy online booking.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary btn--lg" href="#book">
              Book online <Icon name="arrowRight" size={18} />
            </a>
            <a className="btn btn--light btn--lg" href="#prices">
              See prices
            </a>
          </div>
          <ul className="hero__trust">
            <li>
              <Icon name="check" size={17} /> Upfront prices
            </li>
            <li>
              <Icon name="check" size={17} /> Pay after the job
            </li>
            <li>
              <Icon name="check" size={17} /> Eco-friendly soaps
            </li>
          </ul>
        </div>

        <div className="hero__meter" ref={meterRef} data-state="cleaning" aria-hidden="true">
          <span className="hero__meter-text hero__meter-text--cleaning">
            <Icon name="chevronDown" size={16} /> Scroll to keep cleaning
          </span>
          <span className="hero__meter-text hero__meter-text--done">
            <Icon name="sparkle" size={16} /> Spotless. That's the job.
          </span>
          <span className="hero__meter-bar">
            <span />
          </span>
        </div>
      </div>
    </section>
  );
}
