import { useEffect, useState } from 'react'

const NOTICE_KEY = 'desyp_notice_prize_change_closed'

function readNoticeClosed(): boolean {
  try {
    return localStorage.getItem(NOTICE_KEY) === '1'
  } catch {
    return false // 저장소가 막힌 브라우저는 매번 보여 준다
  }
}

const NAV_LINKS = [
  { href: '#hero', label: 'EVENT' },
  { href: '#about', label: 'ABOUT' },
  { href: '#prize', label: 'PRIZE' },
  { href: '#faq', label: 'FAQ' },
]

/** 화면 위쪽 1/3 지점을 지난 마지막 섹션을 현재 섹션으로 본다. 페이지 맨 아래면 마지막 섹션 */
function useActiveSection(): string {
  const [active, setActive] = useState(NAV_LINKS[0].href)

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight / 3
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let current = NAV_LINKS[0].href
      for (const { href } of NAV_LINKS) {
        const el = document.querySelector(href)
        if (el && el.getBoundingClientRect().top <= line) current = href
      }
      setActive(atBottom ? NAV_LINKS[NAV_LINKS.length - 1].href : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return active
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeHref = useActiveSection()
  const [noticeClosed, setNoticeClosed] = useState(readNoticeClosed)

  function closeNotice() {
    setNoticeClosed(true)
    try {
      localStorage.setItem(NOTICE_KEY, '1')
    } catch {
      // 저장하지 못해도 이번 방문 동안은 닫힌다
    }
  }

  return (
    <header className="header">
      <div className="header__inner">
        <a href="#hero" className="header__brand" onClick={() => setMenuOpen(false)}>
          <img className="header__logo" src="/assets/logo.svg" alt="" width={40} height={40} />
          De_sy_P
        </a>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`header__nav-link ${link.href === activeHref ? 'header__nav-link--active' : ''}`}
              aria-current={link.href === activeHref ? 'location' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#entry-card" className="header__cta">
          JOIN EVENT →
        </a>

        <button
          type="button"
          className="header__hamburger"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* 스크롤해도 보이도록 고정 헤더 안에 둔다. ponytail: 공지 한 건이라 하드코딩, 이벤트 후 삭제 */}
      {!noticeClosed && (
        <div className="notice-bar" role="status">
          <p>
            <strong>상품 구성 변경</strong>{' '}
            <span className="notice-bar__from">당첨 번호 상품이 5만원 1명·3만원 2명에서 </span>
            <strong>5만원 2명·3만원 1명</strong>으로 바뀌었어요. <a href="#prize">자세히</a>
          </p>
          <button type="button" className="notice-bar__close" aria-label="공지 닫기" onClick={closeNotice}>
            ×
          </button>
        </div>
      )}
    </header>
  )
}
