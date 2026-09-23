import { useEffect } from 'react'

const LOCK_MS = 900 // 한 번 넘긴 뒤 다음 휠 입력을 받기까지
const MERGE_PX = 200 // 화면보다 이만큼 이상 긴 섹션만 두 번 멈춘다. 가까운 멈춤 지점도 이 거리로 합친다
const INERTIA_GAP_MS = 150 // 트랙패드 관성 입력이 이만큼 끊겨야 다음 넘김을 받는다

/**
 * 마우스 휠을 조금만 굴려도 다음 구간으로 부드럽게 넘어간다.
 * 구간은 각 섹션의 시작점이고, 화면보다 긴 섹션은 끝부분이 보이는 지점도 한 번 거친다.
 * freeFromSelector 섹션부터 아래는 휠 넘김 없이 평소처럼 스크롤된다.
 * 터치 기기와 동작 줄이기 설정에서는 켜지 않는다. 키보드·스크롤바·메뉴 이동은 그대로다.
 */
export function useWheelSectionScroll(selector: string, freeFromSelector?: string) {
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lockedUntil = 0

    const stops = () => {
      const headerH = document.querySelector('.header')?.getBoundingClientRect().height ?? 0
      const view = window.innerHeight - headerH
      const max = document.documentElement.scrollHeight - window.innerHeight
      const points: number[] = []
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY - headerH
        const extra = el.offsetHeight - view
        if (extra > MERGE_PX) {
          // 많이 길면 시작과 끝 두 번 멈춘다
          points.push(top, top + extra)
        } else {
          // 조금만 길면 끝이 다 보이는 지점 한 곳에서 멈춘다 (위쪽 여백만 살짝 가려진다)
          points.push(top + Math.max(extra, 0))
        }
      })
      const sorted = points.map((p) => Math.round(Math.min(Math.max(p, 0), max))).sort((a, b) => a - b)
      // 가까운 지점은 합치되, 맨 끝(페이지 바닥)은 항상 남긴다
      const kept: number[] = []
      for (const p of sorted) {
        const close = kept.length > 0 && p - kept[kept.length - 1] <= MERGE_PX
        if (!close) kept.push(p)
        else if (p === max) kept[kept.length - 1] = p
      }
      return kept
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 4) return // 확대·축소, 가로 스크롤은 건드리지 않는다
      if ((e.target as Element).closest?.('.modal-backdrop')) return

      // freeFrom 섹션부터는 평소처럼 스크롤한다 (내용이 긴 섹션)
      const free = freeFromSelector && document.querySelector<HTMLElement>(freeFromSelector)
      if (free) {
        const headerH = document.querySelector('.header')?.getBoundingClientRect().height ?? 0
        const freeTop = free.getBoundingClientRect().top + window.scrollY - headerH
        const y = window.scrollY
        if ((e.deltaY > 0 && y >= freeTop - 5) || (e.deltaY < 0 && y > freeTop + 5)) return
      }

      e.preventDefault()

      const now = Date.now()
      if (now < lockedUntil) {
        lockedUntil = Math.max(lockedUntil, now + INERTIA_GAP_MS)
        return
      }
      const y = window.scrollY
      const points = stops()
      const target = e.deltaY > 0 ? points.find((p) => p > y + 5) : points.reverse().find((p) => p < y - 5)
      if (target === undefined) return
      lockedUntil = now + LOCK_MS
      window.scrollTo({ top: target, behavior: 'smooth' })
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [selector, freeFromSelector])
}
