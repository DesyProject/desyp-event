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
        <img
          className="hero__character hero__character--main"
          src="/assets/character-1.png"
          alt="점프하며 웃고 있는 De_sy_P 캐릭터"
          width={420}
          height={520}
        />
        <img
          className="hero__character hero__character--side"
          src="/assets/character-2.png"
          alt="주먹을 들어올린 De_sy_P 캐릭터"
          width={260}
          height={340}
        />
        <img
          className="hero__gift"
          src="/assets/gift-box.png"
          alt="물음표가 그려진 선물 상자"
          width={220}
          height={220}
        />

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
        <div className="about-decor__sign" aria-hidden="true">
          <span>SAME</span>
          <span>PEOPLE</span>
          <span>BIGGER</span>
          <span>POSSIBILITIES</span>
        </div>
      </div>

      <EventInfo />
      <Prize />
      <Faq />
      <Footer />
    </>
  )
}
