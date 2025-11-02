# Vercel 배포 가이드

이 문서는 Vercel에 프로젝트를 배포하는 방법을 안내합니다.

## 사전 요구사항

- GitHub 저장소에 코드가 푸시되어 있어야 합니다
- Vercel 계정이 필요합니다 (무료 계정 가능)
- 다음 서비스 계정 및 키가 준비되어 있어야 합니다:
  - Clerk 프로젝트 및 API 키
  - Supabase 프로젝트 및 API 키
  - Toss Payments 계정 및 키 (테스트 모드)

---

## 1. Vercel 프로젝트 생성

### 1.1 GitHub 저장소 연동

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **"Add New..."** → **"Project"** 클릭
3. GitHub 저장소 선택 또는 연결
4. 프로젝트 이름 및 설정 확인:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (프로젝트 루트)
   - **Build Command**: `pnpm build` (또는 자동 감지)
   - **Output Directory**: `.next` (자동 감지)
   - **Install Command**: `pnpm install` (또는 자동 감지)

### 1.2 환경변수 설정

프로젝트 설정에서 **"Environment Variables"** 탭으로 이동하여 다음 환경변수를 추가합니다:

#### Clerk 환경변수

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

**설정 방법:**
1. Clerk Dashboard → **API Keys**
2. Publishable Key와 Secret Key 복사
3. Vercel 환경변수에 추가
4. 모든 환경에 적용 (Production, Preview, Development) 선택

#### Supabase 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**설정 방법:**
1. Supabase Dashboard → **Settings** → **API**
2. Project URL, anon public key, service_role key 복사
3. Vercel 환경변수에 추가
4. 모든 환경에 적용 선택

**⚠️ 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 관리자 권한이므로 절대 공개하지 마세요.

#### Toss Payments 환경변수

```
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
```

**설정 방법:**
1. Toss Payments Dashboard → **개발가이드** → **인증키 관리**
2. 테스트 모드 클라이언트 키와 시크릿 키 복사
3. Vercel 환경변수에 추가
4. 모든 환경에 적용 선택

**⚠️ 참고**: 프로덕션에서는 테스트 키 대신 실제 키를 사용하세요.

### 1.3 Node.js 및 pnpm 버전 설정

프로젝트 설정에서:
- **Node.js Version**: 18.x 이상 (또는 `package.json`의 `engines` 필드 자동 감지)
- **Package Manager**: pnpm (자동 감지 또는 `package.json`의 `packageManager` 필드)

---

## 2. 배포 실행

### 2.1 첫 배포

1. 환경변수 설정 완료 후 **"Deploy"** 버튼 클릭
2. 빌드 진행 상황 확인
3. 배포 완료 후 제공된 URL로 접속 확인

### 2.2 빌드 로그 확인

빌드 실패 시:
1. Vercel Dashboard → 해당 배포의 **"View Build Logs"** 클릭
2. 에러 메시지 확인
3. 주로 발생하는 문제:
   - 환경변수 누락
   - 의존성 설치 실패
   - TypeScript 에러
   - 빌드 타임 에러

---

## 3. 배포 후 검증

### 3.1 필수 기능 확인

다음 기능들이 정상 작동하는지 확인:

- [ ] 홈페이지 로딩
- [ ] 회원가입/로그인 (Clerk)
- [ ] 상품 목록 조회
- [ ] 장바구니 기능
- [ ] 주문 생성
- [ ] 결제 위젯 표시 (Toss Payments)
- [ ] 주문 내역 조회

### 3.2 환경변수 확인

프로덕션 환경에서 환경변수가 정상 로드되었는지 확인:

1. Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**
2. 모든 환경변수가 올바르게 설정되어 있는지 확인
3. 각 환경변수가 올바른 환경(Production, Preview, Development)에 적용되었는지 확인

### 3.3 외부 서비스 연결 확인

- **Clerk**: 로그인/회원가입이 정상 작동하는지 확인
- **Supabase**: 데이터베이스 쿼리가 정상 작동하는지 확인
- **Toss Payments**: 결제 위젯이 정상 표시되는지 확인

---

## 4. 문제 해결

### 4.1 빌드 실패

**문제**: 빌드가 실패하는 경우

**해결 방법:**
1. 빌드 로그에서 에러 메시지 확인
2. 로컬에서 `pnpm build` 실행하여 동일한 에러 재현
3. 로컬에서 수정 후 다시 커밋/푸시
4. 자동 재배포 또는 수동 재배포

