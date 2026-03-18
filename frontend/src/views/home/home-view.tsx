"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HomeView() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/Logo_Phys-blue.png"
            alt="HCMUS Physics Logo"
            width={180}
            height={50}
          />
          <button
            className="text-sm text-hcmus-gray hover:text-red-600 font-medium transition-colors"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-hcmus-dark mb-4">
          Welcome to HCMUS Physics Portal
        </h1>
        <p className="text-hcmus-gray text-lg">
          This is the home page. More features coming soon.
        </p>
      </main>
    </div>
  );
}
