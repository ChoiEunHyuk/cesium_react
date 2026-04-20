# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI 행동 규칙 (필수 준수)

- **아부 표현 금지**: "좋은 질문이에요", "훌륭합니다" 등 불필요한 칭찬이나 아부성 표현을 절대 사용하지 않는다.
- **팩트체크 필수**: 답변하기 전에 반드시 2번 이상 사실 여부를 검증한 후 응답한다.
- **역할**: 효율적인 코드에 민감한 시니어 개발자로서 응답한다. 불필요한 코드, 중복, 비효율적인 구조에 대해 적극적으로 지적한다.
- **답변 구분자 생성**: 답변에 코드 수정사항이 있다면 해당 답변에 구분자를 생성한다. 예) CLAUDE_01, CLAUDE_02 등. 추후 이 구분자를 통해 코드 변경사항을 쉽게 추적할 수 있도록 한다.

## Project Overview

이 저장소는 **프론트엔드 프로젝트**입니다. 별도의 백엔드 프로젝트(`vite_react_backend`)와 함께 구성되어 있으나, 현재 두 프로젝트는 독립적으로 운영되고 있으며 실질적인 API 연동은 아직 구현되지 않은 상태입니다.

| 프로젝트 | 경로 | 설명 |
|---------|------|------|
| 프론트엔드 | `C:\Users\ehcho\IdeaProjects\vite_react` | Vite + React 19 + TypeScript |
| 백엔드 | `C:\Users\ehcho\IdeaProjects\vite_react_backend` | Spring Boot 3.4.5 + Java 17 |

---

## Frontend (vite_react)

### Development Commands

```bash
npm run dev        # Start development server with HMR (http://localhost:5173)
npm run build      # Type-check and build for production (outputs to dist/)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint on all files
npm run typecheck  # Run TypeScript type-check only (tsc --noEmit)
```

### Architecture

Vite + React 19 application using **TypeScript (TSX)**.

### Project Structure

```
src/
├── main.tsx                        # React root setup with StrictMode
├── App.tsx                         # Router configuration (BrowserRouter)
├── vite-env.d.ts                   # Vite 환경변수 타입 선언
├── styles/                         # 전역 스타일 모음
│   ├── index.css
│   ├── Layout.css
│   ├── BoardPage.css
│   ├── MapToolbar.css
│   └── CesiumMap.css
├── components/
│   └── Layout/
│       ├── index.ts                # Re-export
│       └── Layout.tsx              # Main layout with navigation
└── pages/
    ├── Map/
    │   ├── index.ts                # Re-export
    │   ├── MapPage.tsx             # Map page container
    │   ├── CesiumMap.tsx           # Cesium 3D globe component (메인)
    │   ├── MapToolbar.tsx          # 지도 우측 툴바
    │   ├── hooks/
    │   │   ├── useImageSlide.ts    # 이미지 슬라이드 로직
    │   │   ├── useSlopeAnalysis.ts # DEM 경사도 분석 로직
    │   │   └── useCarbonAbsorption.ts # 탄소 흡수 지도 로직
    │   └── components/
    │       ├── ImageSlidePopup.tsx
    │       ├── SlopeAnalysisPopup.tsx
    │       └── CarbonAbsorptionPopup.tsx
    └── Board/
        ├── index.ts                # Re-export
        └── BoardPage.tsx           # TODO List page
```

### Routing (react-router-dom v7)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | MapPage | Cesium 3D 지도 페이지 (기본) |
| `/board` | BoardPage | TODO LIST 페이지 |

### Key Dependencies

- **Cesium** - 3D globe/map visualization (via `vite-plugin-cesium`)
- **proj4** - 좌표계 변환 (지도 분석용)
- **react-router-dom** - Client-side routing

### Configuration Files

- `index.html` - Entry point, loads `/src/main.tsx`
- `vite.config.ts` - Vite configuration with @vitejs/plugin-react and vite-plugin-cesium
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint flat config (ESLint 9)

### Map Features (CesiumMap)

사이드 메뉴를 통해 아래 3가지 기능을 팝업으로 제공:

| 기능 | Hook | 설명 |
|------|------|------|
| 이미지 슬라이드 | `useImageSlide` | 지도 위 이미지 레이어 슬라이드 재생, 투명도 조절 |
| DEM 경사도 분석 | `useSlopeAnalysis` | 지형 경사도 색상 시각화, 호버/영역 선택 모드 |
| 산림 탄소 흡수 지도 | `useCarbonAbsorption` | `/carbon/tree_species_carbon_absorption.json` 로드 후 지도 렌더링 |

---

## Backend (vite_react_backend)

### Tech Stack

- **Spring Boot** 3.4.5
- **Java** 17
- **Gradle** (Kotlin DSL)
- **Spring Data JPA**
- **PostgreSQL**

### Run Command

```bash
./gradlew bootRun
```

서버 포트: `8080`

### Database

```
Host: 192.168.50.150:15433
DB:   postgres
User: postgres
DDL:  validate (스키마 자동 변경 없음)
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/db-test` | DB 연결 테스트 |

### CORS 설정

프론트엔드 연동을 위해 아래 Origin 허용:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`

### Project Structure

```
src/main/java/com/example/backend/
├── BackendApplication.java
├── config/
│   └── CorsConfig.java
└── controller/
    └── HealthController.java
src/main/resources/
└── application.yml
```
