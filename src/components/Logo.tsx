// WaterSense logo: gota con nivel ("agua medida").

export function Logo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  const gid = "wsg" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light ? "#8FD3F4" : "#1E83DA"} />
          <stop offset="100%" stopColor={light ? "#6EE7B7" : "#10B981"} />
        </linearGradient>
      </defs>
      <path d="M50 12 C50 12 80 48 80 66 A30 30 0 1 1 20 66 C20 48 50 12 50 12 Z" fill={`url(#${gid})`} />
      <line x1="34" y1="60" x2="66" y2="60" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="38" y1="72" x2="62" y2="72" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
