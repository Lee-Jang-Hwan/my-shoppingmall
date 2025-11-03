/**
 * @file lib/home/get-categories.ts
 * @description 카테고리 목록 조회 함수
 *
 * 각 카테고리별 상품 개수와 함께 반환합니다.
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getCategoryLabel, type CategoryInfo } from "@/lib/categories";
import type { CategoriesResult } from "./types";
import { checkTableExists, handleSupabaseError } from "./utils";
import { logger } from "./logger";

/**
 * 카테고리 목록 조회 함수
 * 각 카테고리별 상품 개수와 함께 반환
 *
 * @returns 카테고리 정보 배열 (상품 개수 많은 순으로 정렬)
 */
export async function getCategories(): Promise<CategoriesResult> {
  logger.debug("카테고리 목록 조회 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // 테이블 존재 여부 확인
    const tableExists = await checkTableExists(supabase, "products");
    if (!tableExists) {
      logger.error("products 테이블이 존재하지 않습니다", {
        operation: "getCategories",
      });
      return [];
    }

    logger.debug("products 테이블에서 카테고리 목록 조회 중");

    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    if (error) {
      handleSupabaseError(error, {
        operation: "getCategories",
        tableName: "products",
      });
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
      .sort((a, b) => b.count - a.count); // 상품 개수 많은 순으로 정렬

    logger.info(`카테고리 목록 조회 완료: ${categories.length}개`);
    return categories;
  } catch (error) {
    logger.error("카테고리 목록 조회 중 예외 발생", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}


