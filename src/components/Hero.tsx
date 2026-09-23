// 제목·문구는 배경 포스터 이미지에 그려져 있어 화면에는 숨기고, 화면 낭독기와 검색엔진용으로만 남긴다
export default function Hero() {
  return (
    <div className="sr-only">
      <p>SPECIAL EVENT</p>
      <h1>지금, 참여하고 특별한 선물을 받으세요!</h1>
      <p>작은 참여가 더 큰 즐거움을 만듭니다!</p>
    </div>
  )
}
