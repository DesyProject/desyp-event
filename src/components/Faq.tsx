import { useState } from 'react'

const FAQ_ITEMS = [
  { q: '질문 1 (placeholder)', a: '답변 내용을 여기에 채워주세요.' },
  { q: '질문 2 (placeholder)', a: '답변 내용을 여기에 채워주세요.' },
  { q: '질문 3 (placeholder)', a: '답변 내용을 여기에 채워주세요.' },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="section faq">
      <span className="section-label">FAQ</span>
      <h2 className="faq__title">자주 묻는 질문</h2>

      <div className="faq__list">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i
          return (
            <div className="faq-item" key={item.q}>
              <button
                type="button"
                className="faq-item__question"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                {item.q}
                <span className="faq-item__chevron" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && <p className="faq-item__answer">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
