/**
 * @file app/page.tsx
 * @description 홈 페이지
 *
 * 쇼핑몰 홈페이지 - 최신 상품, 카테고리, 인기상품, 디자인 콜라보 섹션을 표시합니다.
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product-card";
import { getCategoryLabel, type CategoryInfo } from "@/lib/categories";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 테이블 존재 여부 확인 함수
 */
async function checkTableExists(
  supabase: ReturnType<typeof createClerkSupabaseClient>,
  tableName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .limit(1);

    if (error) {
      // information_schema 접근이 안될 수 있으므로 별도 쿼리 시도
      console.warn(`⚠️ 테이블 존재 확인 실패 (${tableName}):`, error.message);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * 최신 상품 조회 함수
 * 활성 상품만 최신순으로 조회 (최대 12개)
 */
async function getLatestProducts(): Promise<Product[]> {
  console.group("[getLatestProducts] 시작");
  try {
    console.log("1. Supabase 클라이언트 생성 중...");
    const supabase = createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 테이블 존재 여부 확인
    console.log("2. products 테이블 존재 여부 확인 중...");
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      console.error("❌ [getLatestProducts] 테이블이 존재하지 않습니다!");
      console.error("📋 해결 방법:");
      console.error("   1. Supabase Dashboard → SQL Editor로 이동");
      console.error("   2. supabase/migrations/update_shopping_mall_schema.sql 파일 내용 실행");
      console.error("   3. 또는 Supabase Dashboard → Table Editor에서 테이블이 있는지 확인");
      console.error("   4. 테이블 생성 후 몇 초 기다렸다가 페이지 새로고침");
      console.groupEnd();
      return [];
    }
    console.log("✅ products 테이블 존재 확인 완료");

    console.log("3. products 테이블에서 최신 상품 조회 중...");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("❌ [getLatestProducts] Supabase 쿼리 에러 발생:");
      console.error("- 에러 코드:", error.code);
      console.error("- 에러 메시지:", error.message);
      console.error("- 에러 상세:", error.details);
      console.error("- 에러 힌트:", error.hint);

      // PGRST205 에러 특별 처리
      if (error.code === "PGRST205") {
        console.error("🔍 [PGRST205 에러 분석]");
        console.error("   이 에러는 PostgREST가 테이블을 스키마 캐시에서 찾지 못했을 때 발생합니다.");
        console.error("📋 해결 방법:");
        console.error("   1. Supabase Dashboard → SQL Editor 열기");
        console.error("   2. 다음 SQL 실행하여 스키마 캐시 갱신:");
        console.error("      NOTIFY pgrst, 'reload schema';");
        console.error("   3. 또는 Supabase Dashboard → Table Editor 새로고침 (F5)");
        console.error("   4. 마이그레이션이 적용되지 않았다면:");
        console.error("      supabase/migrations/update_shopping_mall_schema.sql 실행");
      }

      console.error("- 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.groupEnd();
      return [];
    }

    console.log(`✅ [getLatestProducts] 성공: ${data?.length || 0}개 상품 조회`);
    console.groupEnd();
    return (data as Product[]) || [];
  } catch (error) {
    console.error("❌ [getLatestProducts] 예외 발생:");
    console.error("- 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("- 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("- 스택:", error instanceof Error ? error.stack : "N/A");
    console.error("- 전체 에러:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();
    return [];
  }
}

/**
 * 카테고리 목록 조회 함수
 * 각 카테고리별 상품 개수와 함께 반환
 */
async function getCategories(): Promise<CategoryInfo[]> {
  console.group("[getCategories] 시작");
  try {
    console.log("1. Supabase 클라이언트 생성 중...");
    const supabase = createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 테이블 존재 여부 확인
    console.log("2. products 테이블 존재 여부 확인 중...");
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      console.error("❌ [getCategories] products 테이블이 존재하지 않습니다!");
      console.error("📋 해결 방법: getLatestProducts 함수의 에러 메시지 참고");
      console.groupEnd();
      return [];
    }
    console.log("✅ products 테이블 존재 확인 완료");

    console.log("3. products 테이블에서 카테고리 목록 조회 중...");
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    if (error) {
      console.error("❌ [getCategories] Supabase 쿼리 에러 발생:");
      console.error("- 에러 코드:", error.code);
      console.error("- 에러 메시지:", error.message);
      console.error("- 에러 상세:", error.details);
      console.error("- 에러 힌트:", error.hint);

      // PGRST205 에러 특별 처리
      if (error.code === "PGRST205") {
        console.error("🔍 [PGRST205 에러] 스키마 캐시 문제입니다.");
        console.error("📋 해결: NOTIFY pgrst, 'reload schema'; 실행 또는 Dashboard 새로고침");
      }

      console.error("- 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.groupEnd();
      return [];
    }

    console.log(`✅ 카테고리 데이터 조회 성공: ${data?.length || 0}개 행`);

    // 카테고리별 개수 계산
    console.log("4. 카테고리별 개수 계산 중...");
    const categoryCounts: Record<string, number> = {};
    data?.forEach((item) => {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    // CategoryInfo 배열로 변환
    const categories: CategoryInfo[] = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        label: getCategoryLabel(category),
        count,
      }))
      .sort((a, b) => b.count - a.count); // 상품 개수 많은 순으로 정렬

    console.log(`✅ [getCategories] 성공: ${categories.length}개 카테고리`);
    console.groupEnd();
    return categories;
  } catch (error) {
    console.error("❌ [getCategories] 예외 발생:");
    console.error("- 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("- 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("- 스택:", error instanceof Error ? error.stack : "N/A");
    console.error("- 전체 에러:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();
    return [];
  }
}

/**
 * 인기상품 조회 함수
 * order_items 테이블에서 판매수량을 집계하여 인기 상품 조회
 */
async function getPopularProducts(): Promise<Product[]> {
  console.group("[getPopularProducts] 시작");
  try {
    console.log("1. Supabase 클라이언트 생성 중...");
    const supabase = createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // order_items 테이블 존재 여부 확인
    console.log("2. order_items 테이블 존재 여부 확인 중...");
    const orderItemsTableExists = await checkTableExists(supabase, "order_items");
    if (!orderItemsTableExists) {
      console.warn("⚠️ [getPopularProducts] order_items 테이블이 존재하지 않습니다.");
      console.warn("   (주문 데이터가 없으므로 인기 상품을 계산할 수 없습니다.)");
      console.warn("   이는 정상적인 상황일 수 있습니다. 주문이 발생하면 자동으로 표시됩니다.");
      console.groupEnd();
      return [];
    }
    console.log("✅ order_items 테이블 존재 확인 완료");

    // order_items에서 판매수량 집계
    console.log("3. order_items 테이블에서 판매 데이터 조회 중...");
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .limit(1000); // 성능을 위해 제한

    if (orderError) {
      console.error("❌ [getPopularProducts] order_items 조회 에러 발생:");
      console.error("- 에러 코드:", orderError.code);
      console.error("- 에러 메시지:", orderError.message);
      console.error("- 에러 상세:", orderError.details);
      console.error("- 에러 힌트:", orderError.hint);

      // PGRST205 에러 특별 처리
      if (orderError.code === "PGRST205") {
        console.error("🔍 [PGRST205 에러] order_items 테이블을 찾을 수 없습니다.");
        console.error("📋 해결 방법:");
        console.error("   1. Supabase Dashboard → SQL Editor");
        console.error("   2. supabase/migrations/update_shopping_mall_schema.sql 실행");
        console.error("   3. 또는: NOTIFY pgrst, 'reload schema'; 실행");
        console.error("   4. 주문이 없는 경우 이 섹션은 표시되지 않습니다 (정상)");
      }

      console.error("- 전체 에러 객체:", JSON.stringify(orderError, null, 2));
      console.log("⚠️ 판매 데이터가 없으므로 빈 배열 반환");
      console.groupEnd();
      return [];
    }

    console.log(`✅ order_items 조회 성공: ${orderItems?.length || 0}개 주문 항목`);

    if (!orderItems || orderItems.length === 0) {
      console.log("⚠️ 주문 데이터가 없습니다. (정상 - 아직 주문이 없음)");
      console.log("   인기 상품 섹션은 주문이 발생하면 자동으로 표시됩니다.");
      console.groupEnd();
      return [];
    }

    // 판매수량 집계
    console.log("4. 판매수량 집계 중...");
    const salesCount: Record<string, number> = {};
    orderItems?.forEach((item) => {
      const productId = item.product_id;
      salesCount[productId] = (salesCount[productId] || 0) + item.quantity;
    });

    // 판매수량이 있는 상품 ID 목록 (내림차순 정렬)
    const popularProductIds = Object.entries(salesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([productId]) => productId);

    if (popularProductIds.length === 0) {
      console.log("⚠️ 판매 데이터가 없으므로 빈 배열 반환");
      console.groupEnd();
      return [];
    }

    console.log(`✅ 인기 상품 ID ${popularProductIds.length}개 추출`);

    // products 테이블 존재 여부 확인
    console.log("5. products 테이블 존재 여부 확인 중...");
    const productsTableExists = await checkTableExists(supabase, "products");
    if (!productsTableExists) {
      console.error("❌ products 테이블이 존재하지 않습니다!");
      console.groupEnd();
      return [];
    }

    // 상품 정보 조회
    console.log("6. products 테이블에서 상품 정보 조회 중...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .in("id", popularProductIds);

    if (productsError) {
      console.error("❌ [getPopularProducts] products 조회 에러 발생:");
      console.error("- 에러 코드:", productsError.code);
      console.error("- 에러 메시지:", productsError.message);
      console.error("- 에러 상세:", productsError.details);
      console.error("- 에러 힌트:", productsError.hint);

      if (productsError.code === "PGRST205") {
        console.error("🔍 [PGRST205 에러] products 테이블을 찾을 수 없습니다.");
        console.error("📋 해결: 마이그레이션 파일 실행 또는 스키마 캐시 갱신");
      }

      console.error("- 전체 에러 객체:", JSON.stringify(productsError, null, 2));
      console.groupEnd();
      return [];
    }

    // 판매수량 순서대로 정렬
    const sortedProducts = (products as Product[]).sort(
      (a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0)
    );

    console.log(`✅ [getPopularProducts] 성공: ${sortedProducts.length}개 인기 상품`);
    console.groupEnd();
    return sortedProducts;
  } catch (error) {
    console.error("❌ [getPopularProducts] 예외 발생:");
    console.error("- 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("- 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("- 스택:", error instanceof Error ? error.stack : "N/A");
    console.error("- 전체 에러:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();
    return [];
  }
}

/**
 * 디자인 콜라보 상품 조회 함수
 * 상품명 또는 설명에 콜라보 관련 키워드가 포함된 상품 조회
 */
async function getCollaborationProducts(): Promise<Product[]> {
  console.group("[getCollaborationProducts] 시작");
  try {
    console.log("1. Supabase 클라이언트 생성 중...");
    const supabase = createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 테이블 존재 여부 확인
    console.log("2. products 테이블 존재 여부 확인 중...");
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      console.error("❌ [getCollaborationProducts] products 테이블이 존재하지 않습니다!");
      console.error("📋 해결 방법: getLatestProducts 함수의 에러 메시지 참고");
      console.groupEnd();
      return [];
    }
    console.log("✅ products 테이블 존재 확인 완료");

    console.log("3. products 테이블에서 디자인 콜라보 상품 조회 중...");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(
        "category.eq.collaboration,name.ilike.%콜라보%,name.ilike.%collaboration%,name.ilike.%디자인%,description.ilike.%콜라보%,description.ilike.%collaboration%,description.ilike.%디자인%"
      )
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("❌ [getCollaborationProducts] Supabase 쿼리 에러 발생:");
      console.error("- 에러 코드:", error.code);
      console.error("- 에러 메시지:", error.message);
      console.error("- 에러 상세:", error.details);
      console.error("- 에러 힌트:", error.hint);

      if (error.code === "PGRST205") {
        console.error("🔍 [PGRST205 에러] 스키마 캐시 문제입니다.");
        console.error("📋 해결: NOTIFY pgrst, 'reload schema'; 실행 또는 Dashboard 새로고침");
      }

      console.error("- 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.groupEnd();
      return [];
    }

    console.log(`✅ [getCollaborationProducts] 성공: ${data?.length || 0}개 콜라보 상품`);
    console.groupEnd();
    return (data as Product[]) || [];
  } catch (error) {
    console.error("❌ [getCollaborationProducts] 예외 발생:");
    console.error("- 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("- 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("- 스택:", error instanceof Error ? error.stack : "N/A");
    console.error("- 전체 에러:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();
    return [];
  }
}

export default async function Home() {
  console.log("🏠 [Home] 홈페이지 컴포넌트 렌더링 시작");
  console.log("환경변수 확인:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 없음");
  console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 없음");

  console.log("병렬로 데이터 조회 시작...");
  const [latestProducts, categories, popularProducts, collaborationProducts] =
    await Promise.all([
      getLatestProducts(),
      getCategories(),
      getPopularProducts(),
      getCollaborationProducts(),
    ]);

  console.log("✅ [Home] 모든 데이터 조회 완료:");
  console.log(`- 최신 상품: ${latestProducts.length}개`);
  console.log(`- 카테고리: ${categories.length}개`);
  console.log(`- 인기 상품: ${popularProducts.length}개`);
  console.log(`- 콜라보 상품: ${collaborationProducts.length}개`);

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {/* 헤더 섹션 */}
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold lg:text-5xl">
            쇼핑몰에 오신 것을 환영합니다
          </h1>
          <p className="text-lg text-muted-foreground lg:text-xl">
            최신 상품을 확인하고 쇼핑을 시작하세요
          </p>
        </section>

        {/* 카테고리 진입 섹션 */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">카테고리</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {categories.map((categoryInfo) => (
                <Link
                  key={categoryInfo.category}
                  href={`/products?category=${encodeURIComponent(categoryInfo.category)}`}
                >
                  <Button
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4 transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    <span className="text-base font-semibold">
                      {categoryInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {categoryInfo.count}개
                    </span>
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 최신 상품 섹션 */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">최신 상품</h2>

          {latestProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                등록된 상품이 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 인기상품 섹션 */}
        {popularProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">
              인기 상품 <span className="text-sm text-muted-foreground">BEST</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 디자인 콜라보 섹션 */}
        {collaborationProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">
              디자인 콜라보{" "}
              <span className="text-sm text-muted-foreground">COLLABORATION</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collaborationProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <span className="absolute right-2 top-2 z-10 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                    콜라보
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
