"use client";

import { useEffect, useMemo, useState } from "react";
import type { CostItem, Parcel, CropProfile } from "@/types/domain";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { irrigationEfficiency } from "@/lib/brain/irrigationFactors";
import { Icon } from "../Icon";
import { HourlyPrices } from "./HourlyPrices";

type Period = "semanal" | "quincenal" | "mensual";

interface CostEntry {
  id: string;
  category: string;
  amount: number;
  date: string; // yyyy-mm-dd
  recurring: boolean;
  note?: string;
  fileName?: string;
  workers?: number; // nómina
  period?: Period; // nómina
  workersList?: { name: string; amount: number }[]; // nómina desglosada
  parcelId?: string; // a qué parcela se carga el gasto (opcional)
  quantity?: number; // m³ de agua / kWh de luz / L de diésel (opcional)
}
interface CustomCat {
  id: string;
  label: string;
}

const FIXED_CATS = [
  { id: "luz", label: "Luz (CFE)", icon: "bolt" },
  { id: "agua", label: "Agua / derechos", icon: "drop" },
  { id: "diesel", label: "Diésel", icon: "fuel" },
  { id: "mano", label: "Nómina / raya", icon: "user" },
  { id: "mant", label: "Mantenimiento", icon: "wrench" },
  { id: "fert", label: "Fertilizante / nutrición", icon: "leaf" },
  { id: "agroq", label: "Agroquímicos", icon: "shield" },
  { id: "semilla", label: "Semilla / planta", icon: "spark" },
  { id: "maq", label: "Maquinaria / labores", icon: "sliders" },
  { id: "cosecha", label: "Cosecha / empaque", icon: "scale" },
  { id: "flete", label: "Fletes / transporte", icon: "map" },
  { id: "renta", label: "Renta / predial", icon: "home" },
  { id: "credito", label: "Crédito / seguro", icon: "book" },
  { id: "otro", label: "Otro", icon: "coin" },
];

// Energy/water tagging → lets us derive $/m³ and kWh later. Unit per category.
const UNIT_FOR: Record<string, string> = { agua: "m³", luz: "kWh", diesel: "L" };

const PERIOD_MULT: Record<Period, number> = { semanal: 4.33, quincenal: 2, mensual: 1 };
// Temporada de riego (abr–sep) sube luz/diésel; resto baja.
const seasonFactor = (m: number) => ([3, 4, 5, 6, 7, 8].includes(m) ? 1.12 : 0.92);
const monthLabel = (d: Date) => d.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");

