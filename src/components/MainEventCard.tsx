import { useEffect, useId, useRef, useState } from 'react'
import { submitEntry } from '../api/mainEvent'
import { useCountdown } from '../hooks/useCountdown'
import type { EventState } from '../hooks/useEventPhase'
import Countdown from './Countdown'
import ResultModal from './ResultModal'

/** 접수 번호 팝업이 버튼을 가리는 시간 = 연속 응모 간격 */
const POPUP_MS = 1000
/** 14:00 정각에 모두가 동시에 누르지 않도록 버튼을 0~1초 무작위로 늦게 연다 */
const ARM_JITTER_MS = 1000
/** 응모 중 카드에 보여 줄 최근 접수 번호 개수 */
const RECENT_COUNT = 5
/** 종료 화면에 보여 줄 최근 접수 번호 개수 */
const RECENT_LIMIT = 10

// 아이디와 체크 상태는 처음 한 번만 입력하면 연속 응모·새로고침 중에도 이번 세션 동안 유지된다
const INSTAGRAM_KEY = 'desyp_instagram'
const AGE_KEY = 'desyp_entry_age'
const CONSENT_KEY = 'desyp_entry_consent'
/** 내 접수 번호는 서버에서 조회하지 않고 이 브라우저가 받은 번호만 보여 준다. 인앱 브라우저를 닫았다가 발표를 확인할 수 있게 localStorage에 둔다 */
const RECEIPTS_KEY = 'desyp_receipts'
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/
const RETENTION_DAYS = import.meta.env.VITE_RETENTION_DAYS

function normalizeInstagramId(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

/** 저장소가 막힌 브라우저에서는 메모리에만 둔다. persist면 탭을 닫아도 남는 localStorage를 쓴다 */
function load<T>(key: string, fallback: T, persist = false): T {
  try {
    const raw = (persist ? localStorage : sessionStorage).getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown, persist = false) {
  try {
    ;(persist ? localStorage : sessionStorage).setItem(key, JSON.stringify(value))
  } catch {
    // 저장소가 막힌 브라우저
  }
}

/** 값이 바뀔 때마다 sessionStorage에도 남기는 state */
function useSessionState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback))
  const set = (next: T) => {
    setValue(next)
    save(key, next)
  }
  return [value, set] as const
}

