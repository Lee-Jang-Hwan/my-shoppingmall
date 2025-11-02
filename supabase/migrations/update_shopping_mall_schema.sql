-- ==========================================
-- 쇼핑몰 통합 스키마 업데이트
-- PRD.md 기반 모든 Phase 기능 구현
-- ==========================================
-- 
-- 이 파일은 PRD.md에 정의된 모든 기능을 지원하는 완전한 데이터베이스 스키마를 정의합니다.
-- 
-- 포함된 기능:
-- - Phase 1: 기본 인프라 (users, products, cart_items, orders, order_items)
-- - Phase 2: 상품 기능 (이미지, 조회수, 프로모션, 옵션, 상태)
-- - Phase 3: 장바구니 & 주문 (옵션 지원, 배송비 계산, 결제 준비)
-- - Phase 4: 결제 통합 (결제 필드)
-- - Phase 5: 마이페이지 (주문 내역 조회 준비)
-- 
-- 참고: RLS는 비활성화되어 있습니다 (PRD.md 제약사항)
-- ==========================================

-- ==========================================
-- 1. 기본 테이블 생성
-- ==========================================

-- 1-1. Users 테이블 (Clerk 연동)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.users IS 'Clerk 인증과 연동되는 사용자 정보';
COMMENT ON COLUMN public.users.clerk_id IS 'Clerk User ID (외부 키)';

-- 1-2. Products 테이블 (기본)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category TEXT,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.products IS '상품 정보 테이블';
COMMENT ON COLUMN public.products.is_active IS '상품 활성화 여부 (true: 판매중, false: 비활성화)';

-- 1-3. Cart Items 테이블
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    options JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.cart_items IS '장바구니 항목 테이블';
COMMENT ON COLUMN public.cart_items.clerk_id IS 'Clerk User ID (외부 키)';
COMMENT ON COLUMN public.cart_items.options IS '상품 옵션 정보 (사이즈, 색상 등) - JSON 형식';

-- 1-4. Orders 테이블
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB,
    order_note TEXT,
    payment_id TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.orders IS '주문 정보 테이블';
COMMENT ON COLUMN public.orders.clerk_id IS 'Clerk User ID (외부 키)';
COMMENT ON COLUMN public.orders.status IS '주문 상태 (pending: 결제 대기, confirmed: 주문 확인, shipped: 배송중, delivered: 배송완료, cancelled: 취소)';
COMMENT ON COLUMN public.orders.shipping_address IS '배송 주소 정보 (JSON 형식)';
COMMENT ON COLUMN public.orders.payment_id IS 'Toss Payments 결제 ID';
COMMENT ON COLUMN public.orders.payment_method IS '결제 수단 (CARD, TRANSFER 등)';
COMMENT ON COLUMN public.orders.payment_status IS '결제 상태';
COMMENT ON COLUMN public.orders.payment_data IS '결제 관련 추가 데이터 (JSON 형식)';

-- 1-5. Order Items 테이블
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.order_items IS '주문 상세 항목 테이블';
COMMENT ON COLUMN public.order_items.product_name IS '주문 시점의 상품명 (스냅샷)';
COMMENT ON COLUMN public.order_items.options IS '주문 상품 옵션 정보 (사이즈, 색상 등) - 장바구니의 options와 동일한 구조';

-- ==========================================
-- 1-6. Orders 테이블 필드 추가 (기존 테이블 마이그레이션용)
-- ==========================================

-- 기존 orders 테이블에 subtotal과 shipping_fee 필드 추가
-- NOT NULL 제약조건을 추가하기 전에 먼저 NULL 허용으로 추가하고 기본값 설정
DO $$
BEGIN
    -- subtotal 필드 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE public.orders
        ADD COLUMN subtotal DECIMAL(10,2);
        
        -- 기존 데이터 마이그레이션: total_amount를 subtotal로 설정
        UPDATE public.orders
        SET subtotal = total_amount
        WHERE subtotal IS NULL;
        
        -- NOT NULL 제약조건 및 기본값 설정
        ALTER TABLE public.orders
        ALTER COLUMN subtotal SET DEFAULT 0,
        ALTER COLUMN subtotal SET NOT NULL;
        
        -- CHECK 제약조건 추가
        ALTER TABLE public.orders
        ADD CONSTRAINT check_subtotal_valid CHECK (subtotal >= 0);
    END IF;
    
    -- shipping_fee 필드 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_fee'
    ) THEN
        ALTER TABLE public.orders
        ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0 NOT NULL;
        
        -- CHECK 제약조건 추가
        ALTER TABLE public.orders
        ADD CONSTRAINT check_shipping_fee_valid CHECK (shipping_fee >= 0);
    END IF;
