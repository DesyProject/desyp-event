import { useState } from 'react'

const NAV_LINKS = [
  { href: '#hero', label: 'EVENT' },
  { href: '#about', label: 'ABOUT' },
  { href: '#prize', label: 'PRIZE' },
  { href: '#faq', label: 'FAQ' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

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
              className={`header__nav-link ${link.href === '#hero' ? 'header__nav-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#entry-card" className="header__cta">
          PLAY TOGETHER →
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
