/**
 * @file actions/order.ts
 * @description 주문 관리 Server Actions
 *
 * 사용자가 주문을 생성하고 조회하는 Server Actions입니다.
 *
 * 주요 기능:
 * 1. createOrder: 주문 생성 (재고 차감, 장바구니 항목 제거 포함)
 * 2. getOrders: 사용자별 주문 목록 조회
 * 3. getOrder: 주문 상세 조회 (order_items 포함)
 * 4. calculateShippingFee: 배송비 계산 유틸리티
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth)
 * - lib/supabase/server.ts: Supabase 클라이언트
 * - types/order.ts: Order 타입 정의
 * - types/cart.ts: Cart 타입 정의
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderItem,
  OrderWithItems,
  CreateOrderData,
  ShippingAddress,
} from "@/types/order";
import type { CartItemWithProduct } from "@/types/cart";

/**
 * 배송비 계산 유틸리티
 * 5만원 이상 무료 배송, 미만 3천원
 *
 * @param totalAmount - 상품 금액 합계
 * @returns 배송비
 */
export function calculateShippingFee(totalAmount: number): number {
  return totalAmount >= 50000 ? 0 : 3000;
}

/**
 * 주문을 생성합니다.
 * 재고를 즉시 차감하고, 주문 완료 후 장바구니에서 해당 항목을 제거합니다.
 *
 * @param data - 주문 생성 데이터 (cartItemIds, shippingAddress, orderNote)
 * @returns 생성된 주문 ID
 * @throws 로그인하지 않은 경우, 장바구니 항목을 찾을 수 없는 경우, 재고 부족 시 에러
 */
