"use client";

import { useMutation } from "@tanstack/react-query";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationKey: ["AUTH", "LOGIN"],
    mutationFn: authApi.login,
    onSuccess(data) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      toast.success("Login successful");
      window.location.href = "/";
    },
    onError(err: { message?: string; statusCode?: number }) {
      toast.error(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await authApi.googleLink();
      window.location.href = data.url;
    } catch {
      toast.error("Failed to initiate Google login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-hcmus-dark bg-white">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full" style={{ maxWidth: 440 }}>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/Logo_Phys-blue.png"
                alt="HCMUS Physics Logo"
                width={280}
                height={80}
                priority
              />
            </div>
          </div>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-hcmus-gray">
                Please enter your details to sign in.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hcmus-blue focus:border-hcmus-blue transition-colors text-sm outline-none"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. student@hcmus.edu.vn"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-sm font-semibold text-gray-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    className="text-xs font-semibold text-hcmus-blue hover:underline"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hcmus-blue focus:border-hcmus-blue transition-colors text-sm outline-none"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <ViewOffIcon size={18} />
                    ) : (
                      <ViewIcon size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="w-full bg-hcmus-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-50"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-hcmus-gray font-medium">
                  Or sign in with
                </span>
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>

            <footer className="mt-8 text-center">
              <p className="text-sm text-hcmus-gray">
                Don&apos;t have an account?{" "}
                <Link
                  className="text-hcmus-blue font-bold hover:underline inline-flex items-center gap-1"
                  href="/register"
                >
                  Register here
                  <svg
                    aria-hidden="true"
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
              </p>
            </footer>
          </section>
        </div>
      </main>

      <footer className="py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-hcmus-gray text-xs">
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5a1 1 0 112 0v4h3a1 1 0 110 2h-4a1 1 0 01-1-1z" />
            </svg>
            &copy; 2024 Faculty of Physics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
