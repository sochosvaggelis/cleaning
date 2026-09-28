import { About } from '../components/About.jsx';
import { BookingSection } from '../components/BookingSection.jsx';
import { Faq } from '../components/Faq.jsx';
import { Footer } from '../components/Footer.jsx';
import { Hero } from '../components/Hero.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';
import { Nav, TopBar } from '../components/Nav.jsx';
import { Pricing } from '../components/Pricing.jsx';
import { Services } from '../components/Services.jsx';

/** The realistic design: a normal business layout with a first-person 3D cleaning hero. */
export function ProHome() {
  return (
    <>
      <TopBar />
      <Nav />
      <main>
        <Hero />
        <Services />
        <Pricing />
        <About />
        <HowItWorks />
        <BookingSection />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
