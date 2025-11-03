/**
 * @file lib/home/get-collaboration-products.ts
 * @description 디자인 콜라보 상품 조회 함수
 *
 * 상품명 또는 설명에 콜라보 관련 키워드가 포함된 상품을 조회합니다.
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/product";
import type { ProductsResult } from "./types";
import { checkTableExists, handleSupabaseError } from "./utils";
import { logger } from "./logger";

/**
 * 디자인 콜라보 상품 조회 함수
 * 상품명 또는 설명에 콜라보 관련 키워드가 포함된 상품 조회
 *
 * @returns 콜라보 상품 배열 (최대 6개)
 */
export async function getCollaborationProducts(): Promise<ProductsResult> {
  logger.debug("디자인 콜라보 상품 조회 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // 테이블 존재 여부 확인
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      logger.error("products 테이블이 존재하지 않습니다", {
        operation: "getCollaborationProducts",
      });
      return [];
    }

    logger.debug("products 테이블에서 디자인 콜라보 상품 조회 중");

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
      handleSupabaseError(error, {
        operation: "getCollaborationProducts",
        tableName: "products",
      });
      return [];
    }

    const products = (data as Product[]) || [];
    logger.info(`디자인 콜라보 상품 조회 완료: ${products.length}개`);
    return products;
  } catch (error) {
    logger.error("디자인 콜라보 상품 조회 중 예외 발생", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}


