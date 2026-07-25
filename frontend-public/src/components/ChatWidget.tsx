"use client";

import { useEffect, useRef, useState } from "react";
import { chatbotApi, type ChatSource } from "@/lib/api";

type Msg = {
  role: "user" | "bot";
  text: string;
  sources?: ChatSource[];
  pending?: boolean;
};

const BRAND = "#1d4ed8";
const BRAND_DARK = "#1e3a8a";

/* ---------- tiny, safe markdown -> HTML (bold, italic, links, lists) ---------- */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inlineMd = (s: string) => {
  let out = escapeHtml(s);
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" style="color:${BRAND};text-decoration:underline">$1</a>`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  return out;
};

const renderMarkdown = (text: string): string => {
  const parts: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) {
      parts.push(`</${list}>`);
      list = null;
    }
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      if (list !== "ul") {
        closeList();
        parts.push('<ul style="margin:4px 0 4px 2px;padding-left:16px">');
        list = "ul";
      }
      parts.push(`<li style="margin:3px 0">${inlineMd(bullet[1])}</li>`);
    } else if (numbered) {
      if (list !== "ol") {
        closeList();
        parts.push('<ol style="margin:4px 0 4px 2px;padding-left:18px">');
        list = "ol";
      }
      parts.push(`<li style="margin:3px 0">${inlineMd(numbered[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      parts.push(`<div style="margin:3px 0">${inlineMd(line)}</div>`);
    }
  }
  closeList();
  return parts.join("");
};

const CSS = `
@keyframes cwBounce {0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
@keyframes cwFadeUp {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes cwPanelIn {from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes cwPulse {0%{box-shadow:0 0 0 0 rgba(29,78,216,.45)}70%{box-shadow:0 0 0 12px rgba(29,78,216,0)}100%{box-shadow:0 0 0 0 rgba(29,78,216,0)}}
.cw-msg{animation:cwFadeUp .25s ease both}
.cw-panel{animation:cwPanelIn .22s cubic-bezier(.16,1,.3,1) both}
.cw-dot{width:6px;height:6px;border-radius:50%;background:#94a3b8;display:inline-block;animation:cwBounce 1.2s infinite}
.cw-bot a{word-break:break-word}
.cw-bot ul,.cw-bot ol{padding-left:18px}
.cw-send:hover:not(:disabled){filter:brightness(1.08)}
.cw-chip:hover{background:#eff6ff;border-color:${BRAND}}
.cw-src:hover{background:#dbeafe}
`;

function BotAvatar() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        flex: "0 0 auto",
        background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        marginRight: 8,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="11" rx="3" />
        <path d="M12 8V4M9 13h.01M15 13h.01" />
      </svg>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"VI" | "EN">("VI");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t =
    lang === "EN"
      ? {
          title: "Faculty Assistant",
          sub: "Ask about programs, events, admissions…",
          placeholder: "Type your question…",
          sources: "Sources",
          hello: "Hi! I'm the Faculty of Physics assistant. Ask me anything about the faculty.",
          error: "Sorry, something went wrong. Please try again.",
          suggestions: [
            "Who is the dean?",
            "What programs does the faculty offer?",
            "Admissions information?",
            "What are the departments?",
          ],
        }
      : {
          title: "Trợ lý Khoa",
          sub: "Hỏi về chương trình, sự kiện, tuyển sinh…",
          placeholder: "Nhập câu hỏi của bạn…",
          sources: "Nguồn",
          hello: "Xin chào! Mình là trợ lý Khoa Vật lý. Hãy hỏi mình về Khoa nhé.",
          error: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
          suggestions: [
            "Trưởng khoa là ai?",
            "Khoa có những ngành nào?",
            "Thông tin tuyển sinh?",
            "Khoa gồm những bộ môn nào?",
          ],
        };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send(preset?: string) {
    const q = (preset ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [
      ...m,
      { role: "user", text: q },
      { role: "bot", text: "", pending: true },
    ]);
    setBusy(true);
    try {
      const res = await chatbotApi.ask(q, lang);
      setMsgs((m) => [
        ...m.slice(0, -1),
        { role: "bot", text: res.answer, sources: res.sources },
      ]);
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { role: "bot", text: t.error }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      <style>{CSS}</style>

      {/* Launcher */}
      <button
        aria-label="Open chat"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
          color: "#fff",
          border: "none",
          boxShadow: "0 10px 28px rgba(29,78,216,.4)",
          cursor: "pointer",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: open ? "none" : "cwPulse 2.4s infinite",
          transition: "transform .15s",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.94)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="cw-panel"
          style={{
            position: "fixed",
            right: 20,
            bottom: 92,
            width: "min(390px, calc(100vw - 40px))",
            height: "min(580px, calc(100vh - 130px))",
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 24px 68px rgba(15,23,42,.28)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 60,
            fontFamily: "inherit",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
              color: "#fff",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BotAvatar />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <strong style={{ fontSize: 15 }}>{t.title}</strong>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: "#4ade80", boxShadow: "0 0 0 2px rgba(74,222,128,.3)" }} />
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 1 }}>{t.sub}</div>
                </div>
              </div>
              <button
                onClick={() => setLang((l) => (l === "VI" ? "EN" : "VI"))}
                style={{
                  background: "rgba(255,255,255,.18)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {lang}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 14,
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {msgs.length === 0 && (
              <div className="cw-msg" style={{ display: "flex", alignItems: "flex-start" }}>
                <BotAvatar />
                <div>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      padding: "10px 12px",
                      borderRadius: "4px 14px 14px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#0f172a",
                      boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                    }}
                  >
                    {t.hello}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {t.suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="cw-chip"
                        onClick={() => send(s)}
                        style={{
                          fontSize: 12.5,
                          color: BRAND,
                          background: "#fff",
                          border: `1px solid #cdd9f0`,
                          borderRadius: 999,
                          padding: "5px 11px",
                          cursor: "pointer",
                          transition: "all .12s",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div
                key={i}
                className="cw-msg"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "bot" && <BotAvatar />}
                <div style={{ maxWidth: "82%" }}>
                  {m.pending ? (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        padding: "12px 14px",
                        borderRadius: "4px 14px 14px 14px",
                        display: "flex",
                        gap: 5,
                        alignItems: "center",
                      }}
                    >
                      <span className="cw-dot" />
                      <span className="cw-dot" style={{ animationDelay: ".15s" }} />
                      <span className="cw-dot" style={{ animationDelay: ".3s" }} />
                    </div>
                  ) : m.role === "user" ? (
                    <div
                      style={{
                        background: BRAND,
                        color: "#fff",
                        padding: "9px 13px",
                        borderRadius: "14px 14px 4px 14px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        boxShadow: "0 2px 6px rgba(29,78,216,.25)",
                      }}
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div
                      className="cw-bot"
                      style={{
                        background: "#fff",
                        color: "#0f172a",
                        border: "1px solid #e2e8f0",
                        padding: "10px 13px",
                        borderRadius: "4px 14px 14px 14px",
                        fontSize: 14,
                        lineHeight: 1.55,
                        boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                    />
                  )}

                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop: 7 }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>
                        {t.sources}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.sources.map((s, j) => (
                          <a
                            key={j}
                            className="cw-src"
                            href={`/${s.slug}`}
                            title={s.title ?? s.slug ?? ""}
                            style={{
                              fontSize: 12,
                              color: BRAND,
                              textDecoration: "none",
                              border: `1px solid #cdd9f0`,
                              borderRadius: 999,
                              padding: "3px 10px",
                              background: "#eff6ff",
                              transition: "background .12s",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              maxWidth: "100%",
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                            </svg>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {s.title ?? s.slug}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 12,
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.placeholder}
              disabled={busy}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                padding: "10px 15px",
                fontSize: 14,
                outline: "none",
                background: "#f8fafc",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BRAND)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            />
            <button
              className="cw-send"
              aria-label="Send"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 42,
                height: 42,
                flex: "0 0 auto",
                cursor: busy || !input.trim() ? "default" : "pointer",
                opacity: busy || !input.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "filter .12s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}
