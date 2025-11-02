/**
 * @file components/admin/product-image-upload.tsx
 * @description 다중 이미지 업로드 컴포넌트
 *
 * 관리자가 상품 이미지를 다중으로 업로드할 수 있는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 다중 이미지 업로드 (Supabase Storage)
 * 2. 이미지 미리보기
 * 3. 이미지 삭제
 * 4. 이미지 순서 변경 (드래그 앤 드롭 또는 버튼)
 * 5. 업로드 진행률 표시
 *
 * @dependencies
 * - lib/supabase/clerk-client.ts: Supabase 클라이언트
 * - @clerk/nextjs: Clerk 인증
 */

"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { X, Upload, ImageIcon } from "lucide-react";

interface ProductImageUploadProps {
  imageUrls: string[];
  onChange: (imageUrls: string[]) => void;
}

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
const MAX_IMAGE_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ProductImageUpload({
  imageUrls,
  onChange,
}: ProductImageUploadProps) {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});

  // 이미지 업로드
  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!user || !files || files.length === 0) return;

      const filesArray = Array.from(files);
      
      // 파일 유효성 검사
      for (const file of filesArray) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          alert(`${file.name}은(는) 지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)`);
          return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          alert(`${file.name}은(는) 파일 크기가 너무 큽니다. (최대 6MB)`);
          return;
        }
      }

      try {
        setUploading(true);
        const newImageUrls: string[] = [];

        // 여러 파일 업로드
        for (let i = 0; i < filesArray.length; i++) {
          const file = filesArray[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

          const { data, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // 공개 URL 가져오기 (public bucket이 아닌 경우 signed URL 사용)
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

          // private bucket인 경우 signed URL 생성
          const { data: signedData } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(filePath, 3600 * 24 * 365); // 1년 유효

          const imageUrl = signedData?.signedUrl || urlData.publicUrl;
          newImageUrls.push(imageUrl);

          setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
        }

        // 새 이미지 URL을 기존 목록에 추가
        onChange([...imageUrls, ...newImageUrls]);
      } catch (error) {
        console.error("이미지 업로드 에러:", error);
        alert(
          `이미지 업로드에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 에러"}`
        );
      } finally {
        setUploading(false);
        setUploadProgress({});
      }
    },
    [user, supabase, imageUrls, onChange]
  );

  // 이미지 삭제
  const handleRemove = useCallback(
    (index: number) => {
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      onChange(newImageUrls);
    },
    [imageUrls, onChange]
  );

  // 이미지 순서 변경 (위로)
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newImageUrls = [...imageUrls];
      [newImageUrls[index - 1], newImageUrls[index]] = [
        newImageUrls[index],
        newImageUrls[index - 1],
      ];
      onChange(newImageUrls);
    },
    [imageUrls, onChange]
  );

  // 이미지 순서 변경 (아래로)
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === imageUrls.length - 1) return;
      const newImageUrls = [...imageUrls];
      [newImageUrls[index], newImageUrls[index + 1]] = [
        newImageUrls[index + 1],
        newImageUrls[index],
      ];
      onChange(newImageUrls);
    },
    [imageUrls, onChange]
  );

  return (
    <div className="space-y-4">
      {/* 업로드 버튼 */}
      <div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            className="hidden"
          />
          <Button type="button" variant="outline" disabled={uploading} asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "업로드 중..." : "이미지 추가"}
            </span>
          </Button>
        </label>
        <p className="mt-2 text-sm text-muted-foreground">
          JPEG, PNG, WebP 형식의 이미지를 업로드할 수 있습니다. (최대 6MB, 다중 선택 가능)
        </p>
      </div>

      {/* 이미지 목록 */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <img
                  src={url}
                  alt={`상품 이미지 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* 순서 표시 */}
                <div className="absolute top-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {index + 1}
                </div>
                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 rounded bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* 순서 변경 버튼 */}
              <div className="mt-2 flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="flex-1"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === imageUrls.length - 1}
                  className="flex-1"
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 이미지가 없을 때 */}
      {imageUrls.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            아직 업로드된 이미지가 없습니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            위의 "이미지 추가" 버튼을 클릭하여 이미지를 업로드하세요.
          </p>
        </div>
      )}
    </div>
  );
}

