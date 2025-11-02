/**
 * @file components/my/order-cancel-button.tsx
 * @description 주문 취소 버튼 컴포넌트
 *
 * 주문 취소 버튼과 확인 다이얼로그를 제공하는 컴포넌트입니다.
 * 실제 취소 로직은 Phase 5 이후 구현 예정이므로, 현재는 UI만 제공합니다.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderCancelButtonProps {
  orderId: string;
}

export function OrderCancelButton({ orderId }: OrderCancelButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    // TODO: Phase 5 이후 실제 취소 로직 구현
    console.log("주문 취소 요청:", orderId);
    
    // 임시로 다이얼로그만 닫기
    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
      alert("주문 취소 기능은 곧 제공될 예정입니다.");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full mb-6">
          주문 취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주문 취소 확인</DialogTitle>
          <DialogDescription>
            정말로 이 주문을 취소하시겠습니까? 취소된 주문은 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            아니오
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "네, 취소합니다"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

