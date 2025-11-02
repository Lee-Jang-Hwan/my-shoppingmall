/**
 * @file components/cart/cart-item-list.tsx
 * @description 장바구니 항목 목록 컴포넌트
 *
 * 장바구니 항목들을 표시하고, 일괄 선택 및 삭제 기능을 제공합니다.
 */

"use client";

import { useState, useTransition } from "react";
import { CartItem } from "@/components/cart/cart-item";
import { removeCartItems } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { CartItemWithProduct } from "@/types/cart";

interface CartItemListProps {
  items: CartItemWithProduct[];
  onSelectedIdsChange?: (selectedIds: string[]) => void;
}

export function CartItemList({
  items: initialItems,
  onSelectedIdsChange,
}: CartItemListProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // 선택된 ID 배열을 부모에게 전달
  const updateSelectedIds = (newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
    if (onSelectedIdsChange) {
      onSelectedIdsChange(Array.from(newSelectedIds));
    }
  };

  // 항목 선택/해제
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      updateSelectedIds(next);
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      const newSet = new Set<string>();
      setSelectedIds(newSet);
      updateSelectedIds(newSet);
    } else {
      const newSet = new Set<string>(items.map((item) => item.id));
      setSelectedIds(newSet);
      updateSelectedIds(newSet);
    }
  };

  // 선택된 항목 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    if (
      !confirm(
        `선택한 ${selectedIds.size}개의 항목을 장바구니에서 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await removeCartItems(Array.from(selectedIds));
        // 삭제된 항목을 목록에서 제거
        setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
        const newSet = new Set<string>();
        setSelectedIds(newSet);
        updateSelectedIds(newSet);
      } catch (error) {
        console.error("일괄 삭제 실패:", error);
        alert(
          `삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      }
    });
  };

  // 개별 항목 삭제 후 목록 업데이트
  const handleItemRemoved = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      updateSelectedIds(next);
      return next;
    });
  };

  // 개별 항목 업데이트 후 목록 업데이트
  const handleItemUpdated = (updatedItem: CartItemWithProduct) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 일괄 선택 및 삭제 */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.size === items.length && items.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4"
          />
          <span className="text-sm">
            전체 선택 ({selectedIds.size}/{items.length})
          </span>
        </label>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchDelete}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            선택 삭제 ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* 장바구니 항목 목록 */}
      <div className="space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => toggleSelect(item.id)}
            onRemoved={handleItemRemoved}
            onUpdated={handleItemUpdated}
          />
        ))}
      </div>
    </div>
  );
}

