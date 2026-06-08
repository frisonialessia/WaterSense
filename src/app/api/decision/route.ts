// POST /api/decision — runs the tariff decision engine server-side.
import { NextRequest, NextResponse } from "next/server";
import { decideIrrigation } from "@/lib/brain/decisionEngine";
import { decisionSchema, parseJson } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, decisionSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(decideIrrigation(parsed.data));
}
