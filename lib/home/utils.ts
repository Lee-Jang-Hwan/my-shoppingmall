/**
 * @file lib/home/utils.ts
 * @description 홈페이지 데이터 조회 공통 유틸리티 함수
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logger } from "./logger";

/**
 * Supabase 클라이언트 타입
 */
export type SupabaseClient = ReturnType<typeof createClerkSupabaseClient>;

/**
 * 테이블 존재 여부를 확인하는 함수
 * 
 * @param supabase - Supabase 클라이언트
 * @param tableName - 확인할 테이블 이름
 * @returns 테이블 존재 여부
 */
export async function checkTableExists(
  supabase: SupabaseClient,
  tableName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .limit(1);

    if (error) {
      logger.warn(`테이블 존재 확인 실패 (${tableName})`, { error: error.message });
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    logger.error(`테이블 존재 확인 중 예외 발생 (${tableName})`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Supabase 쿼리 에러를 분석하고 로깅하는 함수
 * 
 * @param error - Supabase 에러 객체
 * @param context - 추가 컨텍스트 정보
 */
export function handleSupabaseError(
  error: { code?: string; message?: string; details?: string; hint?: string },
  context: { operation: string; tableName?: string }
): void {
  logger.error(`${context.operation} 에러 발생`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    tableName: context.tableName,
  });

  // PGRST205 에러 특별 처리
  if (error.code === "PGRST205") {
    logger.warn(
      "PostgREST가 테이블을 스키마 캐시에서 찾지 못했습니다. 스키마 캐시 갱신이 필요할 수 있습니다."
    );
  }
}

