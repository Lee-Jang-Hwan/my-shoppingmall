# Vercel 배포 가이드

## 환경 변수 설정

Vercel에 배포할 때는 반드시 다음 환경 변수를 설정해야 합니다:

### 필수 환경 변수

1. **Clerk 인증**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`

2. **Supabase** (선택 사항이지만 권장)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (서버 사이드 전용)

### Vercel에서 환경 변수 설정하기

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 각 환경 변수를 추가:
   - **Name**: 환경 변수 이름 (예: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
     - ⚠️ **주의**: 정확한 이름으로 입력 (대소문자, 언더스코어 포함)
   - **Value**: 환경 변수 값
     - ⚠️ **주의**: 값 앞뒤에 공백이나 불필요한 따옴표가 없어야 합니다
   - **Environment**: 적용할 환경 선택
     - ✅ **필수**: `NEXT_PUBLIC_*` 변수는 **모든 환경**에 설정해야 합니다
     - Production, Preview, Development 모두 체크

4. **Save** 클릭

5. **환경 변수 확인**:
   - 추가한 환경 변수가 목록에 표시되는지 확인
   - 환경별로 올바르게 설정되었는지 확인
   - 값이 올바른지 다시 한 번 확인 (특히 키 이름의 오타)

> **⚠️ 중요**: 
> - 환경 변수를 추가하거나 수정한 후에는 **반드시 재배포**해야 합니다.
> - Vercel은 빌드 타임에 환경 변수를 읽어오므로, 새로 추가한 환경 변수는 재배포하지 않으면 적용되지 않습니다.
> - 빌드 캐시 문제가 있을 수 있으므로, 재배포 시 "Clear cache and deploy" 옵션을 사용하는 것을 권장합니다.

#### 환경 변수 설정 체크리스트

환경 변수 추가 후 다음을 확인하세요:

- [ ] 변수 이름이 정확한가? (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- [ ] 값에 공백이나 따옴표가 없는가?
- [ ] 모든 환경(Production, Preview, Development)에 설정되었는가?
- [ ] 저장 후 목록에 표시되는가?
- [ ] 재배포를 실행했는가?

## 배포 후 확인 사항

### 1. 미들웨어 에러 확인

배포 후 `MIDDLEWARE_INVOCATION_FAILED` 에러가 발생하면:

1. **Vercel 로그 확인**:
   - Vercel Dashboard → **Deployments** → 최신 배포 클릭
   - **Logs** 탭에서 에러 메시지 확인

2. **환경 변수 확인**:
   - 모든 필수 환경 변수가 설정되었는지 확인
   - 특히 `NEXT_PUBLIC_` 접두사가 올바른지 확인

3. **미들웨어 코드 확인**:
   - `middleware.ts` 파일이 프로젝트 루트에 있는지 확인
   - 에러 처리 로직이 포함되어 있는지 확인

### 2. 일반적인 배포 에러

#### "MIDDLEWARE_INVOCATION_FAILED"

**원인:**
- 환경 변수 누락
- 미들웨어 코드에서 처리되지 않은 에러
- Edge Runtime 호환성 문제

**해결:**
- 모든 환경 변수가 설정되었는지 확인
- `utils/supabase/middleware.ts`에 에러 처리 로직이 포함되어 있는지 확인
- Vercel 로그에서 구체적인 에러 메시지 확인

#### "Build Failed" 또는 "Missing publishableKey"

**원인:**
- TypeScript 에러
- 의존성 문제
- 빌드 타임아웃
- **환경 변수 누락 또는 잘못된 설정 (특히 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)**
  - 환경 변수가 특정 환경(Production/Preview/Development)에만 설정됨
  - 환경 변수 이름 오타
  - 환경 변수 값에 공백이나 따옴표 포함
  - 빌드 캐시 문제

**해결 단계별 가이드:**

1. **환경 변수 확인**:
   - Vercel Dashboard → Settings → Environment Variables
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 존재하는지 확인
   - 변수 이름이 정확한지 확인 (대소문자, 언더스코어)
   - **모든 환경에 설정되었는지 확인** (Production, Preview, Development 모두)

2. **환경 변수 값 확인**:
   - 값 앞뒤에 공백이 없는지 확인
   - 값에 따옴표가 포함되어 있지 않은지 확인
   - Clerk Dashboard에서 복사한 정확한 키 값인지 확인

3. **빌드 캐시 초기화**:
   - Vercel Dashboard → Deployments
   - 최신 배포에서 "Redeploy" 클릭
   - **"Clear cache and deploy" 옵션 체크**
   - 재배포 실행

4. **로컬에서 검증**:
   ```bash
   # .env 파일에 환경 변수가 있는지 확인
   pnpm build
   ```
   - 로컬에서 빌드가 성공하면 코드는 정상
   - 로컬에서 실패하면 `.env` 파일 확인

5. **Vercel 빌드 로그 확인**:
   - Vercel Dashboard → Deployments → 최신 배포 → Logs
   - 에러 메시지에서 정확한 원인 확인
   - `next.config.ts`에서 환경 변수 체크가 먼저 실행되므로, 더 명확한 에러 메시지를 볼 수 있습니다

## 배포 체크리스트

배포 전 확인:

- [ ] **모든 환경 변수가 Vercel에 설정되었는지 확인** (특히 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- [ ] 로컬에서 `pnpm build` 성공 확인
- [ ] TypeScript 에러 없음 확인
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `next.config.ts` 설정이 올바른지 확인
- [ ] 환경 변수 추가 후 **재배포** 예정인지 확인

배포 후 확인:

- [ ] 사이트가 정상적으로 로드되는지 확인
- [ ] 로그인 기능이 작동하는지 확인
- [ ] API 라우트가 정상 작동하는지 확인
- [ ] Vercel 로그에서 에러가 없는지 확인

## 문제 해결

### 환경 변수가 로드되지 않는 경우

1. Vercel Dashboard에서 환경 변수가 올바르게 설정되었는지 확인
2. 배포를 재실행 (환경 변수 추가/수정 후)
3. 브라우저 개발자 도구에서 `process.env` 확인 (클라이언트 사이드)

### 미들웨어가 작동하지 않는 경우

1. `middleware.ts` 파일이 프로젝트 루트에 있는지 확인
2. `export const config`가 올바르게 설정되었는지 확인
3. Vercel 로그에서 구체적인 에러 메시지 확인

### 추가 도움

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 문서](https://nextjs.org/docs/deployment)
- 프로젝트의 `docs/TROUBLESHOOTING.md` 참고


