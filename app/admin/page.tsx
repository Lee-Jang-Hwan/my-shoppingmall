/**
 * @file app/admin/page.tsx
 * @description 관리자 대시보드 메인 페이지
 *
 * 관리자용 상품 목록을 표시합니다.
 * 검색, 필터링, 정렬 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품 목록 표시 (전체 상품)
 * 2. 상품 상태별 필터링 (판매중/품절/숨김)
 * 3. 검색 기능
 * 4. 상품 수정/삭제 링크
 *
 * @dependencies
 * - actions/admin/products.ts: 상품 데이터 조회
 * - components/admin/product-list.tsx: 상품 목록 컴포넌트
 */

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductList } from "@/components/admin/product-list";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">상품 관리</h1>
          <p className="mt-2 text-muted-foreground">
            상품을 등록, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>새 상품 등록</Button>
        </Link>
      </div>

      <Suspense fallback={<div>상품 목록을 불러오는 중...</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}

