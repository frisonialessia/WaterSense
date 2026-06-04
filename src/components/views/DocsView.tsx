"use client";

import { cardStyle, space, fz, radius, C, type Theme } from "@/lib/theme";

export function DocsView({ th, tr }: { th: Theme; tr: (s: string, t: string) => string }) {
  const docs = [
    {
      q: tr("¿Qué es la 'sed del cultivo'?", "¿Qué es el NDWI?"),
      a: tr(
        "Es qué tan seca está tu planta, medida desde satélite. Verde = bien regada, rojo = necesita agua ya.",
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
    {
      q: tr("¿Puedo dibujar y guardar mis parcelas?", "Gestión de parcelas"),
      a: tr(
        "Sí. En el mapa toca 'Dibujar mi parcela', marca las esquinas, ponle nombre y elige el cultivo. Al elegir el cultivo, el sistema ya sabe cuánta agua y dinero necesita. Puedes borrarla cuando quieras.",
        "Dibuja el polígono, asígnale nombre y cultivo (hereda CropProfile: lámina, frecuencia, m³/ha, costo). Se guarda en tu navegador (localStorage); con base de datos conectada, persistiría por usuario."
      ),
    },
    {
      q: tr("¿Por qué cada cultivo riega distinto?", "Riego por cultivo"),
      a: tr(
        "Porque cada planta bebe distinto. Un nogal pide mucha agua y riego cada ~7 días; un manzano pide menos y cada ~8. Por eso el costo y el calendario cambian según lo que siembres.",
        "Cada cultivo tiene su perfil hídrico (lámina anual, m³/ha, frecuencia, rendimiento). El calculador y el calendario se ajustan automáticamente al cultivo de cada parcela."
      ),
    },
    {
      q: tr("¿Cómo sé qué pozos hay y quién comparte mi acuífero?", "Pozos y derechos de agua"),
      a: tr(
        "Los pozos y concesiones de agua en México están en un registro público de CONAGUA (REPDA). Ahí se puede ver quién tiene permiso, para qué y cuánto. En esta demo los pozos son de ejemplo; la idea es conectar ese registro para mostrarte los reales cerca de ti.",
        "REPDA (Registro Público de Derechos de Agua, CONAGUA) lista concesiones: titular, uso, volumen y ubicación. Hoy simulado; la arquitectura está lista para cruzar REPDA por acuífero/coordenadas."
      ),
    },
    {
      q: tr("¿Cómo cuida WaterSense mis bombas?", "Mantenimiento de pozos"),
      a: tr(
        "Vigila los arranques y la presión de cada bomba y te avisa antes de que falle, para que no te quedes sin agua en plena temporada. En 'Mis pozos' ves la salud de cada una.",
        "Mantenimiento predictivo: el motor estima salud y ventana de falla a partir de arranques y caída de presión. Con sensores reales por bomba, las alertas usarían desgaste medido."
      ),
    },
    {
      q: tr("¿Mis datos están seguros?", "Privacidad de datos"),
      a: tr(
        "En esta demostración nada sale de tu navegador: lo que dibujas se guarda solo en tu equipo. Cuando se conecte una base de datos real, tus datos serían privados y solo tuyos.",
        "PoC sin backend: el estado del usuario vive en localStorage. En producción (Supabase) habría cuentas, RLS por usuario y datos cifrados en tránsito."
      ),
    },
    {
      q: tr("¿Esto cuesta? ¿Necesito internet?", "Uso y requisitos"),
      a: tr(
        "Es una demostración gratuita. Necesitas internet para ver el mapa. Todo lo demás funciona como ejemplo, sin que tengas que configurar nada.",
        "Demo gratuita. El mapa usa teselas en línea (CARTO). El resto opera con datos simulados sin configuración."
      ),
    },
    {
      q: tr("¿Cómo cambio entre lenguaje simple y técnico?", "Modo simple vs técnico"),
      a: tr(
        "Arriba a la derecha hay un botón 'Simple / Técnico'. En Simple hablamos claro; en Técnico mostramos los términos y unidades de ingeniería.",
        "El toggle Simple/Técnico (barra superior) cambia toda la terminología de la interfaz."
      ),
    },
  ];
  return (
    <div style={{ padding: space.x3, maxWidth: 880 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: space.md }}>
        {docs.map((d, i) => (
          <div key={i} className="card" style={{ ...cardStyle(th), animationDelay: `${i * 0.05}s`, padding: `${space.lg}px ${space.xl}px` }}>
            <div style={{ display: "flex", gap: space.md, alignItems: "flex-start" }}>
              <span className="mono" style={{ fontSize: fz.xs, color: C.glacier, border: `1px solid ${C.glacier}33`, borderRadius: radius.sm, padding: "1px 6px", marginTop: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: fz.md, marginBottom: 6 }}>{d.q}</div>
                <div style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>{d.a}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
