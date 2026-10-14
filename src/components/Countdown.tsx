import { pad2, type Countdown as CountdownValue } from '../hooks/useCountdown'

/** 사전등록 카드와 메인 이벤트 카드가 같이 쓰는 카운트다운 숫자판 */
export default function Countdown({ countdown }: { countdown: CountdownValue }) {
  return (
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
  )
}
