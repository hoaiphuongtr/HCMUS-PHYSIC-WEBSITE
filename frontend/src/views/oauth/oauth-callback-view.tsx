"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

export function OAuthCallbackView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      window.location.href = "/";
    } else {
      const errorMessage = searchParams.get("errorMessage");
      toast.error(
        errorMessage ?? "Something went wrong with Google authentication",
      );
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-hcmus-gray text-sm">Authenticating...</p>
    </div>
  );
}
