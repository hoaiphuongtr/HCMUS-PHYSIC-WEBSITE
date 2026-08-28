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
import { adminApi, type StaffUnit } from "@/lib/api";
// Dùng chung danh mục với modal "Sửa hồ sơ" — khoá phải khớp ĐÚNG chuỗi ACADsoom.
import {
  DEGREES,
  EMPLOYMENT,
  POSITIONS,
  RANKS,
} from "@/views/admin/admins/edit-profile-modal";

const nn = (s: string) => (s.trim() ? s : null);

const fieldCls =
  "w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30";

export function CreateStaffModal({
  units,
  onClose,
}: {
  units: StaffUnit[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rank, setRank] = useState("");
  const [positionKey, setPositionKey] = useState("");
  const [degree, setDegree] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionFrom, setPositionFrom] = useState("");
  const [positionTo, setPositionTo] = useState("");

  const create = useMutation({
    mutationKey: ["STAFF", "CREATE"],
    mutationFn: () =>
      adminApi.createStaff({
        name: name.trim(),
        email: email.trim(),
        rank: nn(rank),
        positionKey: nn(positionKey),
        degree: nn(degree),
        teacherId: nn(teacherId),
        employmentType: nn(employmentType),
        departmentId: nn(departmentId),
        positionFrom: nn(positionFrom),
        positionTo: nn(positionTo),
      }),
    onSuccess: () => {
      toast.success("Đã tạo cán bộ");
      queryClient.invalidateQueries({ queryKey: ["STAFF"] });
      onClose();
    },
    onError: (err: { message?: string }) => {
      // Backend trả 409 "Email đã tồn tại" — thông điệp đã nằm trong err.message.
      toast.error(err.message || "Tạo cán bộ thất bại");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    if (!email.trim()) {
      toast.error("Email không được để trống");
      return;
    }
    create.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo cán bộ mới</DialogTitle>
          <DialogDescription>
            Thêm hồ sơ cán bộ / giảng viên (ngạch, học vị, chức vụ…). Cán bộ
            không có tài khoản đăng nhập nên không cần mật khẩu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-3">
          <Field
            label="Họ và tên"
            htmlFor={`${id}-name`}
            className="col-span-2"
          >
            <input
              id={`${id}-name`}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className={fieldCls}
            />
          </Field>

          <Field label="Email" htmlFor={`${id}-email`} className="col-span-2">
            <input
              id={`${id}-email`}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldCls}
            />
          </Field>

          <Field label="Ngạch" htmlFor={`${id}-rank`}>
            <select
              id={`${id}-rank`}
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className={fieldCls}
            >
              <option value="">— chưa đặt —</option>
              {RANKS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l} ({k})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Học vị" htmlFor={`${id}-degree`}>
            <select
              id={`${id}-degree`}
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className={fieldCls}
            >
              <option value="">— chưa đặt —</option>
              {DEGREES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Chức vụ quản lý" htmlFor={`${id}-pos`}>
            <select
              id={`${id}-pos`}
              value={positionKey}
              onChange={(e) => setPositionKey(e.target.value)}
              className={fieldCls}
            >
              <option value="">— không giữ chức vụ —</option>
              {POSITIONS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Đơn vị" htmlFor={`${id}-unit`}>
            <select
              id={`${id}-unit`}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={fieldCls}
            >
              <option value="">— chưa đặt —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nhiệm kỳ từ" htmlFor={`${id}-from`}>
            <input
              id={`${id}-from`}
              type="date"
              value={positionFrom}
              onChange={(e) => setPositionFrom(e.target.value)}
              className={fieldCls}
            />
          </Field>

          <Field label="Nhiệm kỳ đến" htmlFor={`${id}-to`}>
            <input
              id={`${id}-to`}
              type="date"
              value={positionTo}
              onChange={(e) => setPositionTo(e.target.value)}
              className={fieldCls}
            />
          </Field>

          <Field label="MSCB (giữ số 0 đầu)" htmlFor={`${id}-mscb`}>
            <input
              id={`${id}-mscb`}
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={fieldCls}
            />
          </Field>

          <Field label="Loại công tác" htmlFor={`${id}-emp`}>
            <select
              id={`${id}-emp`}
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className={fieldCls}
            >
              <option value="">— chưa đặt —</option>
              {EMPLOYMENT.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {create.isPending ? "Đang tạo…" : "Tạo cán bộ"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
