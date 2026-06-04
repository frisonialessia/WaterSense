// Minimal inline-SVG sparkline — no chart lib, keeps the KPI strip light.

export function Sparkline({ data, color, width = 64, height = 18 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = (data.length - 1) * stepX;
  const lastY = height - 2 - ((data[data.length - 1] - min) / span) * (height - 4);
  return (
    <svg width={width} height={height} style={{ display: "block" }} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={lastX} cy={lastY} r={1.8} fill={color} />
    </svg>
  );
}
