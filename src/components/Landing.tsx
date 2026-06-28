import Link from "next/link";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { HeroSimulator } from "./HeroSimulator";
import { AquiferHero } from "./AquiferHero";
import { LuzStrip } from "./LuzStrip";
import { TIERS, formatMxn } from "@/lib/billing/tiers";

// Marketing landing — light mode, brand palette, one gradient hero moment.
// Leads with the emotional anchor from CLAUDE.md: "¿tu finca sobrevive
// la próxima década?". Honest that everything is simulated.

const th = T.light;

const STEPS = [
  { icon: "map", n: "1", t: "Conecta tu rancho", b: "Dibuja tus parcelas y pozos en el mapa, o arranca con el rancho de ejemplo. Sin hardware para empezar." },
  { icon: "chart", n: "2", t: "Mira tu futuro", b: "Cruzamos el costo de tu luz, el desperdicio de agua y la salud del cultivo: qué regar, cuándo y cuántos años le quedan a tu pozo." },
  { icon: "coin", n: "3", t: "Decide con dinero", b: "Riega en la hora barata, recibe alertas antes de una falla y gana años de pozo — con cada decisión puesta en pesos." },
];

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: fz.micro, color: th.mute, letterSpacing: ".08em", marginBottom: space.md, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="lnav" style={{ fontSize: fz.sm, color: th.soft, textDecoration: "none" }}>{label}</Link>
        ))}
      </div>
    </div>
  );
}

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
        <div style={{ display: "flex", alignItems: "center", gap: space.lg }}>
          <div className="lnav-group" style={{ display: "flex", alignItems: "center", gap: space.lg }}>
            {[
              { href: "#pilares", label: "Qué hace" },
              { href: "#porque", label: "Por qué WaterSense" },
              { href: "#fuentes", label: "Datos" },
              { href: "/precios", label: "Precios" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="lnav" style={{ fontSize: fz.sm, color: th.soft, textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}>
                {l.label}
              </a>
            ))}
          </div>
          <Link
            href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "8px 16px", borderRadius: radius.md, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Entrar a la demo <Icon name="arrow" size={15} color="#fff" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="hero-overlay" style={{ position: "absolute", inset: 0 }} />
        <div className="hero-grid">
          <div>
            <span
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: fz.xs,
                color: "#fff",
                fontWeight: 600,
                letterSpacing: ".08em",
                background: "rgba(255,255,255,.12)",
                border: "1px solid rgba(255,255,255,.22)",
                padding: "6px 12px",
                borderRadius: radius.pill,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.9)" }} />
              AGRICULTURA DE ALTO RENDIMIENTO
            </span>
            <h1 style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: "clamp(33px, 6.6vw, 58px)", lineHeight: 1.04, letterSpacing: "-0.03em", margin: `${space.lg}px 0`, color: "#fff" }}>
              El agua de tu pozo se está acabando. ¿Sabes qué tan rápido?
            </h1>
            <p style={{ fontSize: fz.lg, color: "rgba(255,255,255,.9)", lineHeight: 1.6, maxWidth: 540 }}>
              Elige tu municipio y míralo con datos reales de CONAGUA — y a qué hora regar para <b style={{ color: "#fff" }}>pagar menos luz</b>.
            </p>
            <div style={{ display: "flex", gap: space.md, marginTop: space.xl, flexWrap: "wrap" }}>
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", boxShadow: shadow.md }}>
                Ver el panel en vivo <Icon name="arrow" size={16} color="#fff" />
              </Link>
              <a href="#balance" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", border: "1px solid rgba(255,255,255,.3)" }}>
                Cómo funciona
              </a>
            </div>
          </div>

          {/* Gancho: lectura instantánea del acuífero del visitante (datos CONAGUA) */}
          <AquiferHero />
        </div>
      </section>

      {/* La otra mitad de la promesa: el precio de la luz en vivo (CENACE) */}
      <LuzStrip />

      {/* Profundidad: el balance del acuífero — ¿cuánto tendría que cambiar? */}
      <section id="balance" style={{ background: th.panel2, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
          <div style={{ textAlign: "center", marginBottom: space.x2 }}>
            <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>EL FUTURO DEL AGUA · DATOS REALES</span>
            <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(26px,4.6vw,38px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.sm}px 0` }}>
              ¿Cuánto tendría que cambiar para que <span style={{ color: C.glacier }}>el agua alcance</span>?
            </h2>
            <p style={{ fontSize: fz.md, color: th.soft, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
              Mueve la extracción de la región y mira el balance del acuífero acercarse al equilibrio.
            </p>
          </div>
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <HeroSimulator />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pilares" style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px ${space.x4}px` }}>
        <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, letterSpacing: "-0.01em", marginBottom: space.xl }}>
          Cuatro cosas que tu rancho necesita saber
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 250px),1fr))", gap: space.md }}>
          {PILLARS.map((p, i) => (
            <div key={p.title} className="lcard" style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, padding: space.xl }}>
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

      {/* Cómo funciona — 3 pasos */}
      <section id="como" style={{ background: th.panel, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
          <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".05em" }}>EN 3 PASOS</span>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, letterSpacing: "-0.01em", margin: `${space.sm}px 0 ${space.xl}px` }}>
            De tus datos a una decisión con dinero
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 280px),1fr))", gap: space.lg }}>
            {STEPS.map((s) => (
              <div key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: space.md, marginBottom: space.md }}>
                  <span style={{ width: 46, height: 46, borderRadius: radius.lg, background: `${C.emerald}12`, border: `1px solid ${C.emerald}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={s.icon} size={20} color={C.emerald} />
                  </span>
                  <span className="mono" style={{ fontSize: fz.micro, color: th.mute, letterSpacing: ".08em" }}>PASO {s.n}</span>
                </div>
                <div style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.md, marginBottom: 6 }}>{s.t}</div>
                <div style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Anchor band — emotional hook + visual break between sections */}
      <section style={{ position: "relative", background: `linear-gradient(110deg, ${C.brandNavy}, ${C.glacier} 58%, ${C.emerald})`, color: "#fff", overflow: "hidden" }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", top: -1, left: 0, width: "100%", height: 56, display: "block" }}>
          <path d="M0,42 C240,82 480,2 720,30 C960,58 1200,88 1440,40 L1440,0 L0,0 Z" fill={th.bg} />
        </svg>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
        <div style={{ position: "relative", maxWidth: 980, margin: "0 auto", padding: `${space.x4 + space.lg}px ${space.x3}px ${space.x4}px`, textAlign: "center" }}>
          <span className="mono" style={{ fontSize: fz.sm, fontWeight: 700, letterSpacing: ".12em", color: C.emeraldSoft }}>LA PREGUNTA QUE IMPORTA</span>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(30px, 5vw, 48px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.md}px 0` }}>
            ¿Tu rancho <span style={{ color: C.glacierSoft }}>sobrevive</span> la próxima década?
          </h2>
          <p style={{ fontSize: fz.lg, color: "rgba(255,255,255,.9)", maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
            WaterSense le pone <b style={{ color: "#fff" }}>fecha</b> y <b style={{ color: "#fff" }}>precio</b> a esa pregunta — y te muestra cómo ganar años de pozo.
          </p>
          <div style={{ display: "flex", gap: space.sm, justifyContent: "center", flexWrap: "wrap", margin: `${space.xl}px 0` }}>
            {["Acuífero · sobreexplotado", "+12 años con el plan", "Riego en la hora más barata"].map((t) => (
              <span key={t} style={{ fontSize: fz.sm, fontWeight: 600, background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.25)", borderRadius: radius.pill, padding: "8px 16px" }}>{t}</span>
            ))}
          </div>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8, maxWidth: "100%", background: "#fff", color: C.brandNavy, fontSize: fz.md, fontWeight: 700, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", boxShadow: shadow.md, lineHeight: 1.3 }}>
            Ver el panel en vivo <Icon name="arrow" size={16} color={C.brandNavy} />
          </Link>
        </div>
      </section>

      {/* Why WaterSense — differentiators */}
      <section id="porque" style={{ background: th.panel, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, letterSpacing: "-0.01em", marginBottom: space.sm }}>
            Por qué WaterSense (y no otro tablero)
          </h2>
          <p style={{ fontSize: fz.sm, color: th.soft, marginBottom: space.xl, maxWidth: 640 }}>
            La mayoría de apps de riego solo muestran datos. En el norte de México, donde el agua se acaba, eso no basta:
            hay que decidir, con dinero de por medio.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 250px),1fr))", gap: space.md }}>
            {[
              { icon: "chart", t: "Defiende tu próxima década", b: "No optimizamos solo el riego de hoy: predecimos cuándo dejaría de dar tu pozo y cómo retrasarlo. El acuífero Meoqui-Delicias ya está sobreexplotado." },
              { icon: "coin", t: "Decisión con precio, no solo datos", b: "Le ponemos $ a cada decisión: pérdida por sed, ahorro por regar de madrugada, ingreso proyectado de la cosecha. El riego se vuelve inversión." },
              { icon: "bolt", t: "Energía + agua + cultivo, juntos", b: "El gran costo del bombeo es la luz. Cruzamos la tarifa eléctrica (CENACE) con la sed del cultivo para elegir la hora exacta de riego." },
              { icon: "home", t: "En tu idioma, sin hardware para empezar", b: "Español claro, modo simple o técnico, y arranque con bajo costo: conectas sensores y datos reales cuando estés listo, sin rehacer nada." },
            ].map((d) => (
              <div key={d.t} className="lcard" style={{ background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.lg, padding: space.xl }}>
                <span style={{ width: 34, height: 34, borderRadius: radius.md, background: th.panel, border: `1px solid ${th.line}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
                  <Icon name={d.icon} size={18} color={C.emerald} />
                </span>
                <div style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.md, marginBottom: 6 }}>{d.t}</div>
                <div style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>{d.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stat band — contained card, with air around it */}
      <section id="fuentes" style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px` }}>
        <div style={{ borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.lg, color: "#fff", backgroundImage: `linear-gradient(110deg,${C.brandNavy}f2,${C.glacier}cc 60%,${C.emerald}cc), url('/landing/riego.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ padding: `${space.x3}px ${space.x3}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 220px),1fr))", gap: space.xl }}>
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
        </div>
      </section>

      {/* Human — two columns: photo + text, plenty of air */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 300px),1fr))", gap: space.x3, alignItems: "center" }}>
          <div style={{ borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.lg, minHeight: 340, backgroundImage: `url('/landing/agricultor.jpg')`, backgroundSize: "cover", backgroundPosition: "center 22%" }} />
          <div>
            <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".05em" }}>PARA EL CAMPO, NO PARA EL LABORATORIO</span>
            <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(24px, 4.5vw, 30px)", lineHeight: 1.15, letterSpacing: "-0.01em", color: th.ink, margin: `${space.sm}px 0 ${space.md}px` }}>
              Hecho para quien trabaja la tierra, no para el ingeniero.
            </h2>
            <p style={{ fontSize: fz.lg, color: th.soft, lineHeight: 1.6, maxWidth: 520 }}>
              Español claro, lenguaje de rancho y decisiones con dinero de por medio. Te decimos qué hacer hoy con tu agua — sin jerga, sin complicarte.
            </p>
          </div>
        </div>
      </section>

      {/* Planes — teaser hacia /precios */}
      <section id="planes" style={{ background: th.panel2, borderTop: `1px solid ${th.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x4}px ${space.x3}px`, textAlign: "center" }}>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(24px,4.5vw,32px)", letterSpacing: "-0.01em", marginBottom: space.sm }}>
            Un plan para cada tamaño de operación
          </h2>
          <p style={{ fontSize: fz.md, color: th.soft, maxWidth: 560, margin: `0 auto ${space.x2}px`, lineHeight: 1.6 }}>
            Empieza con la demo, sin registro. Cuando estés listo, 14 días de prueba — sin tarjeta.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: space.md, maxWidth: 920, margin: "0 auto", textAlign: "left" }}>
            {Object.values(TIERS).map((t) => (
              <div key={t.id} className="lcard" style={{ background: th.panel, border: `1px solid ${t.popular ? C.glacier : th.line}`, borderRadius: radius.lg, padding: space.xl, boxShadow: t.popular ? shadow.md : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
                  <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md }}>{t.name}</div>
                  {t.popular && <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: C.glacier, borderRadius: radius.pill, padding: "2px 8px", flexShrink: 0 }}>POPULAR</span>}
                </div>
                <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2, marginBottom: space.md }}>{t.audience}</div>
                <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl }}>
                  {t.priceMxnMonthly > 0 ? formatMxn(t.priceMxnMonthly) : "A cotizar"}
                  {t.priceMxnMonthly > 0 && <span style={{ fontSize: fz.xs, color: th.soft, fontWeight: 400 }}> /mes</span>}
                </div>
              </div>
            ))}
          </div>
          <Link href="/precios" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: space.x2, background: C.glacier, color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none" }}>
            Ver todos los planes <Icon name="arrow" size={16} color="#fff" />
          </Link>
        </div>
      </section>

      {/* Closing CTA — full-bleed agave, generous space */}
      <section style={{ position: "relative", backgroundImage: `linear-gradient(${C.brandNavy}e6, ${C.brandNavy}cc), url('/landing/agave.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: `${space.x4 + space.x2}px ${space.x3}px`, textAlign: "center" }}>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(26px, 5vw, 38px)", letterSpacing: "-0.01em", marginBottom: space.md, color: "#fff", lineHeight: 1.1 }}>
            Mira el futuro de tu rancho en 2 minutos
          </h2>
          <p style={{ fontSize: fz.lg, color: "rgba(255,255,255,.9)", marginBottom: space.xl, maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Sin registro, sin instalar nada. Entra a la demo y recorre tu rancho, tus pozos, tus costos y tu acuífero.
          </p>
          <Link
            href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.brandNavy, fontSize: fz.md, fontWeight: 700, padding: "14px 28px", borderRadius: radius.md, textDecoration: "none", boxShadow: shadow.md }}
          >
            Entrar a la demo <Icon name="arrow" size={16} color={C.brandNavy} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: th.panel, borderTop: `1px solid ${th.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x3}px ${space.x3}px ${space.x2}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: space.x2 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
              <Logo size={22} /> <b style={{ fontFamily: FONT.title, fontSize: fz.md }}>WaterSense</b>
            </div>
            <p style={{ fontSize: fz.xs, color: th.soft, marginTop: space.sm, lineHeight: 1.6, maxWidth: 260 }}>
              Auditor de riego y futuro del agua para la agricultura de alto rendimiento. Delicias, Chihuahua.
            </p>
          </div>
          <FooterCol title="Producto" links={[["Qué hace", "/#pilares"], ["Cómo funciona", "/#como"], ["Datos", "/#fuentes"], ["Precios", "/precios"], ["Entrar a la demo", "/dashboard"]]} />
          <FooterCol title="Legal" links={[["Privacidad", "/privacidad"], ["Términos", "/terminos"]]} />
        </div>
        <div style={{ borderTop: `1px solid ${th.line}` }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.md}px ${space.x3}px`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: space.sm, fontSize: fz.micro, color: th.mute }}>
            <span>© {new Date().getFullYear()} WaterSense · Chihuahua, México</span>
            <span>Prototipo · datos simulados con rangos reales</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
