/**
 * @file lib/home/get-promotional-products.ts
 * @description 기획 상품 조회 함수
 *
 * 프로모션/특가 상품을 조회합니다 (is_promotional = true).
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import type { ProductsResult } from "./types";
import { checkTableExists, handleSupabaseError } from "./utils";
import { logger } from "./logger";

/**
 * 기획 상품 조회 함수
 * is_promotional = true인 활성 상품을 최신순으로 조회
 *
 * @returns 기획 상품 배열 (최대 8개)
 */
export async function getPromotionalProducts(): Promise<ProductsResult> {
  logger.debug("기획 상품 조회 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // 테이블 존재 여부 확인
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      logger.error("products 테이블이 존재하지 않습니다", {
        operation: "getPromotionalProducts",
      });
      return [];
    }

    logger.debug("products 테이블에서 기획 상품 조회 중");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_promotional", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      handleSupabaseError(error, {
        operation: "getPromotionalProducts",
        tableName: "products",
      });
      return [];
    }

    const products = (data as Product[]) || [];
    logger.info(`기획 상품 조회 완료: ${products.length}개`);
    return products;
  } catch (error) {
    logger.error("기획 상품 조회 중 예외 발생", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

