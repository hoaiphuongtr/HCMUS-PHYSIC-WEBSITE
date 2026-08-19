"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { resolveMediaUrl } from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { localizedSummary } from "../fields/item-summary";
import { localizedTextField } from "../fields/localized-text-field";
import { localizedRichTextField } from "../fields/localized-rich-text-field";
import { mediaPickerField } from "../fields/media-picker-field";
import { LegacyHtmlRender } from "./post-placeholders";

// ── StaffProfileEditorial ───────────────────────────────────────────────────
// Hồ sơ giảng viên kiểu tạp chí: nửa trên nền đen, nửa dưới nền trắng ngà, chữ
// tên dùng `mix-blend-difference` nên tự đảo màu khi vắt ngang ranh giới hai
// nền. Tiêu đề dùng Playfair Display — font ĐÃ self-host sẵn trong dự án
// (--font-playfair), không import Google Fonts để khỏi phụ thuộc mạng lúc build.
//
// Mọi mục đều tự ẩn khi bỏ trống, nên trang mới chuyển sang (chỉ có ảnh + nội
// dung cũ) vẫn hiện gọn; biên tập viên điền dần thì trang tự đầy lên.

const INK = "#111111";
const PAPER = "#F9F9F6";

type Entry = { title: LocalizedString; desc: LocalizedString };
/** Mục tự đặt tên (Học vấn, Major, Giải thưởng…) — gom theo `section`. */
type Extra = {
  section: LocalizedString;
  title: LocalizedString;
  desc: LocalizedString;
};
type Project = {
  category: LocalizedString;
  title: LocalizedString;
  desc: LocalizedString;
};
type Publication = {
  year: string;
  title: LocalizedString;
  meta: LocalizedString;
  url: string;
};

type Props = {
  photo: string;
  photoFilter: boolean;
  eyebrow: LocalizedString;
  name: LocalizedString;
  nameLines?: { text: LocalizedString }[];
  intro: LocalizedString;
  researchTitle: LocalizedString;
  research?: Entry[];
  teachingTitle: LocalizedString;
  teaching?: Entry[];
  extras?: Extra[];
  projectsTitle: LocalizedString;
  projects?: Project[];
  pubsTitle: LocalizedString;
  publications?: Publication[];
  pubsMoreUrl: string;
  pubsMoreLabel: LocalizedString;
  contentTitle: LocalizedString;
  html: LocalizedString;
};

/** Tiêu đề mục: chữ serif hoa + đường kẻ chạy hết phần còn lại. */
function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6 mb-12">
      <h2
        className="text-3xl md:text-4xl text-gray-900 uppercase tracking-wider"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {children}
      </h2>
      <div className="h-px bg-gray-300 flex-grow" />
    </div>
  );
}

