// POST /api/agent — the field assistant.
// Works with ZERO config: without ANTHROPIC_API_KEY it answers with the
// local rule-based brain over the (simulated) repository data. With the key
// set, it uses Claude to reason freely. The key never reaches the browser.
import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/lib/data/repository";
import { localAgentAnswer } from "@/lib/brain/localAgent";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    const lastUser = [...(messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";

    // live farm context from the repository (real data once Supabase is wired)
    const [parcels, wells, costs] = await Promise.all([
      repository.getParcels(),
      repository.getWells(),
      repository.getCosts(),
    ]);

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // No key → local fallback so the PoC always works.
    if (!apiKey) {
      return NextResponse.json({ text: localAgentAnswer(lastUser, { parcels, wells, costs }), mode: "local" });
    }

    const system = `Eres el asistente de WaterSense para un agricultor de Chihuahua. Responde claro y breve (2-4 frases), en español, sin jerga.
PARCELAS: ${parcels.map((p) => `${p.name} (${p.crop}, ${p.hectares}ha, sed ${(p.stress * 100).toFixed(0)}%)`).join("; ")}.
POZOS: ${wells.map((w) => `${w.name} (${w.currentFlowLph}/${w.sustainableFlowLph} L/h, ${w.ok ? "bien" : "sobre el límite"})`).join("; ")}.
Recuerda: todos los datos son simulados (demostración). Si te preguntan algo fuera de estos datos, acláralo con honestidad.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system,
          messages,
        }),
      });
      const data = await res.json();
      const text =
        (data.content ?? [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n") || localAgentAnswer(lastUser, { parcels, wells, costs });
      return NextResponse.json({ text, mode: "claude" });
    } catch {
      // network/API failure → still answer locally
      return NextResponse.json({ text: localAgentAnswer(lastUser, { parcels, wells, costs }), mode: "local" });
    }
  } catch {
    return NextResponse.json({ error: "Solicitud inválida al asistente." }, { status: 400 });
  }
}
