-- ==========================================
-- 장바구니 옵션 필드 추가 및 UNIQUE 제약 수정
-- 파일명: 20251103012043_add_cart_options.sql
-- ==========================================

-- 1. 기존 UNIQUE 제약 제거
ALTER TABLE public.cart_items 
DROP CONSTRAINT IF EXISTS cart_items_clerk_id_product_id_key;

-- 2. options JSONB 필드 추가 (옵션 정보 저장용)
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

COMMENT ON COLUMN public.cart_items.options IS '상품 옵션 정보 (사이즈, 색상 등) - JSON 형식, NULL 허용';

-- 3. 새로운 복합 유니크 제약 추가 (clerk_id, product_id, options 조합)
-- options가 NULL인 경우와 JSONB 객체인 경우를 모두 처리하기 위해
-- COALESCE와 jsonb_typeof를 사용하여 NULL을 'null' 문자열로 변환
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_unique_user_product_options 
ON public.cart_items (
  clerk_id, 
  product_id, 
  COALESCE(options::text, 'null')
);

-- 4. options 필드에 대한 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_cart_items_options 
ON public.cart_items USING GIN (options);

-- 5. 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE '✅ cart_items 테이블에 options 필드 추가 및 UNIQUE 제약 수정 완료';
END $$;

