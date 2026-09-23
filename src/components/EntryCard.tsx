import { useEffect, useId, useState } from 'react'
import {
  fetchMe,
  LOGIN_ERROR_MESSAGES,
  startNaverLogin,
  submitPreRegistration,
  type Me,
} from '../api/preRegistration'
import { pad2, useCountdown } from '../hooks/useCountdown'
import ResultModal from './ResultModal'

/** 백엔드가 로그인 뒤 돌려보낸 ?login=error&reason=... 를 읽고 주소에서 지운다 */
function consumeLoginError(): string | null {
  const params = new URLSearchParams(window.location.search)
  if (params.get('login') !== 'error') return null
  const reason = params.get('reason') ?? 'default'
  params.delete('login')
  params.delete('reason')
  const query = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  return LOGIN_ERROR_MESSAGES[reason] ?? LOGIN_ERROR_MESSAGES.default
}

export default function EntryCard() {
  const countdown = useCountdown(import.meta.env.VITE_REGISTRATION_END_AT)
  const ageId = useId()
  const privacyId = useId()
  const marketingId = useId()

  // undefined: 로그인 여부 확인 중, null: 로그인 전
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(() => consumeLoginError())

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
  }, [])

  const closed = countdown.isEnded
  const canSubmit = !!me && !me.registered && ageConfirmed && agreePrivacy && !busy && !closed

  async function handleLogin() {
    setBusy(true)
    await startNaverLogin() // 실제 모드는 여기서 네이버로 페이지가 이동한다
    setMe(await fetchMe())
    setBusy(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    const result = await submitPreRegistration({ ageConfirmed, agreePrivacy, agreeMarketing })
    setBusy(false)
    if (result.kind === 'success' || result.kind === 'already') {
      setMe((prev) => prev && { ...prev, registered: true })
    } else if (result.kind === 'unauthorized') {
      setMe(null)
    }
    setModalMessage(result.message)
  }

  return (
    <div className="entry-card" id="entry-card">
      <div className="entry-card__corner entry-card__corner--tl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--tr" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--bl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--br" aria-hidden="true" />

      <p className="entry-card__label">PRE-REGISTRATION ENDS IN</p>

      <div className="countdown">
        {/* 마지막 날(0일)에는 일 칸을 숨긴다 */}
        {countdown.days > 0 && (
          <div className="countdown__unit countdown__unit--days">
            <span className="countdown__value">
              {countdown.days}
              <span className="countdown__suffix">일</span>
            </span>
            <span className="countdown__caption">DAYS</span>
          </div>
        )}
        <div className="countdown__unit">
          <span className="countdown__value">{pad2(countdown.hours)}</span>
          <span className="countdown__caption">HOURS</span>
        </div>
        <span className="countdown__colon">:</span>
        <div className="countdown__unit">
          <span className="countdown__value">{pad2(countdown.minutes)}</span>
          <span className="countdown__caption">MINUTES</span>
        </div>
        <span className="countdown__colon">:</span>
        <div className="countdown__unit">
          <span className="countdown__value">{pad2(countdown.seconds)}</span>
          <span className="countdown__caption">SECONDS</span>
        </div>
      </div>

      <div className="entry-form">
        {!closed && !me?.registered && <h2 className="entry-form__title">이벤트 사전등록</h2>}
        {closed ? (
          <p className="entry-card__status">사전등록이 마감되었습니다</p>
        ) : me?.registered ? (
          <div className="entry-card__status">
            <p className="entry-card__status-title">사전등록 완료!</p>
            <p className="entry-card__status-body">오픈 소식을 가장 먼저 알려드릴게요.</p>
          </div>
        ) : me ? (
          <form onSubmit={handleSubmit} noValidate>
            <p className="entry-form__account">
              <span className="entry-form__account-label">네이버 계정 연결됨</span>
              {me.phoneMasked}
            </p>

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
                id={privacyId}
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
              <label htmlFor={privacyId}>
                [필수] 개인정보 수집·이용에 동의합니다. <a href="#about">자세히</a>
              </label>
            </div>
            <div className="entry-form__checkbox-row">
              <input
                id={marketingId}
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
              />
              <label htmlFor={marketingId}>[선택] 오픈 소식 알림 수신에 동의합니다.</label>
            </div>

            <button type="submit" className="entry-form__submit" disabled={!canSubmit}>
              {busy ? '등록 중…' : '사전등록하기 →'}
            </button>
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
            <p className="entry-form__help">네이버 로그인 후 사전등록을 진행할 수 있어요.</p>
          </>
        )}

        <p className="entry-card__caption">TOGETHER FOR A BRIGHTER TOMORROW</p>
      </div>

      <ResultModal
        open={modalMessage !== null}
        message={modalMessage ?? ''}
        onClose={() => setModalMessage(null)}
      />
    </div>
  )
}
