import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'desyp_win_tutorial_seen'

const STEPS = [
  {
    img: 'step1-ready',
    title: '미리 아이디 입력하고 체크',
    body: 'Instagram 아이디를 @ 없이 넣고 필수 항목 2개를 체크해 두세요. 로그인은 필요 없어요.',
  },
  {
    img: 'step2-press',
    title: '오후 2시, 응모하기 누르기',
    body: '누를 때마다 새 접수 번호가 나와요. 1초 뒤 다시 누를 수 있고 횟수 제한은 없어요. 많이 누를수록 당첨 기회가 늘어나요.',
  },
  {
    img: 'step3-receipts',
    title: '내 접수 번호 확인',
    body: '받은 번호는 아래에 쌓여요. 이 브라우저에만 저장되니 결과도 같은 브라우저에서 확인해 주세요.',
  },
  {
    img: 'step4-result',
    title: '2시 10분, 당첨 번호 발표',
    body: '끝나자마자 당첨 번호 18개가 떠요. 내 번호가 있으면 "당첨된 내 접수 번호"로 알려 드려요.',
  },
] as const

function firstVisit(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY)
  } catch {
    return false // 저장소가 막혔으면 매번 뜨지 않게 자동으로는 띄우지 않는다
  }
}

/** 대기 화면의 "당첨되는 법" 안내. 첫 방문에 한 번 자동으로 뜨고, 버튼으로 다시 연다 */
export default function WinTutorial() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  useEffect(() => {
    if (firstVisit() && !dialogRef.current?.open) open()
  }, [])

  return (
    <>
      <button type="button" className="tutorial-open" onClick={open}>
        🎁 당첨되는 법 보기 (예시 화면)
      </button>
      <dialog
        ref={dialogRef}
        className="onboarding tutorial"
        aria-labelledby="tutorial-title"
        onClose={() => {
          try {
            localStorage.setItem(STORAGE_KEY, '1')
          } catch {
            // 저장소가 막힌 브라우저
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className="onboarding__body">
          <button type="button" className="onboarding__close" aria-label="닫기" onClick={close}>
            ×
          </button>
          <h2 id="tutorial-title" className="onboarding__title">
            당첨되는 법, 4단계면 끝
          </h2>
          <ol className="onboarding__steps">
            {STEPS.map((s, i) => (
              <li key={s.img}>
                <span className="onboarding__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.body}</p>
                  <img
                    className="tutorial__img"
                    src={`/assets/tutorial/${s.img}.png`}
                    alt={`${s.title} 예시 화면`}
                    loading="lazy"
                  />
                </div>
              </li>
            ))}
          </ol>
          <ul className="tutorial__tips">
            <li>
              <b>첫 번째로 누른 사람은 무조건 5만원!</b> 나머지 17명의 당첨 방식은 당일 공개해요.
            </li>
            <li>같은 아이디로 여러 번 당첨될 수 있어요.</li>
            <li>당첨되면 입력한 Instagram 아이디로 DM을 드려요. DM 수신을 열어 두세요.</li>
          </ul>
          <p className="tutorial__note">사진 속 번호는 예시예요.</p>
          <button type="button" className="onboarding__cta" onClick={close}>
            알겠어요, 2시에 올게요
          </button>
        </div>
      </dialog>
    </>
  )
}
