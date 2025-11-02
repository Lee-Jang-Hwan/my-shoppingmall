/**
 * @file utils/order.ts
 * @description 주문 관련 유틸리티 함수
 *
 * 주문 상태 변환, 배지 색상, 날짜 포맷팅 등의 공통 함수를 제공합니다.
 */

import type { OrderStatus } from "@/types/order";

/**
 * 주문 상태를 한글 레이블로 변환합니다.
 *
 * @param status - 주문 상태
 * @returns 한글 레이블
 */
export function getOrderStatusLabel(status: OrderStatus | string): string {
  const statusMap: Record<string, string> = {
    pending: "주문 접수",
    confirmed: "주문 확인",
    shipped: "배송 중",
    delivered: "배송 완료",
    cancelled: "주문 취소",
  };
  return statusMap[status] || status;
}

/**
 * 주문 상태에 따른 배지 색상 클래스를 반환합니다.
 *
 * @param status - 주문 상태
 * @returns Tailwind CSS 색상 클래스
 */
export function getOrderStatusColor(status: OrderStatus | string): string {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500 text-white",
    confirmed: "bg-blue-500 text-white",
    shipped: "bg-purple-500 text-white",
    delivered: "bg-green-500 text-white",
    cancelled: "bg-red-500 text-white",
  };
  return colorMap[status] || "bg-gray-500 text-white";
}

/**
 * 주문 일시를 한국어 형식으로 포맷팅합니다.
 *
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export function formatOrderDate(dateString: string): string {
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 가격을 천단위 콤마로 포맷팅합니다.
 *
 * @param price - 가격
 * @returns 포맷팅된 가격 문자열
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

