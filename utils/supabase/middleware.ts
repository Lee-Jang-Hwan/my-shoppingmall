/**
 * @file utils/supabase/middleware.ts
 * @description Supabase Middleware Session Manager
 *
 * Next.js Middleware에서 Supabase 세션을 자동으로 갱신하는 유틸리티입니다.
 * 쿠키 기반 세션 관리를 통해 Server Components와 브라우저 간 세션 동기화를 보장합니다.
 *
 * 주요 기능:
 * 1. 자동 세션 갱신
 * 2. 쿠키 기반 세션 관리
 * 3. 인증되지 않은 사용자 리다이렉트 (선택적)
 *
 * @dependencies
 * - @supabase/ssr: Next.js SSR 지원
 * - next/server: Next.js 서버 유틸리티
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware에서 Supabase 세션을 갱신하는 함수
 *
 * IMPORTANT: 이 함수는 반드시 `supabase.auth.getUser()`를 호출해야 합니다.
 * 세션 갱신을 보장하고, 사용자 인증 상태를 확인합니다.
 *
 * @param request - Next.js 요청 객체
 * @returns 세션이 업데이트된 NextResponse 객체
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { updateSession } from '@/utils/supabase/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request);
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  // 환경 변수 확인 (Vercel 배포 시 필수)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수가 없으면 Supabase 세션 관리를 건너뛰고 기본 응답 반환
  // 이 프로젝트는 Clerk를 사용하므로 Supabase 인증 세션은 선택적입니다
  if (!supabaseUrl || !supabaseAnonKey) {
    // 프로덕션에서는 로그 출력하지 않음 (Vercel Edge Runtime 안정성)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Supabase environment variables not found. Skipping Supabase session management.'
      );
    }
    return NextResponse.next({
      request,
    });
  }

  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: createServerClient와 supabase.auth.getUser() 사이에
    // 다른 로직을 추가하지 마세요. 세션 동기화 문제를 일으킬 수 있습니다.

    // IMPORTANT: getUser()를 제거하지 마세요.
    // 이 호출이 세션 갱신을 보장합니다.
    // 에러가 발생해도 미들웨어가 실패하지 않도록 try-catch로 감쌉니다.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 선택적: 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
      // 주의: 이 프로젝트는 Clerk를 사용하므로 이 로직은 필요하지 않을 수 있습니다.
      // Clerk 미들웨어와 충돌하지 않도록 주의하세요.
      // if (
      //   !user &&
      //   !request.nextUrl.pathname.startsWith('/login') &&
      //   !request.nextUrl.pathname.startsWith('/auth')
      // ) {
      //   const url = request.nextUrl.clone();
      //   url.pathname = '/login';
      //   return NextResponse.redirect(url);
      // }
    } catch (authError) {
      // Supabase 인증 에러는 무시 (Clerk를 사용하므로)
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.warn('Supabase auth getUser failed (expected if using Clerk):', authError);
      }
    }

    // IMPORTANT: supabaseResponse 객체를 그대로 반환해야 합니다.
    // 새로 생성하는 경우 다음을 반드시 수행하세요:
    // 1. NextResponse.next({ request })에 request 전달
    // 2. supabaseResponse.cookies.getAll()로 쿠키 복사
    // 3. 쿠키를 변경하지 않고 필요한 경우에만 다른 부분 수정
    return supabaseResponse;
  } catch (error) {
    // 예기치 않은 에러 발생 시에도 미들웨어가 실패하지 않도록 처리
    // 프로덕션에서는 로그 출력하지 않음 (Vercel Edge Runtime 안정성)
    if (process.env.NODE_ENV === 'development') {
      console.error('Supabase middleware error:', error);
    }
    
    // 에러 발생 시 기본 응답 반환 (애플리케이션이 계속 작동하도록)
    // 이 함수는 항상 NextResponse를 반환해야 합니다
    return NextResponse.next({
      request,
    });
  }
}
