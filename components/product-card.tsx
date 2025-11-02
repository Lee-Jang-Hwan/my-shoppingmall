/**
 * @file components/product-card.tsx
 * @description 상품 카드 컴포넌트
 *
 * 상품 정보를 카드 형태로 표시하는 컴포넌트
 */

import Link from "next/link";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";

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
  const priceFormatted = formatPrice(product.price);
  const categoryLabel = getCategoryLabel(product.category);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative block rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50",
        isOutOfStock && "opacity-60",
        className
      )}
    >
      {/* 품절 배지 */}
      {isOutOfStock && (
        <span className="absolute right-2 top-2 rounded-md bg-destructive/90 px-2 py-1 text-xs font-semibold text-white">
          품절
        </span>
      )}

      {/* 카테고리 배지 */}
      {product.category && (
        <span className="mb-2 inline-block rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {categoryLabel}
        </span>
      )}

      {/* 상품명 */}
      <h3 className="mb-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors">
        {product.name}
      </h3>

      {/* 상품 설명 (선택적) */}
      {product.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      )}

      {/* 가격 및 재고 정보 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">
            {priceFormatted}원
          </p>
          {!isOutOfStock && (
            <p className="text-xs text-muted-foreground">
              재고 {product.stock_quantity}개
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

