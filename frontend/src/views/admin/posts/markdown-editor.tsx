"use client";

import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eraser,
  Image as ImageIcon,
  Link2Off,
  Link as LinkIcon,
  Minus,
  Redo2,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ImageResize from "tiptap-extension-resize-image";
import { MediaPickerModal } from "@/views/admin/widgets-layout/fields/media-picker-modal";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const BLOCK_OPTIONS = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Quote", value: "blockquote" },
] as const;

type EditorInstance = NonNullable<ReturnType<typeof useEditor>>;

const ToolbarButton = ({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={
      "min-w-[28px] h-7 px-2 text-xs font-semibold rounded border inline-flex items-center justify-center " +
      (active
        ? "bg-blue-50 border-blue-300 text-blue-700"
        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50") +
      " disabled:opacity-40 disabled:cursor-not-allowed"
    }
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <span
    aria-hidden="true"
    className="w-px h-5 bg-slate-200 dark:bg-[#202c44] mx-1"
  />
);

function setBlockType(editor: EditorInstance, value: string) {
  const chain = editor.chain().focus();
  if (value === "paragraph") chain.setParagraph().run();
  else if (value === "blockquote") chain.toggleBlockquote().run();
  else if (value.startsWith("h")) {
    const level = Number.parseInt(value.slice(1), 10) as 1 | 2 | 3 | 4;
    chain.toggleHeading({ level }).run();
  }
}

function currentBlock(editor: EditorInstance): string {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  if (editor.isActive("blockquote")) return "blockquote";
  return "paragraph";
}

type ImageLayoutMode =
  | "inline"
  | "wrapSquareLeft"
  | "wrapSquareRight"
  | "topBottom"
  | "behindText"
  | "frontText";

const IMAGE_LAYOUT_OPTIONS: {
  mode: ImageLayoutMode;
  label: string;
  group: "inline" | "wrap";
  preview: React.ReactNode;
}[] = [
  {
    mode: "inline",
    label: "Cùng dòng với văn bản",
    group: "inline",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="6" y="6" width="24" height="2.5" fill="#94a3b8" />
        <rect x="6" y="10.5" width="24" height="2.5" fill="#94a3b8" />
        <rect x="6" y="16" width="10" height="10" fill="#1d4ed8" />
        <rect x="18" y="17" width="12" height="2" fill="#94a3b8" />
        <rect x="18" y="21" width="12" height="2" fill="#94a3b8" />
        <rect x="6" y="29" width="24" height="2" fill="#94a3b8" />
      </svg>
    ),
  },
  {
    mode: "wrapSquareLeft",
    label: "Wrap vuông - ảnh trái",
    group: "wrap",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="6" y="6" width="10" height="10" fill="#1d4ed8" />
        <rect x="18" y="6" width="12" height="2" fill="#94a3b8" />
        <rect x="18" y="10" width="12" height="2" fill="#94a3b8" />
        <rect x="18" y="14" width="12" height="2" fill="#94a3b8" />
        <rect x="6" y="20" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="24" width="24" height="2" fill="#94a3b8" />
      </svg>
    ),
  },
  {
    mode: "wrapSquareRight",
    label: "Wrap vuông - ảnh phải",
    group: "wrap",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="20" y="6" width="10" height="10" fill="#1d4ed8" />
        <rect x="6" y="6" width="12" height="2" fill="#94a3b8" />
        <rect x="6" y="10" width="12" height="2" fill="#94a3b8" />
        <rect x="6" y="14" width="12" height="2" fill="#94a3b8" />
        <rect x="6" y="20" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="24" width="24" height="2" fill="#94a3b8" />
      </svg>
    ),
  },
  {
    mode: "topBottom",
    label: "Trên & dưới",
    group: "wrap",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="6" y="6" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="10" width="24" height="2" fill="#94a3b8" />
        <rect x="11" y="15" width="14" height="8" fill="#1d4ed8" />
        <rect x="6" y="25" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="29" width="24" height="2" fill="#94a3b8" />
      </svg>
    ),
  },
  {
    mode: "behindText",
    label: "Phía sau văn bản",
    group: "wrap",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="9" y="9" width="18" height="18" fill="#cbd5e1" />
        <rect x="6" y="11" width="24" height="2" fill="#1d4ed8" />
        <rect x="6" y="15" width="24" height="2" fill="#1d4ed8" />
        <rect x="6" y="19" width="24" height="2" fill="#1d4ed8" />
        <rect x="6" y="23" width="24" height="2" fill="#1d4ed8" />
      </svg>
    ),
  },
  {
    mode: "frontText",
    label: "Trước văn bản",
    group: "wrap",
    preview: (
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <rect x="6" y="11" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="15" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="19" width="24" height="2" fill="#94a3b8" />
        <rect x="6" y="23" width="24" height="2" fill="#94a3b8" />
        <rect x="9" y="9" width="18" height="18" fill="#1d4ed8" />
      </svg>
    ),
  },
];

