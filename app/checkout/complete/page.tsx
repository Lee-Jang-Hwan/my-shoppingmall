/**
 * @file app/checkout/complete/page.tsx
 * @description 주문 완료 페이지
 *
 * 주문 완료 후 주문 정보를 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 주문 번호 표시
 * 2. 주문 완료 메시지
 * 3. 주문 상세 정보 요약 표시
 * 4. "주문 내역 보기" 버튼 (마이페이지로 이동, Phase 5에서 구현)
 * 5. "쇼핑 계속하기" 버튼 (홈으로 이동)
 *
 * @dependencies
 * - actions/order.ts: getOrder
 * - types/order.ts: OrderWithItems 타입
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOrder } from "@/actions/order";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { OrderWithItems } from "@/types/order";

interface CheckoutCompletePageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

/**
 * 주문 상태 한글 변환
 */
function getOrderStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "주문 접수",
    confirmed: "주문 확인",
    shipped: "배송 중",
    delivered: "배송 완료",
    cancelled: "주문 취소",
  };
  return statusMap[status] || status;
}

export default async function CheckoutCompletePage({
  searchParams,
}: CheckoutCompletePageProps) {
  console.group("📦 [CheckoutCompletePage] 주문 완료 페이지 렌더링 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.log("⚠️ 비로그인 사용자 - 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  // 2. 쿼리 파라미터에서 주문 ID 추출
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    console.log("⚠️ 주문 ID 없음 - 홈으로 리다이렉트");
    console.groupEnd();
    redirect("/");
  }

  // 3. 주문 정보 조회
  let order: OrderWithItems;
  try {
    order = await getOrder(orderId);
    console.log(`✅ 주문 조회 완료: ${order.id}`);
  } catch (error) {
    console.error("❌ 주문 조회 실패:", error);
    console.groupEnd();
    redirect("/");
  }

  console.groupEnd();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 주문 완료 메시지 */}
      <div className="text-center mb-8">
        <div className="mb-4">
          <svg
            className="w-24 h-24 mx-auto text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">주문이 완료되었습니다!</h1>
        <p className="text-muted-foreground">
          주문해주셔서 감사합니다. 주문 내역은 아래와 같습니다.
        </p>
      </div>

      {/* 주문 정보 카드 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* 주문 번호 */}
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-lg font-semibold">주문 번호</span>
            <span className="text-lg font-bold text-primary">{order.id}</span>
          </div>

          {/* 주문 상태 */}
          <div className="flex justify-between items-center">
            <span className="text-base">주문 상태</span>
            <span className="text-base font-medium">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          {/* 주문 일시 */}
          <div className="flex justify-between items-center">
            <span className="text-base">주문 일시</span>
            <span className="text-base text-muted-foreground">
              {new Date(order.created_at).toLocaleString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 주문 상품 목록 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">주문 상품</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const itemTotal = item.price * item.quantity;
            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-border rounded-lg"
              >
                {/* 상품 이미지 */}
                <div className="flex-shrink-0 w-20 h-20 relative overflow-hidden rounded-md border border-border bg-muted">
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    이미지
                  </span>
                </div>

                {/* 상품 정보 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-1">
                    {item.product_name}
                  </h3>

                  {/* 옵션 정보 (있는 경우) */}
                  {item.options &&
                    Object.keys(item.options).length > 0 && (
                      <div className="text-sm text-muted-foreground mb-1">
                        {Object.entries(item.options).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* 단가 및 수량 */}
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(item.price)}원 × {item.quantity}개
                  </div>
                </div>

                {/* 소계 */}
                <div className="text-right">
                  <div className="text-base font-bold">
                    {formatPrice(itemTotal)}원
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 배송 정보 */}
      {order.shipping_address && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">배송 정보</h2>
          <div className="space-y-2 text-base">
            <div>
              <span className="font-medium">수령인:</span>{" "}
              {order.shipping_address.recipientName}
            </div>
            <div>
              <span className="font-medium">연락처:</span>{" "}
              {order.shipping_address.phone}
            </div>
            <div>
              <span className="font-medium">주소:</span> [
              {order.shipping_address.postalCode}]{" "}
              {order.shipping_address.address}{" "}
              {order.shipping_address.detailAddress}
            </div>
            {order.shipping_address.deliveryRequest && (
              <div>
                <span className="font-medium">배송 요청사항:</span>{" "}
                {order.shipping_address.deliveryRequest}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 금액 요약 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">결제 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span>상품 금액</span>
            <span>
              {formatPrice(
                order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )
              )}
              원
            </span>
          </div>
          <div className="flex justify-between text-base">
            <span>배송비</span>
            <span>
              {order.total_amount -
                order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                ) ===
              0
                ? "무료"
                : `${formatPrice(
                    order.total_amount -
                      order.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                  )}원`}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-lg font-semibold">최종 결제 금액</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(order.total_amount)}원
            </span>
          </div>
        </div>
      </div>

      {/* 주문 메모 */}
      {order.order_note && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">주문 메모</h2>
          <p className="text-base text-muted-foreground">{order.order_note}</p>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            쇼핑 계속하기
          </Button>
        </Link>
        <Link href="/my/orders" className="flex-1">
          <Button className="w-full" disabled>
            주문 내역 보기 (Phase 5에서 구현)
          </Button>
        </Link>
      </div>
    </div>
  );
}

