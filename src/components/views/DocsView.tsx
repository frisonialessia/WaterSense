"use client";

import type { Theme } from "@/lib/theme";

export function DocsView({ th, tr }: { th: Theme; tr: (s: string, t: string) => string }) {
  const docs = [
    {
      q: tr("¿Qué es la 'sed del cultivo'?", "¿Qué es el NDWI?"),
      a: tr(
        "Es qué tan seca está tu planta, medida desde satélite. Verde lima = bien regada, rojo = necesita agua ya.",
        "Normalized Difference Water Index: índice satelital (Sentinel-2) de contenido de agua en vegetación. 0=sano, 1=estrés severo."
      ),
    },
    {
      q: tr("¿Por qué riega de noche?", "¿Cómo decide la hora de riego?"),
      a: tr(
        "Porque la luz cuesta menos de madrugada. Regamos cuando es más barato sin que tu planta sufra.",
        "El motor compara tarifa actual vs. ventana de tarifa baja, ponderando el coste de estrés hídrico por esperar."
      ),
    },
    {
      q: tr("¿Qué pasa si un pozo se pone rojo?", "Sobreexplotación de acuífero"),
      a: tr(
        "Significa que estás sacando agua más rápido de lo que el pozo se recarga. Hay que bajar el ritmo o dañas el pozo.",
        "Caudal extraído supera el sostenible. Riesgo de daño al acuífero y a la bomba. El sistema alerta y sugiere reducir."
      ),
    },
    {
      q: tr("¿De dónde salen los datos?", "Fuentes de datos"),
      a: tr(
        "De sensores en tu campo, satélites y el precio de la luz. Ahora mismo es una demostración con datos de ejemplo.",
        "Sensores de suelo (LoRaWAN), Sentinel-2 (Copernicus), CENACE (spot), CONAGUA (derechos). Actualmente simulado."
      ),
    },
  ];
  return (
    <div style={{ padding: 30, maxWidth: 760 }}>
      {docs.map((d, i) => (
        <div
          key={i}
          className="card"
          style={{ animationDelay: `${i * 0.07}s`, background: th.panel, border: `1px solid ${th.line}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 7 }}>{d.q}</div>
          <div style={{ fontSize: 13.5, color: th.soft, lineHeight: 1.6 }}>{d.a}</div>
        </div>
      ))}
    </div>
  );
}
