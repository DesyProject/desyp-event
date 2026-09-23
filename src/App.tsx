import EntryCard from './components/EntryCard'
import EventInfo from './components/EventInfo'
import Faq from './components/Faq'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Prize from './components/Prize'
import { useWheelSectionScroll } from './hooks/useWheelSectionScroll'

export default function App() {
  useWheelSectionScroll('.hero, .about, .prize, .faq', '.faq')

  return (
    <>
      <Header />

      <section id="hero" className="hero">
        <Hero />
        <EntryCard />

        <a href="#about" className="hero__scroll">
          <span>SCROLL</span>
          <span className="hero__scroll-arrow" aria-hidden="true">
            ⌄
          </span>
        </a>
      </section>

      <EventInfo />
      <Prize />
      <Faq />
      <Footer />
    </>
  )
}
