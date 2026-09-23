import { useEffect, useRef } from 'react'

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
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  return (
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
    </div>
  )
}
