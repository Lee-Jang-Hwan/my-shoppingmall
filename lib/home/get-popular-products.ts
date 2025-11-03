/**
 * @file lib/home/get-popular-products.ts
 * @description 인기상품 조회 함수
 *
 * order_items 테이블에서 판매수량을 집계하여 인기 상품을 조회합니다.
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import type { ProductsResult } from "./types";
import { checkTableExists, handleSupabaseError } from "./utils";
import { logger } from "./logger";

/**
 * 인기상품 조회 함수
 * order_items 테이블에서 판매수량을 집계하여 인기 상품 조회
 *
 * @returns 인기 상품 배열 (판매량 높은 순으로 정렬, 최대 8개)
 */
export async function getPopularProducts(): Promise<ProductsResult> {
  logger.debug("인기상품 조회 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // order_items 테이블 존재 여부 확인
    const orderItemsTableExists = await checkTableExists(supabase, "order_items");
    if (!orderItemsTableExists) {
      logger.debug("order_items 테이블이 존재하지 않습니다 (주문 데이터 없음)");
      return [];
    }

    logger.debug("order_items 테이블에서 판매 데이터 조회 중");

    // order_items에서 판매수량 집계
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .limit(1000); // 성능을 위해 제한

    if (orderError) {
      handleSupabaseError(orderError, {
        operation: "getPopularProducts",
        tableName: "order_items",
      });
      return [];
    }

    if (!orderItems || orderItems.length === 0) {
      logger.debug("주문 데이터가 없습니다 (정상 - 아직 주문이 없음)");
      return [];
    }

    logger.debug("판매수량 집계 중");

    // 판매수량 집계
    const salesCount: Record<string, number> = {};
    orderItems.forEach((item) => {
      const productId = item.product_id;
      salesCount[productId] = (salesCount[productId] || 0) + item.quantity;
    });

    // 판매수량이 있는 상품 ID 목록 (내림차순 정렬)
    const popularProductIds = Object.entries(salesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([productId]) => productId);

    if (popularProductIds.length === 0) {
      logger.debug("판매 데이터가 없으므로 빈 배열 반환");
      return [];
    }

    logger.debug(`인기 상품 ID ${popularProductIds.length}개 추출`);

    // products 테이블에서 상품 정보 조회
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .in("id", popularProductIds);

    if (productsError) {
      handleSupabaseError(productsError, {
        operation: "getPopularProducts",
        tableName: "products",
      });
      return [];
    }

    // 판매수량 순서대로 정렬
    const sortedProducts = (products as Product[]).sort(
      (a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0)
    );

    logger.info(`인기상품 조회 완료: ${sortedProducts.length}개`);
    return sortedProducts;
  } catch (error) {
    logger.error("인기상품 조회 중 예외 발생", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}


