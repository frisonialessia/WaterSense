// GET /api/tariff — hourly electricity price ($/kWh), 24 values.
// Best-effort LIVE from CENACE (PML del Mercado del Día en Adelanto); if CENACE
// is unreachable (it often blocks cloud hosts), falls back to the simulated
// curve so the app never breaks. Set CENACE_NODE to your local node clave.
import { NextResponse } from "next/server";
import { repository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const fallback = await repository.getTariffCurve();
  const node = process.env.CENACE_NODE || "01CHI-115"; // TODO: nodo CENACE de tu zona

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const url = `https://ws01.cenace.gob.mx:8082/SWPML/SIM/SIN/MDA/${node}/${y}/${m}/${day}/${y}/${m}/${day}/JSON`;

    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CENACE ${res.status}`);
    const data = await res.json();

    // CENACE: { Resultados: [ { Valores: [ { hora, pml($/MWh) }, ... ] } ] }
    const valores: { hora?: string; pml?: string }[] = data?.Resultados?.[0]?.Valores ?? [];
    if (valores.length < 12) throw new Error("CENACE sin datos");

    const curve = [...fallback];
    for (const v of valores) {
      const h = parseInt(v.hora ?? "", 10) - 1;
      const pmlMwh = parseFloat(v.pml ?? "");
      if (h >= 0 && h < 24 && Number.isFinite(pmlMwh)) {
        curve[h] = Math.max(0.4, Math.round((pmlMwh / 1000) * 100) / 100); // $/kWh
      }
    }
    return NextResponse.json({ curve, source: "cenace", node });
  } catch {
    return NextResponse.json({ curve: fallback, source: "sim" });
  } finally {
    clearTimeout(timer);
  }
}
