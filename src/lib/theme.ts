// ============================================================
// WaterSense — Brand theme tokens (presentation only)
// Mirrors the palette/themes from the design reference HTML.
// No business data lives here — see SimulatedRepository.
// ============================================================

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
