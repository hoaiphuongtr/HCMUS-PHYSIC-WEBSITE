"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MediaPickerModal } from "@/views/admin/widgets-layout/fields/media-picker-modal";
import {
  pageLayoutApi,
  postApi,
  resolveMediaUrl,
  type ContentStatusValue,
  type PostCategoryValue,
  type UpsertPostBody,
} from "@/lib/api";
import { toSlug } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";

const CATEGORY_OPTIONS: { value: PostCategoryValue; label: string }[] = [
  { value: "EDUCATIONAL_NEWS", label: "Tin học vụ / Thông báo" },
  { value: "SCIENTIFIC_INFORMATION", label: "Thông tin khoa học" },
  { value: "RECRUITMENT", label: "Tuyển dụng" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "SCHOLARSHIP", label: "Học bổng" },
];

const STATUS_OPTIONS: { value: ContentStatusValue; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
];

const parseTagInput = (value: string): string[] => {
  const tokens = value
    .split(/[,\n]/)
    .map((t) => toSlug(t))
    .filter(Boolean);
  return Array.from(new Set(tokens));
};

const addUnique = (list: string[], slug: string) =>
  list.includes(slug) ? list : [...list, slug];

const toLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function PostComposerView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const idParam = searchParams.get("id");

  const [postId, setPostId] = useState<string | null>(idParam);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategoryValue>(
    "EDUCATIONAL_NEWS",
  );
  const [status, setStatus] = useState<ContentStatusValue>("DRAFT");
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [templateLayoutId, setTemplateLayoutId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setPostId(idParam);
  }, [idParam]);

  const postQuery = useQuery({
    queryKey: ["POSTS", postId],
    queryFn: () => postApi.getById(postId!),
    enabled: !!postId,
  });

  useEffect(() => {
    const data = postQuery.data;
    if (!data) return;
    setTitle(data.title);
    setSlug(data.slug);
    setSlugTouched(true);
    setExcerpt(data.excerpt ?? "");
    setBody(data.body ?? "");
    setCategory(data.category);
    setStatus(data.status);
    setTagSlugs(data.tags.map((t) => t.slug));
    setCoverMediaId(data.coverMediaId);
    setCoverUrl(data.coverUrl ?? "");
    setCoverAlt(data.coverAlt ?? "");
    setEventStartAt(toLocalInput(data.eventStartAt));
    setEventEndAt(toLocalInput(data.eventEndAt));
    setEventLocation(data.eventLocation ?? "");
  }, [postQuery.data]);

  const layoutsQuery = useQuery({
    queryKey: ["PAGE_LAYOUTS", "ALL"],
    queryFn: pageLayoutApi.list,
  });

  const commitTagDraft = () => {
    const parsed = parseTagInput(tagDraft);
    if (!parsed.length) return;
    setTagSlugs((prev) => parsed.reduce(addUnique, prev));
    setTagDraft("");
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTagDraft();
      return;
    }
    if (event.key === "Backspace" && !tagDraft && tagSlugs.length) {
      event.preventDefault();
      setTagSlugs((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (slugToRemove: string) =>
    setTagSlugs((prev) => prev.filter((t) => t !== slugToRemove));

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  };

  const buildPayload = (): UpsertPostBody => {
    const pendingDraft = parseTagInput(tagDraft);
    const finalTagSlugs = pendingDraft.reduce(addUnique, tagSlugs);
    return {
      title: title.trim(),
      slug: toSlug(slug || title),
      body: body || null,
      excerpt: excerpt || null,
      category,
      status,
      coverMediaId: coverMediaId ?? null,
      coverUrl: coverUrl || null,
      coverAlt: coverAlt || null,
      tagSlugs: finalTagSlugs,
      eventStartAt: eventStartAt
        ? new Date(eventStartAt).toISOString()
        : null,
      eventEndAt: eventEndAt ? new Date(eventEndAt).toISOString() : null,
      eventLocation: eventLocation || null,
    };
  };

  const saveMutation = useMutation({
    mutationKey: ["POSTS", postId ?? "NEW", "SAVE"],
    mutationFn: async (payload: UpsertPostBody) =>
      postId
        ? postApi.update(postId, payload)
        : postApi.create(payload),
    onSuccess: (data) => {
      toast.success(postId ? "Đã cập nhật bài đăng" : "Đã lưu draft");
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      if (!postId) {
        setPostId(data.id);
        router.replace(`/admin/posts?id=${data.id}`);
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Không thể lưu bài đăng");
    },
  });

  const cloneMutation = useMutation({
    mutationKey: ["POSTS", postId ?? "NEW", "CLONE_INTO_LAYOUT"],
    mutationFn: async (body: { templateLayoutId: string }) => {
      if (!postId) throw new Error("Hãy lưu draft trước khi tạo layout");
      return postApi.cloneIntoLayout(postId, body);
    },
    onSuccess: (data) => {
      toast.success("Đã tạo layout mới từ bài đăng");
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      router.push(`/admin/widgets-layout?edit=${data.id}`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Không thể tạo layout");
    },
  });

  const saveDraft = () => {
    if (!title.trim()) {
      toast.warn("Nhập tiêu đề trước khi lưu");
      return;
    }
    saveMutation.mutate(buildPayload());
  };

  const createLayoutFromPost = () => {
    if (!postId) {
      toast.warn("Lưu draft trước khi tạo layout mới");
      return;
    }
    if (!templateLayoutId) {
      toast.warn("Chọn layout mẫu trước");
      return;
    }
    cloneMutation.mutate({ templateLayoutId });
  };

  const previewCover = resolveMediaUrl(coverUrl);
  const attachedLayouts = postQuery.data?.layouts ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-content-1000">
            {postId ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới"}
          </h1>
          <p className="text-xs text-slate-500">
            Lưu draft để soạn nội dung. Tạo layout để có trang public —
            một bài có thể được gắn vào nhiều layout khác nhau.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/posts/list")}
            className="px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Danh sách bài đăng
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending
              ? "Đang lưu…"
              : postId
                ? "Cập nhật bài đăng"
                : "Lưu draft"}
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label
              className="block text-xs font-semibold text-slate-700 mb-1"
              htmlFor="post-title"
            >
              Tiêu đề
            </label>
            <input
              id="post-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ví dụ: Thông báo đăng ký học phần HK2"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 mb-1"
              htmlFor="post-status"
            >
              Trạng thái bài đăng
            </label>
            <select
              id="post-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatusValue)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 mb-1"
              htmlFor="post-slug"
            >
              Slug
            </label>
            <input
              id="post-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 font-mono"
              placeholder="tin-tuc-thong-bao-..."
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 mb-1"
              htmlFor="post-category"
            >
              Danh mục
            </label>
            <select
              id="post-category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as PostCategoryValue)
              }
              className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <label
            className="block text-xs font-semibold text-slate-700 mb-1"
            htmlFor="post-tags"
          >
            Tags (Enter hoặc dấu phẩy để thêm)
          </label>
          <div className="flex flex-wrap items-center gap-1 w-full min-h-[38px] px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-200 bg-white">
            {tagSlugs.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label={`Xoá tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="post-tags"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTagDraft}
              className="flex-1 min-w-[120px] px-1 py-0.5 text-sm outline-none bg-transparent"
              placeholder={tagSlugs.length ? "" : "hoc-vu, thong-bao, dang-ky"}
            />
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ảnh bìa
          </label>
          <div className="flex flex-wrap items-start gap-3">
            <input
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                setCoverMediaId(null);
              }}
              placeholder="URL ảnh hoặc chọn từ thư viện"
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Chọn từ thư viện
            </button>
            {coverUrl ? (
              <input
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                placeholder="Alt text"
                className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            ) : null}
          </div>
          {previewCover ? (
            <div className="mt-3 max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              {/** biome-ignore lint/performance/noImgElement: preview only */}
              <img
                src={previewCover}
                alt={coverAlt || title}
                className="w-full h-auto object-cover"
              />
            </div>
          ) : null}
        </section>

        <section>
          <label
            className="block text-xs font-semibold text-slate-700 mb-1"
            htmlFor="post-excerpt"
          >
            Tóm tắt (hiển thị ở danh sách bài đăng)
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Tóm tắt ngắn 1-2 câu"
          />
        </section>

        <section>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Nội dung bài đăng
          </label>
          <MarkdownEditor value={body} onChange={setBody} />
        </section>

        <section className="border border-slate-200 rounded-lg p-4 bg-white">
          <h2 className="text-sm font-semibold text-content-1000 mb-3">
            Thông tin sự kiện (tuỳ chọn)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 mb-1"
                htmlFor="event-start"
              >
                Bắt đầu
              </label>
              <input
                id="event-start"
                type="datetime-local"
                value={eventStartAt}
                onChange={(e) => setEventStartAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 mb-1"
                htmlFor="event-end"
              >
                Kết thúc
              </label>
              <input
                id="event-end"
                type="datetime-local"
                value={eventEndAt}
                onChange={(e) => setEventEndAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 mb-1"
                htmlFor="event-location"
              >
                Địa điểm
              </label>
              <input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Ví dụ: Cơ sở Nguyễn Văn Cừ"
              />
            </div>
          </div>
        </section>

        <section className="border border-slate-200 rounded-lg p-4 bg-white">
          <h2 className="text-sm font-semibold text-content-1000 mb-3">
            Layout public
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Bạn có thể để trống — bài đăng sẽ là draft trong hệ thống. Khi
            muốn xuất hiện ở public, chọn 1 layout mẫu và bấm "Tạo layout từ
            bài đăng". Mỗi layout độc lập: bạn có thể tạo nhiều layout khác
            nhau từ cùng bài đăng.
          </p>

          {attachedLayouts.length ? (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
                Layouts đã gắn
              </p>
              <div className="flex flex-wrap gap-2">
                {attachedLayouts.map((layout) => (
                  <LayoutBadge
                    key={layout.id}
                    layout={layout}
                    onClick={() =>
                      router.push(`/admin/widgets-layout?edit=${layout.id}`)
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label
                className="block text-xs font-semibold text-slate-700 mb-1"
                htmlFor="template-layout"
              >
                Layout mẫu
              </label>
              <select
                id="template-layout"
                value={templateLayoutId}
                onChange={(e) => setTemplateLayoutId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">— Chọn layout mẫu —</option>
                {layoutsQuery.data?.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name} · /{layout.slug}{" "}
                    {layout.isPublished ? "(published)" : "(draft)"}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={createLayoutFromPost}
              disabled={
                !postId || !templateLayoutId || cloneMutation.isPending
              }
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {cloneMutation.isPending
                ? "Đang tạo layout…"
                : "Tạo layout từ bài đăng"}
            </button>
          </div>
          {templateLayoutId && slug ? (
            <p className="text-[11px] text-slate-500 mt-2">
              URL public sẽ là:{" "}
              <span className="font-mono text-slate-700">
                /
                {[
                  layoutsQuery.data?.find((l) => l.id === templateLayoutId)
                    ?.slug,
                  slug,
                ]
                  .filter(Boolean)
                  .join("/")}
              </span>
            </p>
          ) : null}
          {!postId ? (
            <p className="text-[11px] text-amber-600 mt-2">
              Lưu draft trước khi tạo layout.
            </p>
          ) : null}
        </section>
      </div>

      {pickerOpen ? (
        <MediaPickerModal
          onSelect={(url) => {
            setCoverUrl(url);
            setCoverMediaId(null);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

type LayoutBadgeProps = {
  layout: {
    id: string;
    name: string;
    slug: string;
    isPublished: boolean;
    scheduledAt: string | null;
  };
  onClick: () => void;
};

const layoutBadgeStyle = (layout: LayoutBadgeProps["layout"]): string => {
  if (layout.isPublished)
    return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
  if (layout.scheduledAt)
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
};

const layoutBadgeLabel = (layout: LayoutBadgeProps["layout"]): string => {
  if (layout.isPublished) return "Published";
  if (layout.scheduledAt) return "Scheduled";
  return "Draft";
};

function LayoutBadge({ layout, onClick }: LayoutBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors " +
        layoutBadgeStyle(layout)
      }
      title={`Mở ${layout.name}`}
    >
      <span>{layout.name}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">
        {layoutBadgeLabel(layout)}
      </span>
    </button>
  );
}
