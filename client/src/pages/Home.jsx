import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { business } from '@shared/business.js';
import { BookingProvider } from '../booking/BookingContext.jsx';
import { ClassicHome } from '../classic/ClassicHome.jsx';
import classicCss from '../classic/classic.css?inline';
import { DesignSwitch } from '../components/DesignSwitch.jsx';
import { FloatingCart } from '../components/FloatingCart.jsx';
import realisticCss from '../styles/home.css?inline';
import { ProHome } from './ProHome.jsx';

/** The design visitors see on the live site. */
const DEFAULT_DESIGN = 'realistic';
const DESIGN_IDS = ['realistic', 'classic'];
const STORAGE_KEY = 'cleanup.design';

const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: business.name,
  description: business.tagline,
  telephone: business.phone,
  email: business.email,
  areaServed: business.serviceArea,
}).replace(/</g, '\\u003c');

/** While developing, reopen the design picked last time; the live site always starts on the default. */
function savedDesign() {
  if (!import.meta.env.DEV) return DEFAULT_DESIGN;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return DESIGN_IDS.includes(saved) ? saved : DEFAULT_DESIGN;
  } catch {
    return DEFAULT_DESIGN;
  }
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkDesign = DESIGN_IDS.includes(searchParams.get('design')) ? searchParams.get('design') : null;
  const [design, setDesign] = useState(() => linkDesign ?? savedDesign());
  // Visitors never see the switch. It shows while developing, or on the live site for links
  // with ?design=realistic or ?design=classic (handy for showing both designs to someone).
  const showSwitch = import.meta.env.DEV || linkDesign !== null;

  // Arriving from another page with a #hash: jump there once the sections exist.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  const switchDesign = (next) => {
    if (next === design) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: the switch still works for this visit */
    }
    if (linkDesign !== null) {
      // Keep the address in sync so a reload or a shared link shows the same design.
      setSearchParams(
        (params) => {
          params.set('design', next);
          return params;
        },
        { replace: true },
      );
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setDesign(next);
  };

  return (
    <BookingProvider>
      <title>{`${business.name} · Pressure washing for driveways, patios, decks & homes`}</title>
      {/* Both designs use the same class names, so only the active design's stylesheet is loaded. */}
      <style>{design === 'classic' ? classicCss : realisticCss}</style>
      {design === 'classic' ? <ClassicHome key="classic" /> : <ProHome key="realistic" />}
      <FloatingCart key={`cart-${design}`} />
      {showSwitch && <DesignSwitch design={design} onChange={switchDesign} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
    </BookingProvider>
  );
}
