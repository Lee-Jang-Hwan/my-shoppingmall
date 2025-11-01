# Middleware 에러 수정 가이드

## 문제 원인

Vercel 배포 시 `MIDDLEWARE_INVOCATION_FAILED` 에러가 발생한 주요 원인:

1. **Edge Runtime 호환성**: Vercel Edge Runtime에서 Supabase 세션 관리가 실패할 때 미들웨어 전체가 실패
2. **에러 처리 부족**: Supabase 관련 에러가 Clerk 미들웨어까지 영향을 미침
3. **환경 변수 접근**: Edge Runtime에서 환경 변수 접근 시 문제 발생 가능

## 해결 방법

### 1. 동적 Import 사용

Supabase 미들웨어를 동적으로 import하여 에러 격리:

```typescript
const supabaseModule = await import("@/utils/supabase/middleware").catch(() => null);
```

### 2. 다층 에러 처리

- Clerk 미들웨어 레벨에서 try-catch
- Supabase 세션 관리 레벨에서 try-catch
- 개별 쿠키 설정 레벨에서도 try-catch

### 3. 항상 응답 반환 보장

미들웨어는 **항상** NextResponse를 반환해야 합니다:

```typescript
// ✅ 올바른 방법: 항상 응답 반환
export default clerkMiddleware(async (auth, request) => {
  const response = NextResponse.next({ request });
  
  try {
    // Supabase 세션 관리 시도
  } catch {
    // 에러 발생해도 응답은 반환
  }
  
  return response; // 항상 반환 보장
});
```

### 4. 프로덕션 로깅 최소화

프로덕션에서는 불필요한 로그 출력을 피하여 Edge Runtime 안정성을 보장:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn('...');
}
```

## 현재 구현 상태

현재 미들웨어는 다음과 같이 구성되어 있습니다:

1. **Clerk 미들웨어 우선**: 항상 기본 응답을 먼저 생성
2. **Supabase 선택적 처리**: 환경 변수가 있을 때만 처리
3. **완전한 에러 격리**: Supabase 관련 모든 에러를 catch
4. **안전한 쿠키 복사**: 각 단계에서 에러 처리

## 테스트 방법

### 로컬 테스트

```bash
pnpm dev
```

모든 페이지가 정상적으로 로드되는지 확인

### 배포 전 확인

1. 환경 변수가 모두 설정되었는지 확인
2. `pnpm build` 성공 확인
3. 타입 에러 없음 확인

### 배포 후 확인

1. Vercel 로그에서 에러 없음 확인
2. 모든 페이지 정상 작동 확인
3. 인증 플로우 정상 작동 확인

## 문제가 계속되는 경우

1. **Vercel 로그 확인**:
   - Dashboard → Deployments → 최신 배포 → Logs
   - 구체적인 에러 메시지 확인

2. **환경 변수 재확인**:
   - 모든 `NEXT_PUBLIC_` 변수가 설정되었는지 확인
   - Vercel에서 변수 값이 올바른지 확인

3. **미들웨어 단순화 테스트**:
   ```typescript
   // 임시로 Supabase 제거하고 Clerk만 테스트
   export default clerkMiddleware();
   ```
   - 이것이 작동하면 Supabase 통합 부분이 문제
   - 이것도 실패하면 Clerk 설정 문제

## 추가 개선 사항

필요 시 다음을 고려할 수 있습니다:

1. **Supabase 세션 관리 완전 제거**: Clerk만 사용 (Clerk 토큰으로 Supabase 접근)
2. **별도 미들웨어 체인**: Clerk와 Supabase를 순차적으로 실행
3. **Edge API Route 사용**: Middleware 대신 Edge API Route로 세션 관리


