const ID_PATTERN = /^[a-z0-9._]{1,30}$/

/** 앞의 @ 제거, 트림, 소문자 정규화 */
export function normalizeInstagramId(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase()
}

export function isValidInstagramId(normalized: string): boolean {
  return ID_PATTERN.test(normalized)
}
