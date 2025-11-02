/**
 * @file components/admin/product-list.tsx
 * @description 관리자용 상품 목록 컴포넌트
 *
 * 관리자가 상품 목록을 조회하고 관리할 수 있는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 전체 상품 목록 표시
 * 2. 상품 상태별 필터링 (판매중/품절/숨김)
 * 3. 검색 기능 (이름, 설명)
 * 4. 정렬 기능
 * 5. 상품 수정/삭제 링크
 *
 * @dependencies
 * - actions/admin/products.ts: 상품 데이터 조회
 * - components/ui: shadcn/ui 컴포넌트
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminProducts, deleteProduct } from "@/actions/admin/products";
import type { Product } from "@/types/product";
import { getCategoryLabel } from "@/lib/categories";

/**
 * 상품 상태 타입
 */
type ProductStatus = "active" | "out_of_stock" | "hidden" | null;

/**
 * 정렬 옵션 타입
 */
type SortOption = "name" | "price" | "created_at" | "view_count";

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus>(null);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  // 상품 목록 조회
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({
        search: search || undefined,
        status: status ?? undefined,
        sortBy,
        sortOrder,
      });
      setProducts(data);
    } catch (error) {
      console.error("상품 목록 조회 에러:", error);
      // 에러 발생 시 빈 배열로 설정
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 필터 변경 시 자동 조회
  useEffect(() => {
    startTransition(() => {
      loadProducts();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sortBy, sortOrder]);

  // 상품 삭제 처리
  const handleDelete = async (id: string, productName: string) => {
    if (
      !confirm(
        `"${productName}" 상품을 삭제하시겠습니까?\n\n소프트 삭제(숨김)됩니다.`
      )
    ) {
      return;
    }

    try {
      await deleteProduct(id, false); // 소프트 삭제
      // 목록 새로고침
      loadProducts();
    } catch (error) {
      console.error("상품 삭제 에러:", error);
      alert(`상품 삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  // 상태 레이블
  const getStatusLabel = (status: Product["status"]): string => {
    const statusMap = {
      active: "판매중",
      out_of_stock: "품절",
      hidden: "숨김",
    };
    return statusMap[status] || status;
  };

  // 상태 색상
  const getStatusColor = (status: Product["status"]): string => {
    const colorMap = {
      active: "bg-green-500",
      out_of_stock: "bg-orange-500",
      hidden: "bg-gray-500",
    };
    return colorMap[status] || "bg-gray-500";
  };

  if (loading) {
    return <div className="text-center py-8">상품 목록을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            type="text"
            placeholder="상품명 또는 설명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={status ?? ""}
            onChange={(e) =>
              setStatus(
                e.target.value === ""
                  ? null
                  : (e.target.value as ProductStatus)
              )
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">전체 상태</option>
            <option value="active">판매중</option>
            <option value="out_of_stock">품절</option>
            <option value="hidden">숨김</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by as SortOption);
              setSortOrder(order as "asc" | "desc");
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="created_at-desc">최신순</option>
            <option value="created_at-asc">오래된순</option>
            <option value="name-asc">이름순 (가나다)</option>
            <option value="name-desc">이름순 (역순)</option>
            <option value="price-asc">가격순 (낮은순)</option>
            <option value="price-desc">가격순 (높은순)</option>
            <option value="view_count-desc">조회수순</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || status
            ? "조건에 맞는 상품이 없습니다."
            : "등록된 상품이 없습니다."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold">이미지</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">상품명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">가격</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">재고</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">조회수</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const mainImage =
                  product.image_urls?.[0] || product.image_url || "/logo.png";

                return (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="h-16 w-16 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getCategoryLabel(product.category)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatPrice(product.price)}원
                    </td>
                    <td className="px-4 py-3 text-sm">{product.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs text-white ${getStatusColor(product.status)}`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.view_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

