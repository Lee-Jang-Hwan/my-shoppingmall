/**
 * @file components/cart/checkout-button.tsx
 * @description 장바구니에서 주문하기 버튼 컴포넌트
 *
 * 선택한 장바구니 항목을 주문 페이지로 이동시키는 버튼입니다.
 */

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CheckoutButtonProps {
  selectedIds: string[];
  disabled?: boolean;
}

export function CheckoutButton({ selectedIds, disabled }: CheckoutButtonProps) {
  const router = useRouter();

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      alert("주문할 상품을 선택해주세요.");
      return;
    }

    // 선택한 항목 ID를 쿼리 파라미터로 전달하여 주문 페이지로 이동
    const itemsParam = selectedIds.join(",");
    router.push(`/checkout?items=${itemsParam}`);
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || selectedIds.length === 0}
      className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      주문하기 ({selectedIds.length}개)
    </Button>
  );
}

