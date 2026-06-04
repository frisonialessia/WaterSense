"use client";

import { useEffect, useRef, useState } from "react";
import { C, space, fz, radius, shadow, type Theme } from "@/lib/theme";
import { Logo } from "./Logo";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = ["¿Qué parcela riego primero?", "¿Por qué el pozo chico está en alerta?", "¿Cómo bajo mi gasto de luz?"];

export function Agent({ th, tr }: { th: Theme; tr: (s: string, t: string) => string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hola, soy tu asistente de WaterSense. Puedo ayudarte con tus parcelas, pozos y costos. ¿Qué quieres saber?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [msgs, loading, open]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply =
        data.text ??
        (data.error
          ? `${data.error} (En esta demo el asistente necesita ANTHROPIC_API_KEY configurada en el servidor.)`
          : "No pude responder ahora mismo.");
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Hubo un problema de conexión con el asistente." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={tr("Abrir asistente", "Abrir asistente")}
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${C.glacier},${C.emerald})`, cursor: "pointer", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadow.lg, border: "none" }}
      >
        <Logo size={30} light />
      </button>
    );
  }

  return (
    <div
      style={{ position: "fixed", bottom: 24, right: 24, width: 380, maxWidth: "calc(100vw - 32px)", height: 540, maxHeight: "calc(100vh - 48px)", background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, zIndex: 31, display: "flex", flexDirection: "column", boxShadow: shadow.lg, overflow: "hidden" }}
    >
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderBottom: `1px solid ${th.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
          <Logo size={24} />
          <div>
            <div style={{ fontWeight: 600, fontSize: fz.sm }}>{tr("Asistente WaterSense", "Asistente")}</div>
            <div style={{ fontSize: fz.micro, color: C.emerald }}>● {tr("en línea", "online")}</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ cursor: "pointer", color: th.mute, fontSize: 20, lineHeight: 1, background: "none", border: "none" }}>×</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: space.lg, display: "flex", flexDirection: "column", gap: space.sm }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.role === "user" ? C.glacier : th.panel2, color: m.role === "user" ? "#fff" : th.ink, padding: "9px 12px", borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", fontSize: fz.sm, lineHeight: 1.5 }}
          >
            {m.content}
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", color: th.mute, fontSize: fz.sm, padding: "4px 4px" }}>● ● ●</div>}
        {msgs.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {SUGGESTIONS.map((sg) => (
              <button key={sg} onClick={() => send(sg)} style={{ textAlign: "left", fontSize: fz.xs, color: C.glacier, border: `1px solid ${th.line}`, padding: "8px 11px", borderRadius: radius.md, cursor: "pointer", background: th.panel2 }}>
                {sg}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: space.md, borderTop: `1px solid ${th.line}`, display: "flex", gap: space.sm }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={tr("Pregunta sobre tu rancho…", "Pregunta…")}
          style={{ flex: 1, background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "10px 12px", color: th.ink, fontSize: fz.sm, outline: "none" }}
        />
        <button onClick={() => send()} disabled={loading} aria-label="Enviar" style={{ background: C.emerald, border: "none", borderRadius: radius.md, width: 42, cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700 }}>↑</button>
      </div>
    </div>
  );
}
