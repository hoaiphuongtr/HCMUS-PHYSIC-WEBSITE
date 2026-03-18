"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api";

type Step = "email" | "otp" | "password";

export function ForgotPasswordView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTPMutation = useMutation({
    mutationKey: ["AUTH", "SEND_OTP"],
    mutationFn: authApi.sendOTP,
    onSuccess() {
      setStep("otp");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to send OTP");
    },
  });

  const verifyOTPMutation = useMutation({
    mutationKey: ["AUTH", "VERIFY_OTP"],
    mutationFn: authApi.verifyOTP,
    onSuccess() {
      setStep("password");
      toast.success("Code verified successfully");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Invalid or expired verification code");
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationKey: ["AUTH", "FORGOT_PASSWORD"],
    mutationFn: authApi.forgotPassword,
    onSuccess() {
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to reset password");
    },
  });

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    sendOTPMutation.mutate({ email, type: "FORGOT_PASSWORD" });
  };

  const handleOTPChange = (index: number, value: string) => {
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

  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    verifyOTPMutation.mutate({ email, code, type: "FORGOT_PASSWORD" });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }
    const code = otp.join("");
    forgotPasswordMutation.mutate({
      email,
      code,
      newPassword,
      confirmNewPassword,
    });
  };

  const handleResend = () => {
    sendOTPMutation.mutate({ email, type: "FORGOT_PASSWORD" });
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
            {step === "email" && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900">
                    Forgot Password
                  </h2>
                  <p className="text-sm text-hcmus-gray mt-2">
                    Enter your email address and we&apos;ll send you a
                    verification code to reset your password.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSendOTP}>
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

                  <button
                    className="w-full bg-hcmus-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-50"
                    type="submit"
                    disabled={sendOTPMutation.isPending}
                  >
                    {sendOTPMutation.isPending
                      ? "Sending verification..."
                      : "Send Verification Code"}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-hcmus-gray">
                    Remember your password?{" "}
                    <Link
                      className="text-hcmus-blue font-bold hover:underline"
                      href="/login"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">
                    Verify your email
                  </h2>
                  <p className="text-sm text-hcmus-gray mt-2">
                    We&apos;ve sent a 6-digit verification code to your email.
                    Enter it below to continue.
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP}>
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
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      />
                    ))}
                  </div>

                  <button
                    className="w-full bg-hcmus-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-50"
                    type="submit"
                    disabled={verifyOTPMutation.isPending}
                  >
                    {verifyOTPMutation.isPending ? "Verifying..." : "Verify"}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-hcmus-gray">
                  Didn&apos;t receive the code?{" "}
                  <button
                    className="text-hcmus-blue font-bold hover:underline disabled:opacity-50"
                    type="button"
                    onClick={handleResend}
                    disabled={sendOTPMutation.isPending}
                  >
                    {sendOTPMutation.isPending ? "Sending..." : "Resend"}
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <button
                    className="text-hcmus-gray text-sm hover:text-hcmus-blue inline-flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp(["", "", "", "", "", ""]);
                    }}
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
                    Change email
                  </button>
                </div>
              </>
            )}

            {step === "password" && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900">
                    Set New Password
                  </h2>
                  <p className="text-sm text-hcmus-gray mt-2">
                    Enter your new password below.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleResetPassword}>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                      htmlFor="newPassword"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hcmus-blue focus:border-hcmus-blue transition-colors text-sm outline-none"
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                      htmlFor="confirmNewPassword"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hcmus-blue focus:border-hcmus-blue transition-colors text-sm outline-none"
                        id="confirmNewPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? (
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
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending
                      ? "Resetting..."
                      : "Reset Password"}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button
                    className="text-hcmus-gray text-sm hover:text-hcmus-blue inline-flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp(["", "", "", "", "", ""]);
                      setNewPassword("");
                      setConfirmNewPassword("");
                    }}
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
                    Start over
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-hcmus-gray text-xs">
            &copy; 2024 HCMUS Faculty of Physics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