export async function createOrder(
  data: CreateOrderData
): Promise<{ orderId: string }> {
  console.group("📦 [createOrder] 주문 생성 시작");
  console.log("입력 데이터:", {
    cartItemIds: data.cartItemIds,
    shippingAddress: data.shippingAddress,
    orderNote: data.orderNote,
  });

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 2. 선택한 장바구니 항목 조회 및 검증
  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(*)
    `
    )
    .eq("clerk_id", userId)
    .in("id", data.cartItemIds);

  if (cartError || !cartItems || cartItems.length === 0) {
    console.error("❌ 장바구니 항목 조회 실패:", cartError);
    throw new Error("장바구니 항목을 찾을 수 없습니다.");
  }

  // 요청한 항목 수와 조회된 항목 수가 일치하는지 확인
  if (cartItems.length !== data.cartItemIds.length) {
    console.error("❌ 일부 장바구니 항목을 찾을 수 없음");
    throw new Error("일부 장바구니 항목을 찾을 수 없습니다.");
  }

  console.log(`✅ 장바구니 항목 ${cartItems.length}개 조회 완료`);

  // 3. 각 장바구니 항목 검증 (재고, 활성 상태 등)
  const orderItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    options: Record<string, unknown> | null;
  }> = [];

  let totalAmount = 0;

  for (const cartItem of cartItems) {
    const product = cartItem.product as any;

    // 상품 존재 확인
    if (!product) {
      console.error("❌ 상품 정보 없음:", cartItem.product_id);
      throw new Error(`상품 정보를 찾을 수 없습니다. (ID: ${cartItem.product_id})`);
    }

    // 활성 상태 확인
    if (!product.is_active || product.status === "hidden") {
      console.error("❌ 비활성 상품:", product.name);
      throw new Error(`현재 판매 중이 아닌 상품입니다: ${product.name}`);
    }

    // 재고 확인
    if (cartItem.quantity > product.stock_quantity) {
      console.error("❌ 재고 부족:", {
        상품명: product.name,
        요청수량: cartItem.quantity,
        재고: product.stock_quantity,
      });
      throw new Error(
        `재고가 부족합니다: ${product.name} (최대 ${product.stock_quantity}개까지 가능)`
      );
    }

    // 주문 항목 데이터 준비
    const itemPrice = product.price;
    const itemTotal = itemPrice * cartItem.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: cartItem.quantity,
      price: itemPrice,
      options: cartItem.options,
    });
  }

  // 4. 배송비 계산
  const shippingFee = calculateShippingFee(totalAmount);
  const finalTotalAmount = totalAmount + shippingFee;

  console.log("💰 금액 계산:", {
    상품금액합계: totalAmount,
    배송비: shippingFee,
    최종금액: finalTotalAmount,
  });

  // 5. 주문 금액 검증
  if (finalTotalAmount <= 0) {
    console.error("❌ 주문 금액이 0원 이하");
    throw new Error("주문 금액이 올바르지 않습니다.");
  }

  // 6. 주문 생성 및 재고 차감 (트랜잭션 처리)
  try {
    // 6-1. orders 테이블에 주문 정보 저장
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        clerk_id: userId,
        total_amount: finalTotalAmount,
        status: "pending",
        shipping_address: data.shippingAddress as any,
        order_note: data.orderNote ?? null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("❌ 주문 생성 실패:", orderError);
      throw new Error(`주문 생성에 실패했습니다: ${orderError?.message}`);
    }

    console.log("✅ 주문 생성 완료:", order.id);

    // 6-2. order_items 테이블에 주문 상세 항목 저장
    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
      options: item.options,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("❌ 주문 항목 저장 실패:", itemsError);
      // 주문 삭제 (롤백)
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(`주문 항목 저장에 실패했습니다: ${itemsError.message}`);
    }

    console.log("✅ 주문 항목 저장 완료:", orderItemsToInsert.length, "개");

    // 6-3. 재고 차감
    for (const item of orderItems) {
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        product_id: item.productId,
        quantity: item.quantity,
      });

      // RPC 함수가 없을 수 있으므로 직접 UPDATE
      if (stockError) {
        console.log("⚠️ RPC 함수 없음, 직접 UPDATE 시도");
        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.productId)
          .single();

        if (fetchError || !product) {
          console.error("❌ 상품 조회 실패:", fetchError);
          // 주문 및 항목 삭제 (롤백)
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error(`상품 조회에 실패했습니다: ${fetchError?.message}`);
        }

        const newStock = product.stock_quantity - item.quantity;
        if (newStock < 0) {
          console.error("❌ 재고 부족 (재확인):", {
            상품ID: item.productId,
            재고: product.stock_quantity,
            요청수량: item.quantity,
          });
          // 주문 및 항목 삭제 (롤백)
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error(`재고가 부족합니다: ${item.productName}`);
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.productId);

        if (updateError) {
          console.error("❌ 재고 차감 실패:", updateError);
          // 주문 및 항목 삭제 (롤백)
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error(`재고 차감에 실패했습니다: ${updateError.message}`);
        }
      }

      console.log(`✅ 재고 차감 완료: ${item.productName} -${item.quantity}개`);
    }

    // 6-4. 장바구니에서 해당 항목 제거
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("clerk_id", userId)
      .in("id", data.cartItemIds);

    if (deleteError) {
      console.error("⚠️ 장바구니 항목 삭제 실패:", deleteError);
      // 주문은 성공했으므로 경고만 출력 (장바구니는 나중에 수동 삭제 가능)
    } else {
      console.log("✅ 장바구니 항목 삭제 완료");
    }

    // 7. 캐시 무효화
    revalidatePath("/cart");
    revalidatePath("/checkout");

    console.log("✅ 주문 생성 완료:", order.id);
    console.groupEnd();

    return { orderId: order.id };
  } catch (error) {
    console.error("❌ 주문 생성 중 에러 발생:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 현재 사용자의 주문 목록을 조회합니다.
 *
 * @returns 주문 목록 (최신순 정렬)
 * @throws 로그인하지 않은 경우 에러
 */
export async function getOrders(): Promise<Order[]> {
  console.group("📦 [getOrders] 주문 목록 조회 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    console.groupEnd();
    return [];
  }

  const supabase = createClerkSupabaseClient();

  // 2. 주문 목록 조회
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("clerk_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 주문 목록 조회 실패:", error);
    console.groupEnd();
    throw new Error(`주문 목록 조회에 실패했습니다: ${error.message}`);
  }

  // shipping_address를 ShippingAddress 타입으로 변환
  const typedOrders: Order[] = (orders || []).map((order: any) => ({
    ...order,
    shipping_address: order.shipping_address as ShippingAddress | null,
    payment_data: order.payment_data as Record<string, unknown> | null,
  }));

  console.log(`✅ 주문 목록 조회 완료: ${typedOrders.length}개`);
  console.groupEnd();

  return typedOrders;
}

/**
 * 주문 상세 정보를 조회합니다 (주문 항목 포함).
 *
 * @param orderId - 주문 ID
 * @returns 주문 상세 정보 (order_items 포함)
 * @throws 로그인하지 않은 경우, 주문을 찾을 수 없는 경우, 본인의 주문이 아닌 경우 에러
 */
export async function getOrder(orderId: string): Promise<OrderWithItems> {
  console.group("📦 [getOrder] 주문 상세 조회 시작");
  console.log("주문 ID:", orderId);

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

  // 3. 주문 항목 조회
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("❌ 주문 항목 조회 실패:", itemsError);
    throw new Error(`주문 항목 조회에 실패했습니다: ${itemsError.message}`);
  }

  // 4. 타입 변환
  const typedOrder: OrderWithItems = {
    ...order,
    shipping_address: order.shipping_address as ShippingAddress | null,
    payment_data: order.payment_data as Record<string, unknown> | null,
    items: (items || []).map((item: any) => ({
      ...item,
      options: item.options as Record<string, unknown> | null,
    })),
  };

  console.log(`✅ 주문 상세 조회 완료: 항목 ${typedOrder.items.length}개`);
  console.groupEnd();

  return typedOrder;
}

