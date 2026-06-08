// POST /api/aquifer — runs the aquifer projection model server-side.
import { NextRequest, NextResponse } from "next/server";
import { projectAquifer, type AquiferInputs } from "@/lib/brain/aquiferModel";
import { aquiferSchema, parseJson } from "@/lib/validation/schemas";

const DEFAULTS: Omit<
  AquiferInputs,
  "extractionFactor" | "neighbors" | "rainReuse" | "drainReuse" | "rechargeMAR" | "wastewaterReuse" | "runoffCapture"
> = {
  startLevelM: 78,
  criticalLevelM: 140,
  rechargeMPerYear: 2.2,
  baseExtractionM: 3.4,
  neighborDrawM: 0.9,
  horizonYears: 30,
  baseYear: new Date().getFullYear(),
};

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, aquiferSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;
  const inputs: AquiferInputs = {
    ...DEFAULTS,
    extractionFactor: body.extractionFactor ?? 1,
    neighbors: body.neighbors ?? 3,
    rainReuse: body.rainReuse ?? 0,
    drainReuse: body.drainReuse ?? 0,
    rechargeMAR: body.rechargeMAR ?? 0,
    wastewaterReuse: body.wastewaterReuse ?? 0,
    runoffCapture: body.runoffCapture ?? 0,
  };
  return NextResponse.json(projectAquifer(inputs));
}
