/**
 * @file actions/admin/products.ts
 * @description 상품 관리 Server Actions
 *
 * 관리자가 상품을 생성, 수정, 삭제, 조회하는 Server Actions입니다.
 * 모든 액션에서 관리자 권한을 체크합니다.
 *
 * 주요 기능:
 * 1. createProduct: 새 상품 생성
 * 2. updateProduct: 기존 상품 수정
 * 3. deleteProduct: 상품 삭제 (소프트 삭제 또는 완전 삭제)
 * 4. getAdminProducts: 관리자용 상품 목록 조회 (검색, 필터링 지원)
 *
 * @dependencies
 * - lib/admin/is-admin.ts: 관리자 권한 체크
 * - lib/supabase/server.ts: Supabase 클라이언트
 * - types/product.ts: Product 타입 정의
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/is-admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/product";

/**
 * 상품 생성에 필요한 데이터 타입
 */
export interface CreateProductData {
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  stock_quantity: number;
  image_url?: string | null;
  image_urls?: string[] | null;
  is_promotional?: boolean;
  options?: Record<string, unknown> | null;
  status?: "active" | "out_of_stock" | "hidden";
  is_active?: boolean;
}

/**
 * 상품 수정에 필요한 데이터 타입
 */
export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

/**
 * 관리자용 상품 목록 조회 파라미터
 */
export interface GetAdminProductsParams {
  search?: string;
  status?: "active" | "out_of_stock" | "hidden" | null;
  category?: string | null;
  sortBy?: "name" | "price" | "created_at" | "view_count";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * 새 상품을 생성합니다.
 *
 * @param data - 상품 생성 데이터
 * @returns 생성된 상품 정보
 * @throws 관리자가 아닌 경우 에러
 */
export async function createProduct(
  data: CreateProductData
): Promise<Product> {
  // 관리자 권한 체크
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // image_urls가 없고 image_url이 있으면 image_urls로 변환
  const image_urls =
    data.image_urls ??
    (data.image_url ? [data.image_url] : []);

  // 상품 생성
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      category: data.category ?? null,
      stock_quantity: data.stock_quantity,
      image_url: data.image_url ?? null,
      image_urls: image_urls.length > 0 ? image_urls : null,
      is_promotional: data.is_promotional ?? false,
      options: data.options ?? null,
      status: data.status ?? "active",
      is_active: data.status !== "hidden",
    })
    .select()
    .single();

  if (error) {
    console.error("상품 생성 에러:", error);
    throw new Error(`상품 생성에 실패했습니다: ${error.message}`);
  }

  // 캐시 무효화
  revalidatePath("/admin");
  revalidatePath("/");

  return product as Product;
}

/**
 * 기존 상품을 수정합니다.
 *
 * @param data - 상품 수정 데이터 (id 필수)
 * @returns 수정된 상품 정보
 * @throws 관리자가 아닌 경우 에러
 */
export async function updateProduct(
  data: UpdateProductData
): Promise<Product> {
  // 관리자 권한 체크
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  // 수정할 필드만 추출 (id 제외)
  const { id, ...updateData } = data;

  // image_urls 처리
  if (updateData.image_urls !== undefined || updateData.image_url !== undefined) {
    const image_urls =
      updateData.image_urls ??
      (updateData.image_url ? [updateData.image_url] : []);
    
    updateData.image_urls = image_urls.length > 0 ? image_urls : null;
    if (updateData.image_url && !updateData.image_urls) {
      updateData.image_url = null;
    }
  }

  // status가 변경되면 is_active도 업데이트
  // updateData에 is_active 속성을 안전하게 추가하기 위해 별도 객체 생성
  const updatePayload: Record<string, unknown> = { ...updateData };
  if (updateData.status !== undefined) {
    updatePayload.is_active = updateData.status !== "hidden";
  }

  // 상품 수정
  const { data: product, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("상품 수정 에러:", error);
    throw new Error(`상품 수정에 실패했습니다: ${error.message}`);
  }

  if (!product) {
    throw new Error("상품을 찾을 수 없습니다.");
  }

  // 캐시 무효화
  revalidatePath("/admin");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath(`/products/${id}`);
  revalidatePath("/");

  return product as Product;
}

/**
 * 상품을 삭제합니다.
 *
 * @param id - 삭제할 상품 ID
 * @param hardDelete - 완전 삭제 여부 (true: 완전 삭제, false: 소프트 삭제)
 * @throws 관리자가 아닌 경우 에러
 */
export async function deleteProduct(
  id: string,
  hardDelete: boolean = false
): Promise<void> {
  // 관리자 권한 체크
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  if (hardDelete) {
    // 완전 삭제
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("상품 완전 삭제 에러:", error);
      throw new Error(`상품 삭제에 실패했습니다: ${error.message}`);
    }
  } else {
    // 소프트 삭제 (status를 'hidden'으로 변경)
    const { error } = await supabase
      .from("products")
      .update({
        status: "hidden",
        is_active: false,
      })
      .eq("id", id);

    if (error) {
      console.error("상품 소프트 삭제 에러:", error);
      throw new Error(`상품 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // 캐시 무효화
  revalidatePath("/admin");
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
}

/**
 * 관리자용 상품 목록을 조회합니다.
 *
 * @param params - 조회 파라미터 (검색, 필터링, 정렬 등)
 * @returns 상품 목록
 * @throws 관리자가 아닌 경우 에러
 */
export async function getAdminProducts(
  params: GetAdminProductsParams = {}
): Promise<Product[]> {
  // 관리자 권한 체크
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  let query = supabase.from("products").select("*");

  // 검색 (이름 또는 설명에 포함)
  if (params.search) {
    const searchPattern = `%${params.search}%`;
    query = query.or(
      `name.ilike.${searchPattern},description.ilike.${searchPattern}`
    );
  }

  // 상태 필터링
  if (params.status !== null && params.status !== undefined) {
    query = query.eq("status", params.status);
  }

  // 카테고리 필터링
  if (params.category) {
    query = query.eq("category", params.category);
  }

  // 정렬
  const sortBy = params.sortBy ?? "created_at";
  const sortOrder = params.sortOrder ?? "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // 페이지네이션
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data: products, error } = await query;

  if (error) {
    console.error("상품 목록 조회 에러:", error);
    throw new Error(`상품 목록 조회에 실패했습니다: ${error.message}`);
  }

  return (products ?? []) as Product[];
}

/**
 * 상품 ID로 상품을 조회합니다.
 *
 * @param id - 상품 ID
 * @returns 상품 정보 또는 null
 * @throws 관리자가 아닌 경우 에러
 */
export async function getProductById(
  id: string
): Promise<Product | null> {
  // 관리자 권한 체크
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = createClerkSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 상품을 찾을 수 없음
      return null;
    }
    console.error("상품 조회 에러:", error);
    throw new Error(`상품 조회에 실패했습니다: ${error.message}`);
  }

  return product as Product;
}

