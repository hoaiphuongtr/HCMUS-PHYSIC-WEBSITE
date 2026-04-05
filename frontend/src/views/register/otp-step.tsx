"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api";

type OTPStepProps = {
  email: string;
  registerBody: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  onBack: () => void;
};

export function OTPStep({ email, registerBody, onBack }: OTPStepProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const registerMutation = useMutation({
    mutationKey: ["AUTH", "REGISTER"],
    mutationFn: authApi.register,
    onSuccess() {
      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Registration failed");
    },
  });

  const resendMutation = useMutation({
    mutationKey: ["AUTH", "RESEND_OTP"],
    mutationFn: authApi.sendOTP,
    onSuccess() {
      toast.success("OTP sent successfully");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to resend OTP");
    },
  });

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    registerMutation.mutate({ ...registerBody, code });
  };

  const handleResend = () => {
    resendMutation.mutate({ email, type: "REGISTER" });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-hcmus-dark bg-white">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
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
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900">
                Verify your email
              </h2>
              <p className="text-sm text-hcmus-gray mt-2">
                We&apos;ve sent a 6-digit verification code to your email. Enter
                it below to continue.
              </p>
            </div>

            <form onSubmit={handleVerify}>
              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className="w-12 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-hcmus-blue focus:border-hcmus-blue transition-colors outline-none"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>

              <button
                className="w-full bg-hcmus-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-50"
                type="submit"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Verifying..." : "Verify"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-hcmus-gray">
              Didn&apos;t receive the code?{" "}
              <button
                className="text-hcmus-blue font-bold hover:underline disabled:opacity-50"
                type="button"
                onClick={handleResend}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? "Sending..." : "Resend"}
              </button>
            </div>
          </section>

          <div className="mt-8 text-center">
            <button
              className="text-hcmus-gray text-sm hover:text-hcmus-blue inline-flex items-center gap-1"
              type="button"
              onClick={onBack}
            >
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
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Back to Login
            </button>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-hcmus-gray text-xs">
            &copy; 2024 HCMUS Faculty of Physics. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-xs text-hcmus-gray">
            <Link href="#" className="hover:text-hcmus-blue">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-hcmus-blue">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
