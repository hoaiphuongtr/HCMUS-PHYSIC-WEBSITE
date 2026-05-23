"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import ImageResize from "tiptap-extension-resize-image";
import { useEffect, useRef, useState } from "react";
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
      "min-w-[28px] h-7 px-2 text-xs font-semibold rounded border " +
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
  <span aria-hidden="true" className="w-px h-5 bg-slate-200 mx-1" />
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

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const skipNextUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      ImageResize.configure({
        inline: true,
        allowBase64: false,
        maxWidth: 720,
        HTMLAttributes: {
          class: "post-img",
        },
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
          "prose prose-slate max-w-none min-h-[300px] focus:outline-none px-4 py-3 prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1",
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

  if (!editor) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white h-[380px] flex items-center justify-center text-xs text-slate-400">
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
    const rows = Math.max(1, Math.min(20, Number(tableRows) || 0));
    const cols = Math.max(1, Math.min(10, Number(tableCols) || 0));
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
        attrs: { src: url, alt: "" },
      })
      .run();
  };

  const block = currentBlock(editor);

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center gap-1 border-b border-slate-200 px-2">
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
          <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-200 bg-slate-50 text-xs">
            <select
              value={block}
              onChange={(e) => setBlockType(editor, e.target.value)}
              className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
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
              ⟸
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              title="Align center"
            >
              ≡
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Align right"
            >
              ⟹
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
              🔗
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Unlink"
              disabled={!editor.isActive("link")}
            >
              ⛓️‍💥
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setImagePickerOpen(true)}
              title="Chèn ảnh từ thư viện"
            >
              🖼
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                setTableRows("3");
                setTableCols("3");
                setTableOpen(true);
              }}
              title="Table"
            >
              ⊞
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              ―
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear formatting"
            >
              ⌫
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
              disabled={!editor.can().chain().focus().undo().run()}
            >
              ↶
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
              disabled={!editor.can().chain().focus().redo().run()}
            >
              ↷
            </ToolbarButton>
          </div>

          {linkOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-blue-50">
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
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded bg-white outline-none"
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
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Hủy
              </button>
            </div>
          ) : null}

          {tableOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-blue-50 text-xs">
              <label className="flex items-center gap-1">
                <span className="text-slate-600">Số dòng:</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                  className="w-16 px-2 py-1 border border-slate-200 rounded bg-white outline-none"
                  // biome-ignore lint/a11y/noAutofocus: dialog-style inline bar
                  autoFocus
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-slate-600">Số cột:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(e.target.value)}
                  className="w-16 px-2 py-1 border border-slate-200 rounded bg-white outline-none"
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
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Hủy
              </button>
            </div>
          ) : null}

          <EditorContent editor={editor} />
        </>
      ) : (
        <div className="px-4 py-3 min-h-[300px]">
          {value.trim() ? (
            <article
              className="prose prose-slate max-w-none prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored content
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className="text-xs text-slate-400">
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
