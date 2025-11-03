/**
 * @file components/product-purchase-actions.tsx
 * @description 상품 구매 액션 컴포넌트
 *
 * 상품 상세 페이지에서 장바구니 추가 및 즉시 구매 버튼을 제공하는 클라이언트 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 수량 선택 및 조절
 * 2. 장바구니 추가 (Server Action 호출)
 * 3. 비로그인 사용자 처리
 * 4. 성공/실패 알림
 *
 * @dependencies
 * - actions/cart.ts: addToCart Server Action
 * - @clerk/nextjs: useAuth hook
 * - components/ui: Button, Input
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToCart } from "@/actions/cart";
import { ShoppingCart, CreditCard } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductPurchaseActionsProps {
  product: Product;
}

export function ProductPurchaseActions({
  product,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const isOutOfStock = product.stock_quantity === 0;
  const maxQuantity = product.stock_quantity;

  // 수량 증가
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  // 수량 감소
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // 수량 직접 입력
  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      setQuantity(1);
      return;
    }
    if (numValue > maxQuantity) {
      setQuantity(maxQuantity);
      return;
    }
    setQuantity(numValue);
  };

  // 장바구니 추가
  const handleAddToCart = () => {
    if (!isSignedIn) {
      // 비로그인 사용자는 로그인 모달이 자동으로 뜸 (SignInButton)
      return;
    }

    startTransition(async () => {
      try {
        await addToCart({
          productId: product.id,
          quantity,
          options: null, // 옵션 기능은 나중에 추가
        });
        alert("장바구니에 추가되었습니다!");
        router.refresh(); // 장바구니 개수 업데이트를 위한 새로고침
      } catch (error) {
        console.error("장바구니 추가 실패:", error);
        alert(
          `장바구니 추가에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      }
    });
  };

  // 즉시 구매 (Phase 4에서 구현)
  const handleBuyNow = () => {
    if (!isSignedIn) {
      return;
    }
    alert("즉시 구매 기능은 Phase 4에서 구현됩니다.");
  };

  return (
    <div className="space-y-4">
      {/* 수량 선택 */}
      <div className="space-y-2">
        <Label htmlFor="quantity">수량</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrease}
              disabled={isPending || quantity <= 1 || isOutOfStock}
            >
              -
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value, 10) < 1) {
                  setQuantity(1);
                }
              }}
              disabled={isPending || isOutOfStock}
              className="w-24 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrease}
              disabled={isPending || quantity >= maxQuantity || isOutOfStock}
            >
              +
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            (최대 {maxQuantity}개)
          </span>
        </div>
      </div>

      {/* 구매 버튼 */}
      <div className="flex gap-3 pt-4">
        {isSignedIn ? (
          <>
            <Button
              size="lg"
              variant="outline"
              disabled={isPending || isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isPending ? "추가 중..." : "장바구니 추가"}
            </Button>
            <Button
              size="lg"
              disabled={isPending || isOutOfStock}
              onClick={handleBuyNow}
              className="flex-1"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              즉시 구매
            </Button>
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <Button
                size="lg"
                variant="outline"
                disabled={isOutOfStock}
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                장바구니 추가 (로그인 필요)
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button
                size="lg"
                disabled={isOutOfStock}
                className="flex-1"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                즉시 구매 (로그인 필요)
              </Button>
            </SignInButton>
          </>
        )}
      </div>
    </div>
  );
}


