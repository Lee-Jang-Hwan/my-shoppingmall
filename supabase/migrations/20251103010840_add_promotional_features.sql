-- ==========================================
-- 기획 상품 섹션 기능 추가 마이그레이션
-- PRD.md Phase 2: 홈페이지 기획 상품 섹션 구현
-- ==========================================
-- 
-- 업데이트 내용:
-- 1. products 테이블에 원가 필드 추가 (original_price) - 할인율 계산용
-- 2. products 테이블에 할인율 필드 추가 (discount_percentage) - 직접 입력 가능
-- 3. products 테이블에 프로모션 기간 필드 추가 (promotion_start_date, promotion_end_date)
-- 4. 성능 최적화를 위한 인덱스 추가
-- ==========================================

-- 1. 원가 필드 추가 (할인율 계산용)
-- 현재 판매 가격과 원가를 비교하여 할인율을 계산하거나, 할인율을 직접 저장할 수 있음
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

COMMENT ON COLUMN public.products.original_price IS '상품 원가 (할인율 계산용, 프로모션 상품인 경우 할인 전 가격)';

-- 원가가 현재 가격보다 큰지 확인하는 CHECK 제약조건 추가
ALTER TABLE public.products
ADD CONSTRAINT check_original_price_valid
CHECK (original_price IS NULL OR original_price >= price);

COMMENT ON CONSTRAINT check_original_price_valid ON public.products IS '원가는 현재 가격보다 크거나 같아야 함';

-- 2. 할인율 필드 추가 (0-100 사이의 값)
-- 원가와 현재 가격으로 자동 계산 가능하지만, 직접 입력도 가능
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2)
CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

COMMENT ON COLUMN public.products.discount_percentage IS '할인율 (0-100%, 원가 대비 할인 비율, 직접 입력 또는 자동 계산)';

-- 3. 프로모션 기간 필드 추가
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotion_start_date TIMESTAMPTZ;

COMMENT ON COLUMN public.products.promotion_start_date IS '프로모션 시작일시 (NULL이면 제한 없음)';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMPTZ;

COMMENT ON COLUMN public.products.promotion_end_date IS '프로모션 종료일시 (NULL이면 제한 없음)';

-- 프로모션 기간 검증: 종료일이 시작일보다 이후여야 함
ALTER TABLE public.products
ADD CONSTRAINT check_promotion_dates_valid
CHECK (
  promotion_start_date IS NULL OR 
  promotion_end_date IS NULL OR 
  promotion_end_date >= promotion_start_date
);

COMMENT ON CONSTRAINT check_promotion_dates_valid ON public.products IS '프로모션 종료일은 시작일보다 이후여야 함';

-- 4. 할인율 자동 계산 함수 생성
-- original_price와 price를 비교하여 discount_percentage를 자동 계산
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

-- 트리거 등록 (INSERT와 UPDATE 모두)
DROP TRIGGER IF EXISTS trigger_calculate_discount_percentage ON public.products;
CREATE TRIGGER trigger_calculate_discount_percentage
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  WHEN (
    NEW.is_promotional = true AND 
    (OLD IS NULL OR 
     NEW.original_price IS DISTINCT FROM OLD.original_price OR 
     NEW.price IS DISTINCT FROM OLD.price OR 
     NEW.is_promotional IS DISTINCT FROM OLD.is_promotional)
  )
  EXECUTE FUNCTION calculate_discount_percentage();

-- 5. 프로모션 기간 활성 여부 확인 함수
-- 현재 시간 기준으로 프로모션이 활성화되어 있는지 확인하는 함수
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

-- 6. 성능 최적화를 위한 인덱스 추가

-- 프로모션 기간 인덱스 (활성 프로모션 상품 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_products_promotion_dates 
ON public.products(promotion_start_date, promotion_end_date) 
WHERE is_promotional = true;

-- 프로모션 활성 상품 조회 최적화를 위한 부분 인덱스
-- (현재 시간 기준으로 활성화된 프로모션 상품만 포함)
CREATE INDEX IF NOT EXISTS idx_products_active_promotion 
ON public.products(is_promotional, promotion_start_date, promotion_end_date) 
WHERE is_promotional = true 
  AND is_active = true;

-- 할인율 인덱스 (할인율이 높은 순으로 정렬할 때 사용)
CREATE INDEX IF NOT EXISTS idx_products_discount_percentage 
ON public.products(discount_percentage DESC NULLS LAST) 
WHERE is_promotional = true;

-- 7. 기존 프로모션 상품에 대한 할인율 자동 계산 (한 번만 실행)
-- 기존 데이터에 original_price가 있으면 할인율을 계산하여 업데이트
UPDATE public.products
SET discount_percentage = ROUND(
  ((original_price - price) / original_price) * 100, 
  2
)
WHERE is_promotional = true 
  AND original_price IS NOT NULL 
  AND original_price > price
  AND discount_percentage IS NULL;

-- 8. 테이블 통계 업데이트 (인덱스 효율성 향상)
ANALYZE public.products;

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 
-- 적용된 변경사항:
-- ✅ products 테이블: original_price (원가) 필드 추가
-- ✅ products 테이블: discount_percentage (할인율) 필드 추가
-- ✅ products 테이블: promotion_start_date, promotion_end_date (프로모션 기간) 필드 추가
-- ✅ 할인율 자동 계산 트리거 추가
-- ✅ 프로모션 기간 활성 여부 확인 함수 추가
-- ✅ 프로모션 관련 인덱스 추가 (성능 최적화)
-- ✅ 기존 프로모션 상품 할인율 자동 계산
-- 
-- 다음 단계:
-- 1. 홈페이지에서 프로모션 기간이 활성화된 상품만 표시하도록 필터링
-- 2. ProductCard 컴포넌트에 할인율 표시 추가
-- 3. 프로모션 기간 표시 UI 추가
-- 4. 어드민 대시보드에서 프로모션 기간 및 할인율 설정 기능 추가
-- ==========================================


