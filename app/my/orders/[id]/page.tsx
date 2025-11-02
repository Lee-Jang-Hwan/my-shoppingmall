/**
 * @file app/my/orders/[id]/page.tsx
 * @description 주문 상세 페이지
 *
 * 사용자의 특정 주문에 대한 상세 정보를 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 주문 기본 정보 표시
 * 2. 주문 상품 목록 표시
 * 3. 배송 정보 표시
 * 4. 결제 정보 표시
 * 5. 주문 메모 표시
 * 6. 주문 취소 UI (pending, confirmed 상태만)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (Next.js 15 App Router 패턴)
 * - Server Action으로 주문 상세 데이터 조회
 * - 본인의 주문인지 검증 (Server Action에서 처리)
 *
 * @dependencies
 * - actions/order.ts: getOrder Server Action
 * - components/my/order-status-badge.tsx: 주문 상태 배지
 * - types/order.ts: OrderWithItems 타입 정의
 */

import { getOrder } from "@/actions/order";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrderStatusBadge } from "@/components/my/order-status-badge";
import { formatOrderDate, formatPrice } from "@/utils/order";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OrderWithItems } from "@/types/order";
import { OrderCancelButton } from "@/components/my/order-cancel-button";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  console.group("📦 [OrderDetailPage] 주문 상세 페이지 렌더링 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.log("⚠️ 비로그인 사용자 - 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  // 2. 주문 ID 추출
  const { id: orderId } = await params;

  // 3. 주문 상세 조회 (본인의 주문인지 검증 포함)
  let order: OrderWithItems;
  try {
    order = await getOrder(orderId);
    console.log(`✅ 주문 상세 조회 완료: ${order.id}`);
  } catch (error) {
    console.error("❌ 주문 조회 실패:", error);
    console.groupEnd();
    redirect("/my/orders");
  }

  console.groupEnd();

  // 4. 금액 계산
  const productAmount = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = order.total_amount - productAmount;

  // 5. 취소 가능 여부 확인
  const canCancel = order.status === "pending" || order.status === "confirmed";

  // 6. 결제 상태 한글 변환
  const getPaymentStatusLabel = (status: string | null): string => {
    if (!status) return "미결제";
    const statusMap: Record<string, string> = {
      pending: "결제 대기",
      processing: "결제 중",
      completed: "결제 완료",
      failed: "결제 실패",
      cancelled: "결제 취소",
    };
    return statusMap[status] || status;
  };

  // 7. 결제 수단 한글 변환
  const getPaymentMethodLabel = (method: string | null): string => {
    if (!method) return "-";
    const methodMap: Record<string, string> = {
      CARD: "카드",
      TRANSFER: "계좌이체",
      VIRTUAL_ACCOUNT: "가상계좌",
      MOBILE: "휴대폰",
    };
    return methodMap[method] || method;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <Link href="/my/orders">
          <Button variant="ghost" className="mb-4">
            ← 주문 내역으로 돌아가기
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">주문 상세</h1>
      </div>

      {/* 주문 기본 정보 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* 주문 번호 */}
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-lg font-semibold">주문 번호</span>
            <span className="text-lg font-bold text-primary font-mono">
              {order.id}
            </span>
          </div>

          {/* 주문 상태 */}
          <div className="flex justify-between items-center">
            <span className="text-base">주문 상태</span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* 주문 일시 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span className="text-base">주문 일시</span>
            <span className="text-base text-muted-foreground">
              {formatOrderDate(order.created_at)}
            </span>
          </div>

          {/* 결제 상태 */}
          <div className="flex justify-between items-center">
            <span className="text-base">결제 상태</span>
            <span className="text-base font-medium">
              {getPaymentStatusLabel(order.payment_status)}
            </span>
          </div>

          {/* 최종 결제 금액 */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-lg font-semibold">최종 결제 금액</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(order.total_amount)}원
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
                className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg"
              >
                {/* 상품 이미지 */}
                <div className="flex-shrink-0 w-20 h-20 sm:w-20 sm:h-20 relative overflow-hidden rounded-md border border-border bg-muted mx-auto sm:mx-0">
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    이미지
                  </span>
                </div>

                {/* 상품 정보 */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-base font-semibold mb-1">
                    {item.product_name}
                  </h3>

                  {/* 옵션 정보 (있는 경우) */}
                  {item.options && Object.keys(item.options).length > 0 && (
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
                <div className="text-center sm:text-right">
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

      {/* 결제 정보 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">결제 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span>결제 수단</span>
            <span>{getPaymentMethodLabel(order.payment_method)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span>결제 상태</span>
            <span>{getPaymentStatusLabel(order.payment_status)}</span>
          </div>
          <div className="flex justify-between text-base pt-3 border-t border-border">
            <span>상품 금액</span>
            <span>{formatPrice(productAmount)}원</span>
          </div>
          <div className="flex justify-between text-base">
            <span>배송비</span>
            <span>{shippingFee === 0 ? "무료" : `${formatPrice(shippingFee)}원`}</span>
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

      {/* 주문 취소 버튼 */}
      {canCancel && <OrderCancelButton orderId={order.id} />}

      {/* 뒤로 가기 버튼 */}
      <div className="mt-6">
        <Link href="/my/orders">
          <Button variant="outline" className="w-full">
            주문 내역으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}

