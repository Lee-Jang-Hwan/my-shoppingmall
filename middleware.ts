import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Combined middleware for Clerk and Supabase
 *
 * 이 프로젝트는 Clerk와 Supabase를 함께 사용합니다:
 * - Clerk: 사용자 인증 처리 (필수)
 * - Supabase: 데이터베이스 및 스토리지 (Clerk 토큰을 사용한 인증)
 *
 * 중요 사항:
 * - Clerk 미들웨어는 Edge Runtime에서 실행됩니다
 * - Supabase 자체 인증 세션은 사용하지 않으므로 세션 관리 불필요
 * - 모든 Supabase 접근은 Clerk 토큰을 통해 인증됩니다
 * - Vercel 배포 시 안정적으로 작동합니다
 *
 * @see https://clerk.com/docs/guides/quickstarts/nextjs
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
