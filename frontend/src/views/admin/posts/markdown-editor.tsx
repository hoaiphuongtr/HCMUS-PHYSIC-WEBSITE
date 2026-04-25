"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TurndownService from "turndown";
import { MediaPickerModal } from "@/views/admin/widgets-layout/fields/media-picker-modal";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const FONT_FAMILIES = [
  { label: "Sans (default)", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'JetBrains Mono', 'Courier New', monospace" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif" },
];

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "5" },
  { label: "XLarge", value: "6" },
  { label: "Huge", value: "7" },
];

const BLOCK_TYPES = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Quote", value: "blockquote" },
];

const buildTurndown = () => {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.remove(["style", "script", "meta", "link"]);
  return td;
};

const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

const htmlLooksLikeHtml = (value: string) =>
  /<\w+[^>]*>/.test(value.trim());

type PreviewFrameProps = {
  html: string;
  markdownFallback: string;
};

const PreviewFrame = ({ html, markdownFallback }: PreviewFrameProps) => {
  if (html.trim().length === 0 && markdownFallback.trim().length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Preview hiển thị tại đây khi bạn nhập nội dung.
      </p>
    );
  }
  return (
    <article
      className="prose prose-slate max-w-none prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted admin-authored content
      dangerouslySetInnerHTML={{ __html: html || markdownFallback }}
    />
  );
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isInternalUpdate = useRef(false);
  const turndown = useMemo(() => buildTurndown(), []);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const savedRange = useRef<Range | null>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [imageBox, setImageBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      setSelectedImage(null);
      setImageBox(null);
    }
  }, [value]);

  const emit = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange(editorRef.current.innerHTML);
  };

  const runCommand = (command: string, arg?: string) => {
    editorRef.current?.focus();
    exec(command, arg);
    emit();
  };

  const insertTable = () => {
    const rows = Number(window.prompt("Số dòng?", "3") || 0);
    const cols = Number(window.prompt("Số cột?", "3") || 0);
    if (!rows || !cols) return;
    let html =
      '<table style="width:100%;border-collapse:collapse" border="1"><tbody>';
    for (let r = 0; r < rows; r += 1) {
      html += "<tr>";
      for (let c = 0; c < cols; c += 1) {
        const tag = r === 0 ? "th" : "td";
        html += `<${tag} style="border:1px solid #cbd5e1;padding:6px 8px">${r === 0 ? `Cột ${c + 1}` : "&nbsp;"}</${tag}>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br/></p>";
    runCommand("insertHTML", html);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const range = savedRange.current;
    if (!range) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const confirmLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setLinkOpen(false);
      return;
    }
    editorRef.current?.focus();
    restoreSelection();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (range && !range.collapsed) {
      const text = range.toString();
      const anchor = document.createElement("a");
      anchor.href = trimmed;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.style.color = "#2563eb";
      anchor.style.textDecoration = "underline";
      anchor.textContent = text;
      range.deleteContents();
      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.setEndAfter(anchor);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      const html = `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">${trimmed}</a>`;
      exec("insertHTML", html);
    }
    emit();
    setLinkUrl("");
    setLinkOpen(false);
  };

  const insertImageAtCursor = (url: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const html = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0" draggable="false" />`;
    exec("insertHTML", html);
    emit();
  };

  const updateImageBox = (img: HTMLImageElement) => {
    const editor = editorRef.current;
    if (!editor) return;
    const editorRect = editor.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setImageBox({
      top: imgRect.top - editorRect.top + editor.scrollTop,
      left: imgRect.left - editorRect.left + editor.scrollLeft,
      width: imgRect.width,
      height: imgRect.height,
    });
  };

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      updateImageBox(img);
    } else if (!target.closest("[data-image-resize-handle]")) {
      setSelectedImage(null);
      setImageBox(null);
    }
  };

  useEffect(() => {
    if (!selectedImage) return;
    const reposition = () => updateImageBox(selectedImage);
    window.addEventListener("resize", reposition);
    const editor = editorRef.current;
    editor?.addEventListener("scroll", reposition);
    return () => {
      window.removeEventListener("resize", reposition);
      editor?.removeEventListener("scroll", reposition);
    };
  }, [selectedImage]);

  const startImageResize = (
    event: React.MouseEvent<HTMLDivElement>,
    corner: "nw" | "ne" | "sw" | "se",
  ) => {
    if (!selectedImage) return;
    event.preventDefault();
    event.stopPropagation();
    const img = selectedImage;
    const startX = event.clientX;
    const startWidth = img.getBoundingClientRect().width;
    const naturalRatio =
      img.naturalHeight > 0 && img.naturalWidth > 0
        ? img.naturalHeight / img.naturalWidth
        : img.getBoundingClientRect().height / Math.max(startWidth, 1);
    const editor = editorRef.current;
    const maxWidth = editor
      ? editor.getBoundingClientRect().width -
        parseFloat(getComputedStyle(editor).paddingLeft) -
        parseFloat(getComputedStyle(editor).paddingRight)
      : startWidth * 3;
    const direction = corner === "ne" || corner === "se" ? 1 : -1;

    const onMove = (e: MouseEvent) => {
      const delta = (e.clientX - startX) * direction;
      const nextWidth = Math.max(40, Math.min(maxWidth, startWidth + delta));
      img.style.width = `${Math.round(nextWidth)}px`;
      img.style.height = `${Math.round(nextWidth * naturalRatio)}px`;
      img.style.maxWidth = "100%";
      updateImageBox(img);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      emit();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const setImageAlignment = (align: "left" | "center" | "right") => {
    if (!selectedImage) return;
    if (align === "center") {
      selectedImage.style.display = "block";
      selectedImage.style.marginLeft = "auto";
      selectedImage.style.marginRight = "auto";
      selectedImage.style.float = "";
    } else {
      selectedImage.style.display = "";
      selectedImage.style.marginLeft = "";
      selectedImage.style.marginRight = "";
      selectedImage.style.float = align;
    }
    updateImageBox(selectedImage);
    emit();
  };

  const removeSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    setImageBox(null);
    emit();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    if (!html && !text) return;
    event.preventDefault();
    const cleanHtml = html
      ? html
          .replace(/<meta[^>]*>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<!--[\s\S]*?-->/g, "")
      : text.replace(/\n/g, "<br/>");
    runCommand("insertHTML", cleanHtml);
  };

  const markdownFallback = useMemo(() => {
    if (!value) return "";
    if (htmlLooksLikeHtml(value)) return "";
    return `<p>${value.replace(/\n/g, "<br/>")}</p>`;
  }, [value]);

  const copyAsMarkdown = () => {
    const md = turndown.turndown(value || "");
    navigator.clipboard.writeText(md).catch(() => undefined);
  };

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
        <div className="ml-auto pr-2">
          <button
            type="button"
            onClick={copyAsMarkdown}
            className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
            title="Copy dưới dạng markdown"
          >
            Copy markdown
          </button>
        </div>
      </div>

      {tab === "editor" ? (
        <>
          <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-200 bg-slate-50 text-xs">
            <select
              onChange={(e) => {
                runCommand("formatBlock", e.target.value);
                e.currentTarget.value = "";
              }}
              defaultValue=""
              className="px-2 py-1 border border-slate-200 rounded bg-white"
              title="Block style"
            >
              <option value="" disabled>
                Block
              </option>
              {BLOCK_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => {
                runCommand("fontName", e.target.value);
                e.currentTarget.value = "";
              }}
              defaultValue=""
              className="px-2 py-1 border border-slate-200 rounded bg-white"
              title="Font family"
            >
              <option value="" disabled>
                Font
              </option>
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => {
                runCommand("fontSize", e.target.value);
                e.currentTarget.value = "";
              }}
              defaultValue=""
              className="px-2 py-1 border border-slate-200 rounded bg-white"
              title="Font size"
            >
              <option value="" disabled>
                Size
              </option>
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <span className="w-px h-5 bg-slate-300 mx-1" />

            <ToolbarButton
              title="Bold"
              onClick={() => runCommand("bold")}
              label="B"
              bold
            />
            <ToolbarButton
              title="Italic"
              onClick={() => runCommand("italic")}
              label="I"
              italic
            />
            <ToolbarButton
              title="Underline"
              onClick={() => runCommand("underline")}
              label="U"
              underline
            />
            <ToolbarButton
              title="Strike"
              onClick={() => runCommand("strikeThrough")}
              label="S"
              strike
            />

            <span className="w-px h-5 bg-slate-300 mx-1" />

            <label
              className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
              title="Text color"
            >
              <span className="text-slate-600">A</span>
              <input
                type="color"
                className="w-4 h-4 border-0 p-0 bg-transparent cursor-pointer"
                onChange={(e) => runCommand("foreColor", e.target.value)}
              />
            </label>

            <label
              className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
              title="Highlight"
            >
              <span className="text-slate-600">bg</span>
              <input
                type="color"
                className="w-4 h-4 border-0 p-0 bg-transparent cursor-pointer"
                onChange={(e) => {
                  runCommand("hiliteColor", e.target.value);
                  runCommand("backColor", e.target.value);
                }}
              />
            </label>

            <span className="w-px h-5 bg-slate-300 mx-1" />

            <ToolbarButton
              title="Align left"
              onClick={() => runCommand("justifyLeft")}
              label="⯇"
            />
            <ToolbarButton
              title="Align center"
              onClick={() => runCommand("justifyCenter")}
              label="≡"
            />
            <ToolbarButton
              title="Align right"
              onClick={() => runCommand("justifyRight")}
              label="⯈"
            />

            <span className="w-px h-5 bg-slate-300 mx-1" />

            <ToolbarButton
              title="Bulleted list"
              onClick={() => runCommand("insertUnorderedList")}
              label="• List"
            />
            <ToolbarButton
              title="Numbered list"
              onClick={() => runCommand("insertOrderedList")}
              label="1. List"
            />
            <ToolbarButton
              title="Indent"
              onClick={() => runCommand("indent")}
              label="→|"
            />
            <ToolbarButton
              title="Outdent"
              onClick={() => runCommand("outdent")}
              label="|←"
            />

            <span className="w-px h-5 bg-slate-300 mx-1" />

            <ToolbarButton
              title="Link"
              onClick={() => {
                saveSelection();
                setLinkOpen(true);
              }}
              label="🔗"
            />
            <ToolbarButton
              title="Unlink"
              onClick={() => runCommand("unlink")}
              label="⛓̸"
            />
            <ToolbarButton
              title="Chèn ảnh từ thư viện"
              onClick={() => {
                saveSelection();
                setImagePickerOpen(true);
              }}
              label="🖼️"
            />
            <ToolbarButton title="Table" onClick={insertTable} label="⊞" />
            <ToolbarButton
              title="Divider"
              onClick={() => runCommand("insertHorizontalRule")}
              label="—"
            />
            <ToolbarButton
              title="Clear formatting"
              onClick={() => runCommand("removeFormat")}
              label="⌫"
            />
          </div>

          {linkOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-blue-50">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded bg-white outline-none"
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

          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={emit}
              onBlur={emit}
              onPaste={handlePaste}
              onClick={handleEditorClick}
              className="min-h-[420px] px-5 py-4 text-sm text-content-1000 leading-relaxed outline-none prose prose-slate max-w-none focus:bg-white"
            />
            {selectedImage && imageBox ? (
              <>
                <div
                  data-image-resize-handle
                  className="absolute pointer-events-none border-2 border-blue-500"
                  style={{
                    top: imageBox.top,
                    left: imageBox.left,
                    width: imageBox.width,
                    height: imageBox.height,
                  }}
                />
                <ImageResizeHandle
                  top={imageBox.top - 6}
                  left={imageBox.left - 6}
                  cursor="nwse-resize"
                  onMouseDown={(e) => startImageResize(e, "nw")}
                />
                <ImageResizeHandle
                  top={imageBox.top - 6}
                  left={imageBox.left + imageBox.width - 6}
                  cursor="nesw-resize"
                  onMouseDown={(e) => startImageResize(e, "ne")}
                />
                <ImageResizeHandle
                  top={imageBox.top + imageBox.height - 6}
                  left={imageBox.left - 6}
                  cursor="nesw-resize"
                  onMouseDown={(e) => startImageResize(e, "sw")}
                />
                <ImageResizeHandle
                  top={imageBox.top + imageBox.height - 6}
                  left={imageBox.left + imageBox.width - 6}
                  cursor="nwse-resize"
                  onMouseDown={(e) => startImageResize(e, "se")}
                />
                <div
                  data-image-resize-handle
                  className="absolute flex items-center gap-1 bg-slate-900 text-white text-[11px] rounded-md px-2 py-1 shadow-lg"
                  style={{
                    top: Math.max(0, imageBox.top - 34),
                    left: imageBox.left,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="font-mono text-[10px] opacity-70">
                    {Math.round(imageBox.width)}×{Math.round(imageBox.height)}
                  </span>
                  <span className="w-px h-3 bg-white/20 mx-1" />
                  <button
                    type="button"
                    onClick={() => setImageAlignment("left")}
                    className="px-1 hover:text-blue-300"
                    title="Align left"
                  >
                    ⯇
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlignment("center")}
                    className="px-1 hover:text-blue-300"
                    title="Align center"
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlignment("right")}
                    className="px-1 hover:text-blue-300"
                    title="Align right"
                  >
                    ⯈
                  </button>
                  <span className="w-px h-3 bg-white/20 mx-1" />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="px-1 hover:text-rose-300"
                    title="Xóa ảnh"
                  >
                    🗑
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : (
        <div className="min-h-[420px] px-5 py-4 bg-slate-50 overflow-auto">
          <PreviewFrame html={value} markdownFallback={markdownFallback} />
        </div>
      )}

      {imagePickerOpen ? (
        <MediaPickerModal
          onSelect={(url) => insertImageAtCursor(url)}
          onClose={() => setImagePickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

type ToolbarButtonProps = {
  title: string;
  label: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

type ImageResizeHandleProps = {
  top: number;
  left: number;
  cursor: string;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
};

const ImageResizeHandle = ({
  top,
  left,
  cursor,
  onMouseDown,
}: ImageResizeHandleProps) => (
  <div
    data-image-resize-handle
    role="presentation"
    onMouseDown={onMouseDown}
    className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm shadow"
    style={{ top, left, cursor }}
  />
);

const ToolbarButton = ({
  title,
  label,
  onClick,
  bold,
  italic,
  underline,
  strike,
}: ToolbarButtonProps) => {
  const style = [
    "px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-100 min-w-[28px]",
    bold ? "font-bold" : "",
    italic ? "italic" : "",
    underline ? "underline" : "",
    strike ? "line-through" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={style}
    >
      {label}
    </button>
  );
};
