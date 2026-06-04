"use client";

import { useState } from "react";
import type { RanchConfig } from "@/types/domain";
import { C, cardStyle, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

export function StudyView({ th, tr, ranch }: { th: Theme; tr: (s: string, t: string) => string; ranch: RanchConfig }) {
  const [study, setStudy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [studyMode, setStudyMode] = useState<string>("");

  const generate = async () => {
    setLoading(true);
    setStudy("");
    try {
      const res = await fetch("/api/study", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ranchName: ranch.name }), signal: AbortSignal.timeout(30000) });
      const data = await res.json();
      setStudy(data.text || data.error || "No se pudo generar el estudio.");
      setStudyMode(data.mode || "");
    } catch {
      setStudy("Hubo un problema de conexión al generar el estudio.");
    } finally {
      setLoading(false);
    }
  };
  const download = () => {
    const blob = new Blob([study], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudio-riego-${ranch.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: space.x3 }}>
      <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Estudio de riego profesional (IA)", "Estudio de riego asistido por IA")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, maxWidth: 580 }}>{tr("Genera un análisis completo de tu riego, pozos y acuífero, con un plan accionable. Listo para compartir con socios o tu agrónomo.", "Análisis agronómico generado desde el cerebro (+ Claude si hay clave configurada).")}</div>
          </div>
          <button onClick={generate} disabled={loading} style={{ border: "none", background: C.emerald, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <Icon name="file" size={15} color="#fff" />
            {loading ? tr("Generando…", "Generando…") : tr("Generar estudio", "Generar estudio")}
          </button>
        </div>

        {loading && !study && (
          <div style={{ marginTop: space.lg }}>
            <div className="ws-sk" style={{ width: 140, height: 12, marginBottom: space.md }} />
            {[92, 80, 96, 70, 88, 64, 90].map((w, i) => (
              <div key={i} className="ws-sk" style={{ height: 12, width: `${w}%`, marginBottom: 10 }} />
            ))}
          </div>
        )}

        {study && (
          <div style={{ marginTop: space.lg }}>
            <div style={{ display: "flex", alignItems: "center", gap: space.md, marginBottom: space.sm }}>
              <span style={labelStyle(th)}>{tr("Resultado", "Resultado")}</span>
              <span style={{ fontSize: fz.micro, color: th.mute }}>{studyMode === "claude" ? tr("redactado con IA (Claude)", "Claude") : tr("generado desde el cerebro (modo demo)", "motor local")}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: space.sm }}>
                <button onClick={() => navigator.clipboard?.writeText(study)} style={{ border: `1px solid ${th.line}`, background: th.panel2, color: th.ink, borderRadius: radius.md, padding: "6px 12px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Copiar", "Copiar")}</button>
                <button onClick={download} style={{ border: `1px solid ${th.line}`, background: th.panel2, color: th.ink, borderRadius: radius.md, padding: "6px 12px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Descargar", "Descargar")}</button>
              </div>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: fz.sm, color: th.ink, lineHeight: 1.6, background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: space.lg, margin: 0, maxHeight: 520, overflow: "auto" }}>{study}</pre>
          </div>
        )}

        <p style={{ fontSize: fz.micro, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
          {tr(
            "Estudio de demostración con datos simulados. Para decisiones de inversión, valida el modelo del acuífero con un hidrólogo.",
            "Demo · datos simulados. Con ANTHROPIC_API_KEY el estudio lo redacta Claude; sin clave, lo genera el cerebro local."
          )}
        </p>
      </div>
    </div>
  );
}
