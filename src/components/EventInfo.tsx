const INFO_ITEMS = [
  { icon: 'people', title: '참여 대상', body: '만 14세 이상 (네이버 로그인)' },
  {
    icon: 'database',
    title: '수집 정보',
    body: (
      <>
        · 이메일 (네이버 계정에서 제공)
        <br />· 휴대전화번호 (네이버 계정에서 제공)
        <br />· 추천인 이메일 (선택 입력)
      </>
    ),
  },
  {
    icon: 'document',
    title: '이용 목적',
    body: (
      <>
        · 이메일: 당첨 및 이벤트 안내 연락
        <br />· 휴대전화번호: 한 사람의 중복 참여 확인 (연락에는 일절 사용하지 않음)
        <br />· 추천인 이메일: 추천 참여 확인
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
            <img className="info-card__icon" src={`/assets/icon-${item.icon}.svg`} alt="" width={48} height={48} />
            <div>
              <h3 className="info-card__title">{item.title}</h3>
              <p className="info-card__body">{item.body}</p>
            </div>
          </div>
        ))}
        <div className="info-card">
          <img className="info-card__icon" src="/assets/icon-clock.svg" alt="" width={48} height={48} />
          <div>
            <h3 className="info-card__title">보유 기간</h3>
            <p className="info-card__body">이벤트 종료 후 {retentionDays}일 이내 파기</p>
          </div>
        </div>
        <p className="about__handwritten">SMALL PARTICIPATION BIG CHANGES</p>
      </div>
    </section>
  )
}
