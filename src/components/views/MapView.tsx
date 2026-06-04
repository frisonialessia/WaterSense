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
type DrawnParcel = { pts: [number, number][]; ha: number };

// Geodesic-ish polygon area in hectares (planar approx around its latitude).
function ringHectares(pts: [number, number][]): number {
  if (pts.length < 3) return 0;
  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const mLng = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const mLat = 110_540;
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * mLng * (y2 * mLat) - x2 * mLng * (y1 * mLat);
  }
  return Math.abs(a / 2) / 10_000;
}

const emptyFC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

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

  // search (geocoding)
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  // draw parcel
  const [drawing, setDrawing] = useState(false);
  const [drawPts, setDrawPts] = useState<[number, number][]>([]);
  const [myParcels, setMyParcels] = useState<DrawnParcel[]>([]);
  const drawingRef = useRef(false);
  const drawPtsRef = useRef<[number, number][]>([]);
  const myParcelsRef = useRef<DrawnParcel[]>([]);

  const cropMap = useMemo(() => {
    const m = {} as Record<CropType, CropProfile>;
    crops.forEach((c) => (m[c.crop] = c));
    return m;
  }, [crops]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  const parcelFC = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: parcels
        .filter((p) => p.boundary && p.boundary.length >= 3)
        .map((p) => ({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [p.boundary as [number, number][]] },
          properties: { id: p.id, name: p.name, color: stressColor(p.stress) },
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

  // helpers to push draw / saved geometry into the map sources
  const syncDraw = () => {
    const map = mapRef.current;
    const src = map?.getSource("draw") as maplibregl.GeoJSONSource | undefined;
    const ptsSrc = map?.getSource("draw-pts") as maplibregl.GeoJSONSource | undefined;
    const pts = drawPtsRef.current;
    if (src) {
      const features: GeoJSON.Feature[] = pts.length
        ? [
            pts.length >= 3
              ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } }
              : { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } },
          ]
        : [];
      src.setData({ type: "FeatureCollection", features });
    }
    if (ptsSrc) {
      ptsSrc.setData({ type: "FeatureCollection", features: pts.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p } })) });
    }
  };
  const syncMine = () => {
    const src = mapRef.current?.getSource("myparcels") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: "FeatureCollection",
        features: myParcelsRef.current.map((mp) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...mp.pts, mp.pts[0]]] } })),
      });
    }
  };

  // create / recreate the map (theme swap)
  useEffect(() => {
    if (!containerRef.current) return;
    setReady(false);
    drawingRef.current = false;
    drawPtsRef.current = [];
    setDrawing(false);
    setDrawPts([]);
    const map = new maplibregl.Map({ container: containerRef.current, style: STYLE[mode], center, zoom: 14.2, attributionControl: false });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.addSource("parcels", { type: "geojson", data: parcelFC });
      map.addLayer({ id: "parcels-fill", type: "fill", source: "parcels", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.4 } });
      map.addLayer({ id: "parcels-line", type: "line", source: "parcels", paint: { "line-color": ["get", "color"], "line-width": 2 } });
      map.addLayer({ id: "parcels-sel", type: "line", source: "parcels", paint: { "line-color": ["get", "color"], "line-width": 4 }, filter: ["==", ["get", "id"], ""] });
      map.addLayer({ id: "parcels-label", type: "symbol", source: "parcels", layout: { "text-field": ["get", "name"], "text-size": 12 }, paint: { "text-color": th.ink, "text-halo-color": th.panel, "text-halo-width": 1.5 } });

      // saved (drawn) parcels
      map.addSource("myparcels", { type: "geojson", data: emptyFC });
      map.addLayer({ id: "myparcels-fill", type: "fill", source: "myparcels", paint: { "fill-color": C.emerald, "fill-opacity": 0.25 } });
      map.addLayer({ id: "myparcels-line", type: "line", source: "myparcels", paint: { "line-color": C.emerald, "line-width": 2.5 } });

      // in-progress drawing
      map.addSource("draw", { type: "geojson", data: emptyFC });
      map.addLayer({ id: "draw-fill", type: "fill", source: "draw", paint: { "fill-color": C.glacier, "fill-opacity": 0.15 } });
      map.addLayer({ id: "draw-line", type: "line", source: "draw", paint: { "line-color": C.glacier, "line-width": 2, "line-dasharray": [2, 1.5] } });
      map.addSource("draw-pts", { type: "geojson", data: emptyFC });
      map.addLayer({ id: "draw-pts-c", type: "circle", source: "draw-pts", paint: { "circle-radius": 4, "circle-color": "#fff", "circle-stroke-color": C.glacier, "circle-stroke-width": 2 } });

      map.on("click", "parcels-fill", (e) => {
        if (drawingRef.current) return;
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelId(id);
      });
      map.on("click", (e) => {
        if (!drawingRef.current) return;
        drawPtsRef.current = [...drawPtsRef.current, [e.lngLat.lng, e.lngLat.lat]];
        setDrawPts(drawPtsRef.current.slice());
        syncDraw();
      });
      map.on("mouseenter", "parcels-fill", () => { if (!drawingRef.current) map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "parcels-fill", () => { if (!drawingRef.current) map.getCanvas().style.cursor = ""; });

      syncMine();
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

  // well markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = wells
      .filter((w) => w.lat != null && w.lng != null)
      .map((w) => {
        const col = w.ok ? C.glacier : C.critical;
        const el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:3px;";
        el.innerHTML = `
          <span style="background:${th.panel};color:${th.ink};border:1px solid ${th.line};border-radius:${radius.sm}px;padding:2px 6px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:${shadow.sm}">
            ${w.name} · ${fmt(w.currentFlowLph)} L/h
          </span>
          <span style="width:13px;height:13px;border-radius:50%;background:${col};border:2.5px solid ${th.panel};box-shadow:${shadow.sm}"></span>`;
        return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([w.lng as number, w.lat as number]).addTo(map);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wells]);

  // layer presentation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const showWells = layer === "wells";
    map.setPaintProperty("parcels-fill", "fill-opacity", showWells ? 0.12 : 0.4);
    map.setLayoutProperty("parcels-label", "visibility", showWells ? "none" : "visible");
    markersRef.current.forEach((m) => (m.getElement().style.display = showWells ? "flex" : "none"));
  }, [layer, ready]);

  // selection highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter("parcels-sel", ["==", ["get", "id"], selId]);
  }, [selId, ready]);

  const onRegion = (id: string) => {
    setRegionId(id);
    const r = regions.find((x) => x.id === id);
    if (r && mapRef.current) mapRef.current.flyTo({ center: [r.lng, r.lat], zoom: 12.5, duration: 1200 });
    else if (!id && mapRef.current) mapRef.current.flyTo({ center, zoom: 14.2, duration: 1200 });
  };

  const doSearch = async () => {
    const q = search.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchMsg("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Chihuahua, México")}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await r.json();
      if (data && data[0]) {
        mapRef.current?.flyTo({ center: [+data[0].lon, +data[0].lat], zoom: 13, duration: 1200 });
        setSearchMsg(tr("Ubicación fijada", "Fijado"));
      } else setSearchMsg(tr("No encontrado", "Sin resultados"));
    } catch {
      setSearchMsg(tr("Error de conexión", "Error"));
    } finally {
      setSearching(false);
      setTimeout(() => setSearchMsg(""), 3000);
    }
  };

  const startDraw = () => {
    drawingRef.current = true;
    drawPtsRef.current = [];
    setDrawing(true);
    setDrawPts([]);
    syncDraw();
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "crosshair";
  };
  const cancelDraw = () => {
    drawingRef.current = false;
    drawPtsRef.current = [];
    setDrawing(false);
    setDrawPts([]);
    syncDraw();
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
  };
  const saveDraw = () => {
    if (drawPtsRef.current.length < 3) return cancelDraw();
    myParcelsRef.current = [...myParcelsRef.current, { pts: drawPtsRef.current.slice(), ha: ringHectares(drawPtsRef.current) }];
    setMyParcels(myParcelsRef.current.slice());
    syncMine();
    cancelDraw();
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

  const inputStyle: React.CSSProperties = { background: "transparent", border: "none", padding: "7px 10px", color: th.ink, fontSize: fz.xs, outline: "none", fontFamily: "inherit", width: 150 };
  const selectStyle: React.CSSProperties = { background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "7px 10px", color: th.ink, fontSize: fz.xs, cursor: "pointer", fontFamily: "inherit" };
  const btn = (primary?: boolean, disabled?: boolean): React.CSSProperties => ({
    flex: 1,
    border: primary ? "none" : `1px solid ${th.line}`,
    background: disabled ? th.panel2 : primary ? C.emerald : th.panel2,
    color: disabled ? th.mute : primary ? "#fff" : th.ink,
    borderRadius: radius.md,
    padding: "7px 0",
    fontSize: fz.xs,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 560, display: "flex", flexDirection: "column" }}>
      {/* context bar */}
      <div style={{ display: "flex", alignItems: "center", gap: space.md, padding: `${space.sm}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, background: th.panel, flexWrap: "wrap" }}>
        <select value={regionId} onChange={(e) => onRegion(e.target.value)} style={selectStyle} aria-label={tr("Región", "Región")}>
          <option value="">{tr("Mi finca (Delicias)", "Centrar en finca")}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>{center[1].toFixed(3)}° N · {Math.abs(center[0]).toFixed(3)}° O</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: space.sm }}>
          {searchMsg && <span style={{ fontSize: fz.micro, color: th.mute }}>{searchMsg}</span>}
          <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, overflow: "hidden" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder={tr("Ciudad o código postal…", "Ciudad o CP…")} style={inputStyle} aria-label={tr("Buscar ubicación", "Buscar")} />
            <button onClick={doSearch} disabled={searching} style={{ background: C.glacier, border: "none", color: "#fff", padding: "7px 12px", fontSize: fz.xs, cursor: "pointer", fontWeight: 600 }}>{searching ? "…" : tr("Ir", "Ir")}</button>
          </div>
        </div>
      </div>

      {/* map + overlays */}
      <div style={{ position: "relative", flex: 1, minHeight: 480 }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* layers + draw */}
        <div style={panel({ top: space.md, left: space.md, width: 208 })}>
          <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("¿Qué quieres ver?", "Capas")}</div>
          {([
            { id: "stress", sw: `linear-gradient(90deg,${C.emerald},${C.glacier},${C.alert})`, s: "Sed del cultivo", t: "Estrés hídrico" },
            { id: "wells", sw: C.glacier, s: "Mis pozos", t: "Pozos & acuífero" },
          ] as { id: Layer; sw: string; s: string; t: string }[]).map((o) => {
            const active = layer === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setLayer(o.id)}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: space.sm, padding: "7px 8px", borderRadius: radius.md, fontSize: fz.xs, cursor: "pointer", marginBottom: 2, border: `1px solid ${active ? th.line : "transparent"}`, background: active ? th.panel2 : "transparent", color: active ? th.ink : th.soft }}
              >
                <span style={{ width: 11, height: 11, borderRadius: 3, background: o.sw }} />
                {tr(o.s, o.t)}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${th.line}`, marginTop: space.sm, paddingTop: space.md }}>
            {!drawing ? (
              <button onClick={startDraw} style={{ width: "100%", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "8px 0", fontSize: fz.xs, fontWeight: 600, color: th.ink, cursor: "pointer" }}>
                + {tr("Dibujar mi parcela", "Marcar parcela")}
              </button>
            ) : (
              <div>
                <div style={{ fontSize: fz.micro, color: th.soft, marginBottom: space.sm, lineHeight: 1.4 }}>
                  {tr("Toca el mapa para marcar las esquinas.", "Clic: marca vértices.")}
                  {drawPts.length >= 3 && <span style={{ display: "block", marginTop: 4, color: C.emerald, fontWeight: 600 }}>~{ringHectares(drawPts).toFixed(1)} ha</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveDraw} disabled={drawPts.length < 3} style={btn(true, drawPts.length < 3)}>{tr("Guardar", "Guardar")}</button>
                  <button onClick={cancelDraw} style={btn(false)}>{tr("Cancelar", "Cancelar")}</button>
                </div>
              </div>
            )}
            {myParcels.length > 0 && <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.sm }}>{myParcels.length} {tr("parcela(s) marcada(s)", "marcadas")}</div>}
          </div>
        </div>

        {/* crop cost calculator */}
        {sel && (
          <div style={panel({ top: space.md, right: space.md, width: 234 })}>
            <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("Costo de riego", "Costo por cultivo")}</div>
            <select value={sel.id} onChange={(e) => setSelId(e.target.value)} style={{ ...selectStyle, width: "100%", marginBottom: space.sm }} aria-label={tr("Parcela", "Parcela")}>
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
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: radius.md, background: rain ? `${C.glacier}14` : due.length ? `${C.emerald}12` : th.panel2, border: `1px solid ${rain ? C.glacier + "44" : due.length ? C.emerald + "33" : th.line}` }}>
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
