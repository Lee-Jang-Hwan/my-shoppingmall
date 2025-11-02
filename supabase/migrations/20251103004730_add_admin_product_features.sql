-- ==========================================
-- 어드민 상품 관리 기능 추가 마이그레이션
-- PRD.md Phase 2: 어드민 상품 관리 대시보드 구현
-- ==========================================
-- 
-- 업데이트 내용:
-- 1. products 테이블에 다중 이미지 지원 (image_urls JSONB)
-- 2. products 테이블에 프로모션 필드 추가 (is_promotional)
-- 3. products 테이블에 상품 옵션 필드 추가 (options JSONB)
-- 4. products 테이블에 상품 상태 필드 추가 (status)
-- ==========================================

-- 1. 다중 이미지 지원: image_urls JSONB 컬럼 추가
-- 단일 image_url은 기존 호환성을 위해 유지
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.image_urls IS '상품 이미지 URL 배열 (다중 이미지 지원, Supabase Storage 또는 외부 URL)';

-- 2. 프로모션 필드 추가
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.products.is_promotional IS '프로모션/특가 상품 여부 (기획 상품 섹션 표시용)';

-- 3. 상품 옵션 필드 추가 (사이즈, 색상 등)
-- JSONB 형식으로 유연하게 옵션 저장
-- 예시: {"sizes": ["S", "M", "L", "XL"], "colors": ["빨강", "파랑", "검정"]}
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.options IS '상품 옵션 정보 (사이즈, 색상 등) - JSON 형식';

-- 4. 상품 상태 필드 추가
-- 기존 is_active 필드와 함께 사용하여 더 세밀한 상태 관리
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'out_of_stock', 'hidden'));

COMMENT ON COLUMN public.products.status IS '상품 상태 (active: 판매중, out_of_stock: 품절, hidden: 숨김)';

-- 5. 상품 상태 인덱스 추가 (관리자 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 프로모션 상품 인덱스 추가 (기획 상품 섹션 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_products_is_promotional ON public.products(is_promotional) WHERE is_promotional = true;

-- JSONB 필드 인덱스 (옵션 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_products_options ON public.products USING GIN (options);

-- 이미지 URL 배열 인덱스 (이미지 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_products_image_urls ON public.products USING GIN (image_urls);

-- 6. 기존 image_url을 image_urls로 마이그레이션하는 함수
-- 기존 데이터 호환성을 위해 기존 image_url이 있으면 image_urls의 첫 번째 요소로 설정
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

-- 7. 상품 상태와 is_active 필드 동기화 함수
-- status가 'hidden'이면 is_active를 false로 설정
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

-- 트리거 등록
DROP TRIGGER IF EXISTS trigger_sync_product_status ON public.products;
CREATE TRIGGER trigger_sync_product_status
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION sync_product_status();

COMMENT ON FUNCTION sync_product_status() IS '상품 상태(status)와 is_active 필드를 자동으로 동기화';

-- 8. 테이블 통계 업데이트 (인덱스 효율성 향상)
ANALYZE public.products;

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 
-- 적용된 변경사항:
-- ✅ products 테이블: image_urls (다중 이미지), is_promotional, options, status 필드 추가
-- ✅ products 테이블: 상태 및 프로모션 인덱스 추가
-- ✅ JSONB 필드 인덱스 추가 (옵션 및 이미지 검색 최적화)
-- ✅ 기존 image_url 데이터를 image_urls로 마이그레이션
-- ✅ 상품 상태와 is_active 필드 자동 동기화 트리거 추가
-- 
-- 다음 단계:
-- 1. 어드민 대시보드에서 image_urls를 사용하여 다중 이미지 업로드 구현
-- 2. options 필드를 사용하여 상품 옵션(사이즈, 색상 등) 관리
-- 3. status 필드를 사용하여 상품 상태별 필터링 구현
-- 4. is_promotional 필드를 사용하여 기획 상품 섹션 구현
-- ==========================================

