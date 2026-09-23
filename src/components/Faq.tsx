import { useState } from 'react'

const REGISTRATION_END = new Date(import.meta.env.VITE_REGISTRATION_END_AT).toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const RETENTION_DAYS = import.meta.env.VITE_RETENTION_DAYS

const FAQ_ITEMS = [
  {
    q: '사전등록은 어떻게 하나요?',
    a: '위쪽 사전등록 카드에서 네이버로 로그인한 뒤, 필수 항목에 동의하고 "사전등록하기"를 누르면 끝나요. 추천인 코드가 있다면 함께 입력해주세요.',
  },
  {
    q: '누가 참여할 수 있나요?',
    a: '네이버 계정이 있는 만 14세 이상이면 누구나 참여할 수 있어요.',
  },
  {
    q: '사전등록은 언제까지인가요?',
    a: `${REGISTRATION_END}까지예요. 이벤트 시작 하루 전에 마감돼요.`,
  },
  {
    q: '어떤 상품을 받을 수 있나요?',
    a: '50,000원 상당의 기프티콘이에요. 브랜드 목록은 상품 안내에서 볼 수 있어요.',
  },
  {
    q: '당첨되면 어떻게 알 수 있나요?',
    a: '운영자가 이메일로 직접 연락드려요.',
  },
  {
    q: '휴대전화번호는 어디에 쓰이나요?',
    a: '한 사람이 여러 계정으로 참여하지 않았는지 확인하는 데만 써요. 전화나 문자 연락에는 일절 사용하지 않아요.',
  },
  {
    q: '추천인 코드는 어떻게 받나요?',
    a: '사전등록을 마치면 내 추천인 코드와 추천 링크가 나와요. 친구가 그 링크로 들어오면 코드가 자동으로 입력돼요.',
  },
  {
    q: '제 개인정보는 언제 삭제되나요?',
    a: `이벤트가 끝나고 ${RETENTION_DAYS}일 이내에 파기해요.`,
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="section faq">
      <span className="section-label">FAQ</span>
      <h2 className="faq__title">자주 묻는 질문</h2>

      <div className="faq__list">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i
          return (
            <div className="faq-item" key={item.q}>
              <button
                type="button"
                className="faq-item__question"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                {item.q}
                <span className="faq-item__chevron" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && <p className="faq-item__answer">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
