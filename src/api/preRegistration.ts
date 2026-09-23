/**
 * 사전등록 API. 네이버 로그인과 저장은 백엔드가 맡는다. 계약은 README의 "백엔드 API" 참고.
 * VITE_API_BASE_URL이 비어 있으면 목업으로 동작한다.
 */

export interface Me {
  /** 연락받을 네이버 이메일, 가운데를 가린 형태. 예) des***@naver.com */
  emailMasked: string
  registered: boolean
}

export interface PreRegistrationRequest {
  ageConfirmed: boolean
  agreePrivacy: boolean
  agreeMarketing: boolean
  /** 나를 추천한 사람이 사전등록에 쓴 이메일. 선택 */
  referrerEmail?: string
}

export interface SubmitResult {
  kind: SubmitKind
  message: string
}

export type SubmitKind =
  | 'success'
  | 'already'
  | 'invalid_referral'
  | 'closed'
  | 'unauthorized'
  | 'rate_limited'
  | 'error'

const MESSAGES: Record<SubmitKind, string> = {
  success: '사전등록이 완료되었습니다. 오픈 소식을 가장 먼저 알려드릴게요!',
  already: '이미 사전등록했습니다. 한 사람당 한 번만 참여할 수 있어요.',
  invalid_referral: '이 이메일로 사전등록한 사람을 찾을 수 없습니다. 추천인 이메일을 다시 확인해주세요.',
  closed: '사전등록이 마감되었습니다.',
  unauthorized: '로그인이 만료되었습니다. 네이버 로그인을 다시 해주세요.',
  rate_limited: '잠시 후 다시 시도해주세요.',
  error: '사전등록을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
}

const STATUS_KIND: Record<number, SubmitKind> = {
  401: 'unauthorized',
  404: 'invalid_referral',
  409: 'already',
  410: 'closed',
  429: 'rate_limited',
}

/** 백엔드가 로그인 실패 시 돌려보내는 ?login=error&reason=... 의 reason별 안내 */
export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  no_phone: '휴대전화번호 제공에 동의해야 사전등록할 수 있습니다. 중복 참여 확인에만 쓰고 연락에는 사용하지 않아요.',
  no_email: '이메일 제공에 동의해야 사전등록할 수 있습니다. 당첨 안내를 이메일로 드려요.',
  cancelled: '네이버 로그인이 취소되었습니다.',
  default: '네이버 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const isMock = !API_BASE_URL

// ===== 목업 (페이지를 새로고침하면 초기화된다) =====
const mock = { loggedIn: false, registered: false }

// ===== 공개 함수 =====

/** 네이버 로그인 시작. 실제 모드는 백엔드로 이동하고, 목업은 바로 로그인된 상태가 된다 */
export async function startNaverLogin(): Promise<void> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 400))
    mock.loggedIn = true
    return
  }
  const returnTo = `${window.location.origin}${window.location.pathname}#entry-card`
  window.location.href = `${API_BASE_URL}/auth/naver/login?return_to=${encodeURIComponent(returnTo)}`
}

/** 로그인 안 됐으면 null */
export async function fetchMe(): Promise<Me | null> {
  if (isMock) {
    if (!mock.loggedIn) return null
    return { emailMasked: 'des***@naver.com', registered: mock.registered }
  }
  const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`GET /api/me ${res.status}`)
  return res.json()
}

export async function submitPreRegistration(req: PreRegistrationRequest): Promise<SubmitResult> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 600))
    // 목업 테스트용: 추천인 이메일에 wrong@naver.com을 넣으면 찾을 수 없음 응답
    if (req.referrerEmail === 'wrong@naver.com') return { kind: 'invalid_referral', message: MESSAGES.invalid_referral }
    mock.registered = true
    return { kind: 'success', message: MESSAGES.success }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/pre-registrations`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    let body: { message?: string | null } = {}
    try {
      body = await res.json()
    } catch {
      // 본문이 없어도 status 코드로 판단한다
    }
    const kind: SubmitKind = res.ok ? 'success' : (STATUS_KIND[res.status] ?? 'error')
    return { kind, message: body.message ?? MESSAGES[kind] }
  } catch {
    return { kind: 'error', message: MESSAGES.error }
  }
}
