const PRIZE_ITEMS = [
  { icon: 'clock', title: '선착순 1명', body: '이벤트 오픈 순간 가장 먼저 클릭한 1명', prize: '50,000원 기프티콘' },
  { icon: 'document', title: '랜덤 번호 1명', body: '참여자 중 무작위로 뽑힌 번호 1명', prize: '50,000원 기프티콘' },
  { icon: 'people', title: '추천왕 1명', body: '추천을 가장 많이 받은 1명', prize: '30,000원 상당 상품' },
]

const NOTICES = [
  '입력한 Instagram 아이디가 존재하지 않으면 당첨이 취소되고 다음 순번에게 넘어갑니다.',
  '추천 점수가 같은 사람이 여러 명이면, 그중 1명을 무작위 추첨으로 선정합니다.',
]

export default function EventInfo() {
  const retentionDays = import.meta.env.VITE_RETENTION_DAYS

  return (
    <section id="about" className="section about">
      <div className="about__left">
        <span className="section-label">ABOUT EVENT</span>
        <h2 className="about__title">
          이벤트 <span className="text-blue">소개</span>
        </h2>
        <p className="about__desc">
          De_sy_P는 대학생들이 함께 만드는
          <br />
          대규모 트래픽 프로젝트입니다.
        </p>
        <p className="about__desc about__desc--sub">
          Instagram 아이디를 입력하고, 이벤트가 열리는 시간에 버튼을 클릭해주세요.
          <br />
          수많은 클릭을 우리 서버가 버텨낼 수 있을지 함께 확인해요!
        </p>
      </div>

      <div className="about__right">
        {PRIZE_ITEMS.map((item) => (
          <div className="info-card" key={item.title}>
            <img className="info-card__icon" src={`/assets/icon-${item.icon}.svg`} alt="" width={48} height={48} />
            <div className="info-card__text">
              <h3 className="info-card__title">{item.title}</h3>
              <p className="info-card__body">{item.body}</p>
            </div>
            <span className="info-card__prize">{item.prize}</span>
          </div>
        ))}

        <div className="notice">
          <h3 className="notice__title">유의 사항</h3>
          <ul className="notice__list">
            {NOTICES.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>

        {/* 사전등록 동의 항목의 "자세히" 링크가 여기를 연다 */}
        <details className="privacy" id="privacy">
          <summary>개인정보 수집·이용 안내</summary>
          <dl>
            <dt>수집 정보</dt>
            <dd>이메일, 휴대전화번호 (네이버 계정에서 제공), 추천인 이메일 (선택 입력)</dd>
            <dt>이용 목적</dt>
            <dd>
              이메일은 당첨 및 이벤트 안내 연락에 씁니다. 휴대전화번호는 한 사람의 중복 참여 확인에만 쓰고
              연락에는 일절 사용하지 않습니다. 추천인 이메일은 추천 참여 확인에 씁니다.
            </dd>
            <dt>보유 기간</dt>
            <dd>이벤트 종료 후 {retentionDays}일 이내 파기</dd>
          </dl>
        </details>
      </div>
    </section>
  )
}
