import type { NextConfig } from "next";

// 빌드 타임에 필수 환경 변수 체크
const requiredEnvVars = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}\n` +
        "Please ensure all required environment variables are set in Vercel Dashboard:\n" +
        "1. Go to your Vercel project → Settings → Environment Variables\n" +
        "2. Add the missing environment variable\n" +
        "3. Ensure it's available for the correct environment (Production, Preview, Development)\n" +
        "4. Redeploy your project after adding the variable."
    );
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
};

export default nextConfig;
