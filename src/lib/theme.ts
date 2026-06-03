// ============================================================
// WaterSense — Brand theme tokens (presentation only)
// Mirrors the palette/themes from the design reference HTML.
// No business data lives here — see SimulatedRepository.
// ============================================================

import type { CSSProperties } from "react";

/** Brand palette. Glacier = brand/actions, emerald = positive/health. */
export const C = {
  glacier: "#2270B8",
  glacierDeep: "#1A5A9A",
  glacierSoft: "#7FC4E8",
  emerald: "#0FA868",
  emeraldSoft: "#74E0AC",
  brandNavy: "#1B3A6B",
  alert: "#E0902E",
  critical: "#D8607A",
  // aliases used across the reference UI
  cyanDeep: "#1A5A9A",
  cyan: "#2270B8",
  teal: "#0FA868",
  tealLight: "#74E0AC",
  lime: "#0FA868",
  limeSoft: "#74E0AC",
} as const;

export type ThemeMode = "dark" | "light";

export interface Theme {
  bg: string;
  panel: string;
  panel2: string;
  line: string;
  ink: string;
  soft: string;
  mute: string;
  terrain: string;
  mapborder: string;
}

export const T: Record<ThemeMode, Theme> = {
  dark: { bg: "#081A23", panel: "#0E2730", panel2: "#143540", line: "#1F4450", ink: "#EAF4F4", soft: "#94B8BD", mute: "#5E818A", terrain: "#06222A", mapborder: "#2C5560" },
  light: { bg: "#EEF4F4", panel: "#FFFFFF", panel2: "#F2F8F9", line: "#DCE8EC", ink: "#0B2030", soft: "#4C6376", mute: "#84A0A8", terrain: "#D8EAEC", mapborder: "#BBD3D8" },
};

/** Font families. Variables are injected by next/font in layout.tsx. */
export const FONT = {
  title: "var(--font-montserrat), 'Montserrat', sans-serif",
  body: "var(--font-inter), 'Inter', system-ui, sans-serif",
  mono: "var(--font-jetbrains), 'JetBrains Mono', monospace",
};

/** Locale-aware number formatting (Mexican Spanish). */
export const fmt = (n: number): string => n.toLocaleString("es-MX");

export type Lang = "simple" | "tech";

/** Translator helper: pick simple (farmer) vs technical wording. */
export const makeTr = (lang: Lang) => (simple: string, tech: string) =>
  lang === "simple" ? simple : tech;

// ============================================================
// Design tokens — "dense control-room" system.
// One scale for everything, so the UI reads systematic, not
// eyeballed. Components consume these instead of magic numbers.
// ============================================================

/** Spacing scale (px), base 4. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, x2: 24, x3: 32, x4: 48 } as const;

/** Corner radii (px). Capped low — dense terminals are crisp, not bubbly. */
export const radius = { sm: 4, md: 6, lg: 10, pill: 999 } as const;

/** Type scale (px). Five steps + hero. Numbers ride the mono class. */
export const fz = { micro: 11, xs: 12, sm: 13, md: 15, lg: 18, xl: 24, hero: 34 } as const;

/** Layered, restrained shadows tuned to the navy ink. */
export const shadow = {
  sm: "0 1px 2px rgba(11,32,48,.05)",
  md: "0 2px 10px rgba(11,32,48,.07)",
  lg: "0 12px 36px rgba(11,32,48,.12)",
} as const;

/** Uppercase micro-label used for section headers across the terminal. */
export const labelStyle = (th: Theme): CSSProperties => ({
  fontSize: fz.micro,
  textTransform: "uppercase",
  letterSpacing: ".09em",
  color: th.mute,
  fontWeight: 600,
});

/** Standard panel/card surface. */
export const cardStyle = (th: Theme): CSSProperties => ({
  background: th.panel,
  border: `1px solid ${th.line}`,
  borderRadius: radius.lg,
});
