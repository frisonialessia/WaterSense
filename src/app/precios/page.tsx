// Página pública de precios. Server Component: lee el catálogo de planes de
// src/lib/billing/tiers.ts (única fuente de verdad), así los precios y límites
// nunca se desincronizan del gating del backend.
//
// Hoy los botones llevan a la demo: el registro/checkout (Stripe) llega en la
// Fase 1. Cuando se active, solo cambia el destino del botón.
import Link from "next/link";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { TIERS, annualMonthsFree, formatMxn, type Tier } from "@/lib/billing/tiers";

export const metadata = {
  title: "Precios — WaterSense",
  description: "Planes de WaterSense: Productor, Profesional y Distrito. Prueba gratis, sin tarjeta.",
};

const th = T.light;
const ORDER: Tier[] = [TIERS.productor, TIERS.profesional, TIERS.distrito];

function PriceLine({ tier }: { tier: Tier }) {
  if (tier.priceMxnMonthly <= 0) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl }}>A cotizar</span>
      </div>
    );
  }
  const free = annualMonthsFree(tier);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.hero }}>
          {formatMxn(tier.priceMxnMonthly)}
        </span>
        <span style={{ fontSize: fz.sm, color: th.soft }}>MXN / mes</span>
      </div>
      {free > 0 && (
        <div style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, marginTop: 2 }}>
          o {formatMxn(tier.priceMxnAnnual)}/año — {free} meses gratis
        </div>
      )}
    </div>
  );
}

function PlanCard({ tier }: { tier: Tier }) {
  const popular = tier.popular;
  const isEnterprise = tier.priceMxnMonthly <= 0;
  const href = isEnterprise ? "mailto:ventas@watersense.mx?subject=Plan%20Distrito" : "/dashboard";

  return (
    <div
      style={{
        position: "relative",
        background: th.panel,
        border: `1px solid ${popular ? C.glacier : th.line}`,
        boxShadow: popular ? shadow.lg : shadow.sm,
        borderRadius: radius.lg,
        padding: space.x2,
        display: "flex",
        flexDirection: "column",
        gap: space.md,
        // El plan popular sobresale ligeramente en pantallas anchas.
        transform: popular ? "translateY(-6px)" : undefined,
      }}
    >
      {popular && (
        <span
          className="mono"
          style={{
            position: "absolute",
            top: -11,
            left: space.x2,
            background: C.glacier,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".08em",
            padding: "3px 10px",
            borderRadius: radius.pill,
          }}
        >
          EL MÁS POPULAR
        </span>
      )}

      <div>
        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.lg }}>{tier.name}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>{tier.audience}</div>
      </div>

      <div style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.5, minHeight: 40 }}>{tier.tagline}</div>

      <PriceLine tier={tier} />

      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: popular ? C.glacier : th.panel2,
          color: popular ? "#fff" : C.glacier,
          border: popular ? "none" : `1px solid ${th.line}`,
          fontSize: fz.sm,
          fontWeight: 700,
          padding: "11px 16px",
          borderRadius: radius.md,
          textDecoration: "none",
        }}
      >
        {tier.cta}
        <Icon name="arrow" size={15} color={popular ? "#fff" : C.glacier} />
      </Link>

      {tier.trialDays > 0 && (
        <div style={{ fontSize: fz.micro, color: th.mute, textAlign: "center" }}>
          {tier.trialDays} días de prueba · sin tarjeta
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: `${space.sm}px 0 0`, display: "flex", flexDirection: "column", gap: space.sm }}>
        {tier.features.map((f) => (
          <li key={f} style={{ display: "flex", gap: space.sm, alignItems: "flex-start", fontSize: fz.sm, color: th.ink, lineHeight: 1.45 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>
              <Icon name="check" size={16} color={C.emerald} />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PreciosPage() {
  return (
    <div style={{ background: th.bg, color: th.ink, minHeight: "100vh", fontFamily: FONT.body }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${space.md}px ${space.x3}px`,
          borderBottom: `1px solid ${th.line}`,
          background: `${th.panel}ee`,
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: space.sm, textDecoration: "none", color: th.ink }}>
          <Logo size={26} />
          <b style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md, letterSpacing: "-0.02em" }}>WaterSense</b>
        </Link>
        <Link
          href="/dashboard"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "8px 16px", borderRadius: radius.md, textDecoration: "none" }}
        >
          Entrar a la demo <Icon name="arrow" size={15} color="#fff" />
        </Link>
      </nav>

      {/* Header */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x4}px ${space.x3}px ${space.x2}px`, textAlign: "center" }}>
        <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>
          PLANES
        </span>
        <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.md}px 0` }}>
          Un plan para cada tamaño de operación
        </h1>
        <p style={{ fontSize: fz.lg, color: th.soft, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
          El precio se paga solo: una sola noche de riego en la hora barata del CENACE suele cubrir el mes. Empieza con la demo, sin registro.
        </p>
      </section>

      {/* Cards */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.lg}px ${space.x3}px ${space.x4}px` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 280px),1fr))", gap: space.lg, alignItems: "start" }}>
          {ORDER.map((tier) => (
            <PlanCard key={tier.id} tier={tier} />
          ))}
        </div>
        <p style={{ fontSize: fz.xs, color: th.mute, textAlign: "center", marginTop: space.x2, maxWidth: 680, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Precios en pesos mexicanos (MXN), sin IVA. El registro y el cobro se activan en la siguiente fase;
          hoy todos los botones entran a la demo con datos simulados. Los precios y límites son orientativos
          y se ajustan en un solo archivo (<span className="mono">tiers.ts</span>).
        </p>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x2}px ${space.x3}px`, borderTop: `1px solid ${th.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.sm, color: th.soft, fontSize: fz.xs }}>
          <Logo size={18} /> WaterSense · Chihuahua, México
        </div>
        <Link href="/" style={{ color: C.glacier, fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>
          ← Volver al inicio
        </Link>
      </footer>
    </div>
  );
}
