/**
 * @file components/admin/product-form.tsx
 * @description 상품 등록/수정 폼 컴포넌트
 *
 * 관리자가 상품을 등록하거나 수정하는 폼입니다.
 *
 * 주요 기능:
 * 1. 상품 기본 정보 입력 (이름, 가격, 설명)
 * 2. 카테고리 선택
 * 3. 재고 수량 설정
 * 4. 프로모션/특가 여부 설정
 * 5. 상품 상태 설정
 * 6. 이미지 업로드 (다중 이미지 지원)
 * 7. 상품 옵션 설정 (사이즈, 색상 등)
 *
 * @dependencies
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 * - actions/admin/products.ts: 상품 생성/수정
 * - components/admin/product-image-upload.tsx: 이미지 업로드
 * - components/admin/product-options-form.tsx: 옵션 설정
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createProduct, updateProduct } from "@/actions/admin/products";
import type { Product } from "@/types/product";
import { getCategoryLabel } from "@/lib/categories";
import { ProductImageUpload } from "./product-image-upload";
import { ProductOptionsForm } from "./product-options-form";

/**
 * 카테고리 옵션
 */
const CATEGORIES = [
  { value: "electronics", label: "전자제품" },
  { value: "clothing", label: "의류" },
  { value: "books", label: "도서" },
  { value: "food", label: "식품" },
  { value: "sports", label: "스포츠" },
  { value: "beauty", label: "뷰티" },
  { value: "home", label: "생활/가정" },
  { value: "collaboration", label: "디자인 콜라보" },
] as const;

/**
 * 상품 상태 옵션
 */
const STATUS_OPTIONS = [
  { value: "active", label: "판매중" },
  { value: "out_of_stock", label: "품절" },
  { value: "hidden", label: "숨김" },
] as const;

/**
 * 상품 폼 스키마 (Zod)
 */
const productFormSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요.").max(200, "상품명은 200자 이하여야 합니다."),
  description: z.string().max(5000, "설명은 5000자 이하여야 합니다.").optional().nullable(),
  price: z.number().min(0, "가격은 0원 이상이어야 합니다."),
  category: z.string().optional().nullable(),
  stock_quantity: z.number().int().min(0, "재고 수량은 0개 이상이어야 합니다."),
  is_promotional: z.boolean().default(false),
  status: z.enum(["active", "out_of_stock", "hidden"]).default("active"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.image_urls ?? product?.image_url ? [product.image_url] : []
  );
  const [options, setOptions] = useState<Record<string, unknown>>(
    product?.options ?? {}
  );

  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? null,
      price: product?.price ?? 0,
      category: product?.category ?? null,
      stock_quantity: product?.stock_quantity ?? 0,
      is_promotional: product?.is_promotional ?? false,
      status: product?.status ?? "active",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        if (isEditMode && product) {
          await updateProduct({
            id: product.id,
            ...data,
            image_urls: imageUrls.length > 0 ? imageUrls : null,
            options: Object.keys(options).length > 0 ? options : null,
          });
        } else {
          await createProduct({
            ...data,
            image_urls: imageUrls.length > 0 ? imageUrls : null,
            options: Object.keys(options).length > 0 ? options : null,
          });
        }

        // 성공 시 목록으로 이동
        router.push("/admin");
        router.refresh();
      } catch (error) {
        console.error("상품 저장 에러:", error);
        alert(
          `상품 저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 정보</h2>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상품명 *</FormLabel>
                <FormControl>
                  <Input placeholder="상품명을 입력하세요" {...field} />
                </FormControl>
                <FormDescription>상품의 이름을 입력하세요.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="상품 설명을 입력하세요"
                    rows={5}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>상품에 대한 상세 설명을 입력하세요.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가격 (원) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>상품의 판매 가격을 입력하세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>재고 수량 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>보유 재고 수량을 입력하세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">카테고리 선택</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>상품의 카테고리를 선택하세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상품 상태 *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>상품의 판매 상태를 선택하세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_promotional"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="cursor-pointer">프로모션/특가 상품</FormLabel>
                  <FormDescription>
                    기획 상품 섹션에 표시할지 여부를 선택하세요.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 이미지 업로드 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">상품 이미지</h2>
          <ProductImageUpload imageUrls={imageUrls} onChange={setImageUrls} />
        </div>

        {/* 상품 옵션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">상품 옵션</h2>
          <ProductOptionsForm options={options} onChange={setOptions} />
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "저장 중..." : isEditMode ? "수정 완료" : "상품 등록"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}

