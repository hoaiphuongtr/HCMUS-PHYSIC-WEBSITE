"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { mediaApi } from "@/lib/api";

type UploadZoneProps = {
  tagSlugs?: string[];
  onUploaded: () => void;
};

export function UploadZone({ tagSlugs, onUploaded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(0);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const uploadMutation = useMutation({
    mutationKey: ["MEDIA", "UPLOAD"],
    mutationFn: (file: File) => mediaApi.upload(file, { tagSlugs }),
  });

  const urlMutation = useMutation({
    mutationKey: ["MEDIA", "CREATE_FROM_URL"],
    mutationFn: (url: string) => mediaApi.createFromUrl({ url, tagSlugs }),
    onSuccess: () => {
      toast.success("Đã lưu URL");
      setUrlValue("");
      setUrlMode(false);
      onUploaded();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Không lưu được URL");
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const rejected = files.length - valid.length;
    if (rejected > 0) {
      toast.warning(`Đã bỏ qua ${rejected} file không phải ảnh`);
    }
    if (valid.length === 0) return;

    setPending(valid.length);
    let success = 0;
    for (const file of valid) {
      try {
        await uploadMutation.mutateAsync(file);
        success++;
      } catch (err) {
        const msg = (err as { message?: string })?.message ?? "Upload thất bại";
        toast.error(`${file.name}: ${msg}`);
      } finally {
        setPending((p) => p - 1);
      }
    }
    if (success > 0) {
      toast.success(`Đã tải lên ${success} ảnh`);
      onUploaded();
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors " +
        (dragOver
          ? "border-blue-400 bg-blue-50"
          : "border-slate-200 bg-slate-50/60 hover:bg-slate-50")
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <span className="material-symbols-outlined text-4xl text-slate-400">
        cloud_upload
      </span>
      <p className="mt-2 text-sm text-slate-600">
        Kéo thả ảnh vào đây, hoặc
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ml-1 text-blue-600 font-medium hover:underline"
        >
          chọn từ máy
        </button>
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Hỗ trợ JPG, PNG, WebP, GIF. Tối đa 10MB mỗi file.
      </p>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-400">hoặc</span>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="text-blue-600 font-medium hover:underline"
        >
          {urlMode ? "Ẩn nhập URL" : "Nhập URL ảnh bên ngoài"}
        </button>
      </div>
      {urlMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = urlValue.trim();
            if (clean) urlMutation.mutate(clean);
          }}
          className="mt-3 flex items-center gap-2 max-w-xl mx-auto"
        >
          <input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://… (ví dụ ảnh từ Pinterest, CDN…)"
            className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={urlMutation.isPending || !urlValue.trim()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {urlMutation.isPending ? "Đang lưu…" : "Lưu URL"}
          </button>
        </form>
      )}
      {pending > 0 && (
        <p className="mt-3 text-xs text-blue-600 font-medium">
          Đang tải lên {pending} file…
        </p>
      )}
    </section>
  );
}
