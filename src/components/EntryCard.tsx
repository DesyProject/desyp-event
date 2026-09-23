import { useId, useMemo, useState } from 'react'
import { submitEntry } from '../api/entry'
import { pad2, useCountdown } from '../hooks/useCountdown'
import { isValidInstagramId, normalizeInstagramId } from '../utils/instagram'
import ResultModal from './ResultModal'

export default function EntryCard() {
  const countdown = useCountdown(import.meta.env.VITE_EVENT_END_AT)
  const inputId = useId()
  const checkboxId = useId()

  const [rawId, setRawId] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  const normalizedId = useMemo(() => normalizeInstagramId(rawId), [rawId])
  const idValid = normalizedId.length > 0 && isValidInstagramId(normalizedId)
  const showIdHint = touched && rawId.length > 0 && !idValid
  const canSubmit = idValid && ageConfirmed && !submitting && !countdown.isEnded

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    setSubmitting(true)
    const result = await submitEntry({ instagramId: normalizedId, ageConfirmed })
    setSubmitting(false)
    setModalMessage(result.message)
  }

  return (
    <div className="entry-card" id="entry-card">
      <div className="entry-card__corner entry-card__corner--tl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--tr" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--bl" aria-hidden="true" />
      <div className="entry-card__corner entry-card__corner--br" aria-hidden="true" />

      <p className="entry-card__label">EVENT ENDS IN</p>

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

      {countdown.isEnded && <p className="entry-card__ended">이벤트가 종료되었습니다</p>}

      <form className="entry-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor={inputId} className="entry-form__label">
          Instagram ID
        </label>
        <div className="entry-form__input-wrap">
          <span className="entry-form__at" aria-hidden="true">
            @
          </span>
          <input
            id={inputId}
            type="text"
            className="entry-form__input"
            placeholder="예) desyp_official"
            value={rawId}
            disabled={countdown.isEnded}
            onChange={(e) => setRawId(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="off"
            aria-invalid={showIdHint}
            aria-describedby={showIdHint ? `${inputId}-hint` : undefined}
          />
        </div>
        {showIdHint && (
          <p id={`${inputId}-hint`} className="entry-form__hint">
            영문 소문자, 숫자, '.', '_'만 사용해 1~30자로 입력해주세요.
          </p>
        )}

        <div className="entry-form__checkbox-row">
          <input
            id={checkboxId}
            type="checkbox"
            checked={ageConfirmed}
            disabled={countdown.isEnded}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
          />
          <label htmlFor={checkboxId}>본인은 만 14세 이상입니다.</label>
        </div>

        <button type="submit" className="entry-form__submit" disabled={!canSubmit}>
          {submitting ? '응모 중…' : '응모하기 →'}
        </button>

        <p className="entry-card__caption">TOGETHER FOR A BRIGHTER TOMORROW</p>
      </form>

      <ResultModal
        open={modalMessage !== null}
        message={modalMessage ?? ''}
        onClose={() => setModalMessage(null)}
      />
    </div>
  )
}
