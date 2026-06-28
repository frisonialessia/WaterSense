// ============================================================
// Factores físicos de bombeo y agua — fuente ÚNICA
// ============================================================
// Centralizados para que las vistas (Bitácora, Costos, Mi rancho) NO se
// contradigan entre sí. Con datos reales del pozo y del título de concesión
// estos factores se calcularían por pozo; aquí son valores representativos
// de Chihuahua (uso agrícola, elevación ~80 m).

/** Energía por m³ bombeado (~80 m de elevación). */
export const KWH_PER_M3 = 0.55;

/** Derechos de agua por m³ (cuota CONAGUA, uso agrícola, representativo). $/m³ */
export const WATER_RATE = 0.25;

/** Lámina típica de un evento de riego (~8 mm) expresada en m³ por hectárea. */
export const M3_PER_HA_EVENT = 80;

/**
 * kWh por hectárea al mes que se pueden MOVER del horario pico al barato.
 * Multiplicado por el diferencial tarifario ($/kWh, pico − barato) da el
 * ahorro operativo mensual estimado. Valor conservador; escala con la
 * superficie real del usuario y con el precio de luz en vivo.
 */
export const OPEX_SHIFT_KWH_HA_MONTH = 48;
