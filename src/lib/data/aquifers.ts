// ============================================================
// Acuíferos de Chihuahua — cifras OFICIALES de CONAGUA (DOF)
// ============================================================
// Fuente: "Actualización de la disponibilidad media anual de agua subterránea",
// CONAGUA, publicada en el Diario Oficial de la Federación (DOF). Todas las
// cifras en hm³/año (millones de m³/año).
//
//   DMA = Recarga − Descarga natural comprometida − Volumen concesionado
//   DMA negativa  → déficit / sobreexplotado
//   DMA positiva  → todavía con disponibilidad
//
// Una sola fuente de verdad: la consumen el AquiferLookup (landing) y el
// HeroSimulator. Cuando conectemos la BD, esto se reemplaza por la tabla real
// de acuíferos (o por el cálculo por-pozo con piezometría de CONAGUA).

export interface Aquifer {
  id: string;
  name: string;
  municipios: string;
  /** Recarga media anual (hm³/año) */
  recargaHm3: number;
  /** Volumen concesionado / extraído de agua subterránea (hm³/año) */
  extraccionHm3: number;
  /** Disponibilidad media anual (hm³/año). Negativa = déficit. */
  dmaHm3: number;
  status: string;
  /** Año de la publicación oficial de los datos */
  dataYear: string;
  /** Enlace al acuerdo del DOF */
  sourceUrl: string;
}

export const CHIHUAHUA_AQUIFERS: Aquifer[] = [
  { id: "meoqui-delicias", name: "Meoqui–Delicias", municipios: "Delicias, Meoqui, Rosales, Saucillo", recargaHm3: 211.2, extraccionHm3: 383.4, dmaHm3: -172.2, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5404480&fecha=19/08/2015" },
  { id: "cuauhtemoc", name: "Cuauhtémoc", municipios: "Cuauhtémoc, Cusihuiriachi", recargaHm3: 115.2, extraccionHm3: 311.3, dmaHm3: -196.1, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5399497&fecha=06/07/2015" },
  { id: "jimenez-camargo", name: "Jiménez–Camargo", municipios: "Jiménez, Camargo", recargaHm3: 173.3, extraccionHm3: 309.9, dmaHm3: -142.1, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5404986&fecha=25/08/2015" },
  { id: "ascension", name: "Ascensión", municipios: "Ascensión", recargaHm3: 132.2, extraccionHm3: 239.2, dmaHm3: -107.0, status: "Sobreexplotado", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "flores-magon", name: "Flores Magón–Villa Ahumada", municipios: "Buenaventura, Villa Ahumada", recargaHm3: 137.5, extraccionHm3: 247.8, dmaHm3: -110.3, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5398033&fecha=25/06/2015" },
  { id: "casas-grandes", name: "Casas Grandes", municipios: "Nuevo Casas Grandes, Casas Grandes", recargaHm3: 180.0, extraccionHm3: 200.4, dmaHm3: -20.4, status: "Sobreexplotado", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "el-sauz-encinillas", name: "El Sauz–Encinillas", municipios: "Chihuahua, Riva Palacio", recargaHm3: 62.4, extraccionHm3: 90.0, dmaHm3: -27.6, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://dof.gob.mx/nota_detalle.php?codigo=5398438&fecha=26/06/2015" },
  { id: "tabalaopa-aldama", name: "Tabalaopa–Aldama", municipios: "Chihuahua, Aldama", recargaHm3: 76.5, extraccionHm3: 60.4, dmaHm3: 11.8, status: "Con disponibilidad", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "alto-san-pedro", name: "Alto Río San Pedro", municipios: "Cuauhtémoc, Riva Palacio", recargaHm3: 56.3, extraccionHm3: 16.7, dmaHm3: 10.5, status: "Con disponibilidad", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5414725&fecha=10/11/2015" },
];

/** ¿Está el acuífero en déficit (se extrae más de lo que se recarga)? */
export const isOverexploited = (a: Aquifer): boolean => a.dmaHm3 < 0;

/** Sobregiro: % de agua que se extrae de más respecto a la recarga (>0 = déficit). */
export const overdraftPct = (a: Aquifer): number => Math.round((a.extraccionHm3 / a.recargaHm3 - 1) * 100);

/** Déficit anual en hm³ (valor absoluto; 0 si hay disponibilidad). */
export const deficitHm3 = (a: Aquifer): number => (a.dmaHm3 < 0 ? Math.abs(a.dmaHm3) : 0);