function EntryList({ items, tx }: { items: Entry[]; tx: (v: LocalizedString) => string }) {
  return (
    <ul className="space-y-8 font-light text-gray-600">
      {items.map((it, i) => (
        <li key={`${tx(it.title)}-${i}`} className="flex flex-col">
          <span className="text-gray-900 text-xl font-medium mb-2">
            {tx(it.title)}
          </span>
          {tx(it.desc) ? (
            <span className="leading-relaxed">{tx(it.desc)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function StaffProfileEditorialRender(props: Props) {
  const { locale } = useLocale();
  const tx = (v: LocalizedString) => t(v, locale) || "";

  const photo = resolveMediaUrl(props.photo || "");
  const lines = (props.nameLines ?? [])
    .map((l) => tx(l.text))
    .filter((s) => s.trim());
  const nameLines = lines.length ? lines : [tx(props.name)].filter(Boolean);

  const research = (props.research ?? []).filter((e) => tx(e.title).trim());
  const teaching = (props.teaching ?? []).filter((e) => tx(e.title).trim());

  // Nghiên cứu / Giảng dạy / các mục tự đặt tên đều đổ chung vào một lưới, mục
  // nào trống thì không sinh cột. Mục tự đặt gom theo tên `section`, giữ thứ tự
  // xuất hiện lần đầu.
  const groups = new Map<string, Entry[]>();
  for (const e of props.extras ?? []) {
    const sec = tx(e.section).trim();
    if (!sec || !tx(e.title).trim()) continue;
    groups.set(sec, [...(groups.get(sec) ?? []), { title: e.title, desc: e.desc }]);
  }
  const columns: { title: string; items: Entry[] }[] = [
    ...(research.length
      ? [
          {
            title:
              tx(props.researchTitle) ||
              (locale === "en" ? "Research" : "Nghiên cứu"),
            items: research,
          },
        ]
      : []),
    ...(teaching.length
      ? [
          {
            title:
              tx(props.teachingTitle) ||
              (locale === "en" ? "Teaching" : "Giảng dạy"),
            items: teaching,
          },
        ]
      : []),
    ...[...groups.entries()].map(([title, items]) => ({ title, items })),
  ];
  const projects = (props.projects ?? []).filter((p) => tx(p.title).trim());
  const pubs = (props.publications ?? []).filter((p) => tx(p.title).trim());
  const hasBody = tx(props.html).trim().length > 0;

  return (
    <div className="staff-editorial w-full antialiased">
      {/* Nền: đen ở nửa trên, trắng ngà bên dưới — ranh giới là chỗ chữ đảo màu.
          Dùng <style> vì ngưỡng đổi màu khác nhau giữa mobile (px) và desktop (vh). */}
      <style>{`
        .staff-editorial {
          background-color: ${PAPER};
          background-image: linear-gradient(to bottom, ${INK} 700px, transparent 700px);
        }
        @media (min-width: 768px) {
          .staff-editorial {
            background-image: linear-gradient(to bottom, ${INK} 65vh, transparent 65vh);
          }
        }
        /* Chữ trắng + phép trừ màu: trên nền đen ra trắng, trên nền giấy ra đen. */
        .staff-editorial .blend { mix-blend-mode: difference; }
        @media (prefers-reduced-transparency: reduce) {
          .staff-editorial .blend { mix-blend-mode: normal; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-24 md:pt-[15vh] pb-24 md:pb-32 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        <div className="w-full max-w-sm mx-auto md:max-w-none md:w-5/12 shrink-0 z-10">
          <div className="aspect-[3/4] w-full shadow-2xl overflow-hidden rounded-tl-[5rem] rounded-bl-[5rem] rounded-tr-xl rounded-br-xl bg-gray-200">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={nameLines.join(" ")}
                className={
                  "w-full h-full object-cover " +
                  (props.photoFilter ? "contrast-125 saturate-50" : "")
                }
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="w-full md:w-7/12 flex flex-col justify-center text-white blend">
          {tx(props.eyebrow) ? (
            <p className="text-xs md:text-sm tracking-[0.3em] mb-4 font-medium uppercase">
              {tx(props.eyebrow)}
            </p>
          ) : null}
          {nameLines.length ? (
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[6.5rem] uppercase leading-[0.9] mb-8"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {nameLines.map((line, i) => (
                <span key={`${line}-${i}`} className="block">
                  {line}
                </span>
              ))}
            </h1>
          ) : null}
          {tx(props.intro) ? (
            <p className="text-base md:text-lg max-w-xl font-light leading-relaxed">
              {tx(props.intro)}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Nghiên cứu / Giảng dạy ── */}
      {columns.length ? (
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-24 text-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 border-t border-gray-300 pt-16">
            {columns.map((col) => (
              <div key={col.title}>
                <h2
                  className="text-3xl md:text-4xl mb-8 uppercase tracking-wide text-gray-800"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {col.title}
                </h2>
                <EntryList items={col.items} tx={tx} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Dự án ứng dụng ── */}
      {projects.length ? (
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-32">
          <RuleHeading>
            {tx(props.projectsTitle) ||
              (locale === "en" ? "Projects" : "Dự án ứng dụng")}
          </RuleHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.map((p, i) => (
              <div
                key={`${tx(p.title)}-${i}`}
                className="border border-gray-200 p-8 hover:bg-white hover:shadow-md transition-all duration-300 bg-transparent rounded-sm"
              >
                {tx(p.category) ? (
                  <span className="text-xs tracking-widest text-gray-500 uppercase mb-4 block">
                    {tx(p.category)}
                  </span>
                ) : null}
                <h3
                  className="text-2xl text-gray-900 mb-4"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {tx(p.title)}
                </h3>
                {tx(p.desc) ? (
                  <p className="font-light text-gray-600 text-sm leading-relaxed">
                    {tx(p.desc)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Xuất bản khoa học ── */}
      {pubs.length ? (
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-32">
          <RuleHeading>
            {tx(props.pubsTitle) ||
              (locale === "en" ? "Publications" : "Xuất bản khoa học")}
          </RuleHeading>
          <div className="space-y-6 md:space-y-8">
            {pubs.map((p, i) => (
              <div
                key={`${tx(p.title)}-${i}`}
                className="flex flex-col md:flex-row md:gap-8 border-b border-gray-200 pb-6 group"
              >
                <div className="md:w-32 shrink-0 text-gray-400 font-medium mb-2 md:mb-0">
                  {p.year}
                </div>
                <div className="flex-1">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg md:text-xl font-medium text-gray-800 group-hover:text-blue-700 transition-colors"
                    >
                      {tx(p.title)}
                    </a>
                  ) : (
                    <h3 className="text-lg md:text-xl font-medium text-gray-800">
                      {tx(p.title)}
                    </h3>
                  )}
                  {tx(p.meta) ? (
                    <p className="text-sm text-gray-500 mt-2 font-light leading-relaxed">
                      {tx(p.meta)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {props.pubsMoreUrl ? (
            <div className="mt-12 text-center md:text-left">
              <a
                href={props.pubsMoreUrl}
                className="inline-block border-b border-gray-900 pb-1 text-sm font-medium text-gray-900 uppercase tracking-widest hover:text-blue-700 hover:border-blue-700 transition-colors"
              >
                {tx(props.pubsMoreLabel) ||
                  (locale === "en"
                    ? "See all publications →"
                    : "Xem toàn bộ danh sách bài báo →")}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Nội dung hồ sơ cũ — giữ mọi thứ chưa kịp tách ra ô riêng ── */}
      {hasBody ? (
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-32 text-gray-900">
          <RuleHeading>
            {tx(props.contentTitle) ||
              (locale === "en" ? "Details" : "Thông tin chi tiết")}
          </RuleHeading>
          <div className="overflow-x-auto">
            <LegacyHtmlRender html={props.html} injected={false} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const StaffProfileEditorial: ComponentConfig<Props> = {
  label: "Staff Profile (Editorial)",
  defaultProps: {
    photo: "",
    photoFilter: true,
    eyebrow: { vi: "", en: "" },
    name: { vi: "", en: "" },
    nameLines: [],
    intro: { vi: "", en: "" },
    researchTitle: { vi: "Nghiên cứu", en: "Research" },
    research: [],
    teachingTitle: { vi: "Giảng dạy", en: "Teaching" },
    teaching: [],
    extras: [],
    projectsTitle: { vi: "Dự án ứng dụng", en: "Projects" },
    projects: [],
    pubsTitle: { vi: "Xuất bản khoa học", en: "Publications" },
    publications: [],
    pubsMoreUrl: "",
    pubsMoreLabel: {
      vi: "Xem toàn bộ danh sách bài báo →",
      en: "See all publications →",
    },
    contentTitle: { vi: "", en: "" },
    html: { vi: "", en: "" },
  },
  fields: {
    photo: mediaPickerField("Ảnh chân dung"),
    photoFilter: {
      type: "radio",
      label: "Lọc ảnh nghệ thuật (tăng tương phản, giảm bão hoà)",
      options: [
        { label: "Có", value: true },
        { label: "Không (ảnh màu thật)", value: false },
      ],
    },
    eyebrow: localizedTextField("Dòng nhỏ trên tên (vd: Thạc sĩ • Giảng viên)"),
    name: localizedTextField("Họ tên (dùng khi không tách dòng)"),
    nameLines: {
      type: "array",
      label: "Tên tách theo dòng (để tên xuống hàng như thiết kế)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.text, `Dòng ${(i ?? 0) + 1}`),
      arrayFields: { text: localizedTextField("Chữ trên dòng này") },
    },
    intro: localizedTextField("Đoạn giới thiệu"),
    researchTitle: localizedTextField("Tiêu đề cột nghiên cứu"),
    research: {
      type: "array",
      label: "Hướng nghiên cứu (bỏ trống thì ẩn)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.title, `Mục ${(i ?? 0) + 1}`),
      arrayFields: {
        title: localizedTextField("Tên hướng"),
        desc: localizedTextField("Mô tả"),
      },
    },
    teachingTitle: localizedTextField("Tiêu đề cột giảng dạy"),
    teaching: {
      type: "array",
      label: "Mảng giảng dạy (bỏ trống thì ẩn)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.title, `Mục ${(i ?? 0) + 1}`),
      arrayFields: {
        title: localizedTextField("Tên mảng"),
        desc: localizedTextField("Mô tả"),
      },
    },
    extras: {
      type: "array",
      label: "Mục tự đặt tên (Học vấn, Major, Giải thưởng… — cùng tên mục thì gom chung)",
      getItemSummary: (item, i) =>
        `${localizedSummary(item?.section, "Mục")} — ${localizedSummary(item?.title, `Dòng ${(i ?? 0) + 1}`)}`,
      arrayFields: {
        section: localizedTextField("Tên mục (vd: Học vấn)"),
        title: localizedTextField("Tiêu đề dòng"),
        desc: localizedTextField("Mô tả"),
      },
    },
    projectsTitle: localizedTextField("Tiêu đề mục dự án"),
    projects: {
      type: "array",
      label: "Dự án (bỏ trống thì ẩn)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.title, `Dự án ${(i ?? 0) + 1}`),
      arrayFields: {
        category: localizedTextField("Nhãn phân loại (chữ nhỏ phía trên)"),
        title: localizedTextField("Tên dự án"),
        desc: localizedTextField("Mô tả"),
      },
    },
    pubsTitle: localizedTextField("Tiêu đề mục xuất bản"),
    publications: {
      type: "array",
      label: "Bài báo (bỏ trống thì ẩn)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.title, `Bài ${(i ?? 0) + 1}`),
      arrayFields: {
        year: { type: "text", label: "Năm" },
        title: localizedTextField("Tên bài"),
        meta: localizedTextField("Hội nghị / tạp chí, đồng tác giả"),
        url: { type: "text", label: "Link DOI / bài báo" },
      },
    },
    pubsMoreUrl: { type: "text", label: "Link 'Xem toàn bộ' (trống thì ẩn)" },
    pubsMoreLabel: localizedTextField("Chữ của link 'Xem toàn bộ'"),
    contentTitle: localizedTextField("Tiêu đề ô nội dung cũ"),
    html: localizedRichTextField("Nội dung hồ sơ (phần chưa tách ra ô riêng)"),
  },
  render: (props) => <StaffProfileEditorialRender {...props} />,
};
