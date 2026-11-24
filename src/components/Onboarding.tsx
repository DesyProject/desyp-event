import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'desyp_onboarded'

/**
 * 처음 방문한 사람에게만 띄운다. 네이버 로그인을 마치고 돌아온 경우(#entry-card, ?login=)는 제외한다.
 * 저장소를 쓸 수 없으면(시크릿 모드 등) 매번 뜨지 않도록 아예 띄우지 않는다.
 */
function isFirstVisit(): boolean {
  if (window.location.hash === '#entry-card' || new URLSearchParams(window.location.search).has('login')) return false
  try {
    return !localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

// 사전등록 카드가 마운트되며 ?login=·#entry-card를 주소에서 지우므로, 렌더 전인 모듈 로드 시점에 판단한다
const SHOULD_SHOW = isFirstVisit()
const FROM_FRIEND = new URLSearchParams(window.location.search).has('ref')

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // 저장소가 막힌 브라우저. isFirstVisit도 false라 다시 뜨지 않는다
  }
}

/**
 * 사전등록 기간의 첫 방문자 안내. 네이티브 <dialog>가 포커스 가두기·Escape 닫기·포커스 복귀를 맡는다.
 * 결과 모달과 달리 바깥 클릭으로도 닫힌다.
 */
export default function Onboarding() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open || !SHOULD_SHOW) return
    dialog.showModal()
    ctaRef.current?.focus() // showModal은 첫 버튼(닫기)에 포커스를 준다. 주요 행동으로 옮긴다
  }, [])

  const close = () => dialogRef.current?.close()
  const goToEntry = () => {
    close()
    document.getElementById('entry-card')?.scrollIntoView()
  }

  return (
    <dialog
      ref={dialogRef}
      className="onboarding"
      aria-labelledby="onboarding-title"
      onClose={markSeen}
      onClick={(e) => {
        if (e.target === e.currentTarget) close() // 안쪽 여백이 없어 dialog 자체 클릭 = 바깥(backdrop) 클릭
      }}
    >
      <div className="onboarding__body">
        <button type="button" className="onboarding__close" aria-label="닫기" onClick={close}>
          ×
        </button>
        <h2 id="onboarding-title" className="onboarding__title">
          De_sy_P 이벤트, 이렇게 참여해요
        </h2>
        <ol className="onboarding__steps">
          <li>
            <span className="onboarding__num" aria-hidden="true">1</span>
            <div>
              <strong>30초 사전등록</strong>
              <p>네이버로 로그인하고 동의만 체크하면 끝이에요.</p>
            </div>
          </li>
          <li>
            <span className="onboarding__num" aria-hidden="true">2</span>
            <div>
              {FROM_FRIEND ? (
                <>
                  <strong>친구 추천 코드가 입력돼 있어요</strong>
                  <p>지금 등록하면 나도 친구도 추천 점수 +1점! 추천왕 1위 3만원 · 2위 1만원</p>
                </>
              ) : (
                <>
                  <strong>내 추천 코드 공유</strong>
                  <p>친구가 내 코드로 등록하면 나도 친구도 +1점! 추천왕 1위 3만원 · 2위 1만원</p>
                </>
              )}
            </div>
          </li>
          <li>
            <span className="onboarding__num" aria-hidden="true">3</span>
            <div>
              <strong>11월 29일(일) 오후 2시, 단 10분</strong>
              <p>첫 번째 응모자는 5만원! 사전등록하면 시작 1시간 전에 메일로 알려 드려요.</p>
            </div>
          </li>
        </ol>
        <button type="button" ref={ctaRef} className="onboarding__cta" onClick={goToEntry}>
          사전등록하러 가기
        </button>
        <button type="button" className="onboarding__skip" onClick={close}>
          둘러볼게요
        </button>
      </div>
    </dialog>
  )
}
