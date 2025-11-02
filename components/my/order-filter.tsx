/**
 * @file components/my/order-filter.tsx
 * @description 주문 필터 컴포넌트
 *
 * 주문 상태별로 필터링하는 Client Component입니다.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const statusFilters: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "결제 대기 중" },
  { value: "confirmed", label: "주문 확인됨" },
  { value: "shipped", label: "배송 중" },
  { value: "delivered", label: "배송 완료" },
  { value: "cancelled", label: "주문 취소" },
];

interface OrderFilterProps {
  currentFilter?: string;
}

export function OrderFilter({ currentFilter }: OrderFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (status: OrderStatus | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/my/orders?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {statusFilters.map((filter) => {
        const isActive =
          filter.value === "all"
            ? !currentFilter
            : currentFilter === filter.value;

        return (
          <Button
            key={filter.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
              "transition-all",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

