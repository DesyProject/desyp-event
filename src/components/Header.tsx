import { useEffect, useState } from 'react'

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
          사전등록하기 →
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
    </header>
  )
}
