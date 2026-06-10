import Link from "next/link";
import type { ReactNode } from "react";
import { T, C, FONT, space, fz } from "@/lib/theme";
import { Logo } from "./Logo";

// Plantilla simple y consistente para páginas legales (privacidad, términos).
const th = T.light;

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div style={{ background: th.bg, color: th.ink, minHeight: "100vh", fontFamily: FONT.body }}>
      <nav style={{ borderBottom: `1px solid ${th.line}`, background: th.panel }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: `${space.md}px ${space.x3}px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: space.sm, textDecoration: "none", color: th.ink }}>
            <Logo size={24} /> <b style={{ fontFamily: FONT.title, fontSize: fz.md }}>WaterSense</b>
          </Link>
          <Link href="/" style={{ color: C.glacier, fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>← Inicio</Link>
        </div>
      </nav>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
        <h1 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.hero, letterSpacing: "-0.02em", marginBottom: space.sm }}>{title}</h1>
        <p style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.x2 }}>Última actualización: {updated}</p>
        <div style={{ fontSize: fz.md, color: th.soft, lineHeight: 1.7 }}>{children}</div>
        <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.x3, paddingTop: space.lg, borderTop: `1px solid ${th.line}` }}>
          Este documento es una versión preliminar para el prototipo y no constituye asesoría legal. Antes de cobrar o manejar datos personales reales, debe revisarlo un abogado.
        </p>
      </main>
    </div>
  );
}

export function LSection({ h, children }: { h: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: space.x2 }}>
      <h2 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.lg, color: th.ink, margin: `0 0 ${space.sm}px` }}>{h}</h2>
      {children}
    </section>
  );
}

export function LP({ children }: { children: ReactNode }) {
  return <p style={{ margin: `0 0 ${space.sm}px` }}>{children}</p>;
}
