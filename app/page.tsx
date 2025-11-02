/**
 * @file app/page.tsx
 * @description 홈 페이지
 *
 * 쇼핑몰 홈페이지 - 카테고리, 기획 상품, 최신 상품, 인기상품, 디자인 콜라보 섹션을 표시합니다.
 */

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCategories } from "@/lib/home/get-categories";
import { getPromotionalProducts } from "@/lib/home/get-promotional-products";
import { getLatestProducts } from "@/lib/home/get-latest-products";
import { getPopularProducts } from "@/lib/home/get-popular-products";
import { getCollaborationProducts } from "@/lib/home/get-collaboration-products";
import { logger } from "@/lib/home/logger";

export default async function Home() {
  logger.debug("홈페이지 컴포넌트 렌더링 시작");

  // 병렬로 모든 데이터 조회
  const [categories, promotionalProducts, latestProducts, popularProducts, collaborationProducts] =
    await Promise.all([
      getCategories(),
      getPromotionalProducts(),
      getLatestProducts(),
      getPopularProducts(),
      getCollaborationProducts(),
    ]);

  logger.info("모든 데이터 조회 완료", {
    categories: categories.length,
    promotionalProducts: promotionalProducts.length,
    latestProducts: latestProducts.length,
    popularProducts: popularProducts.length,
    collaborationProducts: collaborationProducts.length,
  });

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

        {/* 기획 상품 섹션 */}
        {promotionalProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">
              기획 상품{" "}
              <span className="text-sm text-muted-foreground">PROMOTION</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {promotionalProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