function ImageLayoutControl({
  img,
  open,
  onToggle,
  onPick,
  onClose,
}: {
  img: HTMLImageElement;
  open: boolean;
  onToggle: () => void;
  onPick: (mode: ImageLayoutMode) => void;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<DOMRect>(() => img.getBoundingClientRect());
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const next = img.getBoundingClientRect();
      setRect((prev) =>
        prev.top === next.top &&
        prev.right === next.right &&
        prev.width === next.width
          ? prev
          : next,
      );
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [img]);

  const POPUP_WIDTH = 280;
  const BUTTON_SIZE = 32;
  const viewportRight = document.documentElement.clientWidth;
  const fitsRight =
    rect.right + 4 + BUTTON_SIZE + 8 + POPUP_WIDTH < viewportRight;
  const btnLeft = fitsRight
    ? rect.right + 4
    : Math.max(8, rect.right - BUTTON_SIZE - 4);
  const popupLeft = fitsRight
    ? rect.right + 4 + BUTTON_SIZE + 8
    : Math.max(8, btnLeft - POPUP_WIDTH - 8);
  const btnStyle: React.CSSProperties = {
    position: "fixed",
    top: rect.top - 2,
    left: btnLeft,
    zIndex: 50,
  };
  const popupStyle: React.CSSProperties = {
    position: "fixed",
    top: rect.top - 2,
    left: popupLeft,
    zIndex: 51,
    width: POPUP_WIDTH,
  };
  return (
    <>
      <button
        type="button"
        data-image-layout-ui="anchor-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        style={btnStyle}
        className="w-9 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2436] shadow-md hover:bg-slate-50 dark:hover:bg-[#202c44] flex items-center justify-center text-slate-700 dark:text-slate-200"
        title="Tùy chọn bố trí"
        aria-label="Tùy chọn bố trí"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="8" height="8" />
          <line x1="13" y1="5" x2="21" y2="5" />
          <line x1="13" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="3" y1="19" x2="21" y2="19" />
        </svg>
      </button>
      {open ? (
        <div
          data-image-layout-ui="popup"
          style={popupStyle}
          className="bg-white dark:bg-[#1a2436] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Tùy chọn bố trí
            </span>
            <button
              type="button"
              onClick={onClose}
              onMouseDown={(e) => e.preventDefault()}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 text-sm leading-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Cùng dòng với văn bản
          </div>
          <div className="px-3 pb-2 flex">
            {IMAGE_LAYOUT_OPTIONS.filter((o) => o.group === "inline").map(
              (o) => (
                <button
                  type="button"
                  key={o.mode}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(o.mode)}
                  title={o.label}
                  aria-label={o.label}
                  className="w-12 h-12 border border-slate-200 dark:border-slate-800 rounded hover:border-blue-500 hover:bg-blue-50 p-1"
                >
                  {o.preview}
                </button>
              ),
            )}
          </div>
          <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Có ngắt dòng
          </div>
          <div className="px-3 pb-3 grid grid-cols-3 gap-2">
            {IMAGE_LAYOUT_OPTIONS.filter((o) => o.group === "wrap").map((o) => (
              <button
                type="button"
                key={o.mode}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(o.mode)}
                title={o.label}
                aria-label={o.label}
                className="w-full aspect-square border border-slate-200 dark:border-slate-800 rounded hover:border-blue-500 hover:bg-blue-50 p-1"
              >
                {o.preview}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [tableSize, setTableSize] = useState<{ rows: string; cols: string }>({
    rows: "3",
    cols: "3",
  });
  const [imageLayout, setImageLayout] = useState<{
    img: HTMLImageElement;
    pos: number;
  } | null>(null);
  const [imageLayoutOpen, setImageLayoutOpen] = useState(false);
  const skipNextUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      ImageResize.extend({
        renderHTML({ node, HTMLAttributes }) {
          const wrapperStyle =
            (node.attrs.wrapperStyle as string | null) ??
            "display: inline-block; max-width: 100%;";
          const containerStyle =
            (node.attrs.containerStyle as string | null) ??
            "max-width: 100%; height: auto; display: inline-block;";
          const {
            containerStyle: _c,
            wrapperStyle: _w,
            ...imgAttrs
          } = node.attrs;
          return [
            "div",
            { style: wrapperStyle },
            [
              "div",
              { style: containerStyle },
              ["img", { ...imgAttrs, ...HTMLAttributes }],
            ],
          ];
        },
      }).configure({
        inline: true,
        allowBase64: false,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "post-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[300px] max-h-[600px] overflow-y-auto focus:outline-none px-4 py-3 prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1",
      },
    },
    onUpdate({ editor: ed }) {
      if (skipNextUpdate.current) {
        skipNextUpdate.current = false;
        return;
      }
      const html = ed.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current === next) return;
    if (current === "<p></p>" && next === "") return;
    skipNextUpdate.current = true;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const img = target.closest("img");
      if (
        img &&
        !img.classList.contains("ProseMirror-separator") &&
        dom.contains(img)
      ) {
        const pos = editor.view.posAtDOM(img, 0);
        setImageLayout({ img: img as HTMLImageElement, pos });
        setImageLayoutOpen(false);
        return;
      }
      if (!target.closest("[data-image-layout-ui]")) {
        setImageLayout(null);
        setImageLayoutOpen(false);
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#1a2436] h-[380px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        Loading editor…
      </div>
    );
  }

  const openLinkBar = () => {
    const existing = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(existing || "");
    setLinkOpen(true);
  };

  const confirmLink = () => {
    setLinkOpen(false);
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const normalized = /^(https?:|mailto:|tel:|\/)/i.test(url)
      ? url
      : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalized })
      .run();
    setLinkUrl("");
  };

  const confirmInsertTable = () => {
    const rows = Math.max(1, Math.min(20, Number(tableSize.rows) || 0));
    const cols = Math.max(1, Math.min(10, Number(tableSize.cols) || 0));
    setTableOpen(false);
    if (!rows || !cols) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

  const insertImage = (url: string) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "imageResize",
        attrs: {
          src: url,
          alt: "",
          containerStyle:
            "width: 480px; max-width: 100%; height: auto; display: inline-block; cursor: pointer;",
          wrapperStyle: "display: inline-block; max-width: 100%;",
        },
      })
      .run();
  };

  const IMAGE_LAYOUT_STYLES: Record<
    ImageLayoutMode,
    { containerStyle: string; wrapperStyle: string }
  > = {
    inline: {
      containerStyle:
        "max-width: 100%; height: auto; display: inline-block; cursor: pointer;",
      wrapperStyle: "display: inline-block; max-width: 100%;",
    },
    wrapSquareLeft: {
      containerStyle:
        "max-width: 100%; height: auto; display: inline-block; float: left; margin: 0 12px 8px 0; cursor: pointer;",
      wrapperStyle: "display: inline; max-width: 100%;",
    },
    wrapSquareRight: {
      containerStyle:
        "max-width: 100%; height: auto; display: inline-block; float: right; margin: 0 0 8px 12px; cursor: pointer;",
      wrapperStyle: "display: inline; max-width: 100%;",
    },
    topBottom: {
      containerStyle:
        "max-width: 100%; height: auto; display: block; margin: 12px auto; cursor: pointer;",
      wrapperStyle: "display: block; margin: 12px auto; max-width: 100%;",
    },
    behindText: {
      containerStyle:
        "max-width: 50%; height: auto; display: block; opacity: 0.55; cursor: pointer;",
      wrapperStyle:
        "display: block; position: relative; z-index: -1; max-width: 50%;",
    },
    frontText: {
      containerStyle:
        "max-width: 50%; height: auto; display: block; cursor: pointer;",
      wrapperStyle:
        "display: block; position: relative; z-index: 10; max-width: 50%;",
    },
  };

  const applyImageLayout = (mode: ImageLayoutMode) => {
    if (!imageLayout) return;
    const node = editor.state.doc.nodeAt(imageLayout.pos);
    if (!node || node.type.name !== "imageResize") return;
    const prevContainer = (node.attrs.containerStyle as string | null) ?? "";
    const widthMatch = prevContainer.match(/width:\s*[^;]+;/i);
    const base = IMAGE_LAYOUT_STYLES[mode];
    const nextContainer = widthMatch
      ? `${widthMatch[0]} ${base.containerStyle}`
      : base.containerStyle;
    const tr = editor.state.tr.setNodeMarkup(imageLayout.pos, undefined, {
      ...node.attrs,
      containerStyle: nextContainer,
      wrapperStyle: base.wrapperStyle,
    });
    editor.view.dispatch(tr);
    setImageLayoutOpen(false);
  };

  const block = currentBlock(editor);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#1a2436]">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-2">
        <button
          type="button"
          onClick={() => setTab("editor")}
          className={
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors " +
            (tab === "editor"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700")
          }
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors " +
            (tab === "preview"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700")
          }
        >
          Preview
        </button>
      </div>

      {tab === "editor" ? (
        <>
          <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121a2b] text-xs">
            <select
              value={block}
              onChange={(e) => setBlockType(editor, e.target.value)}
              className="h-7 px-2 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#1a2436]"
              title="Block style"
            >
              {BLOCK_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              B
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <span className="italic">I</span>
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <span className="underline">U</span>
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strike"
            >
              <span className="line-through">S</span>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Align left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              title="Align center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Align right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bulleted list"
            >
              •
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered list"
            >
              1.
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("link")}
              onClick={openLinkBar}
              title="Link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Unlink"
              disabled={!editor.isActive("link")}
            >
              <Link2Off className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setImagePickerOpen(true)}
              title="Chèn ảnh từ thư viện"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                setTableSize({ rows: "3", cols: "3" });
                setTableOpen(true);
              }}
              title="Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear formatting"
            >
              <Eraser className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>

          {linkOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-blue-50">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmLink();
                  } else if (e.key === "Escape") {
                    setLinkOpen(false);
                    setLinkUrl("");
                  }
                }}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#1a2436] outline-none"
                // biome-ignore lint/a11y/noAutofocus: dialog-style inline bar
                autoFocus
              />
              <button
                type="button"
                onClick={confirmLink}
                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Chèn
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkOpen(false);
                  setLinkUrl("");
                }}
                className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700"
              >
                Hủy
              </button>
            </div>
          ) : null}

          {tableOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-blue-50 text-xs">
              <label className="flex items-center gap-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Số dòng:
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableSize.rows}
                  onChange={(e) =>
                    setTableSize((prev) => ({ ...prev, rows: e.target.value }))
                  }
                  className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#1a2436] outline-none"
                  // biome-ignore lint/a11y/noAutofocus: dialog-style inline bar
                  autoFocus
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Số cột:
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableSize.cols}
                  onChange={(e) =>
                    setTableSize((prev) => ({ ...prev, cols: e.target.value }))
                  }
                  className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#1a2436] outline-none"
                />
              </label>
              <button
                type="button"
                onClick={confirmInsertTable}
                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Chèn bảng
              </button>
              <button
                type="button"
                onClick={() => setTableOpen(false)}
                className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700"
              >
                Hủy
              </button>
            </div>
          ) : null}

          <EditorContent editor={editor} />

          {imageLayout ? (
            <ImageLayoutControl
              img={imageLayout.img}
              open={imageLayoutOpen}
              onToggle={() => setImageLayoutOpen((v) => !v)}
              onPick={applyImageLayout}
              onClose={() => setImageLayoutOpen(false)}
            />
          ) : null}
        </>
      ) : (
        <div className="px-4 py-3 min-h-[300px] max-h-[600px] overflow-y-auto">
          {value.trim() ? (
            <article
              className="prose prose-slate max-w-none prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored content
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Preview hiển thị tại đây khi bạn nhập nội dung.
            </p>
          )}
        </div>
      )}

      {imagePickerOpen ? (
        <MediaPickerModal
          onSelect={(url) => insertImage(url)}
          onClose={() => setImagePickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
