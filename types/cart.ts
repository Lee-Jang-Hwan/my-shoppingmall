/**
 * @file types/cart.ts
 * @description Cart 관련 타입 정의
 *
 * Supabase cart_items 테이블의 스키마를 기반으로 한 TypeScript 타입 정의
 */

import type { Product } from "./product";

/**
 * 장바구니 항목 기본 타입
 */
export interface CartItem {
  id: string; // UUID
  clerk_id: string; // Clerk 사용자 ID
  product_id: string; // UUID (products 테이블 참조)
  quantity: number; // 수량
  options: Record<string, unknown> | null; // 상품 옵션 (사이즈, 색상 등) - JSONB
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 상품 정보를 포함한 장바구니 항목 타입
 */
export interface CartItemWithProduct extends CartItem {
  product: Product;
}

/**
 * 장바구니 추가에 필요한 데이터 타입
 */
export interface AddToCartData {
  productId: string;
  quantity: number;
  options?: Record<string, unknown> | null;
}

/**
 * 장바구니 수량 변경에 필요한 데이터 타입
 */
export interface UpdateCartQuantityData {
  cartItemId: string;
  quantity: number;
}


