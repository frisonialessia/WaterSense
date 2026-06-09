// Route-level skeleton shown while the dashboard server component fetches its
// data (and runs the brain). Mirrors the real shell so the layout doesn't jump.
import { T, space, radius } from "@/lib/theme";

const th = T.light;
const Sk = ({ w, h, r = radius.md, mt = 0 }: { w?: number | string; h: number; r?: number; mt?: number }) => (
  <div className="ws-sk" style={{ width: w ?? "100%", height: h, borderRadius: r, marginTop: mt }} />
);

export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", height: "100vh", background: th.bg, overflow: "hidden" }}>
      {/* sidebar */}
      <div className="ws-sk-side" style={{ width: 218, flexShrink: 0, borderRight: `1px solid ${th.line}`, background: th.panel, padding: space.lg, display: "flex", flexDirection: "column", gap: 10 }}>
        <Sk w={130} h={24} />
        <div style={{ height: space.md }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Sk key={i} h={34} />
        ))}
      </div>

      {/* main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* topbar */}
        <div style={{ height: 61, flexShrink: 0, borderBottom: `1px solid ${th.line}`, background: th.panel, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${space.x2}px` }}>
          <Sk w={190} h={22} />
          <div style={{ display: "flex", gap: space.sm }}>
            <Sk w={120} h={28} />
            <Sk w={84} h={28} />
            <Sk w={30} h={28} />
          </div>
        </div>

        {/* kpi strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", borderBottom: `1px solid ${th.line}`, background: th.panel, flexShrink: 0 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: `${space.md}px ${space.x2}px`, borderLeft: i ? `1px solid ${th.line}` : "none", display: "flex", flexDirection: "column", gap: 8 }}>
              <Sk w={90} h={10} />
              <Sk w={72} h={26} />
            </div>
          ))}
        </div>

        {/* content — refleja el panel "Mi rancho": decisión + ahorro + toggle */}
        <div style={{ flex: 1, padding: space.x3, display: "flex", flexDirection: "column", gap: space.md, overflow: "hidden" }}>
          <Sk h={132} r={radius.lg} />
          <Sk h={108} r={radius.lg} />
          <Sk h={44} r={radius.md} />
        </div>
      </div>
    </div>
  );
}
