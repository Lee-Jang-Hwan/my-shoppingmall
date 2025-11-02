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
 * 실제 쿼리를 시도해서 테이블 접근 가능 여부를 확인
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
    // 실제 쿼리를 시도해서 테이블 접근 가능 여부 확인
    const { error } = await supabase
      .from(tableName)
      .select("id")
      .limit(1);

    // 테이블이 존재하면 에러가 없거나, 존재하지 않으면 에러 발생
    if (error) {
      // PGRST116: 테이블이 존재하지 않음
      // 42P01: relation does not exist (PostgreSQL 에러 코드)
      if (
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        (error.message?.includes("does not exist") && error.message?.includes("relation")) ||
        error.message?.includes("does not exist")
      ) {
        logger.warn(`테이블이 존재하지 않습니다 (${tableName})`, { 
          error: error.message,
          code: error.code 
        });
        return false;
      }
      // 다른 에러(권한 문제, RLS 정책 등)는 테이블이 존재하는 것으로 간주
      // 데이터가 없어도 테이블은 존재하는 것으로 간주
      logger.debug(`테이블 접근 시도 (${tableName})`, { 
        error: error.message,
        code: error.code,
        hint: "테이블은 존재하지만 접근에 문제가 있을 수 있습니다"
      });
      return true; // 테이블은 존재하는 것으로 간주
    }

    // 에러가 없으면 테이블 존재
    return true;
  } catch (error) {
    // 예외 발생 시에도 테이블이 존재하는 것으로 간주 (권한 문제일 수 있음)
    logger.debug(`테이블 존재 확인 중 예외 발생 (${tableName})`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return true; // 예외 발생 시에도 true 반환 (테이블은 존재하지만 접근 문제일 수 있음)
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

