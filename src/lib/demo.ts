// Reinicia la demo: borra todo lo que el usuario editó (vive en localStorage)
// y recarga, volviendo a los datos sembrados pristinos. Clave para enseñar la
// demo varias veces sin que un visitante anterior la deje en mal estado.
export function resetDemo() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("watersense."))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.location.reload();
}
