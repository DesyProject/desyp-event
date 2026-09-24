import { useEffect, useId, useState } from 'react'
import {
  fetchMe,
  fetchReferralScore,
  LOGIN_ERROR_MESSAGES,
  startNaverLogin,
  submitPreRegistration,
  type Me,
  type ReferralScore,
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

const REF_PARAM = 'ref'
const REF_STORAGE_KEY = 'desyp_ref'

/**
 * 공유 링크(?ref=코드)로 들어오면 코드를 기억해 둔다.
 * 네이버 로그인을 다녀오면 주소의 ?ref가 사라지므로 sessionStorage에도 남긴다.
 */
function readSharedReferralCode(): string {
  const fromUrl = new URLSearchParams(window.location.search).get(REF_PARAM)?.trim() ?? ''
  try {
    if (fromUrl) sessionStorage.setItem(REF_STORAGE_KEY, fromUrl)
    return fromUrl || sessionStorage.getItem(REF_STORAGE_KEY) || ''
  } catch {
    return fromUrl // 저장소가 막힌 브라우저
  }
}

function shareUrl(code: string): string {
  return `${window.location.origin}/?${REF_PARAM}=${encodeURIComponent(code)}`
}

/** "자세히"를 누르면 개인정보 안내를 펼친 뒤 그 위치로 이동한다 */
function openPrivacy() {
  const el = document.getElementById('privacy') as HTMLDetailsElement | null
  if (el) el.open = true
}

export default function EntryCard() {
  const countdown = useCountdown(import.meta.env.VITE_REGISTRATION_END_AT)
  const ageId = useId()
  const privacyId = useId()
  const marketingId = useId()
  const referralId = useId()

  // undefined: 로그인 여부 확인 중, null: 로그인 전
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [referrer, setReferrer] = useState(readSharedReferralCode)
  const [referralScore, setReferralScore] = useState<ReferralScore | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [busy, setBusy] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(() => consumeLoginError())

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
  }, [])

  useEffect(() => {
    if (!me?.registered) return
    fetchReferralScore()
      .then(setReferralScore)
      .catch(() => setReferralScore(null))
  }, [me?.registered])

  const closed = countdown.isEnded
  const enteredReferralCode = referrer.trim()
  const canSubmit =
    !!me &&
    !me.registered &&
    ageConfirmed &&
    agreePrivacy &&
    agreeMarketing &&
    !busy &&
    !closed

  async function copyText(text: string, what: 'code' | 'link') {
    const label = what === 'code' ? '추천 코드' : '링크'
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // 복사가 막힌 브라우저: 직접 복사하도록 안내한다
      setModalMessage(`복사하지 못했어요. 아래 ${label}를 길게 눌러 직접 복사해주세요.\n${text}`)
    }
  }

  /** 폰은 공유 시트(카톡·인스타 등)를 열고, 지원하지 않는 브라우저는 링크를 복사한다 */
  async function shareReferral(code: string) {
    const url = shareUrl(code)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'De_sy_P 사전등록', text: '같이 사전등록하고 선물 받자! 내 추천 코드가 자동으로 입력돼요.', url })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // 사용자가 공유 창을 닫음
      }
    }
    await copyText(url, 'link')
  }

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
    const result = await submitPreRegistration({
      ageConfirmed,
      agreePrivacy,
      agreeMarketing,
      referralCode: enteredReferralCode || undefined,
    })
    setBusy(false)
    if (result.kind === 'success' || result.kind === 'already') {
      try {
        sessionStorage.removeItem(REF_STORAGE_KEY)
      } catch {
        // 저장소가 막혀 있으면 지울 것도 없다
      }
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
            <p className="entry-card__status-body">당첨 안내는 이벤트에 참여한 이메일로 보내드립니다.</p>
            {referralScore && (
              <div className="entry-card__referral">
                <span>내 추천 코드</span>
                <code>{referralScore.referralCode}</code>
                <span>현재 추천 점수 {referralScore.totalScore}점</span>
                <div className="entry-card__referral-actions">
                  <button
                    type="button"
                    className="entry-card__share"
                    onClick={() => shareReferral(referralScore.referralCode)}
                  >
                    {copied === 'link' ? '링크 복사됨!' : '친구에게 공유하기'}
                  </button>
                  <button type="button" onClick={() => copyText(referralScore.referralCode, 'code')}>
                    {copied === 'code' ? '복사됨!' : '코드 복사'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : me ? (
          <form onSubmit={handleSubmit} noValidate>
            <p className="entry-form__account">
              <span className="entry-form__account-label">네이버 계정 연결됨</span>
              {me.emailMasked}
            </p>

            <label htmlFor={referralId} className="entry-form__label">
              추천 코드 <span className="entry-form__optional">(선택)</span>
              <span className="entry-form__perk">입력하면 나도 추천 점수를 받아요!</span>
            </label>
            <input
              id={referralId}
              type="text"
              className="entry-form__text"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              placeholder="친구가 공유한 추천 코드"
              autoComplete="off"
              maxLength={64}
            />

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
                [필수] 개인정보 수집·이용에 동의합니다. <a href="#privacy" onClick={openPrivacy}>자세히</a>
              </label>
            </div>
            <div className="entry-form__checkbox-row">
              <input
                id={marketingId}
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
              />
              <label htmlFor={marketingId}>[필수] 오픈 소식 알림 수신에 동의합니다.</label>
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
