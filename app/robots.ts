import { MetadataRoute } from "next";

/**
 * robots.txt 생성
 * 검색 엔진 크롤러에게 사이트 크롤링 규칙 제공
 */
export default function robots(): MetadataRoute.Robots {
  // 프로덕션 환경에서만 사이트맵 제공 (환경변수로 제어 가능)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/checkout/",
          "/my/",
          "/cart",
          // 정적 파일 및 기타 비공개 경로
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

