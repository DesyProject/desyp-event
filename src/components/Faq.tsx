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
    a: '위쪽 사전등록 카드에서 네이버로 로그인한 뒤, 필수 항목 3가지에 동의하고 "사전등록하기"를 누르면 끝나요. 친구에게 받은 추천 코드가 있다면 함께 입력해주세요. 공유 링크로 들어왔다면 코드가 자동으로 입력돼요.',
  },
  {
    q: '누가 참여할 수 있나요?',
    a: '네이버 계정이 있는 만 14세 이상이라면 누구나 참여할 수 있어요.',
  },
  {
    q: '사전등록 마감과 이벤트 일정이 궁금해요.',
    a: `사전등록은 ${REGISTRATION_END}까지 받고, 이벤트는 10월 31일(토) 오후 2시에 열려요.`,
  },
  {
    q: '사전등록을 여러 번 할 수 있나요?',
    a: '네이버 계정과 이메일 하나당 한 번만 할 수 있어요. 등록한 뒤에는 입력한 추천 코드를 바꿀 수 없으니 제출 전에 한 번 더 확인해주세요.',
  },
  {
    q: '이벤트 당일에는 여러 번 응모해도 되나요?',
    a: '네, 횟수 제한 없이 여러 번 응모할 수 있어요. 다만 같은 Instagram 아이디로는 1초에 한 번만 접수돼요.',
  },
  {
    q: '추천 점수는 어떻게 계산되나요?',
    a: '내 추천 코드로 친구가 사전등록하면 친구 1명당 1점을 받아요. 내가 친구의 추천 코드를 입력하고 사전등록하면 1점을 더 받아요. 내 추천 코드와 현재 점수는 사전등록 완료 화면에서 확인할 수 있어요.',
  },
  {
    q: '어떤 상품을 받을 수 있나요?',
    a: '선착순 1명과 랜덤 번호 1명에게 50,000원 기프티콘을, 추천 점수가 가장 높은 1명에게 30,000원 상당의 상품을 드려요. 추천 점수가 같은 사람이 여러 명이면 그중 1명을 무작위로 뽑아요. 기프티콘 브랜드는 상품 안내에서 볼 수 있어요.',
  },
  {
    q: '당첨되면 어떻게 알 수 있나요?',
    a: '사전등록한 네이버 이메일로 운영자가 직접 연락드려요. 메일이 보이지 않으면 스팸함도 확인해주세요.',
  },
  {
    q: '이벤트 알림은 어떻게 받나요?',
    a: '이벤트 시작 1시간 전에 사전등록한 네이버 이메일로 안내해 드려요. 사전등록 완료 화면에서 카카오톡 채널을 추가하면 일정과 주요 공지를 카카오톡으로도 받을 수 있어요. 채널 추가는 선택이에요.',
  },
  {
    q: '제 개인정보는 언제 삭제되나요?',
    a: `이벤트가 끝나고 ${RETENTION_DAYS}일 이내에 모두 파기해요.`,
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
