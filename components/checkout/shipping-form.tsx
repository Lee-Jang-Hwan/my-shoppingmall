/**
 * @file components/checkout/shipping-form.tsx
 * @description 배송 정보 입력 폼 컴포넌트
 *
 * 주문 시 배송 정보를 입력하는 폼입니다.
 *
 * 주요 기능:
 * 1. 수령인 이름, 연락처 입력
 * 2. 배송 주소 입력 (우편번호, 기본주소, 상세주소)
 * 3. 배송 요청사항 선택 또는 직접 입력
 * 4. 주문 메모 입력
 * 5. 유효성 검증 (react-hook-form + Zod)
 *
 * @dependencies
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 * - types/order.ts: ShippingFormData 타입
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ShippingFormData } from "@/types/order";

/**
 * 배송 정보 폼 스키마 (Zod)
 */
const shippingFormSchema = z.object({
  recipientName: z
    .string()
    .min(1, "수령인 이름을 입력해주세요.")
    .max(50, "수령인 이름은 50자 이하여야 합니다."),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요.")
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, "올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)"),
  postalCode: z
    .string()
    .min(1, "우편번호를 입력해주세요.")
    .max(10, "우편번호는 10자 이하여야 합니다."),
  address: z
    .string()
    .min(1, "기본 주소를 입력해주세요.")
    .max(200, "기본 주소는 200자 이하여야 합니다."),
  detailAddress: z
    .string()
    .min(1, "상세 주소를 입력해주세요.")
    .max(200, "상세 주소는 200자 이하여야 합니다."),
  deliveryRequest: z.string().max(200, "배송 요청사항은 200자 이하여야 합니다.").optional(),
  orderNote: z.string().max(500, "주문 메모는 500자 이하여야 합니다.").optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

/**
 * 배송 요청사항 옵션
 */
const DELIVERY_REQUEST_OPTIONS = [
  { value: "", label: "직접 입력" },
  { value: "문 앞", label: "문 앞" },
  { value: "부재 시 문 앞에 놓아주세요", label: "부재 시 문 앞에 놓아주세요" },
  { value: "부재 시 경비실에 맡겨주세요", label: "부재 시 경비실에 맡겨주세요" },
  { value: "배송 전 연락 바랍니다", label: "배송 전 연락 바랍니다" },
] as const;

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void | Promise<void>;
  defaultValues?: Partial<ShippingFormData>;
  isLoading?: boolean;
  onError?: (error: Error) => void;
}

export function ShippingForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  onError,
}: ShippingFormProps) {
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      recipientName: defaultValues?.recipientName ?? "",
      phone: defaultValues?.phone ?? "",
      postalCode: defaultValues?.postalCode ?? "",
      address: defaultValues?.address ?? "",
      detailAddress: defaultValues?.detailAddress ?? "",
      deliveryRequest: defaultValues?.deliveryRequest ?? "",
      orderNote: defaultValues?.orderNote ?? "",
    },
  });

  const handleSubmit = async (data: ShippingFormValues) => {
    try {
      const shippingData: ShippingFormData = {
        recipientName: data.recipientName,
        phone: data.phone.replace(/-/g, ""), // 하이픈 제거하여 저장
        postalCode: data.postalCode,
        address: data.address,
        detailAddress: data.detailAddress,
        deliveryRequest: data.deliveryRequest,
        orderNote: data.orderNote,
      };
      await onSubmit(shippingData);
    } catch (error) {
      // 에러는 onSubmit에서 처리되지만, 폼 제출 중 에러 발생 시 사용자에게 알림
      console.error("주문 생성 실패:", error);
      if (onError && error instanceof Error) {
        onError(error);
      } else if (!onError) {
        // onError 핸들러가 없으면 기본 alert 표시
        alert(
          error instanceof Error
            ? error.message
            : "주문 생성에 실패했습니다. 다시 시도해주세요."
        );
      }
    }
  };

  const deliveryRequestValue = form.watch("deliveryRequest");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 수령인 이름 */}
        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>수령인 이름 *</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 연락처 */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>연락처 (휴대폰) *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="010-1234-5678"
                  {...field}
                  onChange={(e) => {
                    // 하이픈 자동 추가 (선택사항)
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    let formatted = value;
                    if (value.length > 3 && value.length <= 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                    } else if (value.length > 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                    }
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormDescription>예: 010-1234-5678</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 우편번호 */}
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>우편번호 *</FormLabel>
              <FormControl>
                <Input placeholder="12345" {...field} />
              </FormControl>
              <FormDescription>
                우편번호 검색 기능은 향후 추가 예정입니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 기본 주소 */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>기본 주소 *</FormLabel>
              <FormControl>
                <Input placeholder="서울시 강남구 테헤란로 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 상세 주소 */}
        <FormField
          control={form.control}
          name="detailAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 주소 *</FormLabel>
              <FormControl>
                <Input placeholder="101동 101호" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 배송 요청사항 */}
        <FormField
          control={form.control}
          name="deliveryRequest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>배송 요청사항</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <select
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        // "직접 입력" 선택 시 빈 값으로 설정하여 자유 입력 가능
                        field.onChange("");
                      } else {
                        field.onChange(value);
                      }
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    {DELIVERY_REQUEST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {deliveryRequestValue === "" && (
                    <Input
                      placeholder="배송 요청사항을 직접 입력하세요"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                </div>
              </FormControl>
              <FormDescription>배송 시 요청사항이 있으시면 입력해주세요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 주문 메모 */}
        <FormField
          control={form.control}
          name="orderNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주문 메모</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="주문 시 요청사항이나 메모를 입력하세요 (선택사항)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>주문 시 추가 요청사항이 있으시면 입력해주세요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "주문 처리 중..." : "주문하기"}
        </Button>
      </form>
    </Form>
  );
}

