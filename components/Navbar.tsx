"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/cart-icon";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center justify-between px-4 lg:px-8 max-w-7xl mx-auto">
        {/* 브랜드 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-light tracking-wide">N.Code.Flow</span>
        </Link>

        {/* 우측 액션 버튼 */}
        <div className="flex items-center gap-3">
          <CartIcon />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-sm font-light">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/my/orders">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-sm font-light">
                주문 내역
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
