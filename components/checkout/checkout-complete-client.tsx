/**
 * @file components/checkout/checkout-complete-client.tsx
 * @description 주문 완료 페이지 클라이언트 컴포넌트
 *
 * 주문 완료 페이지에서 주문 상태를 표시하는 클라이언트 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 주문 상태 표시
 */

"use client";

import type { OrderWithItems } from "@/types/order";

interface CheckoutCompleteClientProps {
  order: OrderWithItems;
}

/**
 * 주문 완료 페이지 클라이언트 컴포넌트
 */
export function CheckoutCompleteClient({ order }: CheckoutCompleteClientProps) {
  return (
    <>
      {order.status === "confirmed" && order.payment_status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">✅ 주문이 완료되었습니다.</p>
          <p className="text-sm text-green-700 mt-1">
            주문이 확인되었으며, 곧 배송을 준비하겠습니다.
          </p>
        </div>
      )}
    </>
  );
}

