/**
 * @file lib/home/types.ts
 * @description 홈페이지 데이터 조회 함수들을 위한 공통 타입 정의
 */

import { Product } from "@/types/product";
import { CategoryInfo } from "@/lib/categories";

/**
 * 데이터 조회 함수의 공통 반환 타입
 * 모든 조회 함수는 Product 배열을 반환
 */
export type ProductsResult = Product[];

/**
 * 카테고리 조회 함수의 반환 타입
 */
export type CategoriesResult = CategoryInfo[];

/**
 * 로깅 레벨 타입
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 로깅 옵션
 */
export interface LogOptions {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * 환경별 로깅 헬퍼 함수 타입
 */
export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

