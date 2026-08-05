import { NextRequest } from 'next/server';

/**
 * Proxy do Hermesa. Klucz API NIGDY nie trafia do przeglądarki -
 * przeglądarka rozmawia tylko z tym endpointem, a on z agentem po localhost.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERMES_URL = process.env.HERMES_API_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = process.env.HERMES_API_KEY ?? '';

export async function POST(req: NextRequest) {
  if (!HERMES_KEY) {
    return new Response(JSON.stringify({ error: 'Brak HERMES_API_KEY na serwerze aplikacji.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { messages?: Array<{ role: string; content: unknown }> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Nieprawidłowe zapytanie.' }), { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Brak wiadomości.' }), { status: 400 });
  }

  const upstream = await fetch(`${HERMES_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HERMES_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'hermes-agent', messages, stream: true }),
  }).catch((e) => {
    throw new Error(`Nie udało się połączyć z asystentem: ${e?.message ?? e}`);
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: `Asystent odpowiedział błędem ${upstream.status}`, detail: detail.slice(0, 500) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Przepuszczamy strumień SSE bez buforowania, żeby tekst pojawiał się na żywo.
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
