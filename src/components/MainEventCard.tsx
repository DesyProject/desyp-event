import { useEffect, useId, useRef, useState } from 'react'
import { fetchMyEntries, submitEntry, type MyEntries } from '../api/mainEvent'
import { consumeLoginError, fetchMe, startNaverLogin, type Me } from '../api/preRegistration'
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
/** 서버가 돌려주는 최근 접수 번호 최대 개수 */
const RECENT_LIMIT = 10

// 네이버 로그인을 다녀오면 페이지가 새로 열리므로 입력값을 이번 세션 동안 남긴다
const INSTAGRAM_KEY = 'desyp_instagram'
const AGE_KEY = 'desyp_entry_age'
const CONSENT_KEY = 'desyp_entry_consent'
/** 서버 응답 전 임시 표시용. 서버 응답이 오면 덮어쓴다 */
const ENTRIES_KEY = 'desyp_entries'
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/
const RETENTION_DAYS = import.meta.env.VITE_RETENTION_DAYS

function normalizeInstagramId(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

/** 저장소가 막힌 브라우저에서는 메모리에만 둔다 */
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
  const { phase, clockOffset, randomNumber, refresh } = event
  const startCountdown = useCountdown(event.startAt, clockOffset)
  const endCountdown = useCountdown(event.endAt, clockOffset)
  const instagramFieldId = useId()
  const instagramHelpId = useId()
  const ageId = useId()
  const consentId = useId()

  // undefined: 로그인 여부 확인 중, null: 로그인 전
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [instagramId, setInstagramId] = useSessionState(INSTAGRAM_KEY, '')
  const [ageConfirmed, setAgeConfirmed] = useSessionState(AGE_KEY, false)
  const [agreeInstagram, setAgreeInstagram] = useSessionState(CONSENT_KEY, false)
  const [showConsent, setShowConsent] = useState(false)
  const [entries, setEntries] = useState<MyEntries | null>(() => load(ENTRIES_KEY, null))
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [popupNumber, setPopupNumber] = useState<number | null>(null)
  const [popupOn, setPopupOn] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(() => consumeLoginError())
  // 상태 업데이트보다 빠른 연속 클릭·키보드 반복 입력을 막는다
  const lockRef = useRef(false)

  const loggedIn = !!me
  const closed = phase === 'closed'

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
  }, [])

  // 서버 기준 응모 기록은 진입(로그인 확인)·로그인 직후·종료 화면 진입 때만 부른다
  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    fetchMyEntries()
      .then((mine) => {
        if (cancelled || !mine) return
        setEntries(mine)
        save(ENTRIES_KEY, mine)
      })
      .catch(() => {
        // 못 불러오면 임시 표시를 그대로 둔다
      })
    return () => {
      cancelled = true
    }
  }, [loggedIn, closed])

  useEffect(() => {
    if (phase !== 'open') return
    const id = window.setTimeout(() => setArmed(true), Math.random() * ARM_JITTER_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const idValid = INSTAGRAM_PATTERN.test(instagramId)
  const canSubmit = phase === 'open' && armed && loggedIn && idValid && ageConfirmed && agreeInstagram && !busy && !popupOn

  async function handleLogin() {
    setBusy(true)
    await startNaverLogin() // 실제 모드는 여기서 네이버로 페이지가 이동한다
    setMe(await fetchMe().catch(() => null))
    setBusy(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || lockRef.current) return
    lockRef.current = true
    setBusy(true)
    const result = await submitEntry(instagramId)
    setBusy(false)

    if (!result.ok) {
      if (result.status === 401) setMe(null) // 입력값은 그대로 두고 로그인 단계로 돌아간다
      if (result.status === 410) refresh() // 시계가 어긋났을 수 있어 단계를 다시 확인한다
      lockRef.current = false
      setModalMessage(result.message)
      return
    }

    // 응모마다 서버를 다시 부르지 않고 받은 번호로 직접 갱신한다
    setEntries((prev) => {
      const next = {
        count: (prev?.count ?? 0) + 1,
        recent: [result.receiptNumber, ...(prev?.recent ?? [])].slice(0, RECENT_LIMIT),
      }
      save(ENTRIES_KEY, next)
      return next
    })
    setPopupNumber(result.receiptNumber)
    setPopupOn(true)
    window.setTimeout(() => {
      setPopupOn(false)
      lockRef.current = false
    }, POPUP_MS)
  }

  const myEntries = loggedIn && entries && entries.count > 0 ? entries : null

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
            <span>랜덤 당첨 번호</span>
            {randomNumber !== null ? <strong>#{randomNumber}</strong> : <span>곧 발표합니다. 잠시 후 새로고침해 주세요.</span>}
          </div>

          {myEntries && (
            <div className="event-receipts">
              <span>내 응모 {myEntries.count}회 · 최근 접수 번호</span>
              <ul>
                {myEntries.recent.map((n) => (
                  <li key={n}>#{n}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="entry-card__kakao-note event-closed-note">
            당첨자에게는 입력한 Instagram 아이디로 DM을 드립니다. 추천왕은 네이버 이메일로 연락드려요.
          </p>
        </div>
      ) : (
        <>
          <p className="entry-card__label">{phase === 'open' ? 'EVENT ENDS IN' : 'EVENT STARTS IN'}</p>
          <Countdown countdown={phase === 'open' ? endCountdown : startCountdown} />

          <div className="entry-form">
            <h2 className="entry-form__title">{phase === 'open' ? '지금 응모하세요!' : '10월 31일 오후 2시 오픈'}</h2>

            {phase === 'waiting' && (
              <div className="event-guide">
                <p className="event-guide__title">참여 방법</p>
                <ol>
                  <li>네이버로 로그인하고 Instagram 아이디와 필수 항목을 미리 입력해 두세요.</li>
                  <li>오후 2시부터 10분 동안 "응모하기"를 누를 때마다 새 접수 번호를 받아요. 횟수 제한은 없어요.</li>
                </ol>
                <p className="event-guide__title">당첨 방식</p>
                <ul>
                  <li>선착순: 접수 번호 1번</li>
                  <li>랜덤 번호: 미리 정해 둔 번호. 응모가 그보다 적으면 마지막 번호. 종료 직후 발표</li>
                  <li>추천왕: 사전등록 추천 점수 1위</li>
                </ul>
                <p className="event-guide__note">네이버 로그인을 한 만 14세 이상이라면 사전등록하지 않았어도 응모할 수 있어요.</p>
              </div>
            )}

            {me ? (
              <form onSubmit={handleSubmit} noValidate>
                <p className="entry-form__account">
                  <span className="entry-form__account-label">네이버 계정 연결됨</span>
                  {me.emailMasked}
                </p>

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

                {phase === 'open' && myEntries && (
                  <div className="event-receipts">
                    <span>내 응모 {myEntries.count}회</span>
                    <ul>
                      {myEntries.recent.slice(0, RECENT_COUNT).map((n) => (
                        <li key={n}>#{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            ) : (
              <>
                <button
                  type="button"
                  className="naver-login"
                  onClick={handleLogin}
                  disabled={me === undefined || busy}
                >
                  <svg className="naver-login__logo" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill="currentColor" d="M13.56 10.7 6.17 0H0v20h6.44V9.3L13.83 20H20V0h-6.44z" />
                  </svg>
                  네이버로 로그인
                </button>
                <p className="entry-form__help">네이버 로그인 후 응모할 수 있어요. 사전등록하지 않았어도 괜찮아요.</p>
              </>
            )}
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
