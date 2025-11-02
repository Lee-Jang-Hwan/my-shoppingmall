/**
 * @file app/admin/products/new/page.tsx
 * @description 상품 등록 페이지
 *
 * 관리자가 새 상품을 등록하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 상품 기본 정보 입력 (이름, 가격, 설명)
 * 2. 다중 이미지 업로드
 * 3. 카테고리 선택
 * 4. 상품 옵션 설정 (사이즈, 색상 등)
 * 5. 재고 수량 설정
 * 6. 프로모션/특가 여부 설정
 *
 * @dependencies
 * - components/admin/product-form.tsx: 상품 등록 폼
 */

import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">새 상품 등록</h1>
        <p className="mt-2 text-muted-foreground">
          새로운 상품 정보를 입력하고 등록합니다.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}

