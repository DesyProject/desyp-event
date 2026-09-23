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
| `VITE_RETENTION_DAYS` | O    | 개인정보(Instagram ID) 보유 기간(일). 비어 있으면 `npm run build`가 실패한다 |
| `VITE_API_BASE_URL`   | X    | 비워두면 목업 API 사용. 채우면 `{URL}/api/entries`로 실제 요청 |

## 사전등록 흐름

1. **로그인 전:** "네이버로 로그인" 버튼만 보인다.
2. **로그인 후:** 가린 휴대전화번호와 동의 체크박스 3개(만 14세 이상·개인정보 수집 필수, 알림 수신 선택), "사전등록하기" 버튼이 보인다.
3. **등록 완료:** 완료 안내가 보인다. 마감 시각이 지나면 모든 단계 대신 마감 안내가 보인다.

`VITE_API_BASE_URL`이 비어 있으면 목업으로 동작한다. 로그인 버튼을 누르면 바로 로그인된 상태가 되고, 새로고침하면 초기화된다.

## 백엔드 API

프론트는 아래 세 가지만 호출한다. 모두 `VITE_API_BASE_URL` 기준이며, 세션은 쿠키로 유지한다. 프론트 도메인과 다르면 CORS에서 `credentials`를 허용하고 쿠키는 `SameSite=None; Secure`로 내려야 한다.

| 요청 | 설명 |
| ---- | ---- |
| `GET /auth/naver/login?return_to=<URL>` | 브라우저가 이 주소로 이동한다. 백엔드가 `state`를 만들어 네이버 인증 페이지로 보내고, 콜백에서 토큰 교환과 프로필 조회(`/v1/nid/me`의 `mobile`, `id`) 후 세션을 만든다. 끝나면 `return_to`로 돌려보낸다 |
| `GET /api/me` | 로그인 상태면 `200 { "phoneMasked": "010-****-5678", "registered": false }`, 아니면 `401` |
| `POST /api/pre-registrations` | 본문 `{ "ageConfirmed": true, "agreePrivacy": true, "agreeMarketing": false }`. 네이버 `id` 기준 한 번만 등록한다 |

**로그인 실패 시** `return_to`에 `?login=error&reason=<이유>`를 붙여 돌려보낸다. 프론트가 아는 이유는 `no_phone`(휴대전화번호 제공 거부)과 `cancelled`(사용자 취소)이고, 그 외는 일반 실패 안내를 띄운다.

**등록 요청 응답 코드**

| 코드 | 의미 |
| ---- | ---- |
| `2xx` | 등록 완료 |
| `401` | 세션 만료. 프론트가 로그인 전 단계로 되돌린다 |
| `409` | 이미 등록한 계정 |
| `410` | 마감 이후 요청. 마감 시각은 서버에서도 확인해야 한다 |
| `429` | 요청이 너무 잦음 |

응답 본문에 `{ "message": "..." }`가 있으면 프론트는 그 문구를 그대로 모달에 띄운다. 휴대전화번호 원본은 브라우저로 내려보내지 않는다.

## 이미지 에셋 교체

- `bg-hero.jpg` — 히어로 배경 포스터 (가로 1536x1024). 제목·캐릭터·간판·선물상자가 이미지에 포함돼 있다. 비율이 다른 이미지로 바꾸면 `src/index.css`의 `.hero`의 `--poster-h` 비율(2/3)을 맞춘다
- `bg-about.jpg` — 이벤트 안내 섹션 배경 (1959x803). 제목·문구·뒷모습 캐릭터가 이미지에 포함돼 있다. 비율이 바뀌면 `.about`의 `min-height` 비율을 맞춘다

## 배포 (Vercel)

Vite 프로젝트라 프레임워크 프리셋이 자동 인식된다. 빌드 커맨드 `npm run build`, 출력 디렉터리 `dist`.

```bash
npx vercel        # 최초 배포 (로그인 필요)
npx vercel --prod # 프로덕션 배포
```

Vercel 프로젝트 설정의 Environment Variables에 `VITE_REGISTRATION_END_AT`, `VITE_RETENTION_DAYS`(필수), `VITE_API_BASE_URL`(선택)을 등록해야 빌드가 성공한다.
