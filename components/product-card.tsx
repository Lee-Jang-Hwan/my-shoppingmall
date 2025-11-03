/**
 * @file components/product-card.tsx
 * @description 상품 카드 컴포넌트
 *
 * 상품 정보를 카드 형태로 표시하는 컴포넌트 (ADEKUVER 스타일 - 이미지 중심 미니멀 디자인)
 */

import Link from "next/link";
import Image from "next/image";
import { SignedIn } from "@clerk/nextjs";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function ProductCard({ product, className }: ProductCardProps) {
  const isOutOfStock = product.stock_quantity === 0;
  const isPromotional = product.is_promotional ?? false;
  const priceFormatted = formatPrice(product.price);
  
  // 이미지 URL 우선순위: image_urls 배열의 첫 번째 이미지 > image_url > placeholder
  const imageUrl = product.image_urls?.[0] || product.image_url || "https://via.placeholder.com/400x533?text=No+Image";

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative block bg-card overflow-hidden transition-all hover:opacity-90",
        isOutOfStock && "opacity-60",
        className
      )}
    >
      {/* 프로모션 배지 */}
      {isPromotional && (
        <span className="absolute left-3 top-3 z-10 bg-black/70 text-white px-2 py-1 text-xs font-light tracking-wide uppercase">
          특가
        </span>
      )}

      {/* 품절 배지 */}
      {isOutOfStock && !isPromotional && (
        <span className="absolute right-3 top-3 z-10 bg-black/70 text-white px-2 py-1 text-xs font-light tracking-wide uppercase">
          품절
        </span>
      )}

      {/* 상품 이미지 */}
      <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* 상품 정보 */}
      <div className="pt-4 space-y-1 text-center">
        {/* 상품명 */}
        <SignedIn>
          <h3 className="text-sm font-bold text-foreground line-clamp-2 tracking-wide">
            {product.name}
          </h3>
        </SignedIn>

        {/* 상품 설명 */}
        {product.description && (
          <p className="text-xs text-muted-foreground font-light line-clamp-2 tracking-wide">
            {product.description}
          </p>
        )}

        {/* 가격 */}
        <p className={cn(
          "text-sm font-light tracking-wide",
          isPromotional ? "text-foreground" : "text-foreground"
        )}>
          {priceFormatted}원
        </p>
      </div>
    </Link>
  );
}

