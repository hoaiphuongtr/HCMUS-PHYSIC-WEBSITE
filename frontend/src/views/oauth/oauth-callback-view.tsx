"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function OAuthCallbackView() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      window.location.href = "/";
    } else {
      const errorMessage = searchParams.get("errorMessage");
      setError(
        errorMessage ?? "Something went wrong with Google authentication",
      );
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-lg bg-red-50 text-red-600 text-sm max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-hcmus-gray text-sm">Authenticating...</p>
    </div>
  );
}
