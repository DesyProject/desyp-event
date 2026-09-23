import { useEffect, useState } from 'react'

export interface Countdown {
  hours: number
  minutes: number
  seconds: number
  isEnded: boolean
}

function diffToCountdown(diffMs: number): Countdown {
  if (diffMs <= 0) return { hours: 0, minutes: 0, seconds: 0, isEnded: true }
  const totalSeconds = Math.floor(diffMs / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600), // 24시간 이상이어도 누적값 그대로
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isEnded: false,
  }
}

/** endAt: ISO 8601 (KST 오프셋 포함) */
export function useCountdown(endAt: string): Countdown {
  const endMs = new Date(endAt).getTime()
  const [countdown, setCountdown] = useState<Countdown>(() =>
    diffToCountdown(endMs - Date.now()),
  )

  useEffect(() => {
    const tick = () => setCountdown(diffToCountdown(endMs - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endMs])

  return countdown
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}
