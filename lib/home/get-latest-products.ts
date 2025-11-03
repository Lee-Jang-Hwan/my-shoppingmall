/**
 * @file lib/home/get-latest-products.ts
 * @description 최신 상품 조회 함수
 *
 * 활성 상품만 최신순으로 조회합니다 (최대 12개).
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import type { ProductsResult } from "./types";
import { checkTableExists, handleSupabaseError } from "./utils";
import { logger } from "./logger";

/**
 * 최신 상품 조회 함수
 * 활성 상품만 최신순으로 조회 (최대 12개)
 *
 * @returns 최신 상품 배열
 */
export async function getLatestProducts(): Promise<ProductsResult> {
  logger.debug("최신 상품 조회 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // 테이블 존재 여부 확인 (최초 1회만)
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      logger.error("products 테이블이 존재하지 않습니다", {
        operation: "getLatestProducts",
      });
      return [];
    }

    logger.debug("products 테이블에서 최신 상품 조회 중");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      handleSupabaseError(error, {
        operation: "getLatestProducts",
        tableName: "products",
      });
      return [];
    }

    const products = (data as Product[]) || [];
    logger.info(`최신 상품 조회 완료: ${products.length}개`);
    return products;
  } catch (error) {
    logger.error("최신 상품 조회 중 예외 발생", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}


