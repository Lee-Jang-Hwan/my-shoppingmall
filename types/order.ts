/**
 * @file types/order.ts
 * @description Order 관련 타입 정의
 *
 * Supabase orders 및 order_items 테이블의 스키마를 기반으로 한 TypeScript 타입 정의
 */

/**
 * 배송 정보 타입
 */
export interface ShippingAddress {
  recipientName: string; // 수령인 이름
  phone: string; // 연락처 (휴대폰 번호)
  postalCode: string; // 우편번호
  address: string; // 기본 주소
  detailAddress: string; // 상세 주소
  deliveryRequest?: string; // 배송 요청사항 (선택사항)
}

/**
 * 주문 상태 타입
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * 결제 상태 타입
 */
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * 주문 테이블 타입 (orders)
 */
export interface Order {
  id: string; // UUID
  clerk_id: string; // Clerk 사용자 ID
  total_amount: number; // DECIMAL(10,2) - 주문 총액 (상품 금액 + 배송비)
  status: OrderStatus; // 주문 상태
  shipping_address: ShippingAddress | null; // 배송 정보 (JSONB)
  order_note: string | null; // 주문 메모
  payment_id: string | null; // 결제 ID (Phase 4에서 사용)
  payment_method: string | null; // 결제 수단 (CARD, TRANSFER 등)
  payment_status: PaymentStatus | null; // 결제 상태
  payment_data: Record<string, unknown> | null; // 결제 관련 추가 데이터 (JSONB)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 주문 상세 항목 타입 (order_items)
 */
export interface OrderItem {
  id: string; // UUID
  order_id: string; // UUID (orders 테이블 참조)
  product_id: string; // UUID (products 테이블 참조)
  product_name: string; // 상품명 (주문 시점의 상품명 저장)
  quantity: number; // 수량
  price: number; // DECIMAL(10,2) - 주문 시점의 상품 가격
  options: Record<string, unknown> | null; // 상품 옵션 (사이즈, 색상 등) - JSONB
  created_at: string; // ISO 8601 timestamp
}

/**
 * 주문과 주문 항목을 함께 조회하는 타입
 */
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * 주문 생성에 필요한 데이터 타입
 */
export interface CreateOrderData {
  cartItemIds: string[]; // 선택한 장바구니 항목 ID 배열
  shippingAddress: ShippingAddress; // 배송 정보
  orderNote?: string | null; // 주문 메모 (선택사항)
}

/**
 * 배송 정보 폼 데이터 타입
 */
export interface ShippingFormData {
  recipientName: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  deliveryRequest?: string;
  orderNote?: string; // 주문 메모
}

