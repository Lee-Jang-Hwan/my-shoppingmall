-- ==========================================
-- 카테고리에 Woman과 Man 추가
-- ==========================================
-- 
-- products 테이블의 category 컬럼에 체크 제약조건을 추가하여
-- 허용된 카테고리만 입력 가능하도록 제한합니다.
-- 
-- 추가된 카테고리:
-- - woman: 여성
-- - man: 남성
-- ==========================================

-- 기존 category 체크 제약조건이 있다면 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_category_check' 
    AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_check;
  END IF;
END $$;

-- 새로운 카테고리 체크 제약조건 추가 (woman, man 포함)
ALTER TABLE products 
ADD CONSTRAINT products_category_check 
CHECK (
  category IS NULL OR 
  category IN (
    'electronics',
    'clothing',
    'books',
    'food',
    'sports',
    'beauty',
    'home',
    'collaboration',
    'woman',
    'man'
  )
);

COMMENT ON CONSTRAINT products_category_check ON products IS 
'허용된 카테고리만 입력 가능 (woman: 여성, man: 남성 포함)';


