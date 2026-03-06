# Skyling MVP

디지언트풍 성장형 AI 펫 모바일 웹 MVP (하늘 타입 1종).

## 구조

- `apps/web`: Next.js 14 + TypeScript + Tailwind (모바일 UI)
- `apps/api`: FastAPI + SQLite (상태/행동 API)

## 실행 방법

### 1) API 실행

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2) WEB 실행

다른 터미널에서:

```bash
cd apps/web
npm install
npm run dev
```

기본 API 주소는 `http://localhost:8000` 입니다.
필요 시 `apps/web/.env.local` 생성 후:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## GitHub Pages 배포 주의사항

- 배포 URL: `https://kinddragon1224.github.io/skyling-mvp/`
- `apps/web/next.config.js`에서 production 빌드에만 아래가 적용됩니다.
  - `output: "export"`
  - `basePath: "/skyling-mvp"`
  - `assetPrefix: "/skyling-mvp/"`
  - `images.unoptimized: true`
- 로컬 개발(`npm run dev`)은 `basePath/assetPrefix` 없이 `http://localhost:3000`에서 그대로 동작합니다.
- Pages workflow는 `apps/web/out`를 업로드하며, `out/.nojekyll`을 생성해 `_next` 정적 자산이 누락되지 않도록 처리합니다.
- GitHub Pages에서는 API 서버가 없기 때문에 기본적으로 Mock 모드로 동작합니다.
- `public` 자산은 `/pets/...`처럼 루트 기준으로 두고, 코드에서 basePath를 붙여(`/skyling-mvp/pets/...`) 접근해야 하위 경로 배포에서 안전합니다.
- UI 장식/룸 자산은 `public/ui/`로 분리해 두면 추후 픽셀 아트 교체가 쉽습니다. 현재는 `PetRoom`/`SkyPetSprite` 컴포넌트의 CSS+SVG fallback 렌더링을 사용합니다.

## guestId 기반 사용자 유지 방식 (로그인 없음)

- 로그인 없이 각 브라우저를 한 명의 게스트 사용자로 취급합니다.
- 프론트는 최초 실행 시 `localStorage`에 `skyling_guest_id`를 생성/보관합니다.
- API 호출 시 아래처럼 `guest_id`를 함께 전달합니다.
  - `GET /pet/me?guest_id=...`
  - `POST /pet/create` body: `{ "guest_id": "..." }`
  - `POST /pet/action` body: `{ "guest_id": "...", "action": "pray|study|record" }`
- 백엔드는 `guest_id` 기준으로 Pet을 조회/생성하므로, 같은 브라우저에서는 같은 하늘이가 계속 이어집니다.

## 현재 구현 범위

- 모바일 첫 화면 (`하늘이와 나`)
- 하늘이 이미지 자산 구조: `apps/web/public/pets/sky/`
- 스탯 4개: 체력/기분/친밀도/성장도
- 행동 버튼 3개: 기도하기/공부하기/기록하기
- 최근 기억 3개 카드 UI (text/action/created_at)
- API: `GET /pet/me`, `POST /pet/create`, `POST /pet/action`
- DB 모델: `Pet`, `ActionLog` (SQLite)
- 행동 후 메시지 랜덤 템플릿 반응(톤 고정 + 약한 랜덤)
- 스탯 기반 한 줄 존재감 문구
- 오늘의 행동 루프 패널(행동 횟수/마지막 행동/오늘의 기억)
- 규칙 기반 AI 교감 루프(오늘의 해석 + 상태 조합 해석 + 3줄 리포트)
- 교감 출력은 `interaction_snapshot` 구조로 통합 반환 (향후 OpenClaw/LLM 교체 지점)
- 레벨업/스테이지 진화 이벤트 피드백 표시

### Pet 필드

- `guest_id` (사용자 식별용)
- `name`, `hp`, `mood`, `bond`, `growth`
- `level` (기본 1)
- `stage` (기본 1)

### ActionLog 필드

- `pet_id`, `guest_id`, `action`, `message`, `created_at`

### 성장/단계 규칙

- `growth >= 100` 이 되면 `level` 1 상승
- 레벨업 시 `growth`는 `100` 차감 후 나머지 유지
- `level >= 3` 이 되면 `stage = 2`로 전환

### 하늘이 이미지 파일 경로

`apps/web/public/pets/sky/`에 파일을 넣으면 자동으로 사용됨.

- Stage 1 우선 경로: `stage1.png` (없으면 `stage1.svg`)
- Stage 2 우선 경로: `stage2.png` (없으면 `stage2.svg`)

이미지가 없으면 캐릭터 영역 fallback UI(텍스트 박스)가 표시됩니다.

## 제외 범위

- 로그인/OAuth
- 결제
- 텔레그램 연동
- PWA
- 외부 LLM 연동 (현재는 규칙 기반 교감 엔진 사용)

## 교감 엔진 구조 (6차)

- 백엔드: `apps/api/interaction_engine.py`
  - `build_interaction_snapshot()`가 교감 출력 생성 담당
  - 반환 구조:
    - `mood_summary`
    - `today_interpretation`
    - `memory_highlight`
    - `daily_report` (3줄)
- API 응답(`GET /pet/me`, `POST /pet/action`)은 `interaction_snapshot` 필드를 포함합니다.
- 프론트는 해석 로직을 직접 만들지 않고 `interaction_snapshot`를 렌더링합니다.
- Mock 모드에서는 `apps/web/app/lib/interaction.ts`의 동일 규칙 함수로 스냅샷을 생성합니다.
- 추후 OpenClaw/LLM 연동 시 `interaction_engine.py`의 템플릿 로직을 교체하면 됩니다.
