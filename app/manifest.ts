import { MetadataRoute } from "next";

/**
 * manifest.json 생성
 * PWA 및 앱 설치를 위한 매니페스트
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Shopping Mall",
    short_name: "Shopping",
    description: "온라인 쇼핑몰",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

