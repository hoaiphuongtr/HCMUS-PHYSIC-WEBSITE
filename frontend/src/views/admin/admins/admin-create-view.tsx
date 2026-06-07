"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ChevronLeftIcon } from "@/components/admin/icons";
import { authApi, departmentApi, mediaApi, resolveMediaUrl } from "@/lib/api";
import { MediaPickerModal } from "@/views/admin/widgets-layout/fields/media-picker-modal";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: string;
  newDepartmentName: string;
  password: string;
  avatarUrl: string;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  position: "",
  departmentId: "",
  newDepartmentName: "",
  password: "",
  avatarUrl: "",
};

export function AdminCreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [createNewDept, setCreateNewDept] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File vượt quá 10MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const media = await mediaApi.upload(file);
      setField("avatarUrl", media.url);
      toast.success("Đã tải ảnh lên");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Upload thất bại";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["AUTH", "PROFILE"],
    queryFn: authApi.getProfile,
  });

  useEffect(() => {
    if (profile && profile.role !== "SUPER_ADMIN") {
      router.replace("/admin");
    }
  }, [profile, router]);

  const { data: departments = [] } = useQuery({
    queryKey: ["DEPARTMENTS"],
    queryFn: () => departmentApi.list(),
    enabled: profile?.role === "SUPER_ADMIN",
  });

  const createAdminMut = useMutation({
    mutationKey: ["ADMINS", "CREATE"],
    mutationFn: authApi.createAdmin,
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email không được để trống");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Mật khẩu phải tối thiểu 6 ký tự");
      return;
    }
    setSubmitting(true);
    try {
      const newDepartmentName =
        createNewDept && form.newDepartmentName.trim()
          ? form.newDepartmentName.trim()
          : undefined;
      await createAdminMut.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        position: form.position.trim() || undefined,
        departmentId: newDepartmentName
          ? undefined
          : form.departmentId || undefined,
        newDepartmentName,
        avatarUrl: form.avatarUrl || undefined,
      });
      toast.success("Đã tạo admin mới");
      queryClient.invalidateQueries({ queryKey: ["ADMINS"] });
      queryClient.invalidateQueries({ queryKey: ["DEPARTMENTS"] });
      router.push("/admin/admins");
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ?? "Tạo admin thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0B1120]">
      <header className="sticky top-0 z-10 bg-white dark:bg-[#101622] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/admin/admins"
            className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202c44] inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Quay lại
          </Link>
        </div>
      </header>

      <form onSubmit={submit} className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Create Admin
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tạo tài khoản quản trị mới. Admin có thể đổi mật khẩu sau khi đăng
          nhập lần đầu.
        </p>

        <div className="mt-6 bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Avatar
            </h2>
            <div className="flex items-center gap-4">
              {form.avatarUrl ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={resolveMediaUrl(form.avatarUrl)}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs">
                  No avatar
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {uploadingAvatar ? "Đang tải…" : "Upload from device"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44]"
                  >
                    Pick from library
                  </button>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setField("avatarUrl", "")}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline self-center"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFile(file);
                  }}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  JPG, PNG, WebP, GIF. Tối đa 10MB.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="First Name"
              required
              value={form.firstName}
              onChange={(v) => setField("firstName", v)}
            />
            <Field
              label="Last Name"
              required
              value={form.lastName}
              onChange={(v) => setField("lastName", v)}
            />
            <Field
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={(v) => setField("email", v)}
              hint="Email này dùng để đăng nhập."
              className="sm:col-span-2"
            />
            <Field
              label="Position / Academic Title"
              value={form.position}
              onChange={(v) => setField("position", v)}
              placeholder="PhD, Lecturer, Department Head…"
            />
            <Field
              label="Default Password"
              type="password"
              required
              value={form.password}
              onChange={(v) => setField("password", v)}
              hint="Tối thiểu 6 ký tự. Admin có thể đổi sau."
            />
          </section>

          <section>
            <label
              htmlFor="departmentSelect"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Department
            </label>
            {createNewDept ? (
              <div className="flex gap-2">
                <input
                  id="newDeptName"
                  value={form.newDepartmentName}
                  onChange={(e) =>
                    setField("newDepartmentName", e.target.value)
                  }
                  placeholder="Tên department mới"
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreateNewDept(false);
                    setField("newDepartmentName", "");
                  }}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202c44]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  id="departmentSelect"
                  value={form.departmentId}
                  onChange={(e) => setField("departmentId", e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100"
                >
                  <option value="">— Chọn department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreateNewDept(true)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202c44]"
                >
                  + New
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href="/admin/admins"
            className="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {showMediaPicker && (
        <MediaPickerModal
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            setField("avatarUrl", url);
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  hint,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
      />
      {hint && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
