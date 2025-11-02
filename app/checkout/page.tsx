/**
 * @file app/checkout/page.tsx
 * @description 주문 페이지
 *
 * 주문 정보를 입력하고 확인하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 선택한 장바구니 항목 조회
 * 2. 배송 정보 입력
 * 3. 주문할 상품 목록 및 금액 표시
 * 4. 주문 생성 처리
 *
 * @dependencies
 * - actions/cart.ts: getCartItems
 * - actions/order.ts: createOrder
 * - components/checkout/shipping-form.tsx: 배송 정보 입력 폼
 * - components/checkout/order-summary.tsx: 주문 상품 목록
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCartItems } from "@/actions/cart";
import { createOrder } from "@/actions/order";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { OrderSummary } from "@/components/checkout/order-summary";
import type { ShippingFormData } from "@/types/order";

interface CheckoutPageProps {
  searchParams: Promise<{
    items?: string;
  }>;
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  console.group("📦 [CheckoutPage] 주문 페이지 렌더링 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.log("⚠️ 비로그인 사용자 - 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  // 2. 쿼리 파라미터에서 선택한 장바구니 항목 ID 배열 추출
  const params = await searchParams;
  const cartItemIdsParam = params.items;

  if (!cartItemIdsParam) {
    console.log("⚠️ 선택한 항목 없음 - 장바구니 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/cart");
  }

  const cartItemIds = cartItemIdsParam.split(",").filter((id) => id.trim());

  if (cartItemIds.length === 0) {
    console.log("⚠️ 선택한 항목 없음 - 장바구니 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/cart");
  }

  console.log(`✅ 선택한 장바구니 항목: ${cartItemIds.length}개`);

  // 3. 장바구니 항목 조회 (선택한 항목만 필터링)
  let allCartItems;
  try {
    allCartItems = await getCartItems();
  } catch (error) {
    console.error("❌ 장바구니 조회 실패:", error);
    console.groupEnd();
    redirect("/cart");
  }

  // 선택한 항목만 필터링
  const selectedCartItems = allCartItems.filter((item) =>
    cartItemIds.includes(item.id)
  );

  if (selectedCartItems.length === 0) {
    console.log("⚠️ 선택한 항목을 찾을 수 없음 - 장바구니 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/cart");
  }

  // 선택한 항목 수와 요청한 항목 수가 일치하는지 확인
  if (selectedCartItems.length !== cartItemIds.length) {
    console.log("⚠️ 일부 항목을 찾을 수 없음 - 장바구니 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/cart");
  }

  console.log(`✅ 주문할 상품 ${selectedCartItems.length}개 확인 완료`);
  console.groupEnd();

  // 4. 주문 생성 핸들러 (Client Component에서 호출)
  async function handleOrderSubmit(data: ShippingFormData) {
    "use server";

    try {
      const { orderId } = await createOrder({
        cartItemIds: cartItemIds,
        shippingAddress: {
          recipientName: data.recipientName,
          phone: data.phone,
          postalCode: data.postalCode,
          address: data.address,
          detailAddress: data.detailAddress,
          deliveryRequest: data.deliveryRequest,
        },
        orderNote: data.orderNote,
      });

      // 주문 완료 페이지로 리다이렉트
      redirect(`/checkout/complete?orderId=${orderId}`);
    } catch (error) {
      console.error("❌ 주문 생성 실패:", error);
      throw error;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">주문하기</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 배송 정보 입력 폼 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">배송 정보</h2>
          <CheckoutClient onSubmit={handleOrderSubmit} />
        </div>

        {/* 주문 상품 목록 및 금액 요약 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">주문 요약</h2>
          <OrderSummary items={selectedCartItems} />
        </div>
      </div>
    </div>
  );
}

