/**
 * @file lib/categories.ts
 * @description 카테고리 관련 유틸리티 함수
 *
 * 카테고리 한글 변환 및 카테고리 목록 관리
 */

/**
 * 카테고리 이름을 한글로 변환
 */
export function getCategoryLabel(category: string | null): string {
  const categoryMap: Record<string, string> = {
    electronics: "전자제품",
    clothing: "의류",
    books: "도서",
    food: "식품",
    sports: "스포츠",
    beauty: "뷰티",
    home: "생활/가정",
    collaboration: "디자인 콜라보",
    woman: "여성",
    man: "남성",
  };

  return category ? categoryMap[category] || category : "기타";
}

/**
 * 카테고리 정보 타입
 */
export interface CategoryInfo {
  category: string;
  label: string;
  count: number;
}

