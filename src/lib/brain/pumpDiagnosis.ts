// ============================================================
// WaterSense — Pump troubleshooting catalog (technical help)
// Symptom → likely cause → recommended action. Static domain
// knowledge; pure data so it stays testable and translatable.
// ============================================================

export type DiagnosisSeverity = "info" | "watch" | "urgent";

export interface Diagnosis {
  id: string;
  /** what the farmer notices */
  symptom: string;
  symptomTech: string;
  cause: string;
  causeTech: string;
  action: string;
  severity: DiagnosisSeverity;
}

export const PUMP_DIAGNOSES: Diagnosis[] = [
  {
    id: "pressure-drop",
    symptom: "Sale menos agua o con menos fuerza",
    symptomTech: "Caída de presión / caudal sostenida",
    cause: "Puede ser desgaste de la bomba, el nivel del agua que bajó, o una fuga en la tubería.",
    causeTech: "Abatimiento del nivel dinámico, desgaste de impulsores o fuga en columna.",
    action: "Mide el nivel del pozo y la presión a la salida. Si el nivel bajó, reduce el bombeo; si no, revisa impulsores.",
    severity: "watch",
  },
  {
    id: "sand",
    symptom: "El agua sale con arena o turbia",
    symptomTech: "Presencia de sólidos / arena en el agua",
    cause: "El ademe o el cedazo del pozo puede estar dañado, o la bomba está muy abajo.",
    causeTech: "Falla de ademe/cedazo o sobre-bombeo arrastrando finos.",
    action: "No sigas bombeando fuerte: la arena desgasta la bomba. Programa una revisión del ademe.",
    severity: "urgent",
  },
  {
    id: "frequent-starts",
    symptom: "La bomba prende y apaga muy seguido",
    symptomTech: "Ciclado corto (arranques frecuentes)",
    cause: "Suele ser el tanque hidroneumático sin aire o un sensor de presión mal ajustado.",
    causeTech: "Precarga incorrecta del tanque o presóstato desajustado.",
    action: "Cada arranque desgasta el motor. Revisa la precarga del tanque y el presóstato; suaviza los arranques.",
    severity: "watch",
  },
  {
    id: "high-amps",
    symptom: "Sube el recibo de luz sin regar más",
    symptomTech: "Consumo eléctrico elevado a igual caudal",
    cause: "La bomba trabaja forzada: desgaste, obstrucción o más profundidad de bombeo.",
    causeTech: "Aumento de carga por desgaste hidráulico o mayor nivel dinámico.",
    action: "Compara consumo vs. caudal. Si el kWh por m³ subió, agenda mantenimiento antes de la temporada alta.",
    severity: "watch",
  },
  {
    id: "no-water",
    symptom: "La bomba prende pero no sale agua",
    symptomTech: "Bomba opera sin descarga",
    cause: "El nivel del agua quedó por debajo de la bomba, se descebó, o hay falla mecánica.",
    causeTech: "Nivel por debajo de la succión, pérdida de cebado o falla de acoplamiento.",
    action: "Apágala para no quemar el motor en seco. Verifica nivel del pozo y profundidad de la bomba.",
    severity: "urgent",
  },
];
