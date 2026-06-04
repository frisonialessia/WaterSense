import Link from "next/link";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { HeroSimulator } from "./HeroSimulator";

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
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(100deg, ${C.brandNavy}f5 0%, ${C.brandNavy}db 40%, ${C.brandNavy}80 66%, ${C.brandNavy}1f 100%), url('/landing/hero.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: `${space.x4 + space.x3}px ${space.x3}px`, minHeight: "80vh", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: space.x4, alignItems: "center" }}>
          <div>
            <span className="mono" style={{ fontSize: fz.sm, color: C.emeraldSoft, fontWeight: 600, letterSpacing: ".05em" }}>
              CHIHUAHUA · AGRICULTURA DE ALTO RENDIMIENTO
            </span>
            <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(34px, 7vw, 56px)", lineHeight: 1.06, letterSpacing: "-0.02em", margin: `${space.lg}px 0`, color: "#fff" }}>
              Optimiza la <span style={{ color: C.glacierSoft }}>energía de tus pozos</span>. Maximiza la <span style={{ color: C.emeraldSoft }}>ganancia de tu rancho</span>.
            </h1>
            <p style={{ fontSize: fz.lg, color: "rgba(255,255,255,.9)", lineHeight: 1.6, maxWidth: 540 }}>
              Cruzamos el <b style={{ color: "#fff" }}>costo de tu luz</b>, el <b style={{ color: "#fff" }}>desperdicio de agua</b> y la <b style={{ color: "#fff" }}>salud de tu cultivo</b> para decirte
              qué regar, cuándo y a qué hora — y cuántos años le quedan a tu pozo. Hecho simple, para el campo de Chihuahua.
            </p>
            <div style={{ display: "flex", gap: space.md, marginTop: space.xl, flexWrap: "wrap" }}>
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", boxShadow: shadow.md }}>
                Ver el panel en vivo <Icon name="arrow" size={16} color="#fff" />
              </Link>
              <a href="#pilares" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", color: "#fff", fontSize: fz.md, fontWeight: 600, padding: "12px 22px", borderRadius: radius.md, textDecoration: "none", border: "1px solid rgba(255,255,255,.3)" }}>
                Cómo funciona
              </a>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: space.xl, fontSize: fz.xs, color: "rgba(255,255,255,.85)", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", padding: "6px 12px", borderRadius: radius.pill }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emeraldSoft }} />
              Prototipo · todos los datos son simulados, con rangos reales de Chihuahua
            </div>
          </div>

          {/* Interactive water-future simulator */}
          <HeroSimulator />
        </div>
      </section>

      {/* Pillars */}
      <section id="pilares" style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px ${space.x4}px` }}>
        <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, letterSpacing: "-0.01em", marginBottom: space.xl }}>
          Cuatro cosas que tu rancho necesita saber
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: space.md }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: space.md }}>
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
        <div style={{ borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.lg, color: "#fff", backgroundImage: `linear-gradient(110deg,${C.brandNavy}f2,${C.glacier}cc 60%,${C.emerald}cc), url('/landing/agua.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ padding: `${space.x3}px ${space.x3}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: space.xl }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: space.x3, alignItems: "center" }}>
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
      <footer style={{ maxWidth: 1180, margin: "0 auto", padding: `${space.x2}px ${space.x3}px`, borderTop: `1px solid ${th.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
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
