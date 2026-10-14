import { useEffect, useState } from 'react'
import { EVENT_END_AT, EVENT_START_AT, fetchEventStatus, initialClockOffset } from '../api/mainEvent'

export type EventPhase = 'registration' | 'waiting' | 'open' | 'closed'

export interface EventState {
  phase: EventPhase
  startAt: string
  endAt: string
  /** 서버 시계 - 클라이언트 시계(ms). 카운트다운과 단계 계산에 더한다 */
  clockOffset: number
  randomNumber: number | null
  /** 0~3초 뒤 상태를 다시 불러온다 (410을 받았을 때 등) */
  refresh: () => void
}

/** 몰리는 시점에 모두가 같은 순간 상태를 부르지 않도록 둔다 */
const STATUS_JITTER_MS = 3000
/** setTimeout 한계(약 24.8일)를 넘지 않도록 하루마다 다시 계산한다 */
const MAX_TIMER_MS = 86_400_000

const REGISTRATION_END_MS = Date.parse(import.meta.env.VITE_REGISTRATION_END_AT)

function phaseAt(now: number, startMs: number, endMs: number): EventPhase {
  if (now < REGISTRATION_END_MS) return 'registration'
  if (now < startMs) return 'waiting'
  if (now < endMs) return 'open'
  return 'closed'
}

/**
 * 사전등록 → 대기 → 응모 중 → 종료 단계를 서버 시계 기준으로 계산한다.
 * 상태 폴링은 하지 않는다. 페이지 진입과 단계가 바뀌는 순간에만 무작위 지연 후 다시 불러온다.
 */
export function useEventPhase(): EventState {
  const [startAt, setStartAt] = useState(EVENT_START_AT)
  const [endAt, setEndAt] = useState(EVENT_END_AT)
  const [clockOffset, setClockOffset] = useState(initialClockOffset)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // 단계 계산 기준 시각(클라이언트 시계). 단계 경계와 상태 응답 때만 새로 찍는다
  const [now, setNow] = useState(() => Date.now())

  const startMs = Date.parse(startAt)
  const endMs = Date.parse(endAt)
  const phase = phaseAt(now + clockOffset, startMs, endMs)

  // 다음 단계 경계에 맞춰 다시 그린다
  useEffect(() => {
    const serverNow = Date.now() + clockOffset
    const next = [REGISTRATION_END_MS, startMs, endMs].find((t) => t > serverNow)
    if (next === undefined) return
    const id = window.setTimeout(() => setNow(Date.now()), Math.min(next - serverNow + 50, MAX_TIMER_MS))
    return () => window.clearTimeout(id)
  }, [clockOffset, startMs, endMs, now])

  // 진입·단계 전환·refresh 때 0~3초 뒤 상태를 불러와 시계 차이를 보정한다
  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(async () => {
      const sentAt = Date.now()
      try {
        const status = await fetchEventStatus()
        if (cancelled) return
        const receivedAt = Date.now()
        // 응답 왕복의 가운데를 서버가 serverTime을 찍은 순간으로 본다
        setClockOffset(Date.parse(status.serverTime) - (sentAt + receivedAt) / 2)
        setNow(receivedAt)
        setStartAt(status.startAt)
        setEndAt(status.endAt)
        setRandomNumber(status.randomNumber)
      } catch {
        // 상태를 못 불러오면 지금 시계와 고정 시각으로 계속 보여 준다
      }
    }, Math.random() * STATUS_JITTER_MS)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [phase, refreshKey])

  return { phase, startAt, endAt, clockOffset, randomNumber, refresh: () => setRefreshKey((k) => k + 1) }
}
