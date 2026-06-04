"use client";

import { C, radius, fz } from "@/lib/theme";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      className="no-print"
      onClick={() => window.print()}
      style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
