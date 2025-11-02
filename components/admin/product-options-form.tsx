/**
 * @file components/admin/product-options-form.tsx
 * @description 상품 옵션 설정 폼 컴포넌트
 *
 * 관리자가 상품 옵션(사이즈, 색상 등)을 설정할 수 있는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 사이즈 옵션 추가/삭제
 * 2. 색상 옵션 추가/삭제
 * 3. 커스텀 옵션 추가/삭제
 * 4. JSON 형식으로 저장
 *
 * @dependencies
 * - components/ui: shadcn/ui 컴포넌트
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface ProductOptionsFormProps {
  options: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}

/**
 * 기본 옵션 타입
 */
const DEFAULT_OPTION_TYPES = ["sizes", "colors"] as const;

export function ProductOptionsForm({
  options,
  onChange,
}: ProductOptionsFormProps) {
  // 사이즈 옵션
  const sizes = (options.sizes as string[]) || [];
  const [newSize, setNewSize] = useState("");

  // 색상 옵션
  const colors = (options.colors as string[]) || [];
  const [newColor, setNewColor] = useState("");

  // 커스텀 옵션
  const customOptions = Object.entries(options).filter(
    ([key]) => !DEFAULT_OPTION_TYPES.includes(key as typeof DEFAULT_OPTION_TYPES[number])
  );

  // 사이즈 추가
  const handleAddSize = () => {
    if (!newSize.trim()) return;
    const updatedSizes = [...sizes, newSize.trim()];
    onChange({ ...options, sizes: updatedSizes });
    setNewSize("");
  };

  // 사이즈 삭제
  const handleRemoveSize = (index: number) => {
    const updatedSizes = sizes.filter((_, i) => i !== index);
    onChange({ ...options, sizes: updatedSizes });
  };

  // 색상 추가
  const handleAddColor = () => {
    if (!newColor.trim()) return;
    const updatedColors = [...colors, newColor.trim()];
    onChange({ ...options, colors: updatedColors });
    setNewColor("");
  };

  // 색상 삭제
  const handleRemoveColor = (index: number) => {
    const updatedColors = colors.filter((_, i) => i !== index);
    onChange({ ...options, colors: updatedColors });
  };

  return (
    <div className="space-y-6">
      {/* 사이즈 옵션 */}
      <div className="space-y-2">
        <Label>사이즈 옵션</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="예: S, M, L, XL"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSize();
              }
            }}
          />
          <Button type="button" onClick={handleAddSize} size="default">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size, index) => (
              <div
                key={index}
                className="flex items-center gap-1 rounded-md border bg-background px-3 py-1"
              >
                <span className="text-sm">{size}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSize(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {sizes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            사이즈 옵션이 없습니다. 위에서 사이즈를 추가하세요.
          </p>
        )}
      </div>

      {/* 색상 옵션 */}
      <div className="space-y-2">
        <Label>색상 옵션</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="예: 빨강, 파랑, 검정"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddColor();
              }
            }}
          />
          <Button type="button" onClick={handleAddColor} size="default">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {colors.map((color, index) => (
              <div
                key={index}
                className="flex items-center gap-1 rounded-md border bg-background px-3 py-1"
              >
                <span className="text-sm">{color}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {colors.length === 0 && (
          <p className="text-sm text-muted-foreground">
            색상 옵션이 없습니다. 위에서 색상을 추가하세요.
          </p>
        )}
      </div>

      {/* 옵션 미리보기 */}
      {(sizes.length > 0 || colors.length > 0) && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <Label className="mb-2 block">옵션 미리보기 (JSON)</Label>
          <pre className="overflow-auto rounded bg-background p-2 text-xs">
            {JSON.stringify(
              {
                sizes: sizes.length > 0 ? sizes : undefined,
                colors: colors.length > 0 ? colors : undefined,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

