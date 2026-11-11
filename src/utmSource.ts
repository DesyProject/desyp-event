/**
 * 사전 등록 유입 경로. 백엔드가 utm_source로 저장하고 관리자 대시보드에 집계한다.
 * 우선순위: 링크의 ?utm_source= → 친구 공유 링크(?ref=) → 이번 세션에 이미 정한 값 → 이전 페이지(referrer) 주소.
 * 인앱 브라우저는 referrer를 비우는 경우가 많아 자동 분류는 참고용이다.
 */

const UTM_PARAM = 'utm_source'
const REF_PARAM = 'ref'
const STORAGE_KEY = 'desyp_utm_source'

/** 호스트 끝부분 → 경로 이름. 위에서부터 먼저 맞는 것을 쓴다 */
const REFERRER_SOURCES: [string, string][] = [
  ['blog.naver.com', 'naver_blog'],
  ['cafe.naver.com', 'naver_cafe'],
  ['band.us', 'naver_band'],
  ['naver.com', 'naver'],
  ['pf.kakao.com', 'kakaotalk_channel'],
  ['kakao.com', 'kakaotalk'],
  ['instagram.com', 'instagram'],
  ['threads.net', 'threads'],
  ['threads.com', 'threads'],
  ['facebook.com', 'facebook'],
  ['t.co', 'twitter'],
  ['x.com', 'twitter'],
  ['twitter.com', 'twitter'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['tiktok.com', 'tiktok'],
  ['discord.com', 'discord'],
  ['everytime.kr', 'everytime'],
  ['daangn.com', 'daangn'],
  ['google.com', 'google'],
  ['google.co.kr', 'google'],
  ['daum.net', 'daum'],
  ['bing.com', 'bing'],
]

/** 우리 사이트와 네이버 로그인을 다녀온 경우는 유입 경로가 아니다 */
const IGNORED_HOSTS = ['desyp.site', 'nid.naver.com']

const matches = (host: string, suffix: string) => host === suffix || host.endsWith(`.${suffix}`)

export function classifyReferrer(referrer: string): string {
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return '' // 빈 값이거나 주소가 아님
  }
  if (host === window.location.hostname || IGNORED_HOSTS.some((h) => matches(host, h))) return ''
  return REFERRER_SOURCES.find(([suffix]) => matches(host, suffix))?.[1] ?? 'other_site'
}

/** 첫 방문에 정한 경로를 sessionStorage에 남겨 네이버 로그인을 다녀와도 유지한다 */
export function readUtmSource(): string {
  const params = new URLSearchParams(window.location.search)
  const explicit = (params.get(UTM_PARAM) ?? '').trim().toLowerCase() || (params.get(REF_PARAM) ? 'referral_link' : '')
  try {
    const source = explicit || sessionStorage.getItem(STORAGE_KEY) || classifyReferrer(document.referrer)
    if (source) sessionStorage.setItem(STORAGE_KEY, source)
    return source
  } catch {
    return explicit || classifyReferrer(document.referrer) // 저장소가 막힌 브라우저
  }
}
