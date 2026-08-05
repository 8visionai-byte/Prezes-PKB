import { NextRequest } from 'next/server';
import { dodajSubskrypcje, usunSubskrypcje, kluczPubliczny } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Klucz publiczny do zapisania telefonu na powiadomienia. */
export async function GET() {
  const klucz = kluczPubliczny();
  return Response.json({ klucz, dostepne: Boolean(klucz) });
}

export async function POST(req: NextRequest) {
  try {
    const s = await req.json();
    if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) {
      return Response.json({ error: 'Nieprawidłowa subskrypcja.' }, { status: 400 });
    }
    await dodajSubskrypcje(s);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: `Nie udało się zapisać: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) await usunSubskrypcje(endpoint);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
