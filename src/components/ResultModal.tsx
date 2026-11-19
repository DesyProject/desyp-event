import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ResultModalProps {
  open: boolean
  message: string
  onClose: () => void
}

/**
 * 성공/실패/대기 모든 경우에 공통으로 쓰는 결과 모달.
 * 바깥 클릭·Escape로 닫히지 않고 OK 버튼으로만 닫힌다. 포커스는 안에 가둔다.
 */
export default function ResultModal({ open, message, onClose }: ResultModalProps) {
  const okButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    okButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        return
      }
      if (e.key === 'Tab') {
        // 포커스 가능한 요소가 OK 버튼 하나뿐이므로 항상 그 안에 고정한다
        e.preventDefault()
        okButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  // 카드 안에 두면 카드의 쌓임 순서에 갇혀 고정 헤더 아래로 깔린다
  return createPortal(
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-modal-message"
      >
        <p id="result-modal-message" className="modal__message">
          {message}
        </p>
        <button ref={okButtonRef} type="button" className="modal__ok" onClick={onClose}>
          OK
        </button>
      </div>
    </div>,
    document.body,
  )
}
