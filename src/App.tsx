import EntryCard from './components/EntryCard'
import EventInfo from './components/EventInfo'
import Faq from './components/Faq'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Prize from './components/Prize'

export default function App() {
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

      <div className="about-decor">
        <img
          className="about-decor__character"
          src="/assets/character-3.png"
          alt="뒷모습으로 서 있는 De_sy_P 캐릭터"
          width={220}
          height={280}
          loading="lazy"
        />
      </div>

      <EventInfo />
      <Prize />
      <Faq />
      <Footer />
    </>
  )
}
