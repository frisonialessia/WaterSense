// Imagen OG dinámica por acuífero (1200×630). Es lo que WhatsApp/redes muestran
// como tarjeta cuando alguien reenvía el link /tu-pozo/[id]. Convierte un link
// en una imagen compartible con el dato real de CONAGUA — el motor viral.
import { ImageResponse } from "next/og";
import { CHIHUAHUA_AQUIFERS, isOverexploited, overdraftPct, deficitHm3 } from "@/lib/data/aquifers";
import { C } from "@/lib/theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Estado del acuífero según CONAGUA — WaterSense";

const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

export default function Image({ params }: { params: { id: string } }) {
  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === params.id) ?? CHIHUAHUA_AQUIFERS[0];
  const over = isOverexploited(aq);
  const pct = overdraftPct(aq);
  const deficit = deficitHm3(aq);
  const accent = !over ? C.emerald : pct >= 80 ? C.critical : C.alert;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundImage: `linear-gradient(125deg, ${C.brandNavy} 0%, #103a78 45%, ${C.glacier} 100%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {/* marca */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 28, height: 28, borderRadius: 8, background: C.glacierSoft, marginRight: 16 }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>WaterSense</div>
        </div>

        {/* cuerpo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              fontSize: 26,
              fontWeight: 600,
              color: "#fff",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 999,
              padding: "8px 22px",
              marginBottom: 26,
            }}
          >
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 99, background: accent, marginRight: 12 }} />
            {aq.name} · {aq.status}
          </div>

          {over ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1, color: accent }}>{pct}%</div>
                <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#fff", marginLeft: 18, marginBottom: 16 }}>más</div>
              </div>
              <div style={{ display: "flex", fontSize: 38, color: "rgba(255,255,255,0.92)", marginTop: 10 }}>
                agua de la que el acuífero alcanza a recargar
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 96, fontWeight: 800, lineHeight: 1, color: C.emeraldSoft }}>Con disponibilidad</div>
              <div style={{ display: "flex", fontSize: 38, color: "rgba(255,255,255,0.92)", marginTop: 16 }}>
                se extrae menos de lo que se recarga
              </div>
            </div>
          )}
        </div>

        {/* cifras + fuente */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex" }}>
            {[
              { l: "Se recarga", v: `${fmt(aq.recargaHm3)}` },
              { l: "Se extrae", v: `${fmt(aq.extraccionHm3)}` },
              over ? { l: "Déficit", v: `−${fmt(deficit)}` } : { l: "Disponible", v: `+${fmt(aq.dmaHm3)}` },
            ].map((m) => (
              <div key={m.l} style={{ display: "flex", flexDirection: "column", marginRight: 56 }}>
                <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.7)" }}>{m.l}</div>
                <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#fff" }}>{m.v}</div>
                <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.6)" }}>hm³/año</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: 360 }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "#fff", textAlign: "right" }}>Calcula el de tu rancho</div>
            <div style={{ display: "flex", fontSize: 21, color: "rgba(255,255,255,0.75)" }}>Fuente: CONAGUA · DOF {aq.dataYear}</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
