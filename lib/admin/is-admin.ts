/**
 * @file lib/admin/is-admin.ts
 * @description 관리자 권한 체크 유틸리티
 *
 * Clerk 인증을 사용하여 현재 사용자가 관리자인지 확인합니다.
 * 환경 변수 ADMIN_USER_IDS에 저장된 Clerk User ID 목록과 비교합니다.
 *
 * 주요 기능:
 * 1. Server Component에서 관리자 권한 체크
 * 2. Server Action에서 관리자 권한 체크
 * 3. 인증되지 않은 사용자 처리
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 서버 사이드 인증
 *
 * @example
 * ```tsx
 * // Server Component
 * import { isAdmin } from '@/lib/admin/is-admin';
 *
 * export default async function AdminPage() {
 *   const admin = await isAdmin();
 *   if (!admin) {
 *     redirect('/');
 *   }
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Server Action
 * 'use server';
 * import { isAdmin } from '@/lib/admin/is-admin';
 *
 * export async function createProduct(data: ProductData) {
 *   if (!(await isAdmin())) {
 *     throw new Error('Unauthorized');
 *   }
 *   // ... 상품 생성 로직
 * }
 * ```
 */

import { auth } from "@clerk/nextjs/server";

/**
 * 환경 변수에서 관리자 Clerk User ID 목록을 가져옵니다.
 *
 * ADMIN_USER_IDS 환경 변수는 쉼표로 구분된 Clerk User ID 목록입니다.
 * 예: ADMIN_USER_IDS=user_abc123,user_def456,user_ghi789
 *
 * @returns 관리자 Clerk User ID 배열
 */
function getAdminUserIds(): string[] {
  const adminUserIdsString = process.env.ADMIN_USER_IDS;

  if (!adminUserIdsString) {
    // 개발 환경에서만 경고 출력
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "ADMIN_USER_IDS 환경 변수가 설정되지 않았습니다. 관리자 기능이 작동하지 않을 수 있습니다."
      );
    }
    return [];
  }

  // 쉼표로 구분된 문자열을 배열로 변환하고 공백 제거
  return adminUserIdsString
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * 현재 인증된 사용자가 관리자인지 확인합니다.
 *
 * @returns 관리자 여부 (true: 관리자, false: 일반 사용자 또는 미인증)
 *
 * @example
 * ```tsx
 * const admin = await isAdmin();
 * if (admin) {
 *   // 관리자 전용 로직
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Clerk 인증 정보 가져오기
    const { userId } = await auth();

    // 인증되지 않은 사용자는 관리자가 아님
    if (!userId) {
      return false;
    }

    // 관리자 ID 목록 가져오기
    const adminUserIds = getAdminUserIds();

    // 관리자 목록이 비어있으면 관리자 없음으로 처리
    if (adminUserIds.length === 0) {
      return false;
    }

    // 현재 사용자 ID가 관리자 목록에 있는지 확인
    return adminUserIds.includes(userId);
  } catch (error) {
    // 에러 발생 시 관리자가 아니라고 처리
    console.error("관리자 권한 체크 중 에러 발생:", error);
    return false;
  }
}

/**
 * 현재 인증된 사용자의 Clerk User ID를 가져옵니다.
 *
 * @returns Clerk User ID (인증되지 않은 경우 null)
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch (error) {
    console.error("사용자 ID 가져오기 중 에러 발생:", error);
    return null;
  }
}

