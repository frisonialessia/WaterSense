"use client";

import { useState } from "react";
import type { RanchConfig, Region, CropProfile } from "@/types/domain";
import { C, cardStyle, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

export function SettingsView({
  th,
  tr,
  ranch,
  setRanch,
  regions,
  crops,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  ranch: RanchConfig;
  setRanch: (r: RanchConfig) => void;
  regions: Region[];
  crops: CropProfile[];
}) {
  const [form, setForm] = useState<RanchConfig>(ranch);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof RanchConfig>(k: K, v: RanchConfig[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };
  const onRegion = (id: string) => {
    const r = regions.find((x) => x.id === id);
    setForm((f) => ({ ...f, regionId: id, ...(r ? { lat: r.lat, lng: r.lng, altitudeM: r.altitudeM } : {}) }));
    setSaved(false);
  };
  const save = () => {
    setRanch(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // AI irrigation study
  const [study, setStudy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [studyMode, setStudyMode] = useState<string>("");
  const generate = async () => {
    setLoading(true);
    setStudy("");
    try {
      const res = await fetch("/api/study", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ranchName: form.name }) });
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
    a.download = `estudio-riego-${form.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "9px 11px", color: th.ink, fontSize: fz.sm, outline: "none", fontFamily: "inherit" };
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label style={{ display: "block" }}>
      <span style={{ ...labelStyle(th), display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );

  return (
    <div style={{ padding: space.x3, maxWidth: 920 }}>
      {/* Ranch configuration */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
        <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Tu rancho", "Configuración del rancho")}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Configura los datos de tu rancho. Se usan en todo el panel.", "Parámetros del rancho usados por el panel y el cerebro.")}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md }}>
          <Field label={tr("Nombre del rancho", "Nombre")}><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label={tr("Responsable", "Titular")}><input style={inputStyle} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder={tr("opcional", "opcional")} /></Field>
          <Field label={tr("Región", "Región / municipio")}>
            <select style={inputStyle} value={form.regionId} onChange={(e) => onRegion(e.target.value)}>
              {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </Field>
          <Field label={tr("Cultivo principal", "Cultivo principal")}>
            <select style={inputStyle} value={form.mainCrop} onChange={(e) => set("mainCrop", e.target.value as RanchConfig["mainCrop"])}>
              {crops.map((c) => (<option key={c.crop} value={c.crop}>{c.crop}</option>))}
            </select>
          </Field>
          <Field label={tr("Latitud", "Latitud")}><input type="number" step="0.0001" style={inputStyle} value={form.lat} onChange={(e) => set("lat", +e.target.value)} /></Field>
          <Field label={tr("Longitud", "Longitud")}><input type="number" step="0.0001" style={inputStyle} value={form.lng} onChange={(e) => set("lng", +e.target.value)} /></Field>
          <Field label={tr("Altitud (m)", "Altitud (m)")}><input type="number" style={inputStyle} value={form.altitudeM} onChange={(e) => set("altitudeM", +e.target.value)} /></Field>
          <Field label={tr("Superficie (ha)", "Superficie (ha)")}><input type="number" step="0.1" style={inputStyle} value={form.hectares} onChange={(e) => set("hectares", +e.target.value)} /></Field>
        </div>
        <div style={{ marginTop: space.md }}>
          <Field label={tr("Notas", "Notas")}><textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={tr("Ej. dos turnos de riego, pozo nuevo en 2024…", "Notas operativas")} /></Field>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: space.md, marginTop: space.lg }}>
          <button onClick={save} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 20px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>{tr("Guardar cambios", "Guardar")}</button>
          {saved && <span style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600 }}>✓ {tr("Guardado", "Guardado")}</span>}
        </div>
      </div>

      {/* AI irrigation study */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Estudio de riego profesional (IA)", "Estudio de riego asistido por IA")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, maxWidth: 560 }}>{tr("Genera un análisis completo de tu riego, pozos y acuífero, con un plan accionable. Listo para compartir.", "Análisis agronómico generado desde el cerebro (+ Claude si hay clave configurada).")}</div>
          </div>
          <button onClick={generate} disabled={loading} style={{ border: "none", background: C.emerald, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <Icon name="file" size={15} color="#fff" />
            {loading ? tr("Generando…", "Generando…") : tr("Generar estudio", "Generar estudio")}
          </button>
        </div>

        {study && (
          <div style={{ marginTop: space.lg }}>
            <div style={{ display: "flex", alignItems: "center", gap: space.md, marginBottom: space.sm }}>
              <span style={{ ...labelStyle(th) }}>{tr("Resultado", "Resultado")}</span>
              <span style={{ fontSize: fz.micro, color: th.mute }}>{studyMode === "claude" ? tr("redactado con IA (Claude)", "Claude") : tr("generado desde el cerebro (modo demo)", "motor local")}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: space.sm }}>
                <button onClick={() => navigator.clipboard?.writeText(study)} style={{ border: `1px solid ${th.line}`, background: th.panel2, color: th.ink, borderRadius: radius.md, padding: "6px 12px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Copiar", "Copiar")}</button>
                <button onClick={download} style={{ border: `1px solid ${th.line}`, background: th.panel2, color: th.ink, borderRadius: radius.md, padding: "6px 12px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Descargar", "Descargar")}</button>
              </div>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: fz.sm, color: th.ink, lineHeight: 1.6, background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: space.lg, margin: 0, maxHeight: 460, overflow: "auto" }}>{study}</pre>
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
