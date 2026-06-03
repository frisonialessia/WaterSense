"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Parcel, Well, Region, CropProfile, CropType } from "@/types/domain";
import { C, fmt, space, fz, radius, shadow, labelStyle, type Theme, type ThemeMode } from "@/lib/theme";

const STYLE: Record<ThemeMode, string> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

const stressColor = (s: number) => (s > 0.6 ? C.alert : s < 0.35 ? C.emerald : C.glacier);

type Layer = "stress" | "wells";

export function MapView({
  th,
  mode,
  tr,
  parcels,
  wells,
  regions,
  crops,
}: {
  th: Theme;
  mode: ThemeMode;
  tr: (s: string, t: string) => string;
  parcels: Parcel[];
  wells: Well[];
  regions: Region[];
  crops: CropProfile[];
}) {
  const [layer, setLayer] = useState<Layer>("stress");
  const [selId, setSelId] = useState<string>(parcels[2]?.id ?? parcels[0]?.id ?? "");
  const [regionId, setRegionId] = useState<string>("");

  const cropMap = useMemo(() => {
    const m = {} as Record<CropType, CropProfile>;
    crops.forEach((c) => (m[c.crop] = c));
    return m;
  }, [crops]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Parcel polygons as GeoJSON (colors are stress-derived, theme-independent).
  const parcelFC = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: parcels
        .filter((p) => p.boundary && p.boundary.length >= 3)
        .map((p) => ({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [p.boundary as [number, number][]] },
          properties: { id: p.id, name: p.name, color: stressColor(p.stress), stress: p.stress },
        })),
    }),
    [parcels]
  );

  const center = useMemo<[number, number]>(() => {
    const pts = parcels.filter((p) => p.lat != null && p.lng != null);
    if (!pts.length) return [-105.47, 28.19];
    const lng = pts.reduce((s, p) => s + (p.lng as number), 0) / pts.length;
    const lat = pts.reduce((s, p) => s + (p.lat as number), 0) / pts.length;
    return [lng, lat];
  }, [parcels]);

  // Create / recreate the map (recreated on theme change to swap basemap).
  useEffect(() => {
    if (!containerRef.current) return;
    setReady(false);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE[mode],
      center,
      zoom: 14.2,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.addSource("parcels", { type: "geojson", data: parcelFC });
      map.addLayer({ id: "parcels-fill", type: "fill", source: "parcels", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.4 } });
      map.addLayer({ id: "parcels-line", type: "line", source: "parcels", paint: { "line-color": ["get", "color"], "line-width": 2 } });
      map.addLayer({
        id: "parcels-sel",
        type: "line",
        source: "parcels",
        paint: { "line-color": ["get", "color"], "line-width": 4 },
        filter: ["==", ["get", "id"], ""],
      });
      map.addLayer({
        id: "parcels-label",
        type: "symbol",
        source: "parcels",
        layout: { "text-field": ["get", "name"], "text-size": 12, "text-offset": [0, 0], "text-allow-overlap": false },
        paint: { "text-color": th.ink, "text-halo-color": th.panel, "text-halo-width": 1.5 },
      });

      map.on("click", "parcels-fill", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelId(id);
      });
      map.on("mouseenter", "parcels-fill", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "parcels-fill", () => (map.getCanvas().style.cursor = ""));
      setReady(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Build well markers once the map is ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = wells
      .filter((w) => w.lat != null && w.lng != null)
      .map((w) => {
        const col = w.ok ? C.glacier : C.critical;
        const el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default;";
        el.innerHTML = `
          <span style="background:${th.panel};color:${th.ink};border:1px solid ${th.line};border-radius:${radius.sm}px;padding:2px 6px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:${shadow.sm}">
            ${w.name} · ${fmt(w.currentFlowLph)} L/h
          </span>
          <span style="width:13px;height:13px;border-radius:50%;background:${col};border:2.5px solid ${th.panel};box-shadow:${shadow.sm}"></span>`;
        return new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([w.lng as number, w.lat as number])
          .addTo(map);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wells]);

  // Toggle layer presentation: parcels vs wells.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const showWells = layer === "wells";
    map.setPaintProperty("parcels-fill", "fill-opacity", showWells ? 0.12 : 0.4);
    map.setLayoutProperty("parcels-label", "visibility", showWells ? "none" : "visible");
    markersRef.current.forEach((m) => (m.getElement().style.display = showWells ? "flex" : "none"));
  }, [layer, ready]);

  // Highlight selected parcel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter("parcels-sel", ["==", ["get", "id"], selId]);
  }, [selId, ready]);

  // Region selector recenters the map.
  const onRegion = (id: string) => {
    setRegionId(id);
    const r = regions.find((x) => x.id === id);
    if (r && mapRef.current) mapRef.current.flyTo({ center: [r.lng, r.lat], zoom: 12.5, duration: 1200 });
    else if (!id && mapRef.current) mapRef.current.flyTo({ center, zoom: 14.2, duration: 1200 });
  };

  const sel = parcels.find((p) => p.id === selId) ?? parcels[0];
  const crop = sel ? cropMap[sel.crop] : undefined;
  const totalCost = crop ? Math.round(crop.costHa * sel.hectares) : 0;
  const totalWater = crop ? Math.round(crop.waterM3ha * sel.hectares) : 0;
  const costPerKg = crop && crop.yieldKgHa ? (crop.costHa / crop.yieldKgHa).toFixed(2) : "—";

  const panel = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    background: `${th.panel}f2`,
    backdropFilter: "blur(8px)",
    border: `1px solid ${th.line}`,
    borderRadius: radius.lg,
    boxShadow: shadow.lg,
    padding: space.md,
    zIndex: 5,
    ...extra,
  });

  const Stat = ({ l, v, c, last }: { l: string; v: string; c?: string; last?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: last ? "none" : `1px solid ${th.line}` }}>
      <span style={{ fontSize: fz.xs, color: th.soft }}>{l}</span>
      <span className="mono" style={{ fontSize: fz.sm, fontWeight: 600, color: c ?? th.ink }}>{v}</span>
    </div>
  );

  const selectStyle: React.CSSProperties = {
    background: th.panel2,
    border: `1px solid ${th.line}`,
    borderRadius: radius.md,
    padding: "7px 10px",
    color: th.ink,
    fontSize: fz.xs,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 560, display: "flex", flexDirection: "column" }}>
      {/* context bar */}
      <div style={{ display: "flex", alignItems: "center", gap: space.md, padding: `${space.sm}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, background: th.panel, flexWrap: "wrap" }}>
        <select value={regionId} onChange={(e) => onRegion(e.target.value)} style={selectStyle}>
          <option value="">{tr("Mi finca (Delicias)", "Centrar en finca")}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>
          {center[1].toFixed(3)}° N · {Math.abs(center[0]).toFixed(3)}° O
        </span>
        <span style={{ fontSize: fz.xs, color: th.mute, marginLeft: "auto" }}>
          {tr("Toca una parcela para ver su costo", "Clic en parcela · detalle de costo")}
        </span>
      </div>

      {/* map + overlays */}
      <div style={{ position: "relative", flex: 1, minHeight: 480 }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* layers */}
        <div style={panel({ top: space.md, left: space.md, width: 196 })}>
          <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("¿Qué quieres ver?", "Capas")}</div>
          {([
            { id: "stress", sw: `linear-gradient(90deg,${C.emerald},${C.glacier},${C.alert})`, s: "Sed del cultivo", t: "Estrés hídrico" },
            { id: "wells", sw: C.glacier, s: "Mis pozos", t: "Pozos & acuífero" },
          ] as { id: Layer; sw: string; s: string; t: string }[]).map((o) => {
            const active = layer === o.id;
            return (
              <div
                key={o.id}
                onClick={() => setLayer(o.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: space.sm,
                  padding: "7px 8px",
                  borderRadius: radius.md,
                  fontSize: fz.xs,
                  cursor: "pointer",
                  marginBottom: 2,
                  border: `1px solid ${active ? th.line : "transparent"}`,
                  background: active ? th.panel2 : "transparent",
                  color: active ? th.ink : th.soft,
                }}
              >
                <span style={{ width: 11, height: 11, borderRadius: 3, background: o.sw }} />
                {tr(o.s, o.t)}
              </div>
            );
          })}
        </div>

        {/* crop cost calculator */}
        {sel && (
          <div style={panel({ top: space.md, right: space.md, width: 234 })}>
            <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("Costo de riego", "Costo por cultivo")}</div>
            <select value={sel.id} onChange={(e) => setSelId(e.target.value)} style={{ ...selectStyle, width: "100%", marginBottom: space.sm }}>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.sm }}>{sel.crop} · {sel.hectares} ha</div>
            <Stat l={tr("Riega cada", "Frecuencia")} v={`${crop?.freqDays ?? "—"} ${tr("días", "d")}`} />
            <Stat l={tr("Agua al año", "Agua/año")} v={`${fmt(totalWater)} m³`} />
            <Stat l={tr("Costo por hectárea", "$/ha año")} v={`$${fmt(crop?.costHa ?? 0)}`} c={C.glacier} />
            <Stat l={tr("Costo por kilo", "$/kg")} v={`$${costPerKg}`} c={C.emerald} />
            <Stat l={tr("Costo total al año", "Total/año")} v={`$${fmt(totalCost)}`} last />
          </div>
        )}

        {/* irrigation calendar */}
        <div style={panel({ bottom: space.md, left: space.md, right: space.md, padding: `${space.md}px ${space.lg}px` })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
            <div style={labelStyle(th)}>{tr("Días de riego · próxima semana", "Calendario de riego · 7 días")}</div>
            <span style={{ fontSize: fz.micro, color: th.mute }}>{tr("verde = toca regar", "programado por el motor")}</span>
          </div>
          <div style={{ display: "flex", gap: space.sm }}>
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => {
              const due = parcels.filter((p) => {
                const f = cropMap[p.crop]?.freqDays ?? 7;
                return (i + 1) % f === 0 || (i === 0 && p.stress > 0.6);
              });
              const rain = i === 3;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 4px",
                    borderRadius: radius.md,
                    background: rain ? `${C.glacier}14` : due.length ? `${C.emerald}12` : th.panel2,
                    border: `1px solid ${rain ? C.glacier + "44" : due.length ? C.emerald + "33" : th.line}`,
                  }}
                >
                  <div style={{ fontSize: fz.micro, color: th.mute, marginBottom: 4 }}>{d}</div>
                  <div className="mono" style={{ fontSize: fz.xs, fontWeight: 600, color: rain ? C.glacier : due.length ? C.emerald : th.mute }}>
                    {rain ? tr("lluvia", "lluvia") : due.length ? `${due.length} ${tr("parc.", "p")}` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
