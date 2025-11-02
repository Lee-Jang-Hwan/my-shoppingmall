/**
 * @file components/Footer.tsx
 * @description 푸터 컴포넌트
 *
 * 인스타그램, 쓰레드 아이콘 및 링크를 포함한 푸터
 */

import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* 브랜드명 */}
          <div>
            <Link href="/" className="text-xl font-light tracking-wide">
              N.Code.Flow
            </Link>
          </div>

          {/* 소셜 미디어 링크 */}
          <div className="flex items-center gap-6">
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="인스타그램"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="https://threads.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="쓰레드"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} N.Code.Flow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
