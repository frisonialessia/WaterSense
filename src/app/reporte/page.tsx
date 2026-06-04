// One-page partner report — reads the repository + runs the brain, styled
// for print ("Guardar como PDF"). For owners/investors to see results.
import Link from "next/link";
import { repository } from "@/lib/data/repository";
import { projectAquifer } from "@/lib/brain/aquiferModel";
import { projectYield } from "@/lib/brain/yieldModel";
import { C, T, FONT, fmt, space, fz, radius } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";

const th = T.light;

export default async function ReportePage() {
  const [costs, parcels, wells, crops, savings] = await Promise.all([
    repository.getCosts(),
    repository.getParcels(),
    repository.getWells(),
    repository.getCrops(),
    repository.getSavings(),
  ]);
  const cropMap = Object.fromEntries(crops.map((c) => [c.crop, c]));

  const totalCost = costs.reduce((s, c) => s + c.month, 0);
  const healthy = parcels.filter((p) => p.stress < 0.5).length;
  const wellsAlert = wells.filter((w) => !w.ok).length;

  const rows = parcels.map((p) => {
    const c = cropMap[p.crop];
    const y = c ? projectYield({ yieldKgHa: c.yieldKgHa, hectares: p.hectares, stress: p.stress, pricePerKg: c.pricePerKg }) : null;
    return { p, costYr: c ? Math.round(c.costHa * p.hectares) : 0, revenue: y?.revenue ?? 0, pct: y?.pct ?? 0 };
  });
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalIrrigCost = rows.reduce((s, r) => s + r.costYr, 0);

  const aq = projectAquifer({ startLevelM: 78, criticalLevelM: 140, rechargeMPerYear: 2.2, baseExtractionM: 3.4, extractionFactor: 1, neighbors: 3, neighborDrawM: 0.9, rainReuse: 0, drainReuse: 0, horizonYears: 30, baseYear: new Date().getFullYear() });

  const month = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const Cap = month.charAt(0).toUpperCase() + month.slice(1);

  const card: React.CSSProperties = { border: `1px solid ${th.line}`, borderRadius: radius.md, padding: `${space.md}px ${space.lg}px` };
  const kpiLabel: React.CSSProperties = { fontSize: fz.micro, textTransform: "uppercase", letterSpacing: ".08em", color: th.mute, fontWeight: 600 };
  const kpiVal: React.CSSProperties = { fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, marginTop: 4 };
  const th2: React.CSSProperties = { textAlign: "left", fontSize: fz.micro, textTransform: "uppercase", letterSpacing: ".06em", color: th.mute, fontWeight: 600, padding: "8px 6px", borderBottom: `1px solid ${th.line}` };
  const td: React.CSSProperties = { fontSize: fz.xs, color: th.ink, padding: "8px 6px", borderBottom: `1px solid ${th.line}` };

  return (
    <div style={{ background: "#fff", color: th.ink, minHeight: "100vh", fontFamily: FONT.body }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: space.x3 }}>
        {/* toolbar (hidden on print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
          <Link href="/dashboard" style={{ color: C.glacier, fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>← Volver al panel</Link>
          <PrintButton label="Imprimir / Guardar PDF" />
        </div>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: space.md, borderBottom: `2px solid ${th.ink}`, paddingBottom: space.md, marginBottom: space.lg }}>
          <Logo size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, letterSpacing: "-0.01em" }}>Reporte de Eficiencia de Riego</div>
            <div style={{ fontSize: fz.sm, color: th.soft }}>Rancho El Álamo · Delicias, Chihuahua · {Cap}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: fz.micro, color: th.mute }}>WaterSense<br />Generado {new Date().toLocaleDateString("es-MX")}</div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: space.sm, marginBottom: space.lg }}>
          <div style={card}><div style={kpiLabel}>Ahorro del mes</div><div className="mono" style={{ ...kpiVal, color: C.emerald }}>${fmt(savings.amountThisMonth)}</div></div>
          <div style={card}><div style={kpiLabel}>Gasto operativo</div><div className="mono" style={kpiVal}>${fmt(totalCost)}</div></div>
          <div style={card}><div style={kpiLabel}>Parcelas sanas</div><div className="mono" style={kpiVal}>{healthy}/{parcels.length}</div></div>
          <div style={card}><div style={kpiLabel}>Pozos en alerta</div><div className="mono" style={{ ...kpiVal, color: wellsAlert ? C.critical : th.ink }}>{wellsAlert}</div></div>
        </div>

        {/* parcels table */}
        <div style={{ fontSize: fz.sm, fontWeight: 600, marginBottom: space.sm }}>Producción proyectada por parcela</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: space.lg }}>
          <thead>
            <tr>
              <th style={th2}>Parcela</th>
              <th style={th2}>Cultivo</th>
              <th style={{ ...th2, textAlign: "right" }}>Ha</th>
              <th style={{ ...th2, textAlign: "right" }}>Sed</th>
              <th style={{ ...th2, textAlign: "right" }}>Costo riego/año</th>
              <th style={{ ...th2, textAlign: "right" }}>Ingreso proyectado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p.id}>
                <td style={td}>{r.p.name}</td>
                <td style={td}>{r.p.crop}</td>
                <td className="mono" style={{ ...td, textAlign: "right" }}>{r.p.hectares}</td>
                <td className="mono" style={{ ...td, textAlign: "right", color: r.p.stress > 0.6 ? C.alert : r.p.stress < 0.35 ? C.emerald : th.ink }}>{Math.round(r.p.stress * 100)}%</td>
                <td className="mono" style={{ ...td, textAlign: "right" }}>${fmt(r.costYr)}</td>
                <td className="mono" style={{ ...td, textAlign: "right", fontWeight: 600 }}>${fmt(r.revenue)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, fontWeight: 700, borderBottom: "none" }} colSpan={4}>Total</td>
              <td className="mono" style={{ ...td, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>${fmt(totalIrrigCost)}</td>
              <td className="mono" style={{ ...td, textAlign: "right", fontWeight: 700, color: C.emerald, borderBottom: "none" }}>${fmt(totalRevenue)}</td>
            </tr>
          </tbody>
        </table>

        {/* aquifer summary */}
        <div style={{ ...card, marginBottom: space.lg }}>
          <div style={{ fontSize: fz.sm, fontWeight: 600, marginBottom: 4 }}>Futuro del acuífero (pozo principal)</div>
          <div style={{ fontSize: fz.sm, color: th.soft }}>
            {aq.survives
              ? "Con el plan actual, el pozo se proyecta viable más de 30 años."
              : `Con el plan actual, el pozo se proyectaría inviable hacia ${aq.limitYear} (caída ${aq.annualDropM.toFixed(2)} m/año). Reúso de agua y menor extracción extienden ese horizonte.`}
          </div>
        </div>

        <div style={{ fontSize: fz.micro, color: th.mute, lineHeight: 1.5, borderTop: `1px solid ${th.line}`, paddingTop: space.md }}>
          Reporte de demostración generado por WaterSense. Todos los datos son simulados con rangos realistas de Chihuahua; no constituyen una medición certificada. Con datos reales conectados (CFE/CENACE, CONAGUA, sensores), este reporte reflejaría tu operación medida.
        </div>
      </div>
    </div>
  );
}
