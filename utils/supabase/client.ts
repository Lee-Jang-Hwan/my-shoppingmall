/**
 * @file utils/supabase/client.ts
 * @description Supabase Client-Side Client (Client Components용)
 *
 * Supabase 공식 문서 기준으로 작성된 표준 클라이언트 사이드 클라이언트입니다.
 * 브라우저 환경에서 쿠키를 통한 세션 관리를 제공합니다.
 *
 * 주요 기능:
 * 1. Client Component에서 사용
 * 2. 브라우저 쿠키 기반 세션 관리
 * 3. 자동 세션 갱신
 *
 * @dependencies
 * - @supabase/ssr: Next.js SSR 지원
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Component에서 사용할 Supabase 클라이언트 생성
 *
 * 브라우저 쿠키를 통한 세션 관리가 자동으로 처리됩니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { createClient } from '@/utils/supabase/client';
 *
 * export default function MyComponent() {
 *   const supabase = createClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('table').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}


