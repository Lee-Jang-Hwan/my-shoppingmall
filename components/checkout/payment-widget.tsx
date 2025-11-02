/**
 * @file components/checkout/payment-widget.tsx
 * @description Toss Payments 결제위젯 컴포넌트
 *
 * Toss Payments 결제위젯을 렌더링하고 결제 프로세스를 처리합니다.
 *
 * 주요 기능:
 * 1. Toss Payments SDK 동적 로드
 * 2. 결제위젯 초기화 및 렌더링
 * 3. 결제 요청 처리
 * 4. 결제 성공/실패 콜백 처리
 *
 * @dependencies
 * - actions/payment.ts: confirmPayment, updateOrderPayment
 * - @clerk/nextjs: useAuth (사용자 정보)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Script from "next/script";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }

  interface TossPaymentsInstance {
    widgets: (options: {
      customerKey?: string;
    }) => TossPaymentsWidgets;
  }

  interface TossPaymentsWidgets {
    setAmount(options: { currency: string; value: number }): Promise<void>;
    renderPaymentMethods(options: {
      selector: string;
      variantKey: string;
    }): Promise<void>;
    renderAgreement(options: {
      selector: string;
      variantKey: string;
    }): Promise<void>;
    requestPayment(options: {
      orderId: string;
      orderName: string;
      successUrl: string;
      failUrl: string;
      customerEmail?: string;
      customerName?: string;
      customerMobilePhone?: string;
    }): Promise<void>;
  }
}

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

/**
 * Toss Payments 결제위젯 컴포넌트
 */
export function PaymentWidget({
  orderId,
  orderName,
  amount,
  customerEmail,
  customerName,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
}: PaymentWidgetProps) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const isInitializedRef = useRef(false);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;

  useEffect(() => {
    // SDK 로드 및 위젯 초기화는 Script onLoad에서 처리
    if (!clientKey) {
      setError("결제 서비스를 사용할 수 없습니다. 클라이언트 키가 설정되지 않았습니다.");
      setIsLoading(false);
    }
  }, [clientKey]);

  const initializeWidget = async () => {
    if (!window.TossPayments || !clientKey || isInitializedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Toss Payments 인스턴스 생성
      const tossPayments = window.TossPayments(clientKey);

      // 위젯 인스턴스 생성 (회원 결제)
      const customerKey = userId || "anonymous";
      const widgets = tossPayments.widgets({
        customerKey,
      });

      widgetsRef.current = widgets;

      // 결제 금액 설정
      await widgets.setAmount({
        currency: "KRW",
        value: amount,
      });

      // 결제 UI 렌더링
      await Promise.all([
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      isInitializedRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error("❌ 결제위젯 초기화 실패:", err);
      setError("결제위젯을 불러오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!widgetsRef.current || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // 결제 요청
      // successUrl과 failUrl은 Toss Payments가 자동으로 paymentKey, orderId, amount 등을 쿼리 파라미터로 추가합니다
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/complete?orderId=${orderId}`,
        failUrl: `${window.location.origin}/checkout/complete?orderId=${orderId}`,
        customerEmail,
        customerName,
        customerMobilePhone: customerPhone,
      });
    } catch (err: unknown) {
      console.error("❌ 결제 요청 실패:", err);
      const errorMessage =
        err instanceof Error ? err.message : "결제 요청 중 오류가 발생했습니다.";
      setError(errorMessage);
      setIsProcessing(false);
      onPaymentError?.(errorMessage);
    }
  };


  if (!clientKey) {
    return (
      <div className="border border-border rounded-lg p-6">
        <p className="text-destructive">
          결제 서비스를 사용할 수 없습니다. 관리자에게 문의하세요.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toss Payments SDK 로드 */}
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={initializeWidget}
        strategy="lazyOnload"
      />

      <div className="space-y-6">
        {error && (
          <div className="border border-destructive bg-destructive/10 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="border border-border rounded-lg p-6">
            <p className="text-center text-muted-foreground">결제위젯을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 결제 UI 영역 */}
            <div className="space-y-4">
              <div id="payment-method" />
              <div id="agreement" />
            </div>

            {/* 결제하기 버튼 */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !!error}
              className="w-full"
              size="lg"
            >
              {isProcessing ? "결제 처리 중..." : `${amount.toLocaleString()}원 결제하기`}
            </Button>
          </>
        )}
      </div>
    </>
  );
}

