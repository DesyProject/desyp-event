import { useEffect } from 'react'

const DURATION_MS = 1100 // 한 구간을 넘어가는 시간. 클수록 살살 넘어간다
const INERTIA_GAP_MS = 150 // 트랙패드 관성 입력이 이만큼 끊겨야 다음 넘김을 받는다

/**
 * 마우스 휠을 조금만 굴려도 다음 구간으로 부드럽게 넘어간다.
 * 구간은 각 섹션의 시작점이고, 화면보다 긴 섹션은 끝부분이 보이는 지점도 한 번 거친다.
 * 터치 기기와 동작 줄이기 설정에서는 켜지 않는다. 키보드·스크롤바·메뉴 이동은 그대로다.
 */
export function useWheelSectionScroll(selector: string) {
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lockedUntil = 0
    let frame = 0

    // 천천히 출발해서 천천히 멈춘다
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
    const animateTo = (target: number) => {
      const start = window.scrollY
      const t0 = performance.now()
      cancelAnimationFrame(frame)
      const step = (now: number) => {
        const t = Math.min((now - t0) / DURATION_MS, 1)
        window.scrollTo({ top: start + (target - start) * ease(t), behavior: 'instant' })
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }

    const stops = () => {
      const headerH = document.querySelector('.header')?.getBoundingClientRect().height ?? 0
      const view = window.innerHeight - headerH
      const max = document.documentElement.scrollHeight - window.innerHeight
      const points: number[] = []
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY - headerH
        points.push(top)
        const extra = el.offsetHeight - view
        if (extra > 40) points.push(top + extra)
      })
      return [...new Set(points.map((p) => Math.round(Math.min(Math.max(p, 0), max))))].sort((a, b) => a - b)
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 4) return // 확대·축소, 가로 스크롤은 건드리지 않는다
      if ((e.target as Element).closest?.('.modal-backdrop')) return
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
      lockedUntil = now + DURATION_MS
      animateTo(target)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(frame)
    }
  }, [selector])
}
