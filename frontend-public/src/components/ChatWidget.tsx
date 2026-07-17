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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"VI" | "EN">("VI");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t =
    lang === "EN"
      ? {
          title: "Faculty Assistant",
          sub: "Ask about programs, events, admissions…",
          placeholder: "Type your question…",
          send: "Send",
          sources: "Sources",
          thinking: "Thinking…",
          hello: "Hi! Ask me anything about the Faculty of Physics.",
        }
      : {
          title: "Trợ lý Khoa",
          sub: "Hỏi về chương trình, sự kiện, tuyển sinh…",
          placeholder: "Nhập câu hỏi của bạn…",
          send: "Gửi",
          sources: "Nguồn",
          thinking: "Đang trả lời…",
          hello: "Xin chào! Hãy hỏi mình bất cứ điều gì về Khoa Vật lý.",
        };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [
      ...m,
      { role: "user", text: q },
      { role: "bot", text: t.thinking, pending: true },
    ]);
    setBusy(true);
    try {
      const res = await chatbotApi.ask(q, lang);
      setMsgs((m) => {
        const next = m.slice(0, -1);
        return [
          ...next,
          { role: "bot", text: res.answer, sources: res.sources },
        ];
      });
    } catch {
      setMsgs((m) => {
        const next = m.slice(0, -1);
        return [
          ...next,
          {
            role: "bot",
            text:
              lang === "EN"
                ? "Sorry, something went wrong. Please try again."
                : "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
          },
        ];
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
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
          background: BRAND,
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 24px rgba(29,78,216,.35)",
          cursor: "pointer",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 92,
            width: "min(380px, calc(100vw - 40px))",
            height: "min(560px, calc(100vh - 130px))",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(15,23,42,.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 60,
            fontFamily: "inherit",
          }}
        >
          {/* Header */}
          <div style={{ background: BRAND, color: "#fff", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{t.title}</strong>
              <button
                onClick={() => setLang((l) => (l === "VI" ? "EN" : "VI"))}
                style={{
                  background: "rgba(255,255,255,.18)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "3px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {lang}
              </button>
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{t.sub}</div>
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
              gap: 10,
            }}
          >
            {msgs.length === 0 && (
              <div style={{ color: "#64748b", fontSize: 14, margin: "auto", textAlign: "center", padding: 20 }}>
                {t.hello}
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    background: m.role === "user" ? BRAND : "#fff",
                    color: m.role === "user" ? "#fff" : "#0f172a",
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                    padding: "9px 12px",
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    opacity: m.pending ? 0.6 : 1,
                  }}
                >
                  {m.text}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.sources.map((s, j) => (
                      <a
                        key={j}
                        href={`/${s.slug}`}
                        style={{
                          fontSize: 12,
                          color: BRAND,
                          textDecoration: "none",
                          border: `1px solid ${BRAND}`,
                          borderRadius: 999,
                          padding: "2px 9px",
                          background: "#eff6ff",
                        }}
                      >
                        {s.title ?? s.slug}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.placeholder}
              disabled={busy}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              style={{
                background: BRAND,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0 16px",
                fontSize: 14,
                cursor: busy ? "default" : "pointer",
                opacity: busy || !input.trim() ? 0.5 : 1,
              }}
            >
              {t.send}
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
