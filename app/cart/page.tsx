/**
 * @file app/cart/page.tsx
 * @description 장바구니 페이지
 *
 * 사용자의 장바구니 목록을 표시하고, 수량 변경 및 삭제 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 현재 사용자의 장바구니 목록 조회
 * 2. 각 항목별 상품 정보 표시 (이미지, 이름, 옵션, 단가, 수량, 총액)
 * 3. 장바구니 총 금액 계산 및 표시
 * 4. 빈 상태 메시지 표시
 * 5. 재고 부족/비활성 상품 경고 표시
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (Next.js 15 App Router 패턴)
 * - Server Action으로 장바구니 데이터 조회
 * - 클라이언트 컴포넌트에서 수량 변경 및 삭제 처리
 *
 * @dependencies
 * - actions/cart.ts: 장바구니 Server Actions
 * - components/cart/cart-item.tsx: 개별 항목 컴포넌트
 * - types/cart.ts: Cart 타입 정의
 */

import { getCartItems } from "@/actions/cart";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CartPageClient } from "@/components/cart/cart-page-client";
import Link from "next/link";

/**
 * 가격을 천단위 콤마로 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default async function CartPage() {
  console.group("🛒 [CartPage] 장바구니 페이지 렌더링 시작");

  // 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.log("⚠️ 비로그인 사용자 - 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  // 장바구니 목록 조회
  let cartItems;
  try {
    cartItems = await getCartItems();
    console.log(`✅ 장바구니 조회 완료: ${cartItems.length}개 항목`);
  } catch (error) {
    console.error("❌ 장바구니 조회 실패:", error);
    cartItems = [];
  }

  // 총 금액 계산
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  console.groupEnd();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">장바구니</h1>

      {cartItems.length === 0 ? (
        // 빈 상태
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-4">
            <svg
              className="w-24 h-24 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">장바구니가 비어있습니다</h2>
          <p className="text-muted-foreground mb-6">
            상품을 추가해보세요!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        // 장바구니 목록
        <CartPageClient
          items={cartItems}
          totalAmount={totalAmount}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}

