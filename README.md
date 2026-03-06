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

## 현재 구현 범위

- 모바일 첫 화면 (`하늘이와 나`)
- 스탯 4개: 체력/기분/친밀도/성장도
- 행동 버튼 3개: 기도하기/공부하기/기록하기
- 최근 기억 3개
- API: `GET /pet/me`, `POST /pet/create`, `POST /pet/action`
- DB 모델: `Pet`, `ActionLog` (SQLite)
- 버튼 클릭 시 상태 변경 + 규칙 기반 반응 메시지

## 제외 범위

- 로그인/OAuth
- 결제
- 텔레그램 연동
- 외부 LLM 연동
