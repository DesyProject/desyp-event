const PRIZE_ITEMS = [
  {
    icon: 'document',
    title: '당첨 번호 18명',
    body: '3명 지정 · 15명 추첨',
    prizes: [
      { amount: '5만원', count: '1명' },
      { amount: '3만원', count: '2명' },
      { amount: '1만원', count: '15명' },
    ],
  },
  {
    icon: 'people',
    title: '추천왕 2명',
    body: '추천 점수 순위',
    prizes: [
      { amount: '3만원', count: '1위' },
      { amount: '1만원', count: '2위' },
    ],
  },
]

const NOTICES = [
  '네이버 로그인을 한 만 14세 이상이라면 사전등록하지 않았어도 응모할 수 있고, 응모 횟수에는 제한이 없습니다.',
  '5만원·3만원 당첨 번호 3개는 이벤트 전에 정해 두고, 1만원 당첨 번호 15개는 이벤트가 끝난 뒤 전체 접수 번호 중에서 무작위로 추첨합니다.',
  '당첨 번호는 이벤트가 끝난 직후 이 페이지에 발표합니다.',
  '응모할 때마다 새 접수 번호를 받아 많이 응모할수록 당첨 번호를 받을 기회가 늘어나지만, 같은 Instagram 아이디는 한 번만 당첨됩니다.',
  '입력한 Instagram 아이디가 존재하지 않으면 당첨이 취소되고, 그 자리는 전체 접수 번호에서 무작위로 다시 추첨합니다.',
  '추천 점수가 같은 사람이 여러 명이면 무작위 추첨으로 순위를 정합니다.',
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
            <ul className="info-card__prizes">
              {item.prizes.map((p) => (
                <li key={p.count}>
                  <span className="info-card__count">{p.count}</span>
                  <span className="info-card__prize">{p.amount}</span>
                </li>
              ))}
            </ul>
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
            <dd>네이버 계정 식별자, 이메일 / 메인 이벤트 응모 시 Instagram 아이디(당첨 DM 연락용)</dd>
            <dt>이용 목적</dt>
            <dd>중복 참여 확인, 이벤트 시작 안내 및 당첨 연락</dd>
            <dt>보유 기간</dt>
            <dd>이벤트 종료 후 {retentionDays}일 이내 파기</dd>
            <dt>동의 거부</dt>
            <dd>동의하지 않을 수 있으며, 이 경우 사전등록에 참여할 수 없습니다.</dd>
          </dl>
        </details>
      </div>
    </section>
  )
}
