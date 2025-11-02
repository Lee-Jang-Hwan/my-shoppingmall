/**
 * @file components/cart-icon.tsx
 * @description 장바구니 아이콘 컴포넌트
 *
 * Navbar에서 사용하는 장바구니 아이콘과 개수 배지를 표시하는 클라이언트 컴포넌트입니다.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartCount } from "@/actions/cart";
import { useAuth } from "@clerk/nextjs";

export function CartIcon() {
  const { isSignedIn } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isSignedIn) {
      setCount(0);
      return;
    }

    // 장바구니 개수 조회
    const loadCount = async () => {
      try {
        const cartCount = await getCartCount();
        setCount(cartCount);
      } catch (error) {
        console.error("장바구니 개수 조회 실패:", error);
      }
    };

    loadCount();

    // 주기적으로 갱신 (5초마다)
    const interval = setInterval(loadCount, 5000);

    return () => clearInterval(interval);
  }, [isSignedIn]);

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center p-2 hover:opacity-70 transition-opacity"
      aria-label="장바구니"
    >
      <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
      {isSignedIn && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-light text-white bg-black rounded-full px-1.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

