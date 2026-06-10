// WaterSense logo: molinete de gotas (pivote de riego + agua + movimiento).
// 8 gotas en círculo con un ligero giro → "cada gota cuenta" + rotación del
// pivote. Degradado azul → verde → lima (acento). Centro en estrella negativa.

const DROP = "M50 41 C 43 37, 38 30, 38 21 A12 12 0 0 1 62 21 C 62 30, 57 37, 50 41 Z";
const N = 8;
const LEAN = 17; // giro de cada gota → sensación de molinete

export function Logo({ size = 28, light = false, animated = true, solid }: { size?: number; light?: boolean; animated?: boolean; solid?: string }) {
  const gid = "wsg" + size + (light ? "l" : "");
  const fill = solid ?? `url(#${gid})`;
  return (
    <svg className={animated ? "ws-logo" : undefined} width={size} height={size} viewBox="0 0 100 100">
      {!solid && (
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="16" y1="16" x2="84" y2="86">
            <stop offset="0" stopColor={light ? "#8FD3F4" : "#1E83DA"} />
            <stop offset="0.55" stopColor={light ? "#6EE7B7" : "#10B981"} />
            <stop offset="1" stopColor={light ? "#BEF264" : "#84CC16"} />
          </linearGradient>
        </defs>
      )}
      {Array.from({ length: N }, (_, i) => (
        <path key={i} d={DROP} fill={fill} transform={`rotate(${(i * 360) / N} 50 50) rotate(${LEAN} 50 25)`} />
      ))}
    </svg>
  );
}
