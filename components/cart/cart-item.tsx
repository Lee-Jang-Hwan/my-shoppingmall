/**
 * @file components/cart/cart-item.tsx
 * @description 장바구니 개별 항목 컴포넌트
 *
 * 개별 장바구니 항목의 UI를 표시하고, 수량 변경 및 삭제 기능을 제공합니다.
 */

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCartItemQuantity, removeCartItem } from "@/actions/cart";
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react";
import type { CartItemWithProduct } from "@/types/cart";

interface CartItemProps {
  item: CartItemWithProduct;
  isSelected: boolean;
  onSelect: () => void;
  onRemoved: (id: string) => void;
  onUpdated: (item: CartItemWithProduct) => void;
}

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function CartItem({
  item,
  isSelected,
  onSelect,
  onRemoved,
  onUpdated,
}: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isPending, startTransition] = useTransition();

  const { product } = item;
  const itemTotal = product.price * quantity;
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = quantity > product.stock_quantity;
  const isInactive = !product.is_active || product.status === "hidden";

  // 수량 증가
  const handleIncrease = () => {
    if (quantity >= product.stock_quantity) {
      alert(`재고가 부족합니다. (최대 ${product.stock_quantity}개까지 가능)`);
      return;
    }

    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateQuantity(newQuantity);
  };

  // 수량 감소
  const handleDecrease = () => {
    if (quantity <= 1) {
      return;
    }

    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    updateQuantity(newQuantity);
  };

  // 수량 직접 입력
  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      setQuantity(1);
      updateQuantity(1);
      return;
    }

    if (numValue > product.stock_quantity) {
      alert(`재고가 부족합니다. (최대 ${product.stock_quantity}개까지 가능)`);
      setQuantity(product.stock_quantity);
      updateQuantity(product.stock_quantity);
      return;
    }

    setQuantity(numValue);
    updateQuantity(numValue);
  };

  // 수량 업데이트 (Server Action 호출)
  const updateQuantity = (newQuantity: number) => {
    startTransition(async () => {
      try {
        const updated = await updateCartItemQuantity({
          cartItemId: item.id,
          quantity: newQuantity,
        });
        // 업데이트된 항목 정보를 부모로 전달
        onUpdated({
          ...item,
          quantity: updated.quantity,
        });
      } catch (error) {
        console.error("수량 변경 실패:", error);
        // 실패 시 원래 수량으로 복구
        setQuantity(item.quantity);
        alert(
          `수량 변경에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      }
    });
  };

  // 항목 삭제
  const handleDelete = async () => {
    if (!confirm("이 항목을 장바구니에서 삭제하시겠습니까?")) {
      return;
    }

    startTransition(async () => {
      try {
        await removeCartItem(item.id);
        onRemoved(item.id);
      } catch (error) {
        console.error("항목 삭제 실패:", error);
        alert(
          `삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      }
    });
  };

  // 상품 이미지 URL (다중 이미지 우선, 단일 이미지 대체, placeholder)
  const productImageUrl =
    (product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : product.image_url) || "https://via.placeholder.com/200x200?text=No+Image";

  return (
    <div className="flex gap-4 p-4 border border-border rounded-lg">
      {/* 선택 체크박스 */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="mt-2 w-4 h-4"
        disabled={isPending}
      />

      {/* 상품 이미지 */}
      <Link
        href={`/products/${product.id}`}
        className="flex-shrink-0 w-24 h-24 relative overflow-hidden rounded-md border border-border"
      >
        <Image
          src={productImageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </Link>

      {/* 상품 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="text-lg font-semibold hover:text-primary mb-1 block"
            >
              {product.name}
            </Link>

            {/* 옵션 정보 (있는 경우) */}
            {item.options && Object.keys(item.options).length > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                {Object.entries(item.options).map(([key, value]) => (
                  <span key={key} className="mr-2">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}

            {/* 경고 메시지 */}
            {isInactive && (
              <div className="flex items-center gap-1 text-sm text-destructive mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>현재 판매 중이 아닌 상품입니다</span>
              </div>
            )}
            {isLowStock && (
              <div className="flex items-center gap-1 text-sm text-amber-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>
                  재고 부족 (재고: {product.stock_quantity}개, 선택: {quantity}
                  개)
                </span>
              </div>
            )}
            {isOutOfStock && (
              <div className="flex items-center gap-1 text-sm text-destructive mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>품절된 상품입니다</span>
              </div>
            )}

            {/* 단가 */}
            <div className="text-sm text-muted-foreground">
              단가: {formatPrice(product.price)}원
            </div>
          </div>

          {/* 삭제 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 수량 조절 및 총액 */}
        <div className="flex items-center justify-between mt-4">
          {/* 수량 조절 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrease}
              disabled={isPending || quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value, 10) < 1) {
                  setQuantity(1);
                  updateQuantity(1);
                }
              }}
              disabled={isPending || isOutOfStock}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrease}
              disabled={
                isPending || isOutOfStock || quantity >= product.stock_quantity
              }
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* 총액 */}
          <div className="text-right">
            <div className="text-lg font-bold">{formatPrice(itemTotal)}원</div>
            <div className="text-xs text-muted-foreground">
              ({quantity}개)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

