/**
 * @file actions/cart.ts
 * @description 장바구니 관리 Server Actions
 *
 * 사용자가 장바구니에 상품을 추가, 조회, 수정, 삭제하는 Server Actions입니다.
 *
 * 주요 기능:
 * 1. addToCart: 장바구니에 상품 추가 (동일 항목 시 수량 합산)
 * 2. getCartItems: 현재 사용자 장바구니 목록 조회
 * 3. updateCartItemQuantity: 장바구니 항목 수량 변경
 * 4. removeCartItem: 개별 항목 삭제
 * 5. removeCartItems: 일괄 삭제
 * 6. clearCart: 장바구니 전체 비우기
 * 7. getCartCount: 장바구니 개수 조회
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth)
 * - lib/supabase/server.ts: Supabase 클라이언트
 * - types/cart.ts: Cart 타입 정의
 * - types/product.ts: Product 타입 정의
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  CartItem,
  CartItemWithProduct,
  AddToCartData,
  UpdateCartQuantityData,
} from "@/types/cart";

/**
 * 장바구니에 상품을 추가합니다.
 * 동일한 상품과 옵션 조합이 이미 있으면 수량을 합산합니다.
 *
 * @param data - 장바구니 추가 데이터 (productId, quantity, options)
 * @returns 생성 또는 업데이트된 장바구니 항목
 * @throws 로그인하지 않은 경우, 상품을 찾을 수 없는 경우, 재고 부족 시 에러
 */
export async function addToCart(
  data: AddToCartData
): Promise<CartItem> {
  console.group("🛒 [addToCart] 장바구니 추가 시작");
  console.log("입력 데이터:", data);

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 2. 상품 존재 및 활성 상태 확인
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity, is_active, status")
    .eq("id", data.productId)
    .single();

  if (productError || !product) {
    console.error("❌ 상품 조회 실패:", productError);
    throw new Error("상품을 찾을 수 없습니다.");
  }

  if (!product.is_active || product.status === "hidden") {
    console.error("❌ 비활성 상품");
    throw new Error("현재 판매 중이 아닌 상품입니다.");
  }

  if (product.stock_quantity === 0) {
    console.error("❌ 품절 상품");
    throw new Error("품절된 상품입니다.");
  }

  // 3. 기존 장바구니 항목 확인 (동일 상품 + 동일 옵션)
  // options를 JSONB로 비교하기 위해 JSON 문자열로 변환
  const optionsJson = data.options ? JSON.stringify(data.options) : null;

  const { data: existingItem, error: findError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("clerk_id", userId)
    .eq("product_id", data.productId)
    .eq("options", optionsJson ?? null)
    .single();

  // 에러가 있고 "PGRST116" (단일 행을 찾을 수 없음)이 아니면 실제 에러
  if (findError && findError.code !== "PGRST116") {
    console.error("❌ 장바구니 조회 에러:", findError);
    throw new Error(`장바구니 조회에 실패했습니다: ${findError.message}`);
  }

  // 4. 기존 항목이 있으면 수량 합산, 없으면 새로 추가
  let cartItem: CartItem;

  if (existingItem) {
    // 기존 항목 수량 합산
    const newQuantity = existingItem.quantity + data.quantity;

    // 재고 확인
    if (newQuantity > product.stock_quantity) {
      console.error("❌ 재고 부족:", {
        요청수량: newQuantity,
        재고: product.stock_quantity,
      });
      throw new Error(
        `재고가 부족합니다. (최대 ${product.stock_quantity}개까지 가능)`
      );
    }

    // 수량 업데이트
    const { data: updatedItem, error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existingItem.id)
      .select()
      .single();

    if (updateError || !updatedItem) {
      console.error("❌ 장바구니 업데이트 실패:", updateError);
      throw new Error(`장바구니 업데이트에 실패했습니다: ${updateError?.message}`);
    }

    cartItem = updatedItem as CartItem;
    console.log("✅ 기존 항목 수량 합산:", cartItem);
  } else {
    // 새 항목 추가
    // 재고 확인
    if (data.quantity > product.stock_quantity) {
      console.error("❌ 재고 부족:", {
        요청수량: data.quantity,
        재고: product.stock_quantity,
      });
      throw new Error(
        `재고가 부족합니다. (최대 ${product.stock_quantity}개까지 가능)`
      );
    }

    const { data: newItem, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        clerk_id: userId,
        product_id: data.productId,
        quantity: data.quantity,
        options: data.options ?? null,
      })
      .select()
      .single();

    if (insertError || !newItem) {
      console.error("❌ 장바구니 추가 실패:", insertError);
      throw new Error(`장바구니 추가에 실패했습니다: ${insertError?.message}`);
    }

    cartItem = newItem as CartItem;
    console.log("✅ 새 항목 추가:", cartItem);
  }

  // 5. 캐시 무효화
  revalidatePath("/cart");
  revalidatePath("/");
  revalidatePath(`/products/${data.productId}`);

  console.groupEnd();
  return cartItem;
}

