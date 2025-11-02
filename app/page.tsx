/**
 * @file app/page.tsx
 * @description 홈 페이지
 *
 * 쇼핑몰 홈페이지 - 기획 상품, 최신 상품, 인기상품, 디자인 콜라보 섹션을 표시합니다.
 */

import { ProductCard } from "@/components/product-card";
import { BrandBannerSlider } from "@/components/home/brand-banner-slider";
import { getPromotionalProducts } from "@/lib/home/get-promotional-products";
import { getLatestProducts } from "@/lib/home/get-latest-products";
import { getPopularProducts } from "@/lib/home/get-popular-products";
import { getCollaborationProducts } from "@/lib/home/get-collaboration-products";
import { logger } from "@/lib/home/logger";

export default async function Home() {
  logger.debug("홈페이지 컴포넌트 렌더링 시작");

  // 병렬로 모든 데이터 조회
  const [promotionalProducts, latestProducts, popularProducts, collaborationProducts] =
    await Promise.all([
      getPromotionalProducts(),
      getLatestProducts(),
      getPopularProducts(),
      getCollaborationProducts(),
    ]);

  logger.info("모든 데이터 조회 완료", {
    promotionalProducts: promotionalProducts.length,
    latestProducts: latestProducts.length,
    popularProducts: popularProducts.length,
    collaborationProducts: collaborationProducts.length,
  });

  // 브랜드 배너 슬라이드 데이터 (예시 - 실제로는 데이터베이스나 설정에서 가져와야 함)
  const brandBannerSlides = [
    {
      id: "ashley-williams",
      imageUrl: "/1.jpg",
      imageLink: "/products?category=collaboration",
      brandName: "ASHLEY WILLIAMS",
      description: `런던 기반 디자이너 애슐리 윌리엄스가 이끄는 브랜드 ASHLEY WILLIAMS.<br>펑크와 키치, 유머러스한 감성을 결합해 90년대 하위문화와 여성의 개성을 자유롭게 재해석합니다.<br>시그니처 모티프와 대담한 그래픽, 그리고 예측 불가능한 위트를 통해 독창적인 '런던 걸' 무드를 완성합니다.`,
      products: collaborationProducts.slice(0, 3),
    },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
        {/* 브랜드 배너 슬라이더 */}
        {brandBannerSlides.length > 0 && (
          <BrandBannerSlider slides={brandBannerSlides} />
        )}

        {/* 기획 상품 섹션 */}
        {promotionalProducts.length > 0 && (
          <section className="mb-16 lg:mb-24">
            <h2 className="mb-8 text-xs font-light tracking-[0.2em] uppercase text-muted-foreground">
              Promotion
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {promotionalProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 최신 상품 섹션 */}
        <section className="mb-16 lg:mb-24">
          <h2 className="mb-8 text-xs font-light tracking-[0.2em] uppercase text-muted-foreground">
            New Arrivals
          </h2>

          {latestProducts.length === 0 ? (
            <div className="border-t border-border pt-12 text-center">
              <p className="text-sm text-muted-foreground font-light">
                등록된 상품이 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 인기상품 섹션 */}
        {popularProducts.length > 0 && (
          <section className="mb-16 lg:mb-24">
            <h2 className="mb-8 text-xs font-light tracking-[0.2em] uppercase text-muted-foreground">
              Best Sellers
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 디자인 콜라보 섹션 */}
        {collaborationProducts.length > 0 && (
          <section className="mb-16 lg:mb-24">
            <h2 className="mb-8 text-xs font-light tracking-[0.2em] uppercase text-muted-foreground">
              Collaboration
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collaborationProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <span className="absolute left-3 top-3 z-10 bg-black/70 text-white px-2 py-1 text-xs font-light tracking-wide uppercase">
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
