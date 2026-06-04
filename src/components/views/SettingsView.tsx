"use client";

import { useEffect, useState } from "react";
import type { RanchConfig, Region, CropProfile } from "@/types/domain";
import { C, cardStyle, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";

export function SettingsView({
  th,
  tr,
  ranch,
  setRanch,
  regions,
  crops,
  ranches,
  activeRanchId,
  onSwitchRanch,
  onAddRanch,
  onRemoveRanch,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  ranch: RanchConfig;
  setRanch: (r: RanchConfig) => void;
  regions: Region[];
  crops: CropProfile[];
  ranches: RanchConfig[];
  activeRanchId: string;
  onSwitchRanch: (id: string) => void;
  onAddRanch: () => void;
  onRemoveRanch: (id: string) => void;
}) {
  const [form, setForm] = useState<RanchConfig>(ranch);
  // when the active ranch changes (switch / add), reload the form with its data
  useEffect(() => {
    setForm(ranch);
  }, [ranch.id]); // eslint-disable-line react-hooks/exhaustive-deps
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

  const inputStyle: React.CSSProperties = { width: "100%", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "9px 11px", color: th.ink, fontSize: fz.sm, outline: "none", fontFamily: "inherit" };
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label style={{ display: "block" }}>
      <span style={{ ...labelStyle(th), display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );

  return (
    <div style={{ padding: space.x3 }}>
      {/* ranch switcher — keep several ranches and jump between them */}
      <div className="card" style={{ ...cardStyle(th), padding: space.lg, maxWidth: 1100, marginBottom: space.md, display: "flex", alignItems: "center", gap: space.md, flexWrap: "wrap" }}>
        <span style={labelStyle(th)}>{tr("Rancho activo", "Rancho activo")}</span>
        <select value={activeRanchId} onChange={(e) => onSwitchRanch(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 200, flex: "0 1 auto" }}>
          {ranches.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
        <button onClick={onAddRanch} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "9px 16px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>+ {tr("Agregar rancho", "Agregar rancho")}</button>
        {ranches.length > 1 && (
          <button
            onClick={() => { if (typeof window !== "undefined" && window.confirm(tr(`¿Eliminar el rancho "${ranch.name}"?`, `¿Eliminar "${ranch.name}"?`))) onRemoveRanch(activeRanchId); }}
            style={{ background: th.panel2, border: `1px solid ${C.critical}55`, color: C.critical, borderRadius: radius.md, padding: "9px 14px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}
          >
            {tr("Eliminar este rancho", "Eliminar")}
          </button>
        )}
        <span style={{ fontSize: fz.micro, color: th.mute, marginLeft: "auto" }}>{ranches.length} {ranches.length === 1 ? tr("rancho", "rancho") : tr("ranchos", "ranchos")}</span>
      </div>

      <div className="card" style={{ ...cardStyle(th), padding: space.xl, maxWidth: 1100 }}>
        <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Tu rancho", "Configuración del rancho")}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Configura los datos de tu rancho. Se usan en todo el panel.", "Parámetros del rancho usados por el panel y el cerebro.")}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 220px),1fr))", gap: space.md }}>
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
          <Field label={tr("Tarifa de luz (CFE)", "Tarifa contratada")}>
            <select style={inputStyle} value={form.tariffType} onChange={(e) => set("tariffType", e.target.value as RanchConfig["tariffType"])}>
              {(["Nocturna (CFE)", "Horaria", "Fija"] as const).map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </Field>
          <Field label={tr("Carga contratada (kW)", "Carga contratada (kW)")}><input type="number" style={inputStyle} value={form.contractedKw ?? ""} onChange={(e) => set("contractedKw", e.target.value === "" ? undefined : +e.target.value)} placeholder={tr("ej. 110", "kW")} /></Field>
          <Field label={tr("Número de servicio CFE (RPU)", "Servicio CFE / RPU")}><input style={inputStyle} value={form.cfeService ?? ""} onChange={(e) => set("cfeService", e.target.value)} placeholder={tr("opcional", "RPU")} /></Field>
          <Field label={tr("Agua concesionada (m³/año)", "Volumen concesionado (m³/año)")}><input type="number" style={inputStyle} value={form.concessionM3Year ?? ""} onChange={(e) => set("concessionM3Year", e.target.value === "" ? undefined : +e.target.value)} placeholder={tr("lo que te autoriza CONAGUA", "REPDA m³/año")} /></Field>
          <Field label={tr("Título de concesión (REPDA)", "Título REPDA")}><input style={inputStyle} value={form.concessionTitle ?? ""} onChange={(e) => set("concessionTitle", e.target.value)} placeholder={tr("opcional", "núm. de título")} /></Field>
          <Field label={tr("Teléfono / WhatsApp (alertas)", "Teléfono / WhatsApp")}><input style={inputStyle} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder={tr("para avisarte de fallas", "+52…")} /></Field>
        </div>
        <div style={{ marginTop: space.md }}>
          <Field label={tr("Notas", "Notas")}><textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={tr("Ej. dos turnos de riego, pozo nuevo en 2024…", "Notas operativas")} /></Field>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: space.md, marginTop: space.lg }}>
          <button onClick={save} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 20px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>{tr("Guardar cambios", "Guardar")}</button>
          {saved && <span style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600 }}>✓ {tr("Guardado", "Guardado")}</span>}
        </div>
      </div>
    </div>
  );
}
