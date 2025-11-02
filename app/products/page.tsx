/**
 * @file app/products/page.tsx
 * @description 상품 목록 페이지
 *
 * 상품 목록을 표시하고, 카테고리 필터링, 정렬, 페이지네이션 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. URL 쿼리 파라미터 기반 필터링/정렬/페이지네이션
 * 2. 카테고리별 상품 필터링
 * 3. 정렬 기능 (최신순, 가격순, 이름순)
 * 4. 페이지네이션 (12개씩)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (Next.js 15 App Router 패턴)
 * - Supabase에서 상품 데이터 조회 및 필터링
 * - URL 쿼리 파라미터로 상태 관리
 *
 * @dependencies
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/components/product-card: 상품 카드 컴포넌트
 * - @/lib/categories: 카테고리 유틸리티
 * - @/types/product: Product 타입 정의
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product-card";
import { getCategoryLabel, type CategoryInfo } from "@/lib/categories";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 정렬 옵션 타입
 */
type SortOption = "newest" | "price_asc" | "price_desc" | "name";

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
      console.warn(`⚠️ 테이블 존재 확인 실패 (${tableName}):`, error.message);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * 상품 조회 결과 타입
 */
interface GetProductsResult {
  products: Product[];
  totalCount: number;
}

/**
 * 상품 조회 함수
 * 카테고리 필터링, 정렬, 페이지네이션 지원
 */
