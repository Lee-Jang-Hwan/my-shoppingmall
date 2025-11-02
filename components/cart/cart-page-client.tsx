/**
 * @file components/cart/cart-page-client.tsx
 * @description 장바구니 페이지 클라이언트 컴포넌트
 *
 * 선택된 항목 상태를 관리하고 주문하기 버튼을 표시합니다.
 */

"use client";

import { useState } from "react";
import { CartItemList } from "@/components/cart/cart-item-list";
import { CheckoutButton } from "@/components/cart/checkout-button";
import type { CartItemWithProduct } from "@/types/cart";

interface CartPageClientProps {
  items: CartItemWithProduct[];
  totalAmount: number;
  formatPrice: (price: number) => string;
}

export function CartPageClient({
  items,
  totalAmount,
  formatPrice,
}: CartPageClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <CartItemList items={items} onSelectedIdsChange={setSelectedIds} />

      {/* 총액 및 결제 버튼 */}
      <div className="border-t border-border pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold">총 금액</span>
          <span className="text-2xl font-bold">
            {formatPrice(totalAmount)}원
          </span>
        </div>
        <div className="flex gap-3">
          <a
            href="/products"
            className="flex-1 px-4 py-3 text-center border border-border rounded-md hover:bg-muted"
          >
            쇼핑 계속하기
          </a>
          <CheckoutButton selectedIds={selectedIds} />
        </div>
      </div>
    </div>
  );
}

