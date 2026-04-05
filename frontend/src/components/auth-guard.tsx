"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getTokenPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    const payload = getTokenPayload(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(payload.roleName)) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
  }, [router, roles]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
