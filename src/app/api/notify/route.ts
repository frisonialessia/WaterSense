// POST /api/notify — envía una alerta por WhatsApp/SMS (Twilio). PLANTILLA.
// Seguro por defecto: si Twilio no está configurado, NO envía nada y devuelve
// el texto que SE ENVIARÍA (preview), para que la UI lo muestre en el demo.
//
// Para activar el envío real, pon en .env.local:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   (o un From de SMS)
// y manda { to: "+52...", body: "..." }.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let payload: { to?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const body = (payload.body ?? "").trim();
  if (!body) return NextResponse.json({ error: "Falta 'body'" }, { status: 400 });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = payload.to;

  // Sin credenciales o sin destinatario → modo preview (no envía).
  if (!sid || !token || !from || !to) {
    return NextResponse.json({ sent: false, preview: body, reason: !to ? "sin destinatario" : "Twilio no configurado" });
  }

  const isWhatsApp = from.startsWith("whatsapp:");
  const toAddr = isWhatsApp ? `whatsapp:${to}` : to;
  const params = new URLSearchParams({ To: toAddr, From: from, Body: body });

  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ sent: false, error: data?.message ?? "Twilio error" }, { status: 502 });
    return NextResponse.json({ sent: true, sid: data.sid });
  } catch (e) {
    return NextResponse.json({ sent: false, error: String(e) }, { status: 502 });
  }
}
