"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TokenPayload = {
  userId: string;
  roleName: string;
  exp: number;
  iat: number;
};

function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function HomeView() {
  const router = useRouter();
  const [payload, setPayload] = useState<TokenPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
      return;
    }
    setPayload(decoded);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  if (!payload) return null;

  const isAdmin =
    payload.roleName === "ADMIN" || payload.roleName === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/Logo_Phys-blue.png"
            alt="HCMUS Physics Logo"
            width={180}
            height={50}
          />
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-white bg-hcmus-blue hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Admin Portal
              </Link>
            )}
            <button
              className="text-sm text-hcmus-gray hover:text-red-600 font-medium transition-colors"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-hcmus-dark mb-4">
          Welcome to HCMUS Physics Portal
        </h1>
        <p className="text-hcmus-gray text-lg mb-8">
          This is the home page. More features coming soon.
        </p>
        {isAdmin && (
          <Link
            href="/admin/widgets-layout"
            className="inline-flex items-center gap-2 text-sm font-medium text-hcmus-blue hover:underline"
          >
            Go to Widgets Layout
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        )}
      </main>
    </div>
  );
}
