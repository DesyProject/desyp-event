/**
 * 메인 이벤트(응모) API. 계약은 README의 "메인 이벤트 API" 참고.
 * VITE_API_BASE_URL이 비어 있으면 목업으로 동작한다.
 */

export interface EventStatus {
  phase: 'BEFORE' | 'OPEN' | 'CLOSED'
  startAt: string
  endAt: string
  serverTime: string
  /** 이벤트 종료 직후 발표. 그 전에는 null */
  randomNumber: number | null
}

type EntryBody = { message?: string | null; receiptNumber?: number }

export type EntryResult = { ok: true; receiptNumber: number } | { ok: false; status: number; message: string }

/** 이벤트 시간은 고정이다. 서버 응답이 오기 전에도 화면을 그리기 위한 기본값 */
export const EVENT_START_AT = '2026-10-31T14:00:00+09:00'
export const EVENT_END_AT = '2026-10-31T14:10:00+09:00'

const MESSAGES: Record<number, string> = {
  400: '입력한 정보를 다시 확인해주세요.',
  410: '지금은 응모 시간이 아닙니다.',
  429: '요청이 너무 많아요. 잠시 후 다시 응모해주세요.',
  503: '접속자가 많아 접수하지 못했어요. 잠시 후 다시 응모해주세요.',
}
const DEFAULT_MESSAGE = '응모를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'

/** 429·503·네트워크 오류는 같은 requestId로 이만큼 더 시도한다 */
const MAX_RETRIES = 3
const RETRY_BASE_MS = 400

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const isMock = !API_BASE_URL

// ===== 목업 (페이지를 새로고침하면 초기화된다) =====
// ?mockPhase=registration|waiting|open|closed 로 서버 시계를 그 단계 직전·직후로 옮긴다. 목업에서만 동작한다
const MOCK_PHASE_TIME: Record<string, number> = {
  registration: Date.parse(import.meta.env.VITE_REGISTRATION_END_AT) - 30_000,
  waiting: Date.parse(EVENT_START_AT) - 30_000,
  open: Date.parse(EVENT_START_AT) + 1_000,
  closed: Date.parse(EVENT_END_AT) + 1_000,
}
const mockPhaseTime = isMock ? MOCK_PHASE_TIME[new URLSearchParams(window.location.search).get('mockPhase') ?? ''] : undefined
/** 서버 시계 - 클라이언트 시계. 실제 모드는 첫 응답 전까지 0으로 본다 */
export const initialClockOffset = mockPhaseTime === undefined ? 0 : mockPhaseTime - Date.now()
/** 미리 정해 둔 랜덤 당첨 번호 */
const MOCK_RANDOM_NUMBER = 7
const mock = { lastReceipt: 0, requests: new Map<string, number>() }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function mockStatus(): EventStatus {
  const now = Date.now() + initialClockOffset
  const phase = now < Date.parse(EVENT_START_AT) ? 'BEFORE' : now < Date.parse(EVENT_END_AT) ? 'OPEN' : 'CLOSED'
  // 응모 수가 정해 둔 번호에 못 미치면 마지막 접수 번호가 당첨
  const randomNumber = phase === 'CLOSED' && mock.lastReceipt > 0 ? Math.min(MOCK_RANDOM_NUMBER, mock.lastReceipt) : null
  return { phase, startAt: EVENT_START_AT, endAt: EVENT_END_AT, serverTime: new Date(now).toISOString(), randomNumber }
}

/** 실제 fetch와 같은 모양(status, body)으로 돌려줘 재시도 로직을 목업에서도 그대로 거친다 */
async function mockPostEntry(requestId: string, instagramId: string): Promise<{ status: number; body: EntryBody }> {
  // 목업 테스트용 아이디: error → 503, slow → 3초 지연, badrequest → 400, closed → 410
  await sleep(instagramId === 'slow' ? 3000 : 200 + Math.random() * 400)
  if (instagramId === 'error') return { status: 503, body: {} }
  if (instagramId === 'badrequest') return { status: 400, body: { message: 'Instagram 아이디 형식이 올바르지 않습니다.' } }
  if (instagramId === 'closed' || mockStatus().phase !== 'OPEN') return { status: 410, body: {} }
  const issued = mock.requests.get(requestId)
  if (issued) return { status: 200, body: { receiptNumber: issued } }
  mock.lastReceipt += 1
  mock.requests.set(requestId, mock.lastReceipt)
  return { status: 201, body: { receiptNumber: mock.lastReceipt } }
}

// ===== 공개 함수 =====

export async function fetchEventStatus(): Promise<EventStatus> {
  if (isMock) {
    await sleep(200)
    return mockStatus()
  }
  const res = await fetch(`${API_BASE_URL}/api/event/status`)
  if (!res.ok) throw new Error(`GET /api/event/status ${res.status}`)
  return res.json()
}

/** 응모 한 번. requestId는 호출마다 새로 만들고, 네트워크·429·503 재시도에서만 같은 값을 다시 보낸다 */
export async function submitEntry(instagramId: string): Promise<EntryResult> {
  const requestId = crypto.randomUUID()
  let status = 0
  let body: EntryBody = {}

  for (let attempt = 0; ; attempt++) {
    try {
      if (isMock) {
        ;({ status, body } = await mockPostEntry(requestId, instagramId))
      } else {
        const res = await fetch(`${API_BASE_URL}/api/event/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, instagramId, ageConfirmed: true }),
        })
        status = res.status
        try {
          body = await res.json()
        } catch {
          body = {} // 본문이 없어도 status 코드로 판단한다
        }
      }
    } catch {
      status = 0 // 네트워크 오류
    }

    if (status !== 0 && status !== 429 && status !== 503) break
    if (attempt >= MAX_RETRIES) break
    // 지수 백오프 + jitter: 0.4~0.8초, 0.8~1.2초, 1.6~2.0초
    await sleep(RETRY_BASE_MS * 2 ** attempt + Math.random() * RETRY_BASE_MS)
  }

  if ((status === 200 || status === 201) && typeof body.receiptNumber === 'number') {
    return { ok: true, receiptNumber: body.receiptNumber }
  }
  return { ok: false, status, message: body.message ?? MESSAGES[status] ?? DEFAULT_MESSAGE }
}