export function CostosView({ th, tr, costs, tariffCurve, parcels, crops }: { th: Theme; tr: (s: string, t: string) => string; costs: CostItem[]; tariffCurve: number[]; parcels: Parcel[]; crops: CropProfile[] }) {
  const fixedBaseline = costs.reduce((s, c) => s + c.month, 0);
  const [open, setOpen] = useState<string | null>("luz");

  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [customCats, setCustomCats] = useState<CustomCat[]>([]);
  useEffect(() => {
    try {
      const e = localStorage.getItem("watersense.costEntries");
      if (e) setEntries(JSON.parse(e));
      const c = localStorage.getItem("watersense.costCats");
      if (c) setCustomCats(JSON.parse(c));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.costEntries", JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries]);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.costCats", JSON.stringify(customCats));
    } catch {
      /* ignore */
    }
  }, [customCats]);

  const allCats = useMemo(() => [...FIXED_CATS, ...customCats.map((c) => ({ ...c, icon: "coin" }))], [customCats]);
  const catOf = (id: string) => allCats.find((c) => c.id === id) ?? FIXED_CATS[FIXED_CATS.length - 1];

  // form
  const [cat, setCat] = useState("mano");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(true);
  const [fileName, setFileName] = useState("");
  const [workers, setWorkers] = useState("3");
  const [period, setPeriod] = useState<Period>("semanal");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [payrollMode, setPayrollMode] = useState<"total" | "list">("total");
  const [workerRows, setWorkerRows] = useState<{ name: string; amount: string }[]>([{ name: "", amount: "" }]);
  const [parcelId, setParcelId] = useState("");
  const [quantity, setQuantity] = useState("");
  const qtyUnit = UNIT_FOR[cat]; // shows a quantity field for agua/luz/diésel

  const isPayroll = cat === "mano";
  const workersTotal = workerRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const usingList = isPayroll && payrollMode === "list";
  const effectiveAmount = usingList ? workersTotal : parseFloat(amount) || 0;

  const add = () => {
    const n = usingList ? workersTotal : parseFloat(amount);
    if (!n || n <= 0) return;
    const validRows = usingList
      ? workerRows.filter((r) => (parseFloat(r.amount) || 0) > 0).map((r) => ({ name: r.name.trim() || tr("Trabajador", "Trabajador"), amount: Math.round(parseFloat(r.amount)) }))
      : undefined;
    const entry: CostEntry = {
      id: `e-${Date.now()}`,
      category: cat,
      amount: Math.round(n),
      date,
      recurring,
      fileName: fileName || undefined,
      workers: isPayroll ? (usingList ? validRows?.length : Number(workers) || undefined) : undefined,
      period: isPayroll ? period : undefined,
      workersList: validRows,
      parcelId: parcelId || undefined,
      quantity: qtyUnit && parseFloat(quantity) > 0 ? parseFloat(quantity) : undefined,
    };
    setEntries((e) => [entry, ...e]);
    setAmount("");
    setFileName("");
    setWorkerRows([{ name: "", amount: "" }]);
    setQuantity("");
  };
  const remove = (id: string) => setEntries((e) => e.filter((x) => x.id !== id));
  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    const id = `cat-${Date.now()}`;
    setCustomCats((c) => [...c, { id, label: name }]);
    setCat(id);
    setNewCat("");
    setAddingCat(false);
  };

  // monthly-equivalent for recurring projection
  const monthlyEquiv = (e: CostEntry) => (e.category === "mano" && e.period ? e.amount * PERIOD_MULT[e.period] : e.amount);
  const recurringMonthly = useMemo(() => entries.filter((e) => e.recurring).reduce((s, e) => s + monthlyEquiv(e), 0), [entries]);

  // history: last 6 months of actual registered spend
  const now = new Date();
  const history = useMemo(() => {
    const arr: { label: string; key: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const value = entries.filter((e) => e.date.slice(0, 7) === key).reduce((s, e) => s + e.amount, 0);
      arr.push({ label: monthLabel(d), key, value });
    }
    return arr;
  }, [entries, now]);
  const registeredThisMonth = history[history.length - 1]?.value ?? 0;

  // projection: next 6 months = (fixed baseline + recurring) × seasonality
  const projection = useMemo(() => {
    const base = fixedBaseline + recurringMonthly;
    const arr: { label: string; value: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      arr.push({ label: monthLabel(d), value: Math.round(base * seasonFactor(d.getMonth())) });
    }
    return arr;
  }, [fixedBaseline, recurringMonthly, now]);
  const avgProjected = Math.round(projection.reduce((s, p) => s + p.value, 0) / projection.length);

  // Water-productivity indicators: kg/m³, $/m³, $/kg — derived from the same
  // crop × surface × irrigation-efficiency model used across the app.
  const cropMap = useMemo(() => Object.fromEntries(crops.map((c) => [c.crop, c])) as Record<string, CropProfile>, [crops]);
  const prod = useMemo(() => {
    let water = 0;
    let yieldKg = 0;
    for (const p of parcels) {
      const cp = cropMap[p.crop];
      if (!cp) continue;
      water += cp.waterM3ha * p.hectares * irrigationEfficiency(p.irrigationSystem);
      yieldKg += cp.yieldKgHa * p.hectares;
    }
    const annualCost = (fixedBaseline + recurringMonthly) * 12;
    return {
      water: Math.round(water),
      yieldKg: Math.round(yieldKg),
      costPerM3: water ? annualCost / water : 0,
      kgPerM3: water ? yieldKg / water : 0,
      costPerKg: yieldKg ? annualCost / yieldKg : 0,
    };
  }, [parcels, cropMap, fixedBaseline, recurringMonthly]);

  const inputStyle: React.CSSProperties = { background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "8px 10px", color: th.ink, fontSize: fz.xs, outline: "none", fontFamily: "inherit" };

  const Metric = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div>
      <div style={{ ...labelStyle(th), marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: color ?? th.ink }}>{value}</div>
    </div>
  );

  const Bars = ({ data, color }: { data: { label: string; value: number }[]; color: string }) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: space.sm, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span className="mono" style={{ fontSize: 9, color: th.soft }}>{d.value > 0 ? `$${(d.value / 1000).toFixed(0)}k` : ""}</span>
            <div style={{ width: "100%", height: `${(d.value / max) * 86}px`, minHeight: d.value > 0 ? 4 : 0, borderRadius: "3px 3px 0 0", background: color }} />
            <span style={{ fontSize: 9, color: th.mute }}>{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: space.x3 }}>
      {/* water-productivity indicators */}
      {prod.water > 0 && (
        <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: space.sm, marginBottom: space.md }}>
            <div style={{ fontWeight: 600 }}>{tr("Productividad del agua", "Indicadores por m³")}</div>
            <span style={{ fontSize: fz.xs, color: th.mute }}>{tr("según tu producción y consumo del año", "cultivo × superficie × eficiencia de riego")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 150px),1fr))", gap: space.md }}>
            <Metric label={tr("Agua al año", "Agua/año")} value={`${fmt(prod.water)} m³`} />
            <Metric label={tr("Cosecha por m³", "kg/m³")} value={`${prod.kgPerM3.toFixed(1)} kg`} color={C.emerald} />
            <Metric label={tr("Costo por m³", "$/m³")} value={`$${prod.costPerM3.toFixed(2)}`} color={C.glacier} />
            <Metric label={tr("Costo por kilo", "$/kg")} value={`$${prod.costPerKg.toFixed(2)}`} color={C.glacier} />
          </div>
        </div>
      )}

      {/* fixed monthly costs (simulated baseline) */}
      <div className="card" style={{ ...cardStyle(th), overflow: "hidden" }}>
        <div style={{ padding: `${space.lg}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Tus costos de este mes", "Costos operativos · mes")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>{tr("Toca la luz para ver el detalle por hora", "Toca un rubro para desglose")}</div>
          </div>
          <span className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: th.ink }}>${fmt(fixedBaseline)}</span>
        </div>
        {costs.map((c, i) => {
          const expandable = c.id === "luz";
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ borderBottom: i < costs.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <div onClick={() => expandable && setOpen(isOpen ? null : c.id)} style={{ padding: `${space.md}px ${space.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: expandable ? "pointer" : "default", background: isOpen ? th.panel2 : "transparent", transition: "background .2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                  <span style={{ width: 32, height: 32, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={c.icon} size={16} color={c.id === "luz" ? C.alert : c.id === "agua" ? C.glacier : th.soft} />
                  </span>
                  <div>
                    <div style={{ fontSize: fz.sm, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      {c.label}
                      {expandable && <span style={{ fontSize: fz.micro, color: C.emerald, border: `1px solid ${C.emerald}55`, borderRadius: radius.sm, padding: "1px 6px" }}>{isOpen ? tr("ocultar", "ocultar") : tr("ver por hora", "detalle")}</span>}
                    </div>
                    <div style={{ fontSize: fz.xs, color: th.mute }}>{c.note}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: fz.md, fontWeight: 600 }}>${fmt(c.month)}</div>
                  <div style={{ fontSize: fz.xs, fontWeight: 600, color: c.trend < 0 ? C.emerald : c.trend > 0 ? C.critical : th.mute }}>
                    {c.trend > 0 ? "↑" : c.trend < 0 ? "↓" : "="} {Math.abs(c.trend)}%
                  </div>
                </div>
              </div>
              {expandable && isOpen && (
                <div style={{ background: th.panel2, borderTop: `1px solid ${th.line}` }}>
                  <HourlyPrices th={th} tr={tr} prices={tariffCurve} parcels={parcels} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* register a cost (manual + nómina + recibo) */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <div style={{ fontWeight: 600 }}>{tr("Registrar un gasto", "Registrar gasto")}</div>
          {registeredThisMonth > 0 && <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>{tr("este mes:", "mes:")} <b style={{ color: th.ink }}>${fmt(registeredThisMonth)}</b></span>}
        </div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>
          {tr("Nómina/raya, mantenimiento, diésel, fletes… con o sin comprobante. Marca lo que se repite cada mes.", "Captura manual o con comprobante; marca recurrentes para la proyección.")}
        </div>

        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "center", marginBottom: space.sm }}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={inputStyle} aria-label={tr("Rubro", "Rubro")}>
            {allCats.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
          </select>
          {!addingCat ? (
            <button onClick={() => setAddingCat(true)} style={{ ...inputStyle, cursor: "pointer", color: C.glacier, fontWeight: 600 }}>+ {tr("categoría", "categoría")}</button>
          ) : (
            <>
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder={tr("Nueva categoría", "Categoría")} style={{ ...inputStyle, width: 150 }} />
              <button onClick={addCategory} style={{ ...inputStyle, cursor: "pointer", background: C.glacier, color: "#fff", border: "none", fontWeight: 600 }}>{tr("Crear", "Crear")}</button>
            </>
          )}
          {!usingList ? (
            <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, paddingLeft: 10 }}>
              <span style={{ color: th.mute, fontSize: fz.xs }}>$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isPayroll ? tr("Total de la raya", "Total raya") : tr("Monto", "Monto")} style={{ ...inputStyle, border: "none", background: "transparent", width: 120 }} />
            </div>
          ) : (
            <span style={{ ...inputStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>{tr("Total raya", "Total")}: <b className="mono" style={{ color: th.ink }}>${fmt(Math.round(workersTotal))}</b></span>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} aria-label={tr("Fecha", "Fecha")} />
          <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} style={inputStyle} aria-label={tr("Parcela", "Parcela")}>
            <option value="">{tr("Todo el rancho", "Todo el rancho")}</option>
            {parcels.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          {qtyUnit && (
            <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, paddingRight: 10 }}>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={tr(`Consumo`, "Consumo")} style={{ ...inputStyle, border: "none", background: "transparent", width: 90 }} aria-label={tr("Consumo", "Consumo")} />
              <span style={{ color: th.mute, fontSize: fz.xs }}>{qtyUnit}</span>
            </div>
          )}
        </div>

        {isPayroll && (
          <div style={{ marginBottom: space.sm }}>
            <div style={{ display: "flex", gap: 6, marginBottom: space.sm }}>
              {(["total", "list"] as const).map((m) => (
                <button key={m} onClick={() => setPayrollMode(m)} style={{ fontSize: fz.micro, fontWeight: 600, padding: "5px 11px", borderRadius: radius.pill, cursor: "pointer", border: `1px solid ${payrollMode === m ? C.glacier : th.line}`, background: payrollMode === m ? `${C.glacier}14` : th.panel2, color: payrollMode === m ? th.ink : th.soft }}>
                  {m === "total" ? tr("Total rápido", "Total") : tr("Por trabajador", "Por trabajador")}
                </button>
              ))}
            </div>
            {usingList && (
              <div style={{ marginBottom: space.sm }}>
                {workerRows.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <input value={r.name} onChange={(e) => setWorkerRows((rows) => rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={tr("Nombre del trabajador", "Nombre")} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
                    <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, paddingLeft: 10 }}>
                      <span style={{ color: th.mute, fontSize: fz.xs }}>$</span>
                      <input type="number" value={r.amount} onChange={(e) => setWorkerRows((rows) => rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} placeholder={tr("Monto", "Monto")} style={{ ...inputStyle, border: "none", background: "transparent", width: 100 }} />
                    </div>
                    <button onClick={() => setWorkerRows((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows))} aria-label={tr("Quitar", "Quitar")} style={{ background: "none", border: "none", cursor: "pointer", color: th.mute, fontSize: 13, padding: 2 }}>🗑</button>
                  </div>
                ))}
                <button onClick={() => setWorkerRows((rows) => [...rows, { name: "", amount: "" }])} style={{ ...inputStyle, cursor: "pointer", color: C.glacier, fontWeight: 600 }}>+ {tr("trabajador", "trabajador")}</button>
              </div>
            )}
            <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "center" }}>
              {!usingList && (
                <label style={{ fontSize: fz.xs, color: th.soft, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {tr("Jornaleros", "Jornaleros")}
                  <input type="number" value={workers} onChange={(e) => setWorkers(e.target.value)} style={{ ...inputStyle, width: 64 }} />
                </label>
              )}
              <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} style={inputStyle} aria-label={tr("Periodo", "Periodo")}>
                <option value="semanal">{tr("Semanal", "Semanal")}</option>
                <option value="quincenal">{tr("Quincenal", "Quincenal")}</option>
                <option value="mensual">{tr("Mensual", "Mensual")}</option>
              </select>
              <span style={{ fontSize: fz.micro, color: th.mute }}>{tr("equivale a", "≈")} <b className="mono" style={{ color: th.ink }}>${fmt(Math.round(effectiveAmount * PERIOD_MULT[period]))}</b>/{tr("mes", "mes")}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: space.md, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: fz.xs, color: th.ink, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ accentColor: C.emerald }} />
            {tr("Se repite cada mes (recurrente)", "Recurrente")}
          </label>
          <label style={{ ...inputStyle, cursor: "pointer", color: th.soft, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="book" size={13} color={th.soft} />
            {fileName ? fileName.slice(0, 16) : tr("Adjuntar (opcional)", "Comprobante")}
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} style={{ display: "none" }} />
          </label>
          <button onClick={add} style={{ border: "none", background: C.emerald, color: "#fff", borderRadius: radius.md, padding: "9px 18px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>{tr("Agregar gasto", "Agregar")}</button>
        </div>
      </div>

      {/* history + projection */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 320px),1fr))", gap: space.md, marginTop: space.md }}>
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Historial por mes", "Gasto registrado · por mes")}</div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Lo que has registrado en los últimos 6 meses", "Últimos 6 meses · registrado")}</div>
          {entries.length > 0 ? <Bars data={history} color={C.glacier} /> : <div style={{ fontSize: fz.xs, color: th.mute, fontStyle: "italic", padding: `${space.lg}px 0` }}>{tr("Aún no registras gastos. Agrega uno arriba.", "Sin gastos registrados.")}</div>}
        </div>
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Proyección de gastos", "Proyección · próximos 6 meses")}</div>
            <span className="mono" style={{ fontSize: fz.xs, color: C.glacier, fontWeight: 700 }}>~${fmt(avgProjected)}/{tr("mes", "mes")}</span>
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Recurrentes + costos fijos, ajustado por temporada de riego", "Recurrentes + fijos × estacionalidad")}</div>
          <Bars data={projection} color={C.emerald} />
        </div>
      </div>

      {/* entries list */}
      {entries.length > 0 && (
        <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
          <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("Gastos registrados", "Registros")}</div>
          {entries.map((e) => {
            const c = catOf(e.category);
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "8px 0", borderBottom: `1px solid ${th.line}` }}>
                <span style={{ width: 28, height: 28, borderRadius: radius.sm, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={c.icon} size={14} color={th.soft} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: fz.sm, color: th.ink, display: "flex", alignItems: "center", gap: 7 }}>
                    {c.label}
                    {e.recurring && <span style={{ fontSize: 9, color: C.emerald, border: `1px solid ${C.emerald}55`, borderRadius: radius.sm, padding: "0 5px" }}>{tr("recurrente", "rec.")}</span>}
                  </div>
                  <div className="mono" style={{ fontSize: fz.micro, color: th.mute }}>
                    {e.date}
                    {e.parcelId ? ` · ${parcels.find((p) => p.id === e.parcelId)?.name ?? tr("parcela", "parcela")}` : ""}
                    {e.quantity ? ` · ${fmt(e.quantity)} ${UNIT_FOR[e.category] ?? ""}` : ""}
                    {e.workers ? ` · ${e.workers} ${tr("jornaleros", "jorn.")} · ${e.period}` : ""}
                    {e.fileName ? ` · ${e.fileName}` : ""}
                  </div>
                </div>
                <span className="mono" style={{ fontSize: fz.sm, fontWeight: 600 }}>${fmt(e.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
        {tr(
          "Cifras de ejemplo. Lo que registras se guarda en tu navegador (demo). Con base de datos conectada, tu historial y proyección serían permanentes y por usuario.",
          "Datos simulados · registros en localStorage (demo). Con Supabase: historial y proyección permanentes por usuario."
        )}
      </p>
    </div>
  );
}
