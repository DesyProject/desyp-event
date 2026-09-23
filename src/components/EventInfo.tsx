const INFO_ITEMS = [
  { icon: '👥', title: '참여 대상', body: '만 14세 이상' },
  { icon: '🗄️', title: '수집 정보', body: 'Instagram ID' },
  {
    icon: '📄',
    title: '이용 목적',
    body: (
      <>
        · 경품행사 응모 확인
        <br />· 당첨자 선정 및 연락
      </>
    ),
  },
]

export default function EventInfo() {
  const retentionDays = import.meta.env.VITE_RETENTION_DAYS

  return (
    <section id="about" className="section about">
      <div className="about__left">
        <span className="section-label">EVENT INFO</span>
        <h2 className="about__title">
          이벤트 <span className="text-blue">안내</span>
        </h2>
        <p className="about__desc">
          지금, 당신의 일상이
          <br />
          특별한 경험으로 이어질 수 있습니다.
        </p>
        <hr className="about__divider" />
        <p className="about__tagline">
          DESYP
          <br />
          CONNECTS PEOPLE
          <br />
          IDEAS CREATE TOMORROW
        </p>
      </div>

      <div className="about__right">
        {INFO_ITEMS.map((item) => (
          <div className="info-card" key={item.title}>
            <span className="info-card__icon" aria-hidden="true">
              {item.icon}
            </span>
            <div>
              <h3 className="info-card__title">{item.title}</h3>
              <p className="info-card__body">{item.body}</p>
            </div>
          </div>
        ))}
        <div className="info-card">
          <span className="info-card__icon" aria-hidden="true">
            ⏱️
          </span>
          <div>
            <h3 className="info-card__title">보유 기간</h3>
            <p className="info-card__body">행사 종료 후 {retentionDays}일 이내 파기</p>
          </div>
        </div>
        <p className="about__handwritten">SMALL PARTICIPATION BIG CHANGES</p>
      </div>
    </section>
  )
}
