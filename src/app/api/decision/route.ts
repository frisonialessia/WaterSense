// POST /api/decision — runs the tariff decision engine server-side.
import { NextRequest, NextResponse } from "next/server";
import { decideIrrigation, type DecisionInput } from "@/lib/brain/decisionEngine";

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as DecisionInput;
    const result = decideIrrigation(input);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Invalid decision input" }, { status: 400 });
  }
}
