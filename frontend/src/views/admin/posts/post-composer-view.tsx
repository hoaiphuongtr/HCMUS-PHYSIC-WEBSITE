"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AdminSelect } from "@/components/admin/admin-select";
import { DynamicIcon } from "@/components/admin/icons";
import {
  type ContentStatusValue,
  categoryApi,
  type LocalizedText,
  pageLayoutApi,
  postApi,
  resolveMediaUrl,
  tagApi,
  type UpsertPostBody,
} from "@/lib/api";
import { emptyLocalized, type Locale, toLocalized } from "@/lib/localized";
import { buildCategoryOptions } from "@/lib/post-categories";
import { toSlug } from "@/lib/utils";
import { MediaPickerModal } from "@/views/admin/widgets-layout/fields/media-picker-modal";
import { MarkdownEditor } from "./markdown-editor";

// PENDING không phải lựa chọn tay: nó được đặt tự động khi bài được gắn vào layout
// (xem cloneIntoLayout ở backend). Nó chỉ xuất hiện trong dropdown nếu bài đang ở
// trạng thái đó, để hiển thị đúng nhãn.
const STATUS_OPTIONS: { value: ContentStatusValue; label: string }[] = [
  { value: "DRAFT", label: "Nháp" },
  { value: "PENDING", label: "Chờ xuất bản" },
  { value: "SCHEDULED", label: "Lên lịch" },
  { value: "PUBLISHED", label: "Công khai" },
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

// A tag icon is either an image URL (/uploads or http) or a Material Symbol name.
function TagIcon({ icon }: { icon?: string | null }) {
  if (!icon) return null;
  if (/^(https?:|\/uploads)/.test(icon)) {
    // biome-ignore lint/performance/noImgElement: external tag icon, not a Next asset
    return (
      <img
        src={resolveMediaUrl(icon)}
        alt=""
        className="w-3.5 h-3.5 object-contain rounded-sm"
      />
    );
  }
  return <DynamicIcon name={icon} className="w-3.5 h-3.5" />;
}

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
  const [lang, setLang] = useState<Locale>("vi");
  const [title, setTitle] = useState<LocalizedText>(emptyLocalized());
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState<LocalizedText>(emptyLocalized());
  const [body, setBody] = useState<LocalizedText>(emptyLocalized());
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<ContentStatusValue>("DRAFT");
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [templateLayoutIds, setTemplateLayoutIds] = useState<string[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["CATEGORIES"],
    queryFn: categoryApi.list,
  });
  const categoryOptions = buildCategoryOptions(categoriesQuery.data, "vi");

  // Existing tags (with icons) so the author can pick instead of typing slugs.
  const tagsQuery = useQuery({ queryKey: ["TAGS"], queryFn: tagApi.list });
  const allTags = tagsQuery.data ?? [];
  const tagBySlug = (s: string) => allTags.find((tg) => tg.slug === s);
  const toggleTag = (slug: string) =>
    setTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  // Tag picker dropdown: 2 tabs (image-icon tags vs text tags) + search.
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagPickerTab, setTagPickerTab] = useState<"image" | "text">("image");
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  const isImgIcon = (icon?: string | null): boolean =>
    !!icon && /^(https?:|\/uploads)/.test(icon);
  const pickerTags = allTags.filter((tg) => {
    const inTab =
      tagPickerTab === "image" ? isImgIcon(tg.icon) : !isImgIcon(tg.icon);
    if (!inTab) return false;
    const q = tagPickerSearch.trim().toLowerCase();
    return (
      !q ||
      tg.name.toLowerCase().includes(q) ||
      tg.slug.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!categoryId && categoryOptions.length > 0) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

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
    setTitle(toLocalized(data.title));
    setSlug(data.slug);
    setSlugTouched(true);
    setExcerpt(toLocalized(data.excerpt));
    setBody(toLocalized(data.body));
    setCategoryId(data.categoryId);
    setStatus(data.status);
    setTagSlugs(data.tags.map((t) => t.slug));
    setCoverMediaId(data.coverMediaId);
    setCoverUrl(data.coverUrl ?? "");
    setCoverAlt(data.coverAlt ?? "");
    setEventStartAt(toLocalInput(data.eventStartAt));
    setEventEndAt(toLocalInput(data.eventEndAt));
    setEventLocation(data.eventLocation ?? "");
    setScheduledAt(toLocalInput(data.scheduledAt));
  }, [postQuery.data]);

  const layoutsQuery = useQuery({
    queryKey: ["POST_TEMPLATES", "all"],
    queryFn: () => pageLayoutApi.postTemplates(),
  });

  // Bài có ngày giờ sự kiện → chỉ chọn layout mẫu SỰ KIỆN (đường dẫn /su-kien);
  // bài thường → các layout mẫu TIN TỨC. Nhờ vậy tin tức và sự kiện có layout
  // riêng, không lẫn lộn.
  const isEventPost = eventStartAt.trim().length > 0;
  const visibleTemplates = (layoutsQuery.data ?? []).filter((l) =>
    isEventPost ? l.category?.slug === "event" : l.category?.slug !== "event",
  );

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
    setTitle((prev) => ({ ...prev, [lang]: value }));
    if (!slugTouched && lang === "vi") setSlug(toSlug(value));
  };

  const isLocalizedEmpty = (l: LocalizedText) => !l.vi && !l.en;

  const buildPayload = (): UpsertPostBody => {
    const pendingDraft = parseTagInput(tagDraft);
    const finalTagSlugs = pendingDraft.reduce(addUnique, tagSlugs);
    const trimmed: LocalizedText = {
      vi: (title.vi ?? "").trim(),
      en: (title.en ?? "").trim() || undefined,
    };
    return {
      title: trimmed,
      slug: toSlug(slug || trimmed.vi),
      body: isLocalizedEmpty(body) ? null : body,
      excerpt: isLocalizedEmpty(excerpt) ? null : excerpt,
      categoryId,
      status,
      scheduledAt:
        status === "SCHEDULED" && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
      coverMediaId: coverMediaId ?? null,
      coverUrl: coverUrl || null,
      coverAlt: coverAlt || null,
      tagSlugs: finalTagSlugs,
      eventStartAt: eventStartAt ? new Date(eventStartAt).toISOString() : null,
      eventEndAt: eventEndAt ? new Date(eventEndAt).toISOString() : null,
      eventLocation: eventLocation || null,
    };
  };

  const saveMutation = useMutation({
    mutationKey: ["POSTS", postId ?? "NEW", "SAVE"],
    mutationFn: async (payload: UpsertPostBody) =>
      postId ? postApi.update(postId, payload) : postApi.create(payload),
    onSuccess: (data) => {
      toast.success(postId ? "Đã cập nhật bài đăng" : "Đã lưu draft");
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      // The backend re-injects the new content into every attached layout, so the
      // single-layout editor cache must be refreshed too (else it looks unsynced).
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUT"] });
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
    mutationFn: async (body: { templateLayoutIds: string[] }) => {
      if (!postId) throw new Error("Hãy lưu draft trước khi tạo layout");
      // Inject the post into each chosen category template → one layout per
      // category, each under its own slug prefix.
      const results = [];
      for (const templateLayoutId of body.templateLayoutIds) {
        results.push(
          await postApi.cloneIntoLayout(postId, { templateLayoutId }),
        );
      }
      return results;
    },
    onSuccess: (results) => {
      toast.success(`Đã tạo ${results.length} layout từ bài đăng`);
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      const first = results[0];
      if (first) router.push(`/admin/widgets-layout?edit=${first.id}`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Không thể tạo layout");
    },
  });

  const saveDraft = () => {
    if (!title.vi.trim()) {
      toast.warn("Nhập tiêu đề tiếng Việt trước khi lưu");
      return;
    }
    if (!categoryId) {
      toast.warn("Chọn danh mục cho bài đăng");
      return;
    }
    if (canSchedule) {
      setScheduleModalOpen(true);
      return;
    }
    saveMutation.mutate(buildPayload());
  };

  const confirmSchedule = () => {
    if (!scheduledAt) {
      toast.warn("Chọn thời gian xuất bản");
      return;
    }
    const at = new Date(scheduledAt);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      toast.error("Thời gian xuất bản phải ở tương lai");
      return;
    }
    setScheduleModalOpen(false);
    saveMutation.mutate(buildPayload());
  };

  const createLayoutFromPost = async () => {
    if (!postId) {
      toast.warn("Lưu draft trước khi tạo layout mới");
      return;
    }
    if (templateLayoutIds.length === 0) {
      toast.warn("Chọn ít nhất một layout mẫu");
      return;
    }
    try {
      await saveMutation.mutateAsync(buildPayload());
    } catch {
      return;
    }
    cloneMutation.mutate({ templateLayoutIds });
  };

  const previewCover = resolveMediaUrl(coverUrl);
  const attachedLayouts = postQuery.data?.layouts ?? [];
  const hasPublishedLayout = attachedLayouts.some((l) => l.isPublished);
  const canSchedule = status === "SCHEDULED" && hasPublishedLayout;
  // Ẩn "Chờ xuất bản" khỏi lựa chọn tay; chỉ giữ nếu bài đang ở trạng thái đó.
  const statusOptions = STATUS_OPTIONS.filter(
    (o) => o.value !== "PENDING" || status === "PENDING",
  );

  return (
    <div className="flex flex-col h-full overflow-auto">
      <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/list"
            aria-label="Quay lại danh sách bài đăng"
            title="Quay lại danh sách bài đăng"
            className="p-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-[#202c44]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-content-1000 dark:text-slate-100">
              {postId ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lưu draft để soạn nội dung. Tạo layout để có trang public — một
              bài có thể được gắn vào nhiều layout khác nhau.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 space-y-6">
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] p-1 text-xs font-medium">
          {(["vi", "en"] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={
                "px-3 py-1.5 rounded-md transition-colors " +
                (lang === l
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202c44]")
              }
            >
              {l === "vi" ? "Tiếng Việt" : "English"}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              htmlFor="post-title"
            >
              Tiêu đề ({lang === "vi" ? "VI" : "EN"})
              {lang === "vi" ? (
                <span className="text-rose-500 ml-1">*</span>
              ) : null}
            </label>
            <input
              id="post-title"
              value={title[lang] ?? ""}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={
                lang === "vi"
                  ? "Ví dụ: Thông báo đăng ký học phần HK2"
                  : "e.g. HK2 course registration announcement"
              }
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              htmlFor="post-status"
            >
              Trạng thái bài đăng
            </label>
            <AdminSelect
              id="post-status"
              value={status}
              onChange={(next) => setStatus(next as ContentStatusValue)}
              options={statusOptions}
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              Nháp: đang soạn nội dung. Gắn bài vào một layout sẽ tự chuyển sang
              “Chờ xuất bản”. Chọn Lên lịch hoặc Công khai khi trang đã sẵn sàng.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
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
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 font-mono"
              placeholder="tin-tuc-thong-bao-..."
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              htmlFor="post-category"
            >
              Danh mục
            </label>
            <AdminSelect
              id="post-category"
              value={categoryId}
              onChange={setCategoryId}
              placeholder="— Chọn danh mục —"
              options={categoryOptions}
            />
          </div>
        </section>

        <section>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            htmlFor="post-tags"
          >
            Tags (chọn bên dưới, hoặc gõ tag mới rồi Enter)
          </label>
          <div className="flex flex-wrap items-center gap-1 w-full min-h-[38px] px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-lg focus-within:ring-2 focus-within:ring-blue-200 bg-white dark:bg-[#1a2436]">
            {tagSlugs.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium"
              >
                <TagIcon icon={tagBySlug(tag)?.icon} />
                #{tagBySlug(tag)?.name ?? tag}
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
              placeholder={tagSlugs.length ? "" : "tag mới…"}
            />
          </div>
          {allTags.length > 0 && (
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setTagPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300"
              >
                + Chọn tag có sẵn
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {tagPickerOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Đóng"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setTagPickerOpen(false)}
                  />
                  <div className="absolute left-0 z-20 mt-1 w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] shadow-lg">
                    <div className="flex border-b border-slate-100 dark:border-slate-800">
                      {(["image", "text"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTagPickerTab(tab)}
                          className={`flex-1 px-3 py-2 text-xs font-medium ${
                            tagPickerTab === tab
                              ? "text-blue-600 border-b-2 border-blue-600"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {tab === "image" ? "Tag ảnh" : "Tag chữ"}
                        </button>
                      ))}
                    </div>
                    <div className="p-2">
                      <input
                        value={tagPickerSearch}
                        onChange={(e) => setTagPickerSearch(e.target.value)}
                        placeholder="Tìm tag…"
                        className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded outline-none bg-transparent"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {pickerTags.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-400">
                          Không có tag.
                        </p>
                      ) : (
                        pickerTags.map((tg) => {
                          const active = tagSlugs.includes(tg.slug);
                          return (
                            <button
                              key={tg.slug}
                              type="button"
                              onClick={() => toggleTag(tg.slug)}
                              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-[#202c44] ${
                                active
                                  ? "text-blue-600 font-medium"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              <TagIcon icon={tg.icon} />
                              <span className="flex-1 truncate">{tg.name}</span>
                              {active && <span className="text-blue-600">✓</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
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
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 truncate"
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
                className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 truncate"
              />
            ) : null}
          </div>
          {previewCover ? (
            <div className="mt-3 max-w-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121a2b]">
              {/** biome-ignore lint/performance/noImgElement: preview only */}
              <img
                src={previewCover}
                alt={coverAlt || title.vi}
                className="w-full h-auto object-cover"
              />
            </div>
          ) : null}
        </section>

        <section>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            htmlFor="post-excerpt"
          >
            Tóm tắt ({lang === "vi" ? "VI" : "EN"}) — hiển thị ở danh sách
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt[lang] ?? ""}
            onChange={(e) =>
              setExcerpt((prev) => ({ ...prev, [lang]: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Tóm tắt ngắn 1-2 câu"
          />
        </section>

        <section>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Nội dung bài đăng ({lang === "vi" ? "VI" : "EN"})
          </label>
          <MarkdownEditor
            value={body[lang] ?? ""}
            onChange={(next) => setBody((prev) => ({ ...prev, [lang]: next }))}
          />
        </section>

        <section className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-[#1a2436]">
          <h2 className="text-sm font-semibold text-content-1000 dark:text-slate-100 mb-3">
            Thông tin sự kiện (tuỳ chọn)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                htmlFor="event-start"
              >
                Bắt đầu
              </label>
              <input
                id="event-start"
                type="datetime-local"
                value={eventStartAt}
                onChange={(e) => setEventStartAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                htmlFor="event-end"
              >
                Kết thúc
              </label>
              <input
                id="event-end"
                type="datetime-local"
                value={eventEndAt}
                onChange={(e) => setEventEndAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                htmlFor="event-location"
              >
                Địa điểm
              </label>
              <input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Ví dụ: Cơ sở Nguyễn Văn Cừ"
              />
            </div>
          </div>
        </section>

        <section className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-[#1a2436]">
          <h2 className="text-sm font-semibold text-content-1000 dark:text-slate-100 mb-3">
            Layout public
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Bạn có thể để trống — bài đăng sẽ là draft trong hệ thống. Khi muốn
            xuất hiện ở public, chọn 1 layout mẫu và bấm "Tạo layout từ bài
            đăng". Mỗi layout độc lập: bạn có thể tạo nhiều layout khác nhau từ
            cùng bài đăng.
          </p>

          {attachedLayouts.length ? (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Layouts đã gắn
              </p>
              <div className="flex flex-wrap gap-2">
                {attachedLayouts.map((layout) => (
                  <LayoutBadge key={layout.id} layout={layout} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Layout mẫu
              <span className="ml-1 font-normal text-slate-400">
                {isEventPost ? "(layout Sự kiện)" : "(layout Tin tức)"}
              </span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLayoutPickerOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2436]"
              >
                <span
                  className={
                    templateLayoutIds.length
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-400"
                  }
                >
                  {templateLayoutIds.length
                    ? `Đã chọn ${templateLayoutIds.length} layout mẫu`
                    : "Chọn layout mẫu…"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {layoutPickerOpen ? (
                <div className="relative z-20 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2436] shadow-lg">
                    <div className="p-2">
                      <input
                        type="search"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Tìm layout mẫu…"
                        className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded outline-none bg-transparent"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {visibleTemplates
                        .filter((l) => {
                          const q = templateSearch.trim().toLowerCase();
                          return (
                            !q ||
                            l.name.toLowerCase().includes(q) ||
                            l.slug.toLowerCase().includes(q)
                          );
                        })
                        .map((layout) => {
                          const checked = templateLayoutIds.includes(layout.id);
                          return (
                            <label
                              key={layout.id}
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setTemplateLayoutIds((prev) =>
                                    checked
                                      ? prev.filter((id) => id !== layout.id)
                                      : [...prev, layout.id],
                                  )
                                }
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                                {layout.name}{" "}
                                <span className="text-[11px] text-slate-400 font-mono">
                                  /{layout.slug}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      {visibleTemplates.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-center text-slate-400">
                          {isEventPost
                            ? "Chưa có layout mẫu Sự kiện."
                            : "Chưa có layout mẫu Tin tức."}
                        </p>
                      ) : null}
                    </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={createLayoutFromPost}
              disabled={
                !postId ||
                templateLayoutIds.length === 0 ||
                cloneMutation.isPending
              }
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {cloneMutation.isPending
                ? "Đang tạo layout…"
                : `Tạo ${templateLayoutIds.length || ""} layout từ bài đăng`}
            </button>
          </div>
          {templateLayoutIds.length > 0 && slug ? (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
              URL public:
              {templateLayoutIds.map((id) => {
                const l = layoutsQuery.data?.find((x) => x.id === id);
                return l ? (
                  <div
                    key={id}
                    className="font-mono text-slate-700 dark:text-slate-200"
                  >
                    /{[l.slug, slug].filter(Boolean).join("/")}
                  </div>
                ) : null;
              })}
            </div>
          ) : null}
          {!postId ? (
            <p className="text-[11px] text-amber-600 mt-2">
              Lưu draft trước khi tạo layout.
            </p>
          ) : null}
        </section>
      </div>

      {/* Save/publish action moved to a sticky bottom bar (was in the top header). */}
      <div className="sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1a2436]/95 backdrop-blur px-6 py-3 flex justify-end">
        <button
          type="button"
          onClick={saveDraft}
          disabled={saveMutation.isPending}
          data-tour="post-save"
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saveMutation.isPending
            ? "Đang lưu…"
            : canSchedule
              ? "Lên lịch xuất bản"
              : postId
                ? "Cập nhật bài đăng"
                : "Lưu draft"}
        </button>
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

      {scheduleModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setScheduleModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#1a2436] rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Lên lịch xuất bản
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cron worker chuyển trạng thái sang PUBLISHED và đồng bộ lại các
              layout đã đính kèm khi đến thời điểm.
            </p>
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              htmlFor="post-scheduled-at"
            >
              Thời gian xuất bản
            </label>
            <input
              id="post-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-[#1a2436]"
              // biome-ignore lint/a11y/noAutofocus: modal entry point
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-[#202c44]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmSchedule}
                disabled={saveMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Đang lưu…" : "Xác nhận lên lịch"}
              </button>
            </div>
          </div>
        </div>
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

function LayoutBadge({ layout }: LayoutBadgeProps) {
  return (
    <Link
      href={`/admin/widgets-layout?edit=${layout.id}`}
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
    </Link>
  );
}
