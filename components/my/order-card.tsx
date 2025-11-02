/**
 * @file components/my/order-card.tsx
 * @description 주문 카드 컴포넌트
 *
 * 주문 목록에서 각 주문을 카드 형태로 표시하는 컴포넌트입니다.
 */

import Link from "next/link";
import type { Order } from "@/types/order";
import { OrderStatusBadge } from "@/components/my/order-status-badge";
import { formatOrderDate, formatPrice } from "@/utils/order";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
  className?: string;
}

export function OrderCard({ order, className }: OrderCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* 헤더: 주문 번호와 상태 */}
      <div className="mb-4 flex items-start justify-between border-b border-border pb-4">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold">주문 번호</h3>
          <p className="text-sm font-mono text-muted-foreground">{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* 주문 정보 */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">주문 일시</span>
          <span className="text-sm font-medium">
            {formatOrderDate(order.created_at)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">주문 금액</span>
          <span className="text-base font-semibold">
            {formatPrice(order.total_amount)}원
          </span>
        </div>
      </div>

      {/* 주문 상세 보기 버튼 */}
      <Link href={`/my/orders/${order.id}`}>
        <Button variant="outline" className="w-full">
          주문 상세 보기
        </Button>
      </Link>
    </div>
  );
}