/**
 * 현재 사용자의 장바구니 목록을 조회합니다.
 * 상품 정보를 JOIN하여 함께 반환합니다.
 *
 * @returns 장바구니 항목 목록 (상품 정보 포함)
 * @throws 로그인하지 않은 경우 에러
 */
export async function getCartItems(): Promise<CartItemWithProduct[]> {
  console.group("🛒 [getCartItems] 장바구니 조회 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    console.groupEnd();
    return [];
  }

  const supabase = createClerkSupabaseClient();

  // 2. 장바구니 항목 조회 (상품 정보 JOIN)
  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(*)
    `
    )
    .eq("clerk_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 장바구니 조회 실패:", error);
    console.groupEnd();
    throw new Error(`장바구니 조회에 실패했습니다: ${error.message}`);
  }

  if (!cartItems || cartItems.length === 0) {
    console.log("✅ 장바구니 비어있음");
    console.groupEnd();
    return [];
  }

  // 3. 타입 변환
  const items: CartItemWithProduct[] = cartItems.map((item: any) => ({
    id: item.id,
    clerk_id: item.clerk_id,
    product_id: item.product_id,
    quantity: item.quantity,
    options: item.options,
    created_at: item.created_at,
    updated_at: item.updated_at,
    product: item.product,
  }));

  console.log(`✅ 장바구니 조회 완료: ${items.length}개 항목`);
  console.groupEnd();
  return items;
}

/**
 * 현재 사용자의 장바구니 개수를 조회합니다.
 * Navbar 배지 표시용입니다.
 *
 * @returns 장바구니 개수
 */
export async function getCartCount(): Promise<number> {
  // 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    return 0;
  }

  const supabase = createClerkSupabaseClient();

  // 장바구니 개수 조회
  const { count, error } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", userId);

  if (error) {
    console.error("❌ 장바구니 개수 조회 실패:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * 장바구니 항목의 수량을 변경합니다.
 *
 * @param data - 수량 변경 데이터 (cartItemId, quantity)
 * @returns 업데이트된 장바구니 항목
 * @throws 로그인하지 않은 경우, 항목을 찾을 수 없는 경우, 재고 부족 시 에러
 */
export async function updateCartItemQuantity(
  data: UpdateCartQuantityData
): Promise<CartItem> {
  console.group("🛒 [updateCartItemQuantity] 수량 변경 시작");
  console.log("입력 데이터:", data);

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  // 2. 수량 검증
  if (data.quantity < 1) {
    console.error("❌ 수량이 1보다 작음:", data.quantity);
    throw new Error("수량은 최소 1개 이상이어야 합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 3. 장바구니 항목 조회
  const { data: cartItem, error: findError } = await supabase
    .from("cart_items")
    .select("*, product:products(id, stock_quantity, is_active, status)")
    .eq("id", data.cartItemId)
    .eq("clerk_id", userId)
    .single();

  if (findError || !cartItem) {
    console.error("❌ 장바구니 항목 조회 실패:", findError);
    throw new Error("장바구니 항목을 찾을 수 없습니다.");
  }

  // 4. 상품 정보 확인
  const product = cartItem.product as any;
  if (!product.is_active || product.status === "hidden") {
    console.error("❌ 비활성 상품");
    throw new Error("현재 판매 중이 아닌 상품입니다.");
  }

  // 5. 재고 확인
  if (data.quantity > product.stock_quantity) {
    console.error("❌ 재고 부족:", {
      요청수량: data.quantity,
      재고: product.stock_quantity,
    });
    throw new Error(
      `재고가 부족합니다. (최대 ${product.stock_quantity}개까지 가능)`
    );
  }

  // 6. 수량 업데이트
  const { data: updatedItem, error: updateError } = await supabase
    .from("cart_items")
    .update({ quantity: data.quantity })
    .eq("id", data.cartItemId)
    .select()
    .single();

  if (updateError || !updatedItem) {
    console.error("❌ 수량 업데이트 실패:", updateError);
    throw new Error(`수량 변경에 실패했습니다: ${updateError?.message}`);
  }

  // 7. 캐시 무효화
  revalidatePath("/cart");

  console.log("✅ 수량 변경 완료:", updatedItem);
  console.groupEnd();
  return updatedItem as CartItem;
}

/**
 * 장바구니에서 개별 항목을 삭제합니다.
 *
 * @param cartItemId - 삭제할 장바구니 항목 ID
 * @throws 로그인하지 않은 경우, 항목을 찾을 수 없는 경우 에러
 */
export async function removeCartItem(cartItemId: string): Promise<void> {
  console.group("🛒 [removeCartItem] 항목 삭제 시작");
  console.log("장바구니 항목 ID:", cartItemId);

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 2. 본인의 장바구니 항목인지 확인 후 삭제
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("clerk_id", userId);

  if (deleteError) {
    console.error("❌ 항목 삭제 실패:", deleteError);
    throw new Error(`장바구니 항목 삭제에 실패했습니다: ${deleteError.message}`);
  }

  // 3. 캐시 무효화
  revalidatePath("/cart");
  revalidatePath("/");

  console.log("✅ 항목 삭제 완료");
  console.groupEnd();
}

/**
 * 장바구니에서 여러 항목을 일괄 삭제합니다.
 *
 * @param cartItemIds - 삭제할 장바구니 항목 ID 배열
 * @throws 로그인하지 않은 경우 에러
 */
export async function removeCartItems(
  cartItemIds: string[]
): Promise<void> {
  console.group("🛒 [removeCartItems] 일괄 삭제 시작");
  console.log("삭제할 항목 개수:", cartItemIds.length);

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  if (cartItemIds.length === 0) {
    console.log("⚠️ 삭제할 항목이 없음");
    console.groupEnd();
    return;
  }

  const supabase = createClerkSupabaseClient();

  // 2. 본인의 장바구니 항목만 일괄 삭제
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .in("id", cartItemIds)
    .eq("clerk_id", userId);

  if (deleteError) {
    console.error("❌ 일괄 삭제 실패:", deleteError);
    throw new Error(`장바구니 항목 삭제에 실패했습니다: ${deleteError.message}`);
  }

  // 3. 캐시 무효화
  revalidatePath("/cart");
  revalidatePath("/");

  console.log("✅ 일괄 삭제 완료");
  console.groupEnd();
}

/**
 * 현재 사용자의 장바구니를 전체 비웁니다.
 *
 * @throws 로그인하지 않은 경우 에러
 */
export async function clearCart(): Promise<void> {
  console.group("🛒 [clearCart] 장바구니 전체 비우기 시작");

  // 1. 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ 로그인하지 않은 사용자");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 2. 본인의 모든 장바구니 항목 삭제
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("clerk_id", userId);

  if (deleteError) {
    console.error("❌ 장바구니 비우기 실패:", deleteError);
    throw new Error(`장바구니 비우기에 실패했습니다: ${deleteError.message}`);
  }

  // 3. 캐시 무효화
  revalidatePath("/cart");
  revalidatePath("/");

  console.log("✅ 장바구니 비우기 완료");
  console.groupEnd();
}

