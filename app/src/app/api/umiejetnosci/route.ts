export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERMES_URL = process.env.HERMES_API_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = process.env.HERMES_API_KEY ?? '';

/** Lista umiejetnosci agenta. Zrodlo: GET /v1/skills w API Hermesa. */
export async function GET() {
  if (!HERMES_KEY) {
    return Response.json({ error: 'Brak konfiguracji po stronie serwera.' }, { status: 500 });
  }
  try {
    const res = await fetch(`${HERMES_URL}/v1/skills`, {
      headers: { Authorization: `Bearer ${HERMES_KEY}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return Response.json({ error: `Asystent odpowiedział błędem ${res.status}` }, { status: 502 });
    }
    const dane = await res.json();
    const lista = Array.isArray(dane) ? dane : (dane?.data ?? dane?.skills ?? []);
    return Response.json({ umiejetnosci: lista });
  } catch (e) {
    return Response.json(
      { error: `Nie udało się połączyć z asystentem: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}
