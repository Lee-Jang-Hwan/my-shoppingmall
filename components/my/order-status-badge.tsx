/**
 * @file components/my/order-status-badge.tsx
 * @description 주문 상태 배지 컴포넌트
 *
 * 주문 상태를 색상이 적용된 배지로 표시하는 컴포넌트입니다.
 */

import { getOrderStatusLabel, getOrderStatusColor } from "@/utils/order";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const label = getOrderStatusLabel(status);
  const colorClasses = getOrderStatusColor(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
}