END $$;

COMMENT ON COLUMN public.orders.subtotal IS '상품 금액 합계 (order_items의 price * quantity 합계)';
COMMENT ON COLUMN public.orders.shipping_fee IS '배송비 (5만원 이상 무료 배송 등 규칙 적용)';
COMMENT ON COLUMN public.orders.total_amount IS '최종 결제 금액 (subtotal + shipping_fee)';

-- ==========================================
-- 2. Phase 2: 상품 기능 추가 필드
-- ==========================================

-- 2-1. 이미지 필드 (단일 및 다중 이미지 지원)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.image_url IS '상품 이미지 URL (단일 이미지, 호환성 유지)';
COMMENT ON COLUMN public.products.image_urls IS '상품 이미지 URL 배열 (다중 이미지 지원, Supabase Storage 또는 외부 URL)';

-- 2-2. 조회수 필드
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);

COMMENT ON COLUMN public.products.view_count IS '상품 조회수 (인기상품 추천에 사용)';

-- 2-3. 프로모션 필드
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2)
    CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotion_start_date TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMPTZ;

COMMENT ON COLUMN public.products.is_promotional IS '프로모션/특가 상품 여부 (기획 상품 섹션 표시용)';
COMMENT ON COLUMN public.products.original_price IS '상품 원가 (할인율 계산용, 프로모션 상품인 경우 할인 전 가격)';
COMMENT ON COLUMN public.products.discount_percentage IS '할인율 (0-100%, 원가 대비 할인 비율)';
COMMENT ON COLUMN public.products.promotion_start_date IS '프로모션 시작일시 (NULL이면 제한 없음)';
COMMENT ON COLUMN public.products.promotion_end_date IS '프로모션 종료일시 (NULL이면 제한 없음)';

-- 2-4. 상품 옵션 필드
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.options IS '상품 옵션 정보 (사이즈, 색상 등) - JSON 형식, 예: {"sizes": ["S", "M", "L", "XL"], "colors": ["빨강", "파랑", "검정"]}';

-- 2-5. 상품 상태 필드
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'out_of_stock', 'hidden'));

COMMENT ON COLUMN public.products.status IS '상품 상태 (active: 판매중, out_of_stock: 품절, hidden: 숨김)';

-- ==========================================
-- 2-6. Orders 테이블 금액 검증 제약조건
-- ==========================================

-- total_amount는 subtotal + shipping_fee와 일치해야 함
-- 필드가 모두 존재할 때만 제약조건 추가
DO $$
BEGIN
    -- subtotal과 shipping_fee 필드가 모두 존재하는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'subtotal'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_fee'
    ) THEN
        -- 기존 제약조건 제거 (있는 경우)
        ALTER TABLE public.orders
        DROP CONSTRAINT IF EXISTS check_total_amount_valid;
        
        -- 새로운 제약조건 추가
        ALTER TABLE public.orders
        ADD CONSTRAINT check_total_amount_valid
        CHECK (total_amount = subtotal + shipping_fee);
    END IF;
END $$;

-- ==========================================
-- 3. 제약조건 및 검증 추가
-- ==========================================

-- 3-1. 원가 검증 (원가는 현재 가격보다 크거나 같아야 함)
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS check_original_price_valid;

ALTER TABLE public.products
ADD CONSTRAINT check_original_price_valid
CHECK (original_price IS NULL OR original_price >= price);

-- 3-2. 프로모션 기간 검증
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS check_promotion_dates_valid;

ALTER TABLE public.products
ADD CONSTRAINT check_promotion_dates_valid
CHECK (
    promotion_start_date IS NULL OR 
    promotion_end_date IS NULL OR 
    promotion_end_date >= promotion_start_date
);

-- 3-3. Cart Items UNIQUE 제약 (clerk_id, product_id, options 조합)
DROP INDEX IF EXISTS cart_items_unique_user_product_options;

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_unique_user_product_options 
ON public.cart_items (
    clerk_id, 
    product_id, 
    COALESCE(options::text, 'null')
);

-- ==========================================
-- 4. 함수 생성
-- ==========================================

-- 4-1. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_at 컬럼을 자동으로 현재 시간으로 업데이트';

