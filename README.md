# desyp-event

[대규모시스템프로젝트] 선착순 5만원 이벤트!

De_sy_P 사전등록 페이지. Vite + React + TypeScript로 만든 정적 SPA. 네이버 로그인으로만 사전등록을 받고, 로그인 처리와 저장은 별도 백엔드가 맡는다. 백엔드 주소가 없으면 목업 API로 동작한다.

## 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm run dev             # http://localhost:5173
npm run build            # dist/ 에 정적 빌드
npm run preview          # 빌드 결과 로컬 확인
```

## 환경 변수 (`.env`)

| 변수                  | 필수 | 설명                                                         |
| --------------------- | ---- | -------------------------------------------------------------- |
| `VITE_REGISTRATION_END_AT`   | O    | 사전등록 마감 시각(이벤트 하루 전). ISO 8601, KST 오프셋 포함 (`+09:00`)         |
| `VITE_RETENTION_DAYS` | O    | 개인정보(네이버 id·이메일·휴대전화번호) 보유 기간(일). 이벤트 종료 후 이 기간 안에 파기한다. 비어 있으면 `npm run build`가 실패한다 |
| `VITE_API_BASE_URL`   | X    | 비워두면 목업 API 사용. 채우면 `{URL}/api/entries`로 실제 요청 |

## 사전등록 흐름

1. **로그인 전:** "네이버로 로그인" 버튼만 보인다.
2. **로그인 후:** 가린 이메일, 추천 코드 입력칸(선택), 동의 체크박스 3개(만 14세 이상·개인정보 수집·오픈 알림 수신, 모두 필수), "사전등록하기" 버튼이 보인다.
3. **등록 완료:** "사전등록 완료!"와 당첨 안내 문구가 보인다. 마감 시각이 지나면 모든 단계 대신 마감 안내가 보인다.

`VITE_API_BASE_URL`이 비어 있으면 목업으로 동작한다. 로그인 버튼을 누르면 바로 로그인된 상태가 되고, 새로고침하면 초기화된다. 추천 코드에 `ZZZZZZZZ`를 넣으면 찾을 수 없음 응답을 볼 수 있다.

**수집 정보와 용도:** 이메일은 당첨·이벤트 안내 연락에 쓴다. 휴대전화번호는 한 사람이 여러 네이버 계정으로 참여하는 것을 막는 데만 쓰고, 연락에는 일절 사용하지 않는다.

## 백엔드 API

프론트는 아래 네 API를 호출한다. 모두 `VITE_API_BASE_URL` 기준이며, 세션은 쿠키로 유지한다. 백엔드는 `https://api.desyp.site`이고, 같은 사이트의 하위 도메인이라 쿠키는 `SameSite=Lax; Secure; HttpOnly`로 동작한다. CORS는 `https://www.desyp.site`만 허용하므로, Vercel 미리보기 주소(`*.vercel.app`)에서는 목업으로 확인한다.

로컬에서 실제 백엔드에 붙일 때는 `.env`에 `VITE_API_BASE_URL=http://localhost:8080`을 넣는다. 로그인은 네이버 개발자센터 멤버관리에 등록된 테스터 계정만 된다.

| 요청 | 설명 |
| ---- | ---- |
| `GET /auth/naver/login?return_to=<URL>` | 브라우저가 이 주소로 이동한다. 백엔드가 `state`를 만들어 네이버 인증 페이지로 보내고, 콜백에서 토큰 교환과 프로필 조회(`/v1/nid/me`의 `id`, `email`, `mobile`) 후 세션을 만든다. 끝나면 `return_to`로 돌려보낸다 |
| `GET /api/me` | 로그인 상태면 `200 { "emailMasked": "des***@naver.com", "registered": false }`, 아니면 `401` |
| `POST /api/pre-registrations` | 본문 `{ "ageConfirmed": true, "agreePrivacy": true, "agreeMarketing": true, "referralCode": "..." }`. 추천 코드는 선택이며 이메일 같은 개인정보를 추천 식별자로 보내지 않는다. 성공 응답은 본인의 `referralCode`를 반환한다 |
| `GET /api/referrals/me` | 사전등록한 로그인 사용자의 추천 코드, 실제 추천 수, 코드 사용 보너스, 총점을 반환한다 |

**로그인 실패 시** `return_to`에 `?login=error&reason=<이유>`를 붙여 돌려보낸다. 프론트가 아는 이유는 `no_email`·`no_phone`(제공 거부)과 `cancelled`(사용자 취소)이다. `failed`(그 외 실패)와 모르는 이유는 일반 실패 안내를 띄운다.

**등록 요청 응답 코드**

| 코드 | 의미 |
| ---- | ---- |
| `2xx` | 등록 완료 |
| `400` | 동의 누락·형식 오류 |
| `401` | 세션 만료. 프론트가 로그인 전 단계로 되돌린다 |
| `404` | 유효하지 않은 추천 코드 |
| `409` | 이미 등록한 계정, 또는 같은 휴대전화번호로 다른 계정이 이미 등록 |
| `410` | 마감 이후 요청. 마감 시각은 서버에서도 확인해야 한다 |
| `415` | JSON이 아닌 요청 |
| `429` | 요청이 너무 잦음. 배포할 때 API Gateway에서 설정 예정 |

응답 본문에 `{ "message": "..." }`가 있으면 프론트는 기본 문구 대신 그 문구를 그대로 모달에 띄운다. 400·415처럼 표에 따로 처리가 없는 코드는 일반 오류로 다루되, 역시 `message`를 띄운다. 휴대전화번호는 브라우저로 내려보내지 않는다.

## 이미지 에셋 교체

- `bg-hero.jpg` — 히어로 배경 포스터 (가로 1536x1024). 제목·캐릭터·간판·선물상자가 이미지에 포함돼 있다. 비율이 다른 이미지로 바꾸면 `src/index.css`의 `.hero`의 `--poster-h` 비율(2/3)을 맞춘다
- `bg-about.jpg` — 이벤트 소개 섹션 배경 (1961x802). 글자 없는 이미지이고, 문구는 코드로 구현돼 있다. 비율이 바뀌면 `.about`의 `min-height` 비율을 맞춘다

## 배포 (Vercel)

Vite 프로젝트라 프레임워크 프리셋이 자동 인식된다. 빌드 커맨드 `npm run build`, 출력 디렉터리 `dist`.

```bash
npx vercel        # 최초 배포 (로그인 필요)
npx vercel --prod # 프로덕션 배포
```

Vercel 프로젝트 설정의 Environment Variables에 `VITE_REGISTRATION_END_AT`, `VITE_RETENTION_DAYS`(필수), `VITE_API_BASE_URL`(선택)을 등록해야 빌드가 성공한다.
