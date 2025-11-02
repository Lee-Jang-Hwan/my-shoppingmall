/**
 * @file components/checkout/order-summary.tsx
 * @description 주문 상품 목록 컴포넌트
 *
 * 주문할 상품 목록을 표시하고 금액을 계산하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 선택한 장바구니 항목 표시 (이미지, 이름, 옵션, 수량, 단가, 소계)
 * 2. 상품 금액 합계 계산
 * 3. 배송비 표시 (5만원 이상 무료 배송)
 * 4. 최종 결제 금액 표시
 *
 * @dependencies
 * - types/cart.ts: CartItemWithProduct 타입
 * - actions/order.ts: calculateShippingFee 함수
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { calculateShippingFee } from "@/actions/order";
import type { CartItemWithProduct } from "@/types/cart";

interface OrderSummaryProps {
  items: CartItemWithProduct[];
}

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function OrderSummary({ items }: OrderSummaryProps) {
  // 상품 금액 합계 계산
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  // 배송비 계산
  const shippingFee = calculateShippingFee(totalAmount);

  // 최종 결제 금액
  const finalTotalAmount = totalAmount + shippingFee;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 주문할 상품 목록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">주문할 상품</h2>
        {items.map((item) => {
          const { product } = item;
          const itemTotal = product.price * item.quantity;
          const productImageUrl =
            product.image_urls && product.image_urls.length > 0
              ? product.image_urls[0]
              : product.image_url;

          return (
            <div
              key={item.id}
              className="flex gap-4 p-4 border border-border rounded-lg"
            >
              {/* 상품 이미지 */}
              <Link
                href={`/products/${product.id}`}
                className="flex-shrink-0 w-24 h-24 relative overflow-hidden rounded-md border border-border"
              >
                {productImageUrl ? (
                  <Image
                    src={productImageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      이미지 없음
                    </span>
                  </div>
                )}
              </Link>

              {/* 상품 정보 */}
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

                {/* 단가 및 수량 */}
                <div className="text-sm text-muted-foreground">
                  단가: {formatPrice(product.price)}원 × {item.quantity}개
                </div>
              </div>

              {/* 소계 */}
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatPrice(itemTotal)}원
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 금액 요약 */}
      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex justify-between text-base">
          <span>상품 금액</span>
          <span>{formatPrice(totalAmount)}원</span>
        </div>
        <div className="flex justify-between text-base">
          <span>배송비</span>
          <span>
            {shippingFee === 0 ? (
              <span className="text-primary font-semibold">무료</span>
            ) : (
              `${formatPrice(shippingFee)}원`
            )}
          </span>
        </div>
        {totalAmount < 50000 && (
          <div className="text-sm text-muted-foreground">
            {formatPrice(50000 - totalAmount)}원 더 구매하시면 무료 배송!
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-lg font-semibold">최종 결제 금액</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(finalTotalAmount)}원
          </span>
        </div>
      </div>
    </div>
  );
}

