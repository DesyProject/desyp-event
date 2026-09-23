export default function Hero() {
  return (
    <>
      <div className="hero__content">
        <span className="hero__badge">SPECIAL EVENT</span>
        <h1 className="hero__headline">
          <span className="hero__headline-white">지금, 참여하고</span>
          <span className="hero__headline-blue">특별한 선물을</span>
          <span className="hero__headline-blue">받으세요!</span>
        </h1>
        <p className="hero__subcopy">
          작은 참여가
          <br />더 큰 즐거움을 만듭니다!
        </p>
      </div>

      {/* 간판은 .hero 섹션 기준으로 배치돼야 제목과 겹치지 않는다 */}
      <div className="hero__sign hero__sign--left" aria-hidden="true">
        <span>PLAY</span>
        <span>LEARN</span>
        <span>CREATE</span>
        <span>TOGETHER</span>
      </div>
      <div className="hero__sign hero__sign--right" aria-hidden="true">
        <span>GOOD</span>
        <span>IDEAS</span>
        <span>BETTER</span>
        <span>TOMORROW</span>
      </div>
    </>
  )
}
