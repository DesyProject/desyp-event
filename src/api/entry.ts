export interface EntryRequest {
  instagramId: string
  ageConfirmed: boolean
}

export type EntryResultKind = 'success' | 'rate_limited' | 'error'

export interface EntryResult {
  kind: EntryResultKind
  message: string
}

const DEFAULT_MESSAGES: Record<EntryResultKind, string> = {
  success: '응모가 접수되었습니다. 당첨 시 Instagram DM으로 연락드립니다.',
  rate_limited: '잠시 후 다시 응모해주세요.',
  error: '응모를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 목업 모드 테스트용 ID:
 * - "test_429"  -> 429 (너무 빠른 재요청) 응답 확인
 * - "test_error" -> 5xx/네트워크 오류 응답 확인
 * - 그 외        -> 성공 응답
 */
async function submitEntryMock(req: EntryRequest): Promise<EntryResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))

  if (req.instagramId === 'test_429') {
    return { kind: 'rate_limited', message: DEFAULT_MESSAGES.rate_limited }
  }
  if (req.instagramId === 'test_error') {
    return { kind: 'error', message: DEFAULT_MESSAGES.error }
  }
  return { kind: 'success', message: DEFAULT_MESSAGES.success }
}

async function submitEntryReal(req: EntryRequest): Promise<EntryResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    let body: { success?: boolean; message?: string | null } = {}
    try {
      body = await res.json()
    } catch {
      // 본문이 없거나 JSON이 아니어도 status 코드로 처리를 이어간다
    }

    if (res.status === 429) {
      return { kind: 'rate_limited', message: body.message ?? DEFAULT_MESSAGES.rate_limited }
    }
    if (!res.ok) {
      return { kind: 'error', message: body.message ?? DEFAULT_MESSAGES.error }
    }
    if (!body.success) {
      return { kind: 'error', message: body.message ?? DEFAULT_MESSAGES.error }
    }
    return { kind: 'success', message: body.message ?? DEFAULT_MESSAGES.success }
  } catch {
    return { kind: 'error', message: DEFAULT_MESSAGES.error }
  }
}

export async function submitEntry(req: EntryRequest): Promise<EntryResult> {
  return API_BASE_URL ? submitEntryReal(req) : submitEntryMock(req)
}
