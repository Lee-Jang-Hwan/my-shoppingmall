/**
 * @file components/checkout/checkout-complete-client.tsx
 * @description 주문 완료 페이지 클라이언트 컴포넌트
 *
 * 주문 완료 페이지에서 결제위젯을 처리하는 클라이언트 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 주문 상태에 따른 결제위젯 표시
 * 2. 결제 성공/실패 처리
 * 3. 주문 상태 재조회 및 업데이트
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentWidget } from "@/components/checkout/payment-widget";
import { getOrder } from "@/actions/order";
import { confirmPayment, updateOrderPayment } from "@/actions/payment";
import type { OrderWithItems } from "@/types/order";

interface CheckoutCompleteClientProps {
  order: OrderWithItems;
}

/**
 * 주문 완료 페이지 클라이언트 컴포넌트
 */
export function CheckoutCompleteClient({ order: initialOrder }: CheckoutCompleteClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const refreshOrder = async () => {
    setIsRefreshing(true);
    try {
      const updatedOrder = await getOrder(order.id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("주문 조회 실패:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePaymentConfirm = async (paymentKey: string) => {
    try {
      setIsRefreshing(true);
      setPaymentError(null);

      // 1. 결제 승인 (서버 사이드 검증)
      const paymentInfo = await confirmPayment(
        paymentKey,
        order.id,
        order.total_amount
      );

      // 2. 주문 정보 업데이트
      await updateOrderPayment(order.id, paymentInfo);

      // 3. 주문 상태 재조회
      await refreshOrder();

      // 4. URL에서 결제 파라미터 제거
      router.replace(`/checkout/complete?orderId=${order.id}`, { scroll: false });
    } catch (err: unknown) {
      console.error("❌ 결제 승인 처리 실패:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "결제 승인 처리 중 오류가 발생했습니다.";
      setPaymentError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  // URL 쿼리 파라미터에서 결제 상태 확인 및 결제 승인 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey");
    const orderIdFromUrl = params.get("orderId");
    const amount = params.get("amount");
    const code = params.get("code");
    const message = params.get("message");

    // 결제 성공: paymentKey와 orderId가 모두 있는 경우
    if (paymentKey && orderIdFromUrl === order.id && amount) {
      // 결제 금액 검증
      const paymentAmount = parseInt(amount, 10);
      if (Math.abs(paymentAmount - order.total_amount) <= 1) {
        // 결제 승인 처리
        handlePaymentConfirm(paymentKey);
      } else {
        setPaymentError(
          `결제 금액이 일치하지 않습니다. (주문: ${order.total_amount}원, 결제: ${paymentAmount}원)`
        );
        // URL에서 결제 파라미터 제거
        router.replace(`/checkout/complete?orderId=${order.id}`, { scroll: false });
      }
    }
    // 결제 실패: code 또는 message가 있는 경우
    else if (code || message) {
      setPaymentError(message || code || "결제가 취소되었거나 실패했습니다.");
      // URL에서 결제 파라미터 제거
      router.replace(`/checkout/complete?orderId=${order.id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 처음 렌더링 시 한 번만 실행

  const handlePaymentSuccess = () => {
    // 결제 성공 후 주문 상태 재조회
    refreshOrder();
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  // 주문 상태가 pending이고 아직 결제가 완료되지 않은 경우 결제위젯 표시
  const showPaymentWidget =
    order.status === "pending" && order.payment_status !== "completed";

  // 주문 상품명 생성 (최대 2개까지 표시)
  const orderName =
    order.items.length === 1
      ? order.items[0].product_name
      : `${order.items[0].product_name} 외 ${order.items.length - 1}건`;

  // 배송 정보에서 고객 정보 추출
  const customerName = order.shipping_address?.recipientName;
  const customerPhone = order.shipping_address?.phone;
  const customerEmail = undefined; // 배송 정보에 이메일이 없으므로 undefined

  return (
    <>
      {showPaymentWidget && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">결제하기</h2>
          {paymentError && (
            <div className="mb-4 border border-destructive bg-destructive/10 rounded-lg p-4">
              <p className="text-sm text-destructive">{paymentError}</p>
            </div>
          )}
          <PaymentWidget
            orderId={order.id}
            orderName={orderName}
            amount={order.total_amount}
            customerEmail={customerEmail}
            customerName={customerName || undefined}
            customerPhone={customerPhone || undefined}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      )}

      {order.status === "confirmed" && order.payment_status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">✅ 결제가 완료되었습니다.</p>
          <p className="text-sm text-green-700 mt-1">
            주문이 확인되었으며, 곧 배송을 준비하겠습니다.
          </p>
        </div>
      )}

      {isRefreshing && (
        <div className="text-center text-muted-foreground mb-4">
          주문 정보를 불러오는 중...
        </div>
      )}
    </>
  );
}

