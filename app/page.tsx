// Server Component: runs the brain on the server and renders the result.
// Proof that the typed brain works end-to-end before any UI migration.
import { repository } from "@/lib/data/SimulatedRepository";
import { projectAquifer } from "@/lib/brain/aquiferModel";
import { assessPump } from "@/lib/brain/pumpHealth";

export default async function Home() {
  const [parcels, wells] = await Promise.all([
    repository.getParcels(),
    repository.getWells(),
  ]);

  const projection = projectAquifer({
    startLevelM: 78,
    criticalLevelM: 140,
    rechargeMPerYear: 2.2,
    baseExtractionM: 3.4,
    extractionFactor: 1,
    neighbors: 3,
    neighborDrawM: 0.9,
    rainReuse: 0,
    drainReuse: 0,
    horizonYears: 30,
    baseYear: new Date().getFullYear(),
  });

  const pumps = wells.map((w) => assessPump(w, w.ok ? 0 : 18));

  return (
    <main style={{ padding: 32, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 700 }}>WaterSense — cerebro activo</h1>
      <p style={{ color: "#555" }}>
        Esqueleto Next.js + TypeScript. El motor corre en el servidor con datos
        simulados (tipados para datos reales).
      </p>

      <h2>Proyección del acuífero</h2>
      <p>
        {projection.survives
          ? "El pozo es viable más de 30 años con el plan actual."
          : `Año límite estimado: ${projection.limitYear} (caída ${projection.annualDropM.toFixed(2)} m/año).`}
      </p>

      <h2>Salud de pozos</h2>
      <ul>
        {pumps.map((p) => (
          <li key={p.wellId}>
            {p.wellId}: salud {p.health}% — {p.note}
            {p.monthsToFailure ? ` (falla estimada en ~${p.monthsToFailure} meses)` : ""}
          </li>
        ))}
      </ul>

      <h2>Parcelas</h2>
      <ul>
        {parcels.map((p) => (
          <li key={p.id}>
            {p.name} — {p.crop} — sed {(p.stress * 100).toFixed(0)}%
          </li>
        ))}
      </ul>

      <p style={{ color: "#888", fontSize: 13, marginTop: 24 }}>
        Endpoints: <code>/api/decision</code>, <code>/api/aquifer</code>,{" "}
        <code>/api/agent</code>. La UI del dashboard se migra encima de este cerebro.
      </p>
    </main>
  );
}
