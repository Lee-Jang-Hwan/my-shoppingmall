/**
 * @file app/admin/layout.tsx
 * @description 관리자 전용 레이아웃
 *
 * 모든 /admin 경로 하위 페이지에서 관리자 권한을 체크합니다.
 * 관리자가 아니면 홈으로 리다이렉트합니다.
 *
 * 주요 기능:
 * 1. 관리자 권한 체크 (모든 하위 페이지)
 * 2. 관리자 네비게이션 바
 * 3. 관리자 전용 스타일링
 *
 * @dependencies
 * - lib/admin/is-admin.ts: 관리자 권한 체크
 * - next/navigation: 리다이렉트
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin/is-admin";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 관리자 권한 체크
  const admin = await isAdmin();

  // 관리자가 아니면 홈으로 리다이렉트
  if (!admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 관리자 네비게이션 바 */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-xl font-bold">
                관리자 대시보드
              </Link>
              <div className="flex gap-4">
                <Link href="/admin">
                  <Button variant="ghost">상품 목록</Button>
                </Link>
                <Link href="/admin/products/new">
                  <Button variant="ghost">상품 등록</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">사이트로 이동</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 페이지 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

