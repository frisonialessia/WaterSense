import Link from "next/link";
import { T, C, FONT, space, fz, radius } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Página 404 de marca (en vez del default de Next).
const th = T.light;

export default function NotFound() {
  return (
    <div style={{ background: th.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: space.x3, fontFamily: FONT.body, color: th.ink }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: space.lg }}>
          <Logo size={56} />
        </div>
        <div className="mono" style={{ fontFamily: FONT.title, fontSize: fz.hero, fontWeight: 700, color: C.glacier, lineHeight: 1 }}>404</div>
        <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, letterSpacing: "-0.01em", margin: `${space.sm}px 0` }}>Esta página se quedó seca</h1>
        <p style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6, marginBottom: space.xl }}>
          No encontramos lo que buscabas. Volvamos a donde corre el agua.
        </p>
        <div style={{ display: "flex", gap: space.sm, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "11px 20px", fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>
            Ir al inicio
          </Link>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: th.panel, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "11px 20px", fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>
            Entrar a la demo <Icon name="arrow" size={15} color={th.ink} />
          </Link>
        </div>
      </div>
    </div>
  );
}
