// Monochrome line icons (no emojis) — mirrors the reference HTML.

const PATHS: Record<string, string> = {
  bolt: "M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z",
  drop: "M12 2.5C12 2.5 5.5 9.5 5.5 14a6.5 6.5 0 0 0 13 0c0-4.5-6.5-11.5-6.5-11.5z",
  fuel: "M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M3 11h10M16 8l3 3v7a2 2 0 0 0 2-2v-6l-3-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.6-.7-.7-2.6 2.7-2.7z",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3M12 16h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  map: "M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16",
  leaf: "M5 21c0-9 7-16 16-16 0 9-7 16-16 16zM5 21c4-4 7-7 11-9",
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8",
  book: "M4 4h11a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4zM18 4h2v16",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",
  rain: "M7 14a5 5 0 0 1-1-9.9A6 6 0 0 1 18 6a4 4 0 0 1 0 8M8 18l-1 2M12 18l-1 2M16 18l-1 2",
  cloud: "M7 16a5 5 0 0 1-1-9.9A6 6 0 0 1 18 8a4 4 0 0 1 0 8H7z",
  bolt2: "M11 3L5 13h5l-1 8 7-11h-5l1-7z",
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  stroke = 1.6,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const d = PATHS[name] ?? "";
  const filled = name === "bolt";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