export default function MainEventCard({ event }: { event: EventState }) {
  const { phase, clockOffset, winningNumbers, refresh } = event
  const startCountdown = useCountdown(event.startAt, clockOffset)
  const endCountdown = useCountdown(event.endAt, clockOffset)
  const instagramFieldId = useId()
  const instagramHelpId = useId()
  const ageId = useId()
  const consentId = useId()

  const [instagramId, setInstagramId] = useSessionState(INSTAGRAM_KEY, '')
  const [ageConfirmed, setAgeConfirmed] = useSessionState(AGE_KEY, false)
  const [agreeInstagram, setAgreeInstagram] = useSessionState(CONSENT_KEY, false)
  const [showConsent, setShowConsent] = useState(false)
  /** 받은 순서대로 쌓인 내 접수 번호 */
  const [receipts, setReceipts] = useState<number[]>(() => load(RECEIPTS_KEY, [], true))
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [popupNumber, setPopupNumber] = useState<number | null>(null)
  const [popupOn, setPopupOn] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  // 상태 업데이트보다 빠른 연속 클릭·키보드 반복 입력을 막는다
  const lockRef = useRef(false)

  const closed = phase === 'closed'

  useEffect(() => {
    if (phase !== 'open') return
    const id = window.setTimeout(() => setArmed(true), Math.random() * ARM_JITTER_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const idValid = INSTAGRAM_PATTERN.test(instagramId)
  const canSubmit = phase === 'open' && armed && idValid && ageConfirmed && agreeInstagram && !busy && !popupOn

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || lockRef.current) return
    lockRef.current = true
    setBusy(true)
    const result = await submitEntry(instagramId)
    setBusy(false)

    if (!result.ok) {
      if (result.status === 410) refresh() // 시계가 어긋났을 수 있어 단계를 다시 확인한다
      lockRef.current = false
      setModalMessage(result.message)
      return
    }

    // 입력값은 그대로 두고 받은 번호만 쌓는다
    setReceipts((prev) => {
      const next = [...prev, result.receiptNumber]
      save(RECEIPTS_KEY, next, true)
      return next
    })
    setPopupNumber(result.receiptNumber)
    setPopupOn(true)
    window.setTimeout(() => {
      setPopupOn(false)
      lockRef.current = false
    }, POPUP_MS)
  }

  const recent = receipts.slice(-RECENT_LIMIT).reverse()
  const myWins = winningNumbers === null ? [] : receipts.filter((n) => winningNumbers.includes(n))

  return (
    <div className="entry-card" id="entry-card">
      <div className="entry-card__corner entry-card__corner--tl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--tr" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--bl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--br" aria-hidden="true" />

      {closed ? (
        <div className="entry-card__status">
          <p className="entry-card__label">EVENT CLOSED</p>
          <p className="entry-card__status-title">응모가 마감되었습니다</p>
          <p className="entry-card__status-body">참여해 주셔서 감사합니다!</p>

          <div className="event-random">
            <span>당첨 번호</span>
            {winningNumbers !== null ? (
              <strong>{winningNumbers.map((n) => `#${n}`).join(' ')}</strong>
            ) : (
              <span>곧 발표합니다. 잠시 후 새로고침해 주세요.</span>
            )}
          </div>

          {receipts.length > 0 && (
            <div className="event-receipts">
              <span>
                {myWins.length > 0
                  ? `당첨된 내 접수 번호 ${myWins.map((n) => `#${n}`).join(' ')}`
                  : `내 응모 ${receipts.length}회 · 최근 접수 번호`}
              </span>
              <ul>
                {recent.map((n) => (
                  <li key={n}>#{n}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="entry-card__kakao-note event-closed-note">
            당첨자에게는 입력한 Instagram 아이디로 DM을 드립니다. 추천왕은 네이버 이메일로 연락드려요. 접수 번호는
            이 브라우저에만 저장돼요.
          </p>
        </div>
      ) : (
        <>
          <p className="entry-card__label">{phase === 'open' ? 'EVENT ENDS IN' : 'EVENT STARTS IN'}</p>
          <Countdown countdown={phase === 'open' ? endCountdown : startCountdown} />

          <div className="entry-form">
            <h2 className="entry-form__title">{phase === 'open' ? '지금 응모하세요!' : '11월 29일 오후 2시 오픈'}</h2>

            {phase === 'waiting' && (
              <div className="event-guide">
                <p className="event-guide__title">참여 방법</p>
                <ol>
                  <li>Instagram 아이디와 필수 항목을 미리 입력해 두세요. 로그인은 필요 없어요.</li>
                  <li>오후 2시부터 10분 동안 "응모하기"를 누를 때마다 새 접수 번호를 받아요. 횟수 제한은 없어요.</li>
                </ol>
                <p className="event-guide__title">당첨 방식</p>
                <ul>
                  <li>당첨 번호 18개: 5만원 1명·3만원 2명은 이벤트 전에 정해 둔 접수 번호, 1만원 15명은 종료 후 전체 접수 번호에서 무작위 추첨. 종료 직후 발표. 같은 아이디는 한 번만 당첨</li>
                  <li>추천왕: 사전등록 추천 점수 1위 3만원, 2위 1만원</li>
                </ul>
                <p className="event-guide__note">만 14세 이상이라면 사전등록하지 않았어도 응모할 수 있어요.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor={instagramFieldId} className="entry-form__label">
                Instagram 아이디
              </label>
              <input
                id={instagramFieldId}
                type="text"
                className="entry-form__text entry-form__text--plain"
                value={instagramId}
                onChange={(e) => setInstagramId(normalizeInstagramId(e.target.value))}
                placeholder="@ 없이 입력 (예: desyp.event)"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={instagramId !== '' && !idValid}
                aria-describedby={instagramHelpId}
              />
              <div id={instagramHelpId} className="event-help">
                {instagramId !== '' && !idValid && (
                  <p className="event-help__error">영문·숫자·마침표(.)·밑줄(_)만 30자 이내로 입력해주세요.</p>
                )}
                <p>입력한 아이디로 당첨 DM을 보냅니다. DM 수신이 가능하도록 설정해 주세요.</p>
              </div>

              <div className="entry-form__checkbox-row">
                <input
                  id={ageId}
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                />
                <label htmlFor={ageId}>[필수] 본인은 만 14세 이상입니다.</label>
              </div>
              <div className="entry-form__checkbox-row">
                <input
                  id={consentId}
                  type="checkbox"
                  checked={agreeInstagram}
                  onChange={(e) => setAgreeInstagram(e.target.checked)}
                />
                <label htmlFor={consentId}>
                  [필수] 당첨 연락을 위한 Instagram 아이디 수집·이용에 동의합니다.
                  <button
                    type="button"
                    className="event-consent__toggle"
                    aria-expanded={showConsent}
                    onClick={() => setShowConsent((v) => !v)}
                  >
                    자세히
                  </button>
                </label>
              </div>
              {showConsent && (
                <dl className="event-consent">
                  <dt>수집 항목</dt>
                  <dd>Instagram 아이디</dd>
                  <dt>이용 목적</dt>
                  <dd>이벤트 당일 당첨자 DM 연락</dd>
                  <dt>보유 기간</dt>
                  <dd>이벤트 종료 후 {RETENTION_DAYS}일 이내 파기</dd>
                  <dt>동의 거부</dt>
                  <dd>동의하지 않을 수 있으며, 이 경우 응모할 수 없습니다.</dd>
                </dl>
              )}

              <div className="event-submit">
                <button type="submit" className="entry-form__submit event-submit__button" disabled={!canSubmit}>
                  {phase === 'waiting' ? '오후 2시에 열려요' : busy ? '접수 중...' : '응모하기'}
                </button>
                {/* 떠 있는 동안 아래 버튼 클릭을 막는다. 내려간 뒤에도 마지막 번호를 남겨 두어 사라지는 동안 보인다 */}
                <div className={`event-popup${popupOn ? ' event-popup--show' : ''}`} role="status">
                  {popupNumber !== null && (
                    <>
                      <span className="event-popup__label">접수 번호</span>
                      <strong className="event-popup__number">#{popupNumber}</strong>
                    </>
                  )}
                </div>
              </div>

              {phase === 'open' && receipts.length > 0 && (
                <div className="event-receipts">
                  <span>내 응모 {receipts.length}회</span>
                  <ul>
                    {recent.slice(0, RECENT_COUNT).map((n) => (
                      <li key={n}>#{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </>
      )}

      <p className="entry-card__caption">TOGETHER FOR A BRIGHTER TOMORROW</p>

      <ResultModal
        open={modalMessage !== null}
        message={modalMessage ?? ''}
        onClose={() => setModalMessage(null)}
      />
    </div>
  )
}
