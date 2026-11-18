import EntryCard from './components/EntryCard'
import EventInfo from './components/EventInfo'
import Faq from './components/Faq'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import MainEventCard from './components/MainEventCard'
import Prize from './components/Prize'
import { useEventPhase } from './hooks/useEventPhase'
import { useWheelSectionScroll } from './hooks/useWheelSectionScroll'

export default function App() {
  useWheelSectionScroll('.hero, .about, .prize, .faq', '.faq')
  const event = useEventPhase()

  return (
    <>
      <Header />

      {/* ponytail: 공지 한 건이라 하드코딩. 이벤트 후 삭제 */}
      <p className="notice-bar" role="status">
        <strong>상품 구성 변경</strong> 당첨 번호 상품이 5만원 1명·3만원 2명에서{' '}
        <strong>5만원 2명·3만원 1명</strong>으로 바뀌었어요. <a href="#prize">자세히</a>
      </p>

      <section id="hero" className="hero">
        <Hero />
        {/* 사전등록 기간에는 기존 사전등록 카드를 그대로 보여 준다 */}
        {event.phase === 'registration' ? <EntryCard /> : <MainEventCard event={event} />}

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
