import type { NextConfig } from "next";

// 빌드 타임에 필수 환경 변수 체크
console.group("🔍 [next.config.ts] 환경변수 검증 시작");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("실행 환경:", process.env.NODE_ENV === "production" ? "프로덕션" : "개발");

const requiredEnvVars = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const missingEnvVars: string[] = [];
const presentEnvVars: string[] = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
    console.warn(`⚠️  누락됨: ${envVar}`);
  } else {
    presentEnvVars.push(envVar);
    console.log(`✅ 설정됨: ${envVar}`);
  }
}

console.log(`\n📊 환경변수 상태:`);
console.log(`   - 설정됨: ${presentEnvVars.length}개`);
console.log(`   - 누락됨: ${missingEnvVars.length}개`);

if (missingEnvVars.length > 0) {
  const isProduction = process.env.NODE_ENV === "production";
  const errorMessage = [
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    "",
    "Please ensure all required environment variables are set:",
    "",
    "For Local Development:",
    "1. Copy .env.example to .env",
    "2. Fill in all required environment variables",
    "",
    "For Vercel Deployment:",
    "1. Go to your Vercel project → Settings → Environment Variables",
    "2. Add all missing environment variables",
    "3. Ensure they're available for the correct environment (Production, Preview, Development)",
    "4. Redeploy your project after adding the variables",
    "",
    `Missing variables: ${missingEnvVars.join(", ")}`,
  ].join("\n");

  if (isProduction) {
    // 프로덕션 빌드에서는 에러 발생
    console.error("\n❌ 프로덕션 빌드 실패: 필수 환경변수가 누락되었습니다.");
    console.error(errorMessage);
    console.groupEnd();
    throw new Error(errorMessage);
  } else {
    // 개발 환경에서는 경고만 출력하고 계속 진행
    console.warn("\n⚠️  개발 환경: 일부 환경변수가 누락되었습니다.");
    console.warn("개발 서버는 계속 실행되지만, 해당 기능은 정상 작동하지 않을 수 있습니다.");
    console.warn(errorMessage);
    console.warn("\n💡 해결 방법:");
    console.warn("   1. .env 파일을 확인하세요");
    console.warn("   2. .env.example 파일을 참고하여 누락된 환경변수를 추가하세요");
    console.warn("   3. 개발 서버를 재시작하세요");
  }
} else {
  console.log("\n✅ 모든 필수 환경변수가 설정되어 있습니다.");
}

console.groupEnd();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // Supabase Storage 이미지 호스트 추가
      { hostname: "**.supabase.co" },
      // Placeholder 이미지 호스트 추가
      { hostname: "via.placeholder.com" },
      // 아데쿠버 이미지 호스트 추가 (참고용)
      { hostname: "www.adekuver.com" },
    ],
  },
};

export default nextConfig;