async function getProducts(
  category: string | null,
  sort: SortOption,
  page: number,
  pageSize: number = 12
): Promise<GetProductsResult> {
  console.group("[getProducts] 시작");
  try {
    console.log("1. Supabase 클라이언트 생성 중...");
    const supabase = createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 테이블 존재 여부 확인
    console.log("2. products 테이블 존재 여부 확인 중...");
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      console.error("❌ [getProducts] 테이블이 존재하지 않습니다!");
      console.error("📋 해결 방법:");
      console.error("   1. Supabase Dashboard → SQL Editor로 이동");
      console.error("   2. supabase/migrations/update_shopping_mall_schema.sql 파일 내용 실행");
      console.error("   3. 또는 Supabase Dashboard → Table Editor에서 테이블이 있는지 확인");
      console.error("   4. 테이블 생성 후 몇 초 기다렸다가 페이지 새로고침");
      console.groupEnd();
      return { products: [], totalCount: 0 };
    }
    console.log("✅ products 테이블 존재 확인 완료");

    // 쿼리 빌더 생성
    console.log("3. 상품 쿼리 빌더 생성 중...");
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    // 카테고리 필터 적용
    if (category) {
      console.log(`4. 카테고리 필터 적용: ${category}`);
      query = query.eq("category", category);
    }

    // 정렬 적용
    console.log(`5. 정렬 적용: ${sort}`);
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // 페이지네이션 적용
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    console.log(`6. 페이지네이션 적용: ${page}페이지 (${from}~${to})`);
    query = query.range(from, to);

    // 쿼리 실행
    console.log("7. Supabase 쿼리 실행 중...");
    const { data, error, count } = await query;

    if (error) {
      console.error("❌ [getProducts] Supabase 쿼리 에러 발생:");
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
      return { products: [], totalCount: 0 };
    }

    const products = (data as Product[]) || [];
    const totalCount = count || 0;

    console.log(`✅ [getProducts] 성공: ${products.length}개 상품 조회 (전체: ${totalCount}개)`);
    console.groupEnd();
    return { products, totalCount };
  } catch (error) {
    console.error("❌ [getProducts] 예외 발생:");
    console.error("- 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("- 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("- 스택:", error instanceof Error ? error.stack : "N/A");
    console.error("- 전체 에러:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();
    return { products: [], totalCount: 0 };
  }
}

/**
 * 카테고리 목록 조회 함수 (필터 UI용)
 */
async function getCategories(): Promise<CategoryInfo[]> {
  console.group("[getCategories] 시작");
  try {
    const supabase = createClerkSupabaseClient();

    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      console.error("❌ [getCategories] products 테이블이 존재하지 않습니다!");
      console.groupEnd();
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    if (error) {
      console.error("❌ [getCategories] Supabase 쿼리 에러 발생:", error.message);
      console.groupEnd();
      return [];
    }

    // 카테고리별 개수 계산
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
      .sort((a, b) => b.count - a.count);

    console.log(`✅ [getCategories] 성공: ${categories.length}개 카테고리`);
    console.groupEnd();
    return categories;
  } catch (error) {
    console.error("❌ [getCategories] 예외 발생:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * URL 쿼리 파라미터에서 정렬 옵션 추출
 */
function getSortOption(sortParam: string | null | undefined): SortOption {
  if (!sortParam) return "newest";

  const validSorts: SortOption[] = ["newest", "price_asc", "price_desc", "name"];
  return validSorts.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "newest";
}

/**
 * 정렬 옵션 표시명
 */
function getSortLabel(sort: SortOption): string {
  const labels: Record<SortOption, string> = {
    newest: "최신순",
    price_asc: "가격 낮은순",
    price_desc: "가격 높은순",
    name: "이름순",
  };
  return labels[sort];
}

/**
 * URL 쿼리 파라미터 생성 헬퍼
 */
function buildQueryString(params: Record<string, string | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  console.log("🛍️ [ProductsPage] 상품 목록 페이지 렌더링 시작");

  // URL 쿼리 파라미터 추출
  const params = await searchParams;
  const category = params.category || null;
  const sort = getSortOption(params.sort);
  const page = Math.max(1, parseInt(params.page || "1", 10));

  console.log("📋 쿼리 파라미터:");
  console.log(`- category: ${category || "없음"}`);
  console.log(`- sort: ${sort}`);
  console.log(`- page: ${page}`);

  // 데이터 조회
  const pageSize = 12;
  const [{ products, totalCount }, categories] = await Promise.all([
    getProducts(category, sort, page, pageSize),
    getCategories(),
  ]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  console.log(`✅ [ProductsPage] 렌더링 완료: ${products.length}개 상품, ${totalPages}페이지`);

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {/* 헤더 */}
        <section className="mb-8">
          <h1 className="mb-2 text-3xl font-bold lg:text-4xl">상품 목록</h1>
          {category && (
            <p className="text-lg text-muted-foreground">
              카테고리: <span className="font-semibold">{getCategoryLabel(category)}</span>
            </p>
          )}
          {!category && (
            <p className="text-lg text-muted-foreground">전체 상품을 확인하세요</p>
          )}
        </section>

        {/* 필터/정렬 섹션 */}
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            <Link href="/products">
              <Button
                variant={!category ? "default" : "outline"}
                size="sm"
              >
                전체
              </Button>
            </Link>
            {categories.map((categoryInfo) => (
              <Link
                key={categoryInfo.category}
                href={`/products${buildQueryString({
                  category: categoryInfo.category,
                  sort: sort !== "newest" ? sort : undefined,
                  page: page > 1 ? "1" : undefined,
                })}`}
              >
                <Button
                  variant={category === categoryInfo.category ? "default" : "outline"}
                  size="sm"
                >
                  {categoryInfo.label} ({categoryInfo.count})
                </Button>
              </Link>
            ))}
          </div>

          {/* 정렬 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">정렬:</span>
            <div className="flex gap-1 rounded-md border p-1">
              {(
                [
                  { value: "newest", label: "최신순" },
                  { value: "price_asc", label: "가격 낮은순" },
                  { value: "price_desc", label: "가격 높은순" },
                  { value: "name", label: "이름순" },
                ] as const
              ).map((option) => (
                <Link
                  key={option.value}
                  href={`/products${buildQueryString({
                    category: category || undefined,
                    sort: option.value !== "newest" ? option.value : undefined,
                    page: page > 1 ? "1" : undefined,
                  })}`}
                >
                  <Button
                    variant={sort === option.value ? "default" : "ghost"}
                    size="sm"
                    className="h-8"
                  >
                    {option.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 상품 그리드 */}
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-lg text-muted-foreground">
              {category ? `${getCategoryLabel(category)} 카테고리에 상품이 없습니다.` : "등록된 상품이 없습니다."}
            </p>
            {category && (
              <Link href="/products" className="mt-4 inline-block">
                <Button variant="outline">전체 상품 보기</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Link
                  href={`/products${buildQueryString({
                    category: category || undefined,
                    sort: sort !== "newest" ? sort : undefined,
                    page: hasPrevPage ? String(page - 1) : undefined,
                  })}`}
                >
                  <Button variant="outline" disabled={!hasPrevPage} size="sm">
                    이전
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  <span className="px-3 py-1 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (총 {totalCount}개)
                  </span>
                </div>

                <Link
                  href={`/products${buildQueryString({
                    category: category || undefined,
                    sort: sort !== "newest" ? sort : undefined,
                    page: hasNextPage ? String(page + 1) : undefined,
                  })}`}
                >
                  <Button variant="outline" disabled={!hasNextPage} size="sm">
                    다음
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

