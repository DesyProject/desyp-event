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

export default function Prize() {
  return (
    <section id="prize" className="section prize">
      <span className="section-label">PRIZE</span>
      <h2 className="prize__title">
        상품 <span className="text-blue">안내</span>
      </h2>
      <div className="prize__grid">
        {PRIZES.map((name) => (
          <div className="prize-card" key={name}>
            {name}
          </div>
        ))}
      </div>
      <p className="prize__note">당첨자에게 운영자가 직접 연락해 상품을 안내합니다.</p>
    </section>
  )
}
