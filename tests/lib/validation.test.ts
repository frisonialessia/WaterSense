import { describe, it, expect } from "vitest";
import { agentSchema, ingestSchema, parseJson } from "@/lib/validation/schemas";

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("validación de entrada", () => {
  it("agentSchema acepta mensajes válidos", async () => {
    const r = await parseJson(jsonReq({ messages: [{ role: "user", content: "hola" }] }), agentSchema);
    expect(r.ok).toBe(true);
  });

  it("agentSchema rechaza lista vacía", async () => {
    const r = await parseJson(jsonReq({ messages: [] }), agentSchema);
    expect(r.ok).toBe(false);
  });

  it("ingestSchema descarta ranch_id inyectado por el cliente (anti-IDOR)", async () => {
    const r = await parseJson(
      jsonReq({ metric: "water_table_m", value: 82, ranch_id: "del-atacante" }),
      ingestSchema
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as Record<string, unknown>).ranch_id).toBeUndefined();
  });

  it("parseJson rechaza JSON inválido", async () => {
    const bad = new Request("http://localhost/api/test", { method: "POST", body: "{no-json" });
    const r = await parseJson(bad, agentSchema);
    expect(r.ok).toBe(false);
  });
});
