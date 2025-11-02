-- ==========================================
-- order_items 테이블에 options 필드 추가
-- 장바구니 항목의 옵션 정보를 주문 상세 항목에 저장하기 위한 필드
-- ==========================================

-- order_items 테이블에 options JSONB 필드 추가
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS options JSONB;

COMMENT ON COLUMN public.order_items.options IS '주문 상품 옵션 정보 (사이즈, 색상 등) - 장바구니의 options와 동일한 구조';

