/**
 * @file components/checkout/checkout-client.tsx
 * @description 주문 페이지 클라이언트 컴포넌트
 *
 * 주문 폼 제출 시 에러 처리를 담당하는 클라이언트 컴포넌트입니다.
 */

"use client";

import { useState } from "react";
import { ShippingForm } from "@/components/checkout/shipping-form";
import type { ShippingFormData } from "@/types/order";

interface CheckoutClientProps {
  onSubmit: (data: ShippingFormData) => Promise<void>;
}

export function CheckoutClient({ onSubmit }: CheckoutClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ShippingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "주문 생성에 실패했습니다. 다시 시도해주세요.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4">
          <p className="font-medium">주문 생성 실패</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      <ShippingForm onSubmit={handleSubmit} isLoading={isLoading} onError={handleError} />
    </div>
  );
}

