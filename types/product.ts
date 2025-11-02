/**
 * @file types/product.ts
 * @description Product 타입 정의
 *
 * Supabase products 테이블의 스키마를 기반으로 한 TypeScript 타입 정의
 */

/**
 * 상품 정보 타입
 */
export interface Product {
  id: string; // UUID
  name: string;
  description: string | null;
  price: number; // DECIMAL(10,2)
  category: string | null;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null; // 상품 이미지 URL (Supabase Storage 또는 외부 URL) - 단일 이미지 (호환성)
  image_urls: string[] | null; // 상품 이미지 URL 배열 (다중 이미지 지원)
  view_count: number; // 조회수 (인기상품 추천에 사용)
  is_promotional: boolean; // 프로모션/특가 상품 여부
  original_price: number | null; // 원가 (할인율 계산용, 프로모션 상품인 경우 할인 전 가격)
  discount_percentage: number | null; // 할인율 (0-100%, 원가 대비 할인 비율)
  promotion_start_date: string | null; // 프로모션 시작일시 (ISO 8601 timestamp)
  promotion_end_date: string | null; // 프로모션 종료일시 (ISO 8601 timestamp)
  options: Record<string, unknown> | null; // 상품 옵션 (사이즈, 색상 등) - JSONB
  status: "active" | "out_of_stock" | "hidden"; // 상품 상태
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 상품 카드 표시용 타입 (필요시 사용)
 */
export type ProductCard = Pick<
  Product,
  "id" | "name" | "price" | "category" | "stock_quantity"
>;

