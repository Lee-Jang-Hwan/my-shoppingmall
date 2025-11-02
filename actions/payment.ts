/**
 * @file actions/payment.ts
 * @description 결제 처리 Server Actions
 *
 * Toss Payments 결제 승인 및 주문 정보 업데이트를 처리합니다.
 *
 * 주요 기능:
 * 1. confirmPayment: 결제 승인 처리 (Toss Payments API 호출)
 * 2. updateOrderPayment: 주문 테이블에 결제 정보 업데이트
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth)
 * - lib/supabase/server.ts: Supabase 클라이언트
 * - types/order.ts: Order 타입 정의
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { Order } from "@/types/order";

/**
 * Toss Payments 결제 승인 API 호출
 *
 * @param paymentKey - Toss Payments에서 발급한 결제 키
 * @param orderId - 주문 ID
 * @param amount - 결제 금액 (주문 금액과 일치해야 함)
 * @returns 결제 승인 결과
 * @throws 결제 승인 실패 시 에러
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  paymentData: Record<string, unknown>;
}> {
  console.group("💳 [confirmPayment] 결제 승인 시작");
  console.log("결제 정보:", { paymentKey, orderId, amount });

  // 시크릿 키 확인
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey) {
    console.error("❌ TOSS_PAYMENTS_SECRET_KEY가 설정되지 않음");
    throw new Error("결제 서비스 설정 오류입니다. 관리자에게 문의하세요.");
  }

  // 시크릿 키 인코딩 (시크릿 키 뒤에 : 추가 후 base64 인코딩)
  const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    // Toss Payments 결제 승인 API 호출
    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ 결제 승인 실패:", data);
      throw new Error(
        data.message || `결제 승인에 실패했습니다: ${response.status}`
      );
    }

    console.log("✅ 결제 승인 완료:", {
      paymentKey: data.paymentKey,
      status: data.status,
      method: data.method,
    });

    return {
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      status: data.status,
      method: data.method || "카드",
      paymentData: data,
    };
  } catch (error) {
    console.error("❌ 결제 승인 중 에러:", error);
    throw error;
  } finally {
    console.groupEnd();
  }
}

/**
 * 주문 테이블에 결제 정보를 업데이트합니다.
 *
 * @param orderId - 주문 ID
 * @param paymentInfo - 결제 정보 (confirmPayment에서 반환된 값)
 * @throws 로그인하지 않은 경우, 주문을 찾을 수 없는 경우, 본인의 주문이 아닌 경우 에러
 */
export async function updateOrderPayment(
  orderId: string,
  paymentInfo: {
    paymentKey: string;
    status: string;
    method: string;
    paymentData: Record<string, unknown>;
  }
): Promise<void> {
  console.group("💳 [updateOrderPayment] 주문 결제 정보 업데이트 시작");
  console.log("주문 ID:", orderId);
  console.log("결제 정보:", {
    paymentKey: paymentInfo.paymentKey,
    status: paymentInfo.status,
    method: paymentInfo.method,
  });

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 2. 주문 조회 (본인의 주문인지 확인)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("clerk_id", userId)
    .single();

  if (orderError || !order) {
    console.error("❌ 주문 조회 실패:", orderError);
    throw new Error("주문을 찾을 수 없습니다.");
  }

  // 3. 결제 금액 검증 (주문 금액과 결제 금액 일치 확인)
  const paymentAmount = paymentInfo.paymentData.totalAmount as number;
  if (Math.abs(paymentAmount - order.total_amount) > 1) {
    // 1원 오차 허용 (소수점 처리)
    console.error("❌ 결제 금액 불일치:", {
      주문금액: order.total_amount,
      결제금액: paymentAmount,
    });
    throw new Error(
      `결제 금액이 일치하지 않습니다. (주문: ${order.total_amount}원, 결제: ${paymentAmount}원)`
    );
  }

  // 4. 중복 결제 방지 (이미 결제 완료된 주문인지 확인)
  if (order.payment_status === "completed") {
    console.error("❌ 이미 결제 완료된 주문");
    throw new Error("이미 결제가 완료된 주문입니다.");
  }

  // 5. 주문 정보 업데이트
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_id: paymentInfo.paymentKey,
      payment_method: paymentInfo.method,
      payment_status: "completed",
      payment_data: paymentInfo.paymentData,
      status: "confirmed", // pending → confirmed
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("clerk_id", userId); // 추가 보안: 본인의 주문인지 재확인

  if (updateError) {
    console.error("❌ 주문 업데이트 실패:", updateError);
    throw new Error(`주문 업데이트에 실패했습니다: ${updateError.message}`);
  }

  // 6. 캐시 무효화
  revalidatePath("/checkout/complete");
  revalidatePath("/cart");

  console.log("✅ 주문 결제 정보 업데이트 완료");
  console.groupEnd();
}

