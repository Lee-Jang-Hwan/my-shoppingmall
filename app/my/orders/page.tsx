/**
 * @file app/my/orders/page.tsx
 * @description 주문 내역 조회 페이지
 *
 * 사용자의 주문 내역을 조회하고 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 현재 사용자의 주문 목록 조회
 * 2. 주문 상태별 필터링
 * 3. 주문 상세 페이지로 이동
 * 4. 빈 상태 메시지 표시
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (Next.js 15 App Router 패턴)
 * - Server Action으로 주문 데이터 조회
 * - 클라이언트 컴포넌트에서 필터링 처리
 *
 * @dependencies
 * - actions/order.ts: 주문 Server Actions
 * - components/my/order-card.tsx: 주문 카드 컴포넌트
 * - components/my/order-filter.tsx: 주문 필터 컴포넌트
 * - types/order.ts: Order 타입 정의
 */

import { getOrders } from "@/actions/order";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrderCard } from "@/components/my/order-card";
import { OrderFilter } from "@/components/my/order-filter";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  console.group("📦 [OrdersPage] 주문 내역 페이지 렌더링 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.log("⚠️ 비로그인 사용자 - 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  // 2. 주문 목록 조회
  let orders;
  try {
    orders = await getOrders();
    console.log(`✅ 주문 목록 조회 완료: ${orders.length}개`);
  } catch (error) {
    console.error("❌ 주문 목록 조회 실패:", error);
    orders = [];
  }

  // 3. 필터 파라미터 확인
  const params = await searchParams;
  const statusFilter = params.status;

  // 4. 필터링 적용
  const filteredOrders = statusFilter
    ? orders.filter((order) => order.status === statusFilter)
    : orders;

  console.groupEnd();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">주문 내역</h1>
        <p className="text-muted-foreground">
          주문하신 상품의 내역을 확인하실 수 있습니다.
        </p>
      </div>

      {/* 필터 UI */}
      {orders.length > 0 && <OrderFilter currentFilter={statusFilter} />}

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        // 빈 상태
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-4">
            <ShoppingBag className="w-24 h-24 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {statusFilter
              ? "해당 조건의 주문이 없습니다"
              : "주문 내역이 없습니다"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {statusFilter
              ? "다른 주문 상태를 선택해보세요."
              : "상품을 구매해보세요!"}
          </p>
          {!statusFilter && (
            <Link href="/products">
              <Button>쇼핑 계속하기</Button>
            </Link>
          )}
        </div>
      ) : (
        // 주문 목록 그리드
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