-- 4-2. 상품 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_product_view_count(product_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.products
    SET view_count = view_count + 1
    WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_product_view_count(UUID) IS '상품 조회수 1 증가 (상품 상세 페이지 방문 시 호출)';

-- 4-3. 할인율 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_discount_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- original_price와 price가 모두 있고, original_price > price인 경우 할인율 계산
    IF NEW.is_promotional = true AND 
       NEW.original_price IS NOT NULL AND 
       NEW.price IS NOT NULL AND 
       NEW.original_price > NEW.price THEN
        NEW.discount_percentage := ROUND(
            ((NEW.original_price - NEW.price) / NEW.original_price) * 100, 
            2
        );
    -- 프로모션이 아니거나 원가가 없으면 할인율을 NULL로 설정
    ELSIF NEW.is_promotional = false OR NEW.original_price IS NULL THEN
        NEW.discount_percentage := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_discount_percentage() IS '원가와 현재 가격을 비교하여 할인율을 자동 계산';

-- 4-4. 상품 상태와 is_active 동기화 함수
CREATE OR REPLACE FUNCTION sync_product_status()
RETURNS TRIGGER AS $$
BEGIN
    -- status가 'hidden'이면 is_active를 false로 설정
    IF NEW.status = 'hidden' THEN
        NEW.is_active := false;
    -- status가 'active'이면 is_active를 true로 설정 (단, 명시적으로 is_active가 false가 아닌 경우)
    ELSIF NEW.status = 'active' AND (OLD.is_active IS NULL OR OLD.is_active = true) THEN
        NEW.is_active := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_product_status() IS '상품 상태(status)와 is_active 필드를 자동으로 동기화';

-- 4-5. 프로모션 기간 활성 여부 확인 함수
CREATE OR REPLACE FUNCTION is_promotion_active(
    p_promotion_start_date TIMESTAMPTZ,
    p_promotion_end_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 둘 다 NULL이면 항상 활성화된 것으로 간주
    IF p_promotion_start_date IS NULL AND p_promotion_end_date IS NULL THEN
        RETURN true;
    END IF;
    
    -- 시작일만 있고 현재 시간이 시작일 이후인 경우
    IF p_promotion_start_date IS NOT NULL AND p_promotion_end_date IS NULL THEN
        RETURN now() >= p_promotion_start_date;
    END IF;
    
    -- 종료일만 있고 현재 시간이 종료일 이전인 경우
    IF p_promotion_start_date IS NULL AND p_promotion_end_date IS NOT NULL THEN
        RETURN now() <= p_promotion_end_date;
    END IF;
    
    -- 둘 다 있는 경우 현재 시간이 범위 내에 있는지 확인
    RETURN now() >= p_promotion_start_date AND now() <= p_promotion_end_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_promotion_active(TIMESTAMPTZ, TIMESTAMPTZ) IS '프로모션 기간이 현재 활성화되어 있는지 확인';

-- 4-6. 기존 image_url을 image_urls로 마이그레이션하는 함수 (일회성)
CREATE OR REPLACE FUNCTION migrate_image_url_to_urls()
RETURNS void AS $$
BEGIN
    UPDATE public.products
    SET image_urls = CASE
        WHEN image_url IS NOT NULL AND image_url != '' THEN
            jsonb_build_array(image_url)
        ELSE
            '[]'::jsonb
    END
    WHERE image_urls IS NULL OR image_urls = '[]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 함수 실행
SELECT migrate_image_url_to_urls();

-- 마이그레이션 함수 삭제 (일회성 함수)
DROP FUNCTION IF EXISTS migrate_image_url_to_urls();

-- 4-7. 배송비 자동 계산 함수 (5만원 이상 무료 배송)
CREATE OR REPLACE FUNCTION calculate_shipping_fee(p_subtotal DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- 5만원 이상 무료 배송, 미만이면 배송비 3000원
    IF p_subtotal >= 50000 THEN
        RETURN 0;
    ELSE
        RETURN 3000;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_shipping_fee(DECIMAL) IS '배송비 계산 함수 (5만원 이상 무료 배송, 미만이면 3000원)';

-- 4-8. 주문 총액 자동 계산 함수 (subtotal + shipping_fee)
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- shipping_fee가 0이고 subtotal이 있으면 배송비 자동 계산
    IF NEW.shipping_fee = 0 AND NEW.subtotal > 0 THEN
        NEW.shipping_fee := calculate_shipping_fee(NEW.subtotal);
    END IF;
    
    -- total_amount는 subtotal + shipping_fee
    NEW.total_amount := NEW.subtotal + NEW.shipping_fee;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_order_total() IS '주문 총액 자동 계산 (subtotal + shipping_fee)';

-- ==========================================
-- 5. 트리거 생성
-- ==========================================

-- 5-1. updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_cart_items ON public.cart_items;
CREATE TRIGGER set_updated_at_cart_items
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5-2. 할인율 자동 계산 트리거
DROP TRIGGER IF EXISTS trigger_calculate_discount_percentage ON public.products;
CREATE TRIGGER trigger_calculate_discount_percentage
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    WHEN (NEW.is_promotional = true)
    EXECUTE FUNCTION calculate_discount_percentage();

-- 5-3. 상품 상태 동기화 트리거
DROP TRIGGER IF EXISTS trigger_sync_product_status ON public.products;
CREATE TRIGGER trigger_sync_product_status
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION sync_product_status();

-- 5-4. 주문 총액 자동 계산 트리거
DROP TRIGGER IF EXISTS trigger_calculate_order_total ON public.orders;
CREATE TRIGGER trigger_calculate_order_total
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_total();

-- ==========================================
-- 6. 인덱스 생성 (성능 최적화)
-- ==========================================

-- 6-1. 기본 인덱스
CREATE INDEX IF NOT EXISTS idx_cart_items_clerk_id ON public.cart_items(clerk_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_clerk_id ON public.orders(clerk_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 6-2. 결제 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 6-3. 상품 정렬 및 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_products_price_asc ON public.products(price ASC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price_desc ON public.products(price DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_name_asc ON public.products(name ASC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_view_count ON public.products(view_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_created_at ON public.products(category, created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_price ON public.products(category, price) WHERE is_active = true;

-- 6-4. 상품 상태 및 프로모션 인덱스
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_promotional ON public.products(is_promotional) WHERE is_promotional = true;
CREATE INDEX IF NOT EXISTS idx_products_promotion_dates 
    ON public.products(promotion_start_date, promotion_end_date) 
    WHERE is_promotional = true;
CREATE INDEX IF NOT EXISTS idx_products_active_promotion 
    ON public.products(is_promotional, promotion_start_date, promotion_end_date) 
    WHERE is_promotional = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_discount_percentage 
    ON public.products(discount_percentage DESC NULLS LAST) 
    WHERE is_promotional = true;

-- 6-5. JSONB 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_products_options ON public.products USING GIN (options);
CREATE INDEX IF NOT EXISTS idx_products_image_urls ON public.products USING GIN (image_urls);
CREATE INDEX IF NOT EXISTS idx_cart_items_options ON public.cart_items USING GIN (options);

-- ==========================================
-- 7. RLS 비활성화 (PRD.md 제약사항)
-- ==========================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. 테이블 소유자 설정
-- ==========================================

ALTER TABLE public.users OWNER TO postgres;
ALTER TABLE public.products OWNER TO postgres;
ALTER TABLE public.cart_items OWNER TO postgres;
ALTER TABLE public.orders OWNER TO postgres;
ALTER TABLE public.order_items OWNER TO postgres;

-- ==========================================
-- 9. 권한 부여
-- ==========================================

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cart_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;

-- ==========================================
-- 10. 기존 프로모션 상품 할인율 자동 계산
-- ==========================================

UPDATE public.products
SET discount_percentage = ROUND(
    ((original_price - price) / original_price) * 100, 
    2
)
WHERE is_promotional = true 
    AND original_price IS NOT NULL 
    AND original_price > price
    AND discount_percentage IS NULL;

-- ==========================================
-- 11. 테이블 통계 업데이트
-- ==========================================

ANALYZE public.users;
ANALYZE public.products;
ANALYZE public.cart_items;
ANALYZE public.orders;
ANALYZE public.order_items;

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 
-- 적용된 변경사항 요약:
-- ✅ Phase 1: 기본 테이블 (users, products, cart_items, orders, order_items)
-- ✅ Phase 2: 상품 기능 (이미지, 조회수, 프로모션, 옵션, 상태)
-- ✅ Phase 3: 장바구니 & 주문 (옵션 지원, 배송비 계산, 결제 준비)
--   - orders 테이블에 subtotal, shipping_fee 필드 추가
--   - 배송비 자동 계산 함수 (5만원 이상 무료 배송)
--   - 주문 총액 자동 계산 트리거
-- ✅ Phase 4: 결제 통합 (결제 필드)
-- ✅ Phase 5: 마이페이지 준비 (주문 내역 조회 필드 완비)
-- ✅ 성능 최적화 인덱스 및 함수
-- ✅ 자동화 트리거
-- 
-- 다음 단계:
-- 1. 어드민 대시보드에서 모든 상품 기능 활용
-- 2. 홈페이지에서 프로모션 상품 섹션 구현
-- 3. 주문 생성 시 subtotal 계산 및 배송비 자동 적용
-- 4. Phase 4 결제 통합 시 orders.payment_* 필드 활용
-- 5. Phase 5 마이페이지에서 주문 내역 조회 구현
-- 6. 필요시 추가 최적화 수행
-- ==========================================