### 4.2 환경변수 관련 에러

**문제**: "Missing required environment variable" 에러

**해결 방법:**
1. `next.config.ts`에서 요구하는 모든 환경변수가 Vercel에 설정되었는지 확인
2. 환경변수 이름이 정확한지 확인 (대소문자 구분)
3. 환경변수가 올바른 환경(Production, Preview, Development)에 적용되었는지 확인
4. 환경변수 추가/수정 후 재배포 필요

### 4.3 이미지 로딩 실패

**문제**: 이미지가 표시되지 않는 경우

**해결 방법:**
1. `next.config.ts`의 `images.remotePatterns`에 이미지 호스트가 포함되어 있는지 확인
2. Supabase Storage 버킷이 Public으로 설정되어 있는지 확인
3. 이미지 URL이 올바른지 확인

### 4.4 결제 위젯 로딩 실패

**문제**: Toss Payments 결제 위젯이 표시되지 않는 경우

**해결 방법:**
1. `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`가 올바르게 설정되었는지 확인
2. Toss Payments Dashboard에서 테스트 모드가 활성화되어 있는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 4.5 인증 오류

**문제**: Clerk 로그인/회원가입이 작동하지 않는 경우

**해결 방법:**
1. Clerk 환경변수가 올바르게 설정되었는지 확인
2. Clerk Dashboard에서 애플리케이션 URL이 올바르게 설정되었는지 확인
3. Clerk Webhook 설정 확인 (있는 경우)

---

## 5. 커스텀 도메인 설정 (선택사항)

### 5.1 도메인 추가

1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 제공자에서 DNS 레코드 추가

### 5.2 HTTPS 인증서

Vercel이 자동으로 Let's Encrypt 인증서를 발급하고 관리합니다.

---

## 6. 모니터링 및 로깅

### 6.1 Vercel Analytics (선택사항)

1. Vercel Dashboard → 프로젝트 → **Analytics**
2. Analytics 활성화 (유료 플랜 필요)

### 6.2 에러 트래킹 (선택사항)

- Sentry 통합
- LogRocket 통합
- 기타 모니터링 서비스

---

## 7. 성능 최적화

### 7.1 빌드 최적화

- Next.js 15의 자동 최적화 활용
- 이미지 최적화 (Next.js Image 컴포넌트)
- 번들 크기 모니터링

### 7.2 Lighthouse 점수

Chrome DevTools의 Lighthouse로 성능 점수 확인:
- Performance: 70점 이상 목표
- Accessibility: 90점 이상 목표
- Best Practices: 90점 이상 목표
- SEO: 90점 이상 목표

---

## 8. CI/CD 자동화

### 8.1 자동 배포 설정

Vercel은 기본적으로 GitHub 푸시 시 자동 배포됩니다:
- `main` 브랜치 푸시 → Production 환경 배포
- 다른 브랜치 푸시 → Preview 환경 배포

### 8.2 배포 전 체크

프로젝트 설정에서 다음을 활성화할 수 있습니다:
- 빌드 전 린트 검사
- 타입 체크
- 테스트 실행 (있는 경우)

---

## 9. 롤백 방법

배포에 문제가 있는 경우:

1. Vercel Dashboard → 프로젝트 → **Deployments**
2. 이전 성공한 배포 선택
3. **"..."** 메뉴 → **"Promote to Production"** 클릭

---

## 10. 체크리스트

배포 전 확인 사항:

- [ ] 모든 환경변수가 Vercel에 설정됨
- [ ] 로컬에서 `pnpm build`가 성공적으로 실행됨
- [ ] TypeScript 에러가 없음
- [ ] 린트 에러가 없음
- [ ] 주요 기능이 로컬에서 정상 작동함
- [ ] `.env.example` 파일이 최신 상태임
- [ ] `README.md`에 배포 관련 정보가 반영됨

배포 후 확인 사항:

- [ ] 프로덕션 빌드가 성공함
- [ ] 홈페이지가 정상 로딩됨
- [ ] 인증 기능이 정상 작동함
- [ ] 데이터베이스 연결이 정상 작동함
- [ ] 결제 위젯이 정상 표시됨
- [ ] 주요 사용자 플로우가 정상 작동함
- [ ] 반응형 디자인이 정상 작동함
- [ ] 이미지가 정상 로딩됨

---

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

