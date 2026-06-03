import Link from "next/link";
import { C, T, FONT, fmt, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

// Marketing landing — light mode, brand palette, one gradient hero moment.
// Leads with the emotional anchor from CLAUDE.md: "¿tu finca sobrevive
// la próxima década?". Honest that everything is simulated.

const th = T.light;

const PILLARS = [
  {
    icon: "chart",
    title: "Futuro del agua",
    body: "Proyecta cuándo se agotaría tu pozo y cuántos años ganas si cambias de plan. El ancla de toda decisión.",
  },
  {
    icon: "shield",
    title: "Proteger el pozo",
    body: "Mantenimiento predictivo: te avisamos de una falla de bomba antes de que ocurra, no en plena temporada.",
  },
  {
    icon: "scale",
    title: "Derechos de agua",
    body: "Quién comparte tu acuífero, concesiones y amparos. Saber con quién repartes el agua bajo tierra.",
  },
  {
    icon: "coin",
    title: "Ahorro real",
    body: "Riega barato y sin desperdicio: tarifa nocturna del CENACE y reparto de bombeo, sin que muevas un dedo.",
  },
];

function MockTile({ label, value, sub, danger }: { label: string; value: string; sub: string; danger?: boolean }) {
  return (
    <div style={{ padding: `${space.md}px ${space.lg}px`, borderLeft: `1px solid ${th.line}` }}>
      <div style={{ fontSize: fz.micro, textTransform: "uppercase", letterSpacing: ".08em", color: th.mute, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: danger ? C.critical : th.ink }}>{value}</span>
        {danger && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.critical }} />}
      </div>
      <div className="mono" style={{ fontSize: 10, color: th.mute, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function Landing() {
  return (
    <div style={{ background: th.bg, color: th.ink, minHeight: "100vh", fontFamily: FONT.body }}>
      {/* Top nav */}
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
        <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
          <Logo size={26} />
          <b style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md, letterSpacing: "-0.02em" }}>WaterSense</b>
          <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: C.glacier, border: `1px solid ${C.glacier}44`, borderRadius: radius.sm, padding: "2px 5px", marginLeft: 4 }}>
            DEMO
          </span>
        </div>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: C.glacier,
            color: "#fff",
            fontSize: fz.sm,
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: radius.md,
            textDecoration: "none",
          }}
        >
          Entrar a la demo <Icon name="arrow" size={15} color="#fff" />
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x4}px ${space.x3}px`, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: space.x4, alignItems: "center" }}>
        <div>
          <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".04em" }}>
            CHIHUAHUA · AGRICULTURA DE ALTO RENDIMIENTO
          </span>
          <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: 46, lineHeight: 1.08, letterSpacing: "-0.02em", margin: `${space.md}px 0` }}>
            Riega menos, <span style={{ color: C.emerald }}>cosecha igual</span>, paga <span style={{ color: C.glacier }}>menos luz</span>.
          </h1>
          <p style={{ fontSize: fz.lg, color: th.soft, lineHeight: 1.6, maxWidth: 520 }}>
            WaterSense audita tu riego cruzando <b style={{ color: th.ink }}>coste de energía</b>, <b style={{ color: th.ink }}>desperdicio de agua</b> y <b style={{ color: th.ink }}>salud del cultivo</b>.
            Te dice qué regar, cuándo y a qué hora — en tu idioma, no en jerga.
          </p>
          <div style={{ display: "flex", gap: space.md, marginTop: space.xl, flexWrap: "wrap" }}>
            <Link
              href="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", boxShadow: shadow.md }}
            >
              Ver mi finca <Icon name="arrow" size={16} color="#fff" />
            </Link>
            <a
              href="#pilares"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: th.panel, color: th.ink, fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", border: `1px solid ${th.line}` }}
            >
              Cómo funciona
            </a>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: space.xl, fontSize: fz.xs, color: th.mute, background: th.panel2, border: `1px solid ${th.line}`, padding: "6px 12px", borderRadius: radius.pill }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald }} />
            Prototipo · todos los datos son simulados, con rangos reales de Chihuahua
          </div>
        </div>

        {/* Control-room mockup */}
        <div style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, boxShadow: shadow.lg, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: `${space.sm}px ${space.md}px`, borderBottom: `1px solid ${th.line}` }}>
            <Logo size={16} />
            <span style={{ fontSize: fz.xs, fontWeight: 600 }}>Rancho El Álamo</span>
            <span className="mono" style={{ fontSize: 10, color: th.mute, marginLeft: "auto" }}>28.190° N · 105.470° O</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)" }}>
            <MockTile label="Gasto del mes" value={`$${fmt(39950)}`} sub="5 rubros" />
            <MockTile label="Parcelas sanas" value="2/5" sub="sed < 50%" />
            <MockTile label="Salud de bombas" value="64%" sub="promedio" />
            <MockTile label="Pozos en alerta" value="1" sub="sobre el límite" danger />
          </div>
          {/* mini aquifer line */}
          <div style={{ padding: space.lg, borderTop: `1px solid ${th.line}` }}>
            <div style={{ fontSize: fz.micro, textTransform: "uppercase", letterSpacing: ".08em", color: th.mute, fontWeight: 600, marginBottom: space.sm }}>
              Futuro del pozo principal
            </div>
            <svg viewBox="0 0 320 90" style={{ width: "100%" }}>
              <line x1="0" y1="74" x2="320" y2="74" stroke={C.critical} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <polyline points="0,18 60,28 120,40 180,52 240,62 320,70" fill="none" stroke={C.emerald} strokeWidth="2.5" />
              <polyline points="0,18 60,34 120,52 180,68 240,80 280,86" fill="none" stroke={th.mute} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            </svg>
            <div className="mono" style={{ fontSize: 10, color: th.soft, marginTop: 6 }}>
              tu plan <span style={{ color: C.emerald }}>━</span> · no hacer nada <span style={{ color: th.mute }}>╌</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pilares" style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px ${space.x4}px` }}>
        <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, letterSpacing: "-0.01em", marginBottom: space.xl }}>
          Cuatro cosas que tu finca necesita saber
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: space.md }}>
          {PILLARS.map((p, i) => (
            <div key={p.title} style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, padding: space.xl }}>
              <div style={{ display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <span style={{ width: 34, height: 34, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={p.icon} size={18} color={C.glacier} />
                </span>
                <span className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.md, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stat band */}
      <section style={{ background: `linear-gradient(110deg,${C.brandNavy},${C.glacier} 60%,${C.emerald})`, color: "#fff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x3}px ${space.x3}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: space.xl }}>
          {[
            { v: "3", l: "motores de decisión", s: "riego, acuífero y salud de pozos" },
            { v: "100%", l: "simulado, hoy", s: "estructurado para datos reales" },
            { v: "CFE · CONAGUA · CENACE", l: "fuentes previstas", s: "energía, derechos y precio spot" },
          ].map((s) => (
            <div key={s.l}>
              <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl }}>{s.v}</div>
              <div style={{ fontSize: fz.sm, fontWeight: 600, marginTop: 4 }}>{s.l}</div>
              <div style={{ fontSize: fz.xs, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.sm, color: th.soft, fontSize: fz.xs }}>
          <Logo size={18} /> WaterSense · Chihuahua, México
        </div>
        <Link href="/dashboard" style={{ color: C.glacier, fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>
          Entrar a la demo →
        </Link>
      </footer>
    </div>
  );
}
