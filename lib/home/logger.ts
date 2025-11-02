/**
 * @file lib/home/logger.ts
 * @description 환경별 로깅 유틸리티
 *
 * 개발 환경에서는 상세 로그를 출력하고, 프로덕션 환경에서는 에러만 로깅합니다.
 */

import type { Logger } from "./types";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * 환경별 로깅 헬퍼
 */
export const logger: Logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context || "");
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context || "");
  },

  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context || "");
  },
};

