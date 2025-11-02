-- ==========================================
-- 상품 기능 추가 마이그레이션
-- PRD.md Phase 2 기능 구현을 위한 스키마 업데이트
-- ==========================================
-- 
-- 업데이트 내용:
-- 1. products 테이블에 이미지 URL 필드 추가
-- 2. products 테이블에 조회수 필드 추가 (인기상품 추천용)
-- 3. 성능 최적화를 위한 추가 인덱스
-- 4. 결제 통합을 위한 orders 테이블 필드 추가 (Phase 4 준비)
-- ==========================================

-- 1. products 테이블에 이미지 URL 필드 추가
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.products.image_url IS '상품 이미지 URL (Supabase Storage 또는 외부 URL)';

-- 2. products 테이블에 조회수 필드 추가 (인기상품 추천용)
-- PRD.md Phase 2: "인기상품 섹션 (판매량/조회수 기반 추천)"
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);

COMMENT ON COLUMN public.products.view_count IS '상품 조회수 (인기상품 추천에 사용)';

-- 3. 성능 최적화를 위한 추가 인덱스
-- 상품 목록 페이지의 정렬 및 필터링 성능 개선

-- 가격 인덱스 (정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_products_price_asc ON public.products(price ASC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price_desc ON public.products(price DESC) WHERE is_active = true;

-- 이름 인덱스 (이름순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_products_name_asc ON public.products(name ASC) WHERE is_active = true;

-- 조회수 인덱스 (인기상품 추천용)
CREATE INDEX IF NOT EXISTS idx_products_view_count ON public.products(view_count DESC) WHERE is_active = true;

-- 카테고리 + 정렬 복합 인덱스 (카테고리 필터링 + 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_products_category_created_at ON public.products(category, created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_price ON public.products(category, price) WHERE is_active = true;

-- 4. orders 테이블에 결제 관련 필드 추가 (Phase 4: 결제 통합 준비)
-- Toss Payments 결제 정보 저장용
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_id TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_data JSONB;

COMMENT ON COLUMN public.orders.payment_id IS 'Toss Payments 결제 ID (paymentKey 또는 paymentKey)';
COMMENT ON COLUMN public.orders.payment_method IS '결제 수단 (CARD, TRANSFER 등)';
COMMENT ON COLUMN public.orders.payment_status IS '결제 상태';
COMMENT ON COLUMN public.orders.payment_data IS '결제 관련 추가 데이터 (JSON 형식)';

-- 결제 ID 인덱스 (결제 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id) WHERE payment_id IS NOT NULL;

-- 결제 상태 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 5. 상품 조회수 증가 함수 생성
-- 상품 상세 페이지 방문 시 자동으로 조회수 증가
CREATE OR REPLACE FUNCTION increment_product_view_count(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_product_view_count(UUID) IS '상품 조회수 1 증가 (상품 상세 페이지 방문 시 호출)';

-- 6. 인기 상품 조회 함수 생성 (조회수와 판매량 종합)
-- 현재는 애플리케이션 레벨에서 처리하지만, 추후 성능 최적화를 위해 DB 함수로 구현 가능
-- 주석 처리: 필요시 활성화
/*
CREATE OR REPLACE FUNCTION get_popular_products(limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN,
  image_url TEXT,
  view_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  popularity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.*,
    (
      COALESCE(SUM(oi.quantity), 0) * 2 + -- 판매량 가중치 2
      p.view_count * 1                    -- 조회수 가중치 1
    )::NUMERIC AS popularity_score
  FROM public.products p
  LEFT JOIN public.order_items oi ON p.id = oi.product_id
  WHERE p.is_active = true
  GROUP BY p.id
  ORDER BY popularity_score DESC, p.view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_popular_products(INTEGER) IS '인기 상품 조회 (판매량과 조회수 종합)';
*/

-- 7. 기존 인덱스 확인 및 최적화 (필요시)
-- 기존 인덱스가 있으면 유지하고, 없으면 생성 (IF NOT EXISTS 사용)

-- 테이블 통계 업데이트 (인덱스 효율성 향상)
ANALYZE public.products;
ANALYZE public.orders;

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 
-- 적용된 변경사항:
-- ✅ products 테이블: image_url, view_count 필드 추가
-- ✅ products 테이블: 성능 최적화 인덱스 추가
-- ✅ orders 테이블: 결제 관련 필드 추가 (Phase 4 준비)
-- ✅ 상품 조회수 증가 함수 추가
-- 
-- 다음 단계:
-- 1. 상품 상세 페이지 구현 시 increment_product_view_count() 함수 사용
-- 2. Phase 4 결제 통합 시 orders.payment_* 필드 활용
-- 3. 필요시 get_popular_products() 함수 활성화하여 성능 최적화
-- ==========================================

