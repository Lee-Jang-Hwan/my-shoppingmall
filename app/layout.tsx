import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N.Code.Flow",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 빌드 타임에 환경 변수 체크
  // next.config.ts에서도 체크하지만, 여기서도 이중 체크하여 더 명확한 에러 메시지 제공
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // 개발 환경에서는 더 자세한 안내 제공
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.\n\n" +
          "Please check:\n" +
          "1. Your .env file contains NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\n" +
          "2. The value is correct (no extra spaces or quotes)\n" +
          "3. Restart the dev server after adding the variable\n\n" +
          "For Vercel deployment:\n" +
          "1. Go to Vercel Dashboard → Settings → Environment Variables\n" +
          "2. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\n" +
          "3. Select all environments (Production, Preview, Development)\n" +
          "4. Redeploy after adding",
      );
    }
    // 프로덕션/빌드 환경에서는 간단한 메시지
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
        "Please set it in Vercel Dashboard → Settings → Environment Variables and redeploy.",
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
            <Footer />
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
