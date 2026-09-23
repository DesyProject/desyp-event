import { useEffect, useRef, useState } from 'react'

const PRIZES = [
  '올리브영',
  '메가MGC커피',
  '스타벅스',
  '다이소',
  '문화상품권',
  '투썸플레이스',
  '배달의민족',
  '이마트·신세계상품권',
  '쿠팡',
]

const AUTOPLAY_MS = 3000
const VISIBLE_RANGE = 2 // 가운데 기준 좌우로 보이는 카드 수
const SWIPE_PX = 40

/** 가운데(current)에서 i번 카드까지의 거리. 양끝이 이어지도록 가장 가까운 방향을 고른다 */
function circularOffset(i: number, current: number, n: number): number {
  let d = (((i - current) % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Prize() {
  const n = PRIZES.length
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const pointerX = useRef<number | null>(null)

  const go = (step: number) => setCurrent((c) => (c + step + n) % n)

  // 자동 넘김. 마우스를 올리거나 포커스가 있으면 멈추고, 동작 줄이기 설정이면 켜지 않는다.
  // current가 바뀔 때마다 타이머를 새로 걸어서, 직접 넘긴 직후 바로 또 넘어가지 않는다
  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const id = window.setTimeout(() => setCurrent((c) => (c + 1) % n), AUTOPLAY_MS)
    return () => window.clearTimeout(id)
  }, [current, paused, n])

  return (
    <section id="prize" className="section prize">
      <span className="section-label">PRIZE</span>
      <h2 className="prize__title">
        상품 <span className="text-blue">안내</span>
      </h2>

      <div
        className="prize-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="상품 목록"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="prize-carousel__stage"
          aria-live={paused ? 'polite' : 'off'}
          onPointerDown={(e) => (pointerX.current = e.clientX)}
          onPointerUp={(e) => {
            if (pointerX.current === null) return
            const dx = e.clientX - pointerX.current
            pointerX.current = null
            if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1)
          }}
        >
          {PRIZES.map((name, i) => {
            const offset = circularOffset(i, current, n)
            const hidden = Math.abs(offset) > VISIBLE_RANGE
            return (
              <div
                key={name}
                className={`gift-card ${offset === 0 ? 'gift-card--active' : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${n}`}
                aria-hidden={offset !== 0}
                style={
                  {
                    '--offset': offset,
                    '--abs': Math.abs(offset),
                    opacity: hidden ? 0 : 1,
                    zIndex: 10 - Math.abs(offset),
                    pointerEvents: hidden ? 'none' : undefined,
                  } as React.CSSProperties
                }
                onClick={() => offset !== 0 && go(offset)}
              >
                <span className="gift-card__label">GIFTICON</span>
                <span className="gift-card__name">{name}</span>
                <span className="gift-card__footer">
                  <span>De_sy_P PRIZE</span>
                  <span className="gift-card__chip" aria-hidden="true" />
                </span>
              </div>
            )
          })}
        </div>

        <div className="prize-carousel__controls">
          <div className="prize-carousel__dots">
            {PRIZES.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`prize-carousel__dot ${i === current ? 'prize-carousel__dot--active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`${name} 보기`}
                aria-current={i === current}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="prize__note">당첨자에게 운영자가 직접 연락해 상품을 안내합니다.</p>
    </section>
  )
}
