/**
 * @file app/products/[id]/page.tsx
 * @description 상품 상세 페이지
 *
 * 상품의 상세 정보를 표시하고, 장바구니 추가 및 즉시 구매 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품 ID로 상품 정보 조회
 * 2. 조회수 자동 증가
 * 3. 상품 이미지, 기본 정보, 상세 정보 표시
 * 4. 수량 선택 및 구매 버튼 (Phase 3에서 기능 연결)
 * 5. 배송/반품 안내 표시
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (Next.js 15 App Router 패턴)
 * - Supabase에서 상품 데이터 조회
 * - DB 함수를 통한 조회수 증가
 * - 404 처리 (존재하지 않는 상품 또는 비활성 상품)
 *
 * @dependencies
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/types/product: Product 타입 정의
 * - @/lib/categories: 카테고리 유틸리티
 * - @/components/ui: shadcn/ui 컴포넌트
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import { getCategoryLabel } from "@/lib/categories";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Package, Truck, RotateCcw } from "lucide-react";

/**
 * 페이지 Props 타입
 */
interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

/**
 * 상품 조회 함수
 */
async function getProduct(productId: string): Promise<Product | null> {
  console.group("[getProduct] 시작");
  try {
    console.log(`1. 상품 ID: ${productId}`);
    
    const supabase = createClerkSupabaseClient();
    
    console.log("2. Supabase에서 상품 조회 중...");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("❌ [getProduct] 상품 조회 실패:", error.message);
      console.groupEnd();
      return null;
    }

    if (!data) {
      console.warn("⚠️ [getProduct] 상품을 찾을 수 없습니다");
      console.groupEnd();
      return null;
    }

    console.log("✅ [getProduct] 상품 조회 성공:", data.name);
    console.groupEnd();
    return data as Product;
  } catch (error) {
    console.error("❌ [getProduct] 예외 발생:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 조회수 증가 함수
 */
async function incrementViewCount(productId: string): Promise<void> {
  try {
    const supabase = createClerkSupabaseClient();
    await supabase.rpc("increment_product_view_count", {
      product_uuid: productId,
    });
    console.log(`✅ 조회수 증가 완료 (상품 ID: ${productId})`);
  } catch (error) {
    console.error("❌ 조회수 증가 실패:", error);
    // 조회수 증가 실패는 치명적 오류가 아니므로 계속 진행
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  console.log("🛍️ [ProductDetailPage] 상품 상세 페이지 렌더링 시작");

  const { id: productId } = await params;

  if (!productId) {
    console.error("❌ 상품 ID가 없습니다");
    notFound();
  }

  // 상품 데이터 조회
  const product = await getProduct(productId);

  if (!product) {
    console.error("❌ 상품을 찾을 수 없습니다");
    notFound();
  }

  // 조회수 증가 (비동기로 실행, 결과를 기다리지 않음)
  incrementViewCount(productId).catch((error) => {
    console.error("조회수 증가 오류 (무시됨):", error);
  });

  const isOutOfStock = product.stock_quantity === 0;
  const priceFormatted = formatPrice(product.price);
  const categoryLabel = getCategoryLabel(product.category);

  console.log(`✅ [ProductDetailPage] 렌더링 완료: ${product.name}`);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 상품 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* 상품 이미지 */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <Package className="w-24 h-24 opacity-50" />
              <span className="sr-only">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 상품 기본 정보 */}
        <div className="space-y-6">
          {/* 카테고리 및 품절 배지 */}
          <div className="flex items-center gap-2">
            {product.category && (
              <span className="inline-block rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {categoryLabel}
              </span>
            )}
            {isOutOfStock && (
              <span className="rounded-md bg-destructive/90 px-3 py-1 text-sm font-semibold text-white">
                품절
              </span>
            )}
          </div>

          {/* 상품명 */}
          <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

          {/* 가격 */}
          <div className="space-y-1">
            <p className="text-4xl font-bold text-foreground">
              {priceFormatted}원
            </p>
            {!isOutOfStock && (
              <p className="text-sm text-muted-foreground">
                재고 {product.stock_quantity}개
              </p>
            )}
          </div>

          {/* 설명 */}
          {product.description && (
            <p className="text-base text-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* 구분선 */}
          <div className="border-t border-border" />

          {/* 구매 액션 (수량 선택 및 장바구니 추가) */}
          <ProductPurchaseActions product={product} />

          {/* 배송 정보 (간단 버전) */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 text-sm">
              <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">배송 안내</p>
                <p className="text-muted-foreground mt-1">
                  일반 배송: 2-3일 소요 | 제주/도서산간: 4-5일 소요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상품 상세 정보 섹션 */}
      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">상품 상세 정보</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {product.description ? (
            <div className="whitespace-pre-wrap text-foreground">
              {product.description}
            </div>
          ) : (
            <p className="text-muted-foreground">상세 정보가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 배송/반품 안내 섹션 */}
      <div className="border-t border-border pt-8 mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">배송 및 반품 안내</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">배송 정보</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 배송비: 무료 (5만원 이상 구매 시)</li>
                  <li>• 배송 기간: 평일 기준 2-3일 소요</li>
                  <li>• 제주/도서산간 지역: 추가 배송비 및 4-5일 소요</li>
                  <li>• 배송 조회: 주문 완료 후 마이페이지에서 확인 가능</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">반품/교환 안내</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 반품 기간: 상품 수령 후 7일 이내</li>
                  <li>• 반품 조건: 미사용 및 택 제거 상태만 가능</li>
                  <li>• 반품비: 고객 부담 (단순 변심의 경우)</li>
                  <li>• 교환: 불량/오배송의 경우 무료 교환 가능</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

