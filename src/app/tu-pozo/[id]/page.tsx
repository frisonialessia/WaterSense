// Página por acuífero: es donde aterriza quien recibe el link reenviado por
// WhatsApp. Muestra el dato real (CONAGUA) del acuífero compartido y empuja a
// "calcula el de tu rancho". La imagen de la tarjeta la genera opengraph-image.tsx.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { CHIHUAHUA_AQUIFERS, isOverexploited, overdraftPct, deficitHm3 } from "@/lib/data/aquifers";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

const th = T.light;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://watersense-theta.vercel.app";
const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

export function generateStaticParams() {
  return CHIHUAHUA_AQUIFERS.map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === params.id);
  if (!aq) return { title: "Acuífero no encontrado" };
  const over = isOverexploited(aq);
  const title = over
    ? `${aq.name}: saca ${overdraftPct(aq)}% más agua de la que se recarga`
    : `${aq.name}: todavía con disponibilidad de agua`;
  const description = over
    ? `Acuífero ${aq.name} (Chihuahua) en déficit de ${fmt(deficitHm3(aq))} millones de m³/año, según CONAGUA. Calcula el de tu rancho en WaterSense.`
    : `Acuífero ${aq.name} (Chihuahua) todavía con disponibilidad oficial (CONAGUA). Calcula el de tu rancho en WaterSense.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

export default function TuPozoPage({ params }: { params: { id: string } }) {
  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === params.id);
  if (!aq) notFound();

  const over = isOverexploited(aq);
  const deficit = deficitHm3(aq);
  const pct = overdraftPct(aq);
  const color = !over ? C.emerald : pct >= 80 ? C.critical : C.alert;

  const shareText = over
    ? `Mi acuífero (${aq.name}) en Chihuahua saca ${pct}% más agua de la que se recarga — un déficit de ${fmt(deficit)} millones de m³ al año (CONAGUA). Revisa el de tu rancho 👉 ${SITE_URL}/tu-pozo/${aq.id}`
    : `Mi acuífero (${aq.name}) en Chihuahua todavía tiene disponibilidad oficial (CONAGUA). Revisa el de tu rancho 👉 ${SITE_URL}/tu-pozo/${aq.id}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div style={{ minHeight: "100vh", background: th.bg, color: th.ink, fontFamily: FONT.body, display: "flex", flexDirection: "column" }}>
      {/* nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${space.md}px ${space.x3}px`, borderBottom: `1px solid ${th.line}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: space.sm, textDecoration: "none", color: th.ink }}>
          <Logo size={26} />
          <b style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md, letterSpacing: "-0.02em" }}>WaterSense</b>
        </Link>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "8px 16px", borderRadius: radius.md, textDecoration: "none" }}>
          Entrar a la demo <Icon name="arrow" size={15} color="#fff" />
        </Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: `${space.x3}px ${space.x3}px` }}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: space.lg }}>
          <div style={{ textAlign: "center" }}>
            <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>DATOS OFICIALES CONAGUA</span>
            <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(26px,4.6vw,38px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.sm}px 0 0` }}>
              El acuífero de <span style={{ color: C.glacier }}>{aq.municipios.split(",")[0]}</span>
            </h1>
          </div>

          <div className="card" style={{ background: th.panel, border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: radius.lg, padding: space.x2, boxShadow: shadow.md }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: fz.xs, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}33`, borderRadius: radius.pill, padding: "4px 11px", marginBottom: space.md }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
              {aq.name} · {aq.status}
            </div>

            {over ? (
              <>
                <div style={{ fontSize: fz.sm, color: th.soft, marginBottom: 2 }}>Cada año se extrae</div>
                <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(44px,10vw,68px)", lineHeight: 1, color }}>
                  {pct}%<span style={{ fontSize: "0.4em", fontWeight: 600 }}> más</span>
                </div>
                <div style={{ fontSize: fz.sm, color: th.soft, marginTop: 2 }}>agua de la que el acuífero alcanza a recargar.</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: fz.sm, color: th.soft, marginBottom: 2 }}>Tu acuífero todavía tiene</div>
                <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(34px,7vw,48px)", lineHeight: 1.05, color: C.emerald }}>disponibilidad</div>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space.sm, marginTop: space.lg, padding: `${space.md}px 0`, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
              {[
                { l: "Se recarga", v: fmt(aq.recargaHm3), c: th.ink },
                { l: "Se extrae", v: fmt(aq.extraccionHm3), c: th.ink },
                over ? { l: "Déficit", v: `−${fmt(deficit)}`, c: color } : { l: "Disponible", v: `+${fmt(aq.dmaHm3)}`, c: C.emerald },
              ].map((m) => (
                <div key={m.l}>
                  <div style={{ fontSize: fz.micro, color: th.mute, marginBottom: 2 }}>{m.l}</div>
                  <div className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: fz.micro, color: th.mute }}>hm³/año</div>
                </div>
              ))}
            </div>

            {over && (
              <div style={{ fontSize: fz.sm, color: th.soft, marginTop: space.md, lineHeight: 1.5 }}>
                Son <b style={{ color: th.ink }}>{fmt(deficit)} millones de m³</b> que no vuelven cada año. Pero puedes <b style={{ color: C.emerald }}>ganar tiempo</b> — riego eficiente, reúso y medir lo que extraes.
              </div>
            )}

            <div style={{ display: "flex", gap: space.sm, marginTop: space.lg, flexWrap: "wrap" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, textDecoration: "none" }}>
                Calcula el de tu rancho <Icon name="arrow" size={15} color="#fff" />
              </Link>
              <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, textDecoration: "none" }}>
                <Icon name="drop" size={15} color="#fff" /> Compartir por WhatsApp
              </a>
            </div>

            <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
              Fuente: CONAGUA · Disponibilidad media anual de agua subterránea, acuífero {aq.name} (DOF {aq.dataYear}).{" "}
              <a href={aq.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.glacier, fontWeight: 600 }}>Ver acuerdo →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
