"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";

type ResetPasswordModalProps = {
  adminId: string;
  adminName: string;
  onClose: () => void;
};

export function ResetPasswordModal({
  adminId,
  adminName,
  onClose,
}: ResetPasswordModalProps) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const reset = useMutation({
    mutationKey: ["ADMINS", "RESET_PASSWORD", adminId],
    mutationFn: (pw: string) => adminApi.resetPassword(adminId, pw),
    onSuccess: () => {
      toast.success("Đã đặt lại mật khẩu");
      queryClient.invalidateQueries({ queryKey: ["ADMINS"] });
      onClose();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Đặt lại mật khẩu thất bại");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu không khớp");
      return;
    }
    reset.mutate(password);
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password — {adminName}</DialogTitle>
          <DialogDescription>
            Đặt password mới cho admin. Admin sẽ dùng password này để đăng nhập
            ngay lập tức.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 space-y-3">
          <div>
            <label
              htmlFor={`${inputId}-pw`}
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              New password
            </label>
            <input
              id={`${inputId}-pw`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label
              htmlFor={`${inputId}-confirm`}
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm password
            </label>
            <input
              id={`${inputId}-confirm`}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reset.isPending}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {reset.isPending ? "Đang lưu…" : "Reset password"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
