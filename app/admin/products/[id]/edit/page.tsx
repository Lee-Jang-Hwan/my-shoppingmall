/**
 * @file app/admin/products/[id]/edit/page.tsx
 * @description 상품 수정 페이지
 *
 * 관리자가 기존 상품 정보를 수정하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 기존 상품 정보 불러오기
 * 2. 상품 정보 수정
 * 3. 이미지 추가/삭제
 * 4. 상품 옵션 수정
 * 5. 상품 상태 변경
 *
 * @dependencies
 * - components/admin/product-form.tsx: 상품 수정 폼
 * - actions/admin/products.ts: 상품 데이터 조회
 */

import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  // 상품 정보 불러오기
  const supabase = createClerkSupabaseClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  // 상품이 없으면 목록으로 리다이렉트
  if (error || !product) {
    redirect("/admin");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">상품 수정</h1>
        <p className="mt-2 text-muted-foreground">
          상품 정보를 수정합니다.
        </p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}

