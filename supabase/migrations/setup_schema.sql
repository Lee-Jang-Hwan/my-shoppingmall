-- Users 테이블 생성
-- Clerk 인증과 연동되는 사용자 정보를 저장하는 테이블

-- 기존 테이블이 있으면 삭제 (개발 환경용)
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.users OWNER TO postgres;

-- Row Level Security (RLS) 비활성화
-- 개발 단계에서는 RLS를 끄고, 프로덕션에서는 활성화하는 것을 권장합니다
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- PostgREST 스키마 캐시 갱신 (테이블 생성 후 필수)
-- Supabase Dashboard의 SQL Editor에서 실행 시 자동으로 캐시가 갱신됩니다.
-- API를 통해 테이블을 접근하기 전에 이 명령을 실행하거나,
-- Supabase Dashboard를 새로고침하면 자동으로 캐시가 갱신됩니다.
