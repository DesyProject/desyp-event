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

const INSTAGRAM_KEY = 'desyp_instagram'
const RECEIPTS_KEY = 'desyp_receipts'
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/
const RETENTION_DAYS = import.meta.env.VITE_RETENTION_DAYS

function normalizeInstagramId(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

/** 이번 세션 동안 유지한다. 저장소가 막힌 브라우저에서는 메모리에만 둔다 */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장소가 막힌 브라우저
  }
}

export default function MainEventCard({ event }: { event: EventState }) {
  const { phase, clockOffset, randomNumber, refresh } = event
  const startCountdown = useCountdown(event.startAt, clockOffset)
  const endCountdown = useCountdown(event.endAt, clockOffset)
  const instagramFieldId = useId()
  const instagramHelpId = useId()
  const ageId = useId()

  const [instagramId, setInstagramId] = useState(() => load(INSTAGRAM_KEY, ''))
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [receipts, setReceipts] = useState<number[]>(() => load(RECEIPTS_KEY, []))
  const [armed, setArmed] = useState(false)
  const [sending, setSending] = useState(false)
  const [popupNumber, setPopupNumber] = useState<number | null>(null)
  const [popupOn, setPopupOn] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  // 상태 업데이트보다 빠른 연속 클릭·키보드 반복 입력을 막는다
  const lockRef = useRef(false)

  useEffect(() => {
    if (phase !== 'open') return
    const id = window.setTimeout(() => setArmed(true), Math.random() * ARM_JITTER_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const idValid = INSTAGRAM_PATTERN.test(instagramId)
  const canSubmit = phase === 'open' && armed && idValid && ageConfirmed && !sending && !popupOn

  function handleInstagramChange(value: string) {
    const next = normalizeInstagramId(value)
    setInstagramId(next)
    save(INSTAGRAM_KEY, next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || lockRef.current) return
    lockRef.current = true
    setSending(true)
    const result = await submitEntry(instagramId)
    setSending(false)

    if (!result.ok) {
      if (result.status === 410) refresh() // 시계가 어긋났을 수 있어 단계를 다시 확인한다
      lockRef.current = false
      setModalMessage(result.message)
      return
    }

    setReceipts((prev) => {
      const next = [...prev, result.receiptNumber]
      save(RECEIPTS_KEY, next)
      return next
    })
    setPopupNumber(result.receiptNumber)
    setPopupOn(true)
    window.setTimeout(() => {
      setPopupOn(false)
      lockRef.current = false
    }, POPUP_MS)
  }

  const recent = receipts.slice(-RECENT_COUNT).reverse()

  return (
    <div className="entry-card" id="entry-card">
      <div className="entry-card__corner entry-card__corner--tl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--tr" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--bl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--br" aria-hidden="true" />

      {phase === 'closed' ? (
        <div className="entry-card__status">
          <p className="entry-card__label">EVENT CLOSED</p>
          <p className="entry-card__status-title">응모가 마감되었습니다</p>
          <p className="entry-card__status-body">참여해 주셔서 감사합니다!</p>

          <div className="event-random">
            <span>랜덤 당첨 번호</span>
            {randomNumber !== null ? <strong>#{randomNumber}</strong> : <span>곧 발표합니다. 잠시 후 새로고침해 주세요.</span>}
          </div>

          {receipts.length > 0 && (
            <div className="event-receipts event-receipts--all">
              <span>내 접수 번호 {receipts.length}개</span>
              <ul>
                {receipts.map((n, i) => (
                  <li key={i}>#{n}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="entry-card__kakao-note">
            당첨자에게는 입력한 Instagram 아이디로 DM을 드립니다. 추천왕은 네이버 이메일로 연락드려요.
          </p>
        </div>
      ) : (
        <>
          <p className="entry-card__label">{phase === 'open' ? 'EVENT ENDS IN' : 'EVENT STARTS IN'}</p>
          <Countdown countdown={phase === 'open' ? endCountdown : startCountdown} />

          <form className="entry-form" onSubmit={handleSubmit} noValidate>
            <h2 className="entry-form__title">{phase === 'open' ? '지금 응모하세요!' : '10월 31일 오후 2시 오픈'}</h2>

            {phase === 'waiting' && (
              <div className="event-guide">
                <p className="event-guide__title">참여 방법</p>
                <ol>
                  <li>Instagram 아이디를 입력하고 만 14세 이상인지 확인해 주세요. 미리 해 둘 수 있어요.</li>
                  <li>오후 2시부터 10분 동안 "응모하기"를 누를 때마다 새 접수 번호를 받아요. 횟수 제한은 없어요.</li>
                </ol>
                <p className="event-guide__title">당첨 방식</p>
                <ul>
                  <li>선착순: 접수 번호 1번</li>
                  <li>랜덤 번호: 미리 정해 둔 번호. 응모가 그보다 적으면 마지막 번호. 종료 직후 발표</li>
                  <li>추천왕: 사전등록 추천 점수 1위</li>
                </ul>
                <p className="event-guide__note">만 14세 이상이라면 사전등록 없이도 누구나 응모할 수 있어요.</p>
              </div>
            )}

            <label htmlFor={instagramFieldId} className="entry-form__label">
              Instagram 아이디
            </label>
            <input
              id={instagramFieldId}
              type="text"
              className="entry-form__text entry-form__text--plain"
              value={instagramId}
              onChange={(e) => handleInstagramChange(e.target.value)}
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
              <p>수집 목적: 당첨 연락 · 보관: 이벤트 종료 후 {RETENTION_DAYS}일 이내 파기</p>
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

            <div className="event-submit">
              <button type="submit" className="entry-form__submit event-submit__button" disabled={!canSubmit}>
                {phase === 'waiting' ? '오후 2시에 열려요' : sending ? '접수 중...' : '응모하기'}
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
                <span>이번 세션 응모 {receipts.length}회</span>
                <ul>
                  {recent.map((n, i) => (
                    <li key={i}>#{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
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
