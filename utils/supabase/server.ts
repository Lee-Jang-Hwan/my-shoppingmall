/**
 * @file utils/supabase/server.ts
 * @description Supabase Server-Side Client (Server Components & Server Actions용)
 *
 * Supabase 공식 문서 기준으로 작성된 표준 서버 사이드 클라이언트입니다.
 * 쿠키 기반 세션 관리를 통해 SSR 환경에서 인증 상태를 유지합니다.
 *
 * 주요 기능:
 * 1. Server Component에서 사용
 * 2. Server Actions에서 사용
 * 3. 쿠키 기반 자동 세션 관리
 *
 * @dependencies
 * - @supabase/ssr: Next.js SSR 지원
 * - next/headers: 쿠키 접근
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Component 또는 Server Action에서 사용할 Supabase 클라이언트 생성
 *
 * 쿠키를 통한 세션 관리가 자동으로 처리됩니다.
 * Middleware에서 세션을 자동으로 갱신합니다.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClient } from '@/utils/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Server Action
 * 'use server';
 * import { createClient } from '@/utils/supabase/server';
 *
 * export async function myAction() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('table').select('*');
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 setAll이 호출된 경우
            // Middleware에서 세션을 자동으로 갱신하므로 무시해도 됩니다.
          }
        },
      },
    }
  );
}


