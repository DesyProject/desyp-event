# desyp-event

[대규모시스템프로젝트] 선착순 5만원 이벤트!

De_sy_P 이벤트 응모 페이지. Vite + React + TypeScript로 만든 정적 SPA. 백엔드가 없어서 기본은 목업 API로 동작한다.

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
| `VITE_EVENT_END_AT`   | O    | 이벤트 종료 시각. ISO 8601, KST 오프셋 포함 (`+09:00`)         |
| `VITE_RETENTION_DAYS` | O    | 개인정보(Instagram ID) 보유 기간(일). 비어 있으면 `npm run build`가 실패한다 |
| `VITE_API_BASE_URL`   | X    | 비워두면 목업 API 사용. 채우면 `{URL}/api/entries`로 실제 요청 |

## 목업 API 테스트 (`VITE_API_BASE_URL` 미설정 시)

Instagram ID 입력값으로 응답을 강제할 수 있다 (`src/api/entry.ts`):

| 입력한 ID    | 결과 모달        |
| ------------ | ----------------- |
| `test_429`   | 429 — "잠시 후 다시 응모해주세요." |
| `test_error` | 오류 — "응모를 처리하지 못했습니다..." |
| 그 외 유효한 ID | 성공 — "응모가 접수되었습니다..." |

## 이미지 에셋 교체

`public/assets/`에 1x1 투명 PNG placeholder가 들어있다. 실제 파일을 같은 파일명으로 덮어쓰면 바로 반영된다:

- `character-1.png` — 히어로 메인 캐릭터
- `character-2.png` — 히어로 좌하단 보조 캐릭터
- `character-3.png` — 이벤트 안내 섹션 캐릭터
- `gift-box.png` — 물음표 선물 상자
- `bg-hero.jpg` — 히어로 배경 블록 도시 (없어도 그라데이션 배경으로 자연스럽게 대체됨)

## 배포 (Vercel)

Vite 프로젝트라 프레임워크 프리셋이 자동 인식된다. 빌드 커맨드 `npm run build`, 출력 디렉터리 `dist`.

```bash
npx vercel        # 최초 배포 (로그인 필요)
npx vercel --prod # 프로덕션 배포
```

Vercel 프로젝트 설정의 Environment Variables에 `VITE_EVENT_END_AT`, `VITE_RETENTION_DAYS`(필수), `VITE_API_BASE_URL`(선택)을 등록해야 빌드가 성공한다.
