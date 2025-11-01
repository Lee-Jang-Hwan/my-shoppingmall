# 문제 해결 가이드

## Supabase 관련 문제

### "Could not find the table 'public.users' in the schema cache" 에러

**증상:**
- `PGRST205` 에러 코드
- "Could not find the table 'public.users' in the schema cache" 메시지
- 404 에러가 발생

**원인:**
1. 테이블이 실제로 생성되지 않음
2. PostgREST 스키마 캐시가 최신 상태가 아님
3. 테이블 이름의 대소문자 불일치

**해결 방법:**

#### 1단계: 테이블 존재 확인

Supabase Dashboard에서 확인:
1. Supabase Dashboard → Table Editor
2. `users` 테이블이 있는지 확인

또는 SQL Editor에서 확인:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';
```

#### 2단계: 테이블 생성

테이블이 없다면, 다음 SQL을 Supabase Dashboard의 SQL Editor에서 실행:

```sql
-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 권한 부여
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

#### 3단계: 스키마 캐시 갱신

**방법 A: Supabase Dashboard 사용 (권장)**
1. Supabase Dashboard → Table Editor
2. 페이지를 새로고침 (F5)
3. 몇 초 대기 후 다시 테스트

**방법 B: SQL 명령 사용**
SQL Editor에서 다음 명령 실행:

```sql
NOTIFY pgrst, 'reload schema';
```

**방법 C: Supabase 프로젝트 재시작**
1. Supabase Dashboard → Settings → General
2. 프로젝트 재시작 (가능한 경우)
3. 또는 Supabase 지원팀에 문의

#### 4단계: 테이블 이름 확인

에러 메시지에 "Perhaps you meant the table 'public.user_id'" 라고 나온다면:
- 실제 테이블 이름이 `user_id`일 수 있습니다
- 코드에서 `users`로 참조하는 부분을 확인하세요

**확인 방법:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 테이블은 있지만 여전히 404 에러가 발생하는 경우

1. **RLS 정책 확인:**
   ```sql
   -- RLS 비활성화 확인
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'users';
   ```

2. **권한 확인:**
   ```sql
   -- 테이블 권한 확인
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_schema = 'public' 
   AND table_name = 'users';
   ```

3. **Supabase 클라이언트 설정 확인:**
   - 환경 변수가 올바르게 설정되었는지 확인
   - `.env` 파일에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른지 확인

### 빠른 해결 체크리스트

- [ ] Supabase Dashboard에서 `users` 테이블이 존재하는지 확인
- [ ] SQL Editor에서 마이그레이션 파일(`supabase/migrations/setup_schema.sql`) 실행
- [ ] Supabase Dashboard를 새로고침
- [ ] 개발 서버 재시작 (`pnpm dev`)
- [ ] 브라우저 캐시 삭제 및 새로고침
- [ ] 환경 변수가 올바르게 설정되었는지 확인

## Clerk 관련 문제

### "auth() was called but Clerk can't detect usage of clerkMiddleware()" 에러

**해결 방법:**
1. `middleware.ts` 파일이 프로젝트 루트에 있는지 확인
2. `export default clerkMiddleware(...)` 형식으로 올바르게 작성되었는지 확인
3. 개발 서버 재시작

자세한 내용은 `middleware.ts` 파일의 주석을 참고하세요.

## 일반적인 문제

### 환경 변수 관련

환경 변수가 제대로 로드되지 않는 경우:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. `NEXT_PUBLIC_` 접두사가 올바르게 사용되었는지 확인
3. 개발 서버 재시작 (환경 변수 변경 후 필수)

### 패키지 의존성 문제

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
pnpm install
```

## 추가 도움

문제가 계속되면:
1. [Supabase 공식 문서](https://supabase.com/docs)
2. [Clerk 공식 문서](https://clerk.com/docs)
3. 프로젝트의 GitHub Issues


