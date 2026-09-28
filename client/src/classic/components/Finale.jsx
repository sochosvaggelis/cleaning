import { formatMoney } from '@shared/pricing.js';
import { Reveal } from '../../components/Reveal.jsx';

export function Finale() {
  return (
    <section className="finale" data-chapter="6" id="results">
      <div className="finale__inner">
        <Reveal as="p" className="eyebrow finale__eyebrow">
          The whole property, cleaned
        </Reveal>
        <Reveal as="h2" className="finale__title" delay={80}>
          Same home.
          <br />
          <span className="text-gradient">Brand-new look.</span>
        </Reveal>
        <Reveal as="p" className="finale__lead" delay={160}>
          That's what one visit does. We're two friends with a pressure washer and a lot of pride in our work, and we
          don't pack up until it's right.
        </Reveal>
        <Reveal className="finale__stats" delay={240}>
          <div>
            <strong>100%</strong>
            <span>Happiness guarantee. Not right? We come back for free.</span>
          </div>
          <div>
            <strong>{formatMoney(0)}</strong>
            <span>Hidden fees. The price you see is the price you pay.</span>
          </div>
          <div>
            <strong>~60s</strong>
            <span>To book online, at a time that suits you.</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
