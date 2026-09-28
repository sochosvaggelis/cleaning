import { BookingSection } from '../components/BookingSection.jsx';
import { Faq } from '../components/Faq.jsx';
import { Footer } from '../components/Footer.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';
import { Pricing } from '../components/Pricing.jsx';
import { ClassicHero } from './components/ClassicHero.jsx';
import { ClassicNav } from './components/ClassicNav.jsx';
import { Finale } from './components/Finale.jsx';
import { StoryChapter } from './components/StoryChapter.jsx';
import { stories } from './content/stories.js';
import { SceneLayer } from './three/SceneLayer.jsx';

/**
 * The first design: a playful 3D island story. A fixed canvas sits behind the page and the
 * camera flies around the property, cleaning one surface per chapter as you scroll.
 */
export function ClassicHome() {
  return (
    <>
      <SceneLayer />
      <ClassicNav />
      <main>
        <ClassicHero />
        {stories.map((story) => (
          <StoryChapter key={story.chapter} story={story} />
        ))}
        <Finale />
        <div className="sheet" id="sheet">
          <Pricing />
          <HowItWorks />
          <BookingSection />
          <Faq />
          <Footer />
        </div>
      </main>
    </>
  );
}
