// POST /api/agent — the field assistant.
// Runs server-side so ANTHROPIC_API_KEY never reaches the browser.
import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/lib/data/SimulatedRepository";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en las variables de entorno." },
      { status: 500 }
    );
  }

  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    // build live farm context from the repository (real data once Supabase is wired)
    const [parcels, wells] = await Promise.all([
      repository.getParcels(),
      repository.getWells(),
    ]);
    const context = `Eres el asistente de WaterSense para un agricultor de Chihuahua. Responde claro y breve (2-4 frases), en español.
PARCELAS: ${parcels
      .map((p) => `${p.name} (${p.crop}, ${p.hectares}ha, sed ${(p.stress * 100).toFixed(0)}%)`)
      .join("; ")}.
POZOS: ${wells
      .map((w) => `${w.name} (${w.currentFlowLph}/${w.sustainableFlowLph} L/h, ${w.ok ? "bien" : "sobre el límite"})`)
      .join("; ")}.
Si te preguntan algo fuera de estos datos, acláralo con honestidad.`;

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
        system: context,
        messages,
      }),
    });

    const data = await res.json();
    const text =
      (data.content ?? [])
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n") || "No pude responder ahora mismo.";

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Error consultando al asistente." }, { status: 500 });
  }
}
