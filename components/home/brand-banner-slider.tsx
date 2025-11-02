/**
 * @file components/home/brand-banner-slider.tsx
 * @description 브랜드 배너 그리드 컴포넌트
 *
 * 브랜드 이미지를 3개 그리드로 표시하는 컴포넌트
 * 각 이미지 크기: 405.58px * 540.78px
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";

interface BrandBannerData {
  id: string;
  imageUrl: string;
  imageLink?: string;
  brandName: string;
  description?: string; // 텍스트 설명 (옵셔널)
  descriptionImageUrl?: string; // 이미지 설명 (옵셔널)
  products: Product[];
}

interface BrandBannerSliderProps {
  slides: BrandBannerData[];
}

export function BrandBannerSlider({ slides }: BrandBannerSliderProps) {
  if (!slides || slides.length === 0) {
    return null;
  }

  // 첫 번째 슬라이드의 이미지를 3개 그리드로 표시
  const slide = slides[0];

  return (
    <section className="mb-16 lg:mb-24">
      {/* 3개 그리드 레이아웃 */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => {
          // 각 이미지별로 다른 파일 사용
          const imageUrl = 
            index === 0 ? slide.imageUrl : // 첫 번째: /1.jpg
            index === 1 ? "/2.jpg" :      // 두 번째: /2.jpg
            "/3.jpg";                      // 세 번째: /3.jpg
          
          return (
            <div key={index} className="subBan_thumb relative bg-muted overflow-hidden">
              {slide.imageLink ? (
                <Link href={slide.imageLink} className="block w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={`${slide.brandName} ${index + 1}`}
                    width={405.58}
                    height={540.78}
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 33vw, 405.58px"
                  />
                </Link>
              ) : (
                <Image
                  src={imageUrl}
                  alt={`${slide.brandName} ${index + 1}`}
                  width={405.58}
                  height={540.78}
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 768px) 33vw, 405.58px"
                />
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .subBan_thumb {
          width: 405.58px;
          height: 540.78px;
        }

        .subBan_thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .subBan_thumb {
            width: 100%;
            height: auto;
            aspect-ratio: 405.58 / 540.78;
          }
        }
      `}</style>
    </section>
  );
}
