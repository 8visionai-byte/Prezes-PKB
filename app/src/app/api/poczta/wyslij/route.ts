import { NextRequest } from 'next/server';
import { usunDraft, wczytajDraft, wyslijMaila, zapiszDraft } from '@/lib/poczta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * JEDYNE miejsce w całej aplikacji, które faktycznie wysyła maila.
 * Wołane tylko z przycisku, który klika prezes. Agent nie ma tu dostępu:
 * on potrafi jedynie zostawić wersję roboczą w katalogu draftów.
 */
export async function POST(req: NextRequest) {
  try {
    const { id, potwierdzenie } = await req.json();

    if (potwierdzenie !== 'wyslij') {
      return Response.json({ error: 'Brak potwierdzenia wysyłki.' }, { status: 400 });
    }

    const draft = await wczytajDraft(id);
    if (!draft) return Response.json({ error: 'Nie znaleziono wersji roboczej.' }, { status: 404 });
    if (draft.wyslany) return Response.json({ error: 'Ten mail został już wysłany.' }, { status: 409 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.do)) {
      return Response.json({ error: `Adres "${draft.do}" nie wygląda na poprawny.` }, { status: 400 });
    }

    await wyslijMaila(draft);

    // Slad po wysylce zostaje: prezes widzi, co i kiedy poszlo.
    await zapiszDraft({ ...draft, wyslany: new Date().toISOString() });
    return Response.json({ ok: true, do: draft.do });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** Sprzatanie: usuniecie wyslanego maila z listy. */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await usunDraft(id);
  return Response.json({ ok: true });
}
