- [x] Phase 1: 기본 인프라

  - [x] Next.js 프로젝트 셋업 (pnpm, App Router, React 19)
  - [x] Clerk 연동 (로그인/회원가입, 미들웨어 보호)
  - [x] 기본 레이아웃/네비게이션 구성 (`app/layout.tsx`, `components/Navbar.tsx`)
  - [x] Supabase 프로젝트 연결 및 환경변수 세팅 (`.env.local`)
  - [x] DB 스키마 준비: `products`, `cart_items`, `orders`, `order_items` (개발 환경 RLS 비활성화)
  - [x] 마이그레이션 작성/적용 (`supabase/migrations/*`)

- [ ] Phase 2: 상품 기능

  - [ ] 홈 페이지: 프로모션/카테고리 진입 동선
  - [ ] 상품 목록 페이지: 페이지네이션/정렬/카테고리 필터
  - [ ] 상품 상세 페이지: 재고/가격/설명 표시
  - [ ] 어드민 상품 등록은 대시보드에서 수기 관리(문서화만)

- [ ] Phase 3: 장바구니 & 주문

  - [ ] 장바구니 담기/삭제/수량 변경 (`cart_items` 연동)
  - [ ] 주문 생성 흐름(주소/메모 입력 포함)
  - [ ] 주문테이블 저장(`orders`, `order_items`) 및 합계 검증

- [ ] Phase 4: 결제 통합 (Toss Payments 테스트 모드)

  - [ ] 결제위젯 연동 및 클라이언트 플로우 구축
  - [ ] 결제 성공/실패 콜백 처리
  - [ ] 결제 완료 후 주문 상태 업데이트(`orders.status`)

- [ ] Phase 5: 마이페이지

  - [ ] 주문 내역 목록 조회 (사용자별 `orders`)
  - [ ] 주문 상세 보기 (`order_items` 포함)

- [ ] Phase 6: 테스트 & 배포

  - [ ] 전체 사용자 플로우 E2E 점검
  - [ ] 주요 버그 수정 및 예외처리 강화
  - [ ] Vercel 배포 설정 및 환경변수 구성

- [ ] 공통 작업 & 문서화

  - [ ] 오류/로딩/비어있는 상태 UI 정비
  - [ ] 타입 안전성 강화 (Zod + react-hook-form 적용 구간)
  - [ ] README/PRD 반영, 운영 가이드 업데이트
  - [ ] 접근성/반응형/다크모드 점검

- [ ] 환경/리포지토리 기초 세팅
  - [ ] `.gitignore` / `.cursorignore` 정비
  - [ ] `eslint.config.mjs` / 포맷터 설정 확정
  - [ ] 아이콘/OG 이미지/파비콘 추가 (`public/`)
  - [ ] SEO 관련 파일 (`robots.ts`, `sitemap.ts`, `manifest.ts`)
