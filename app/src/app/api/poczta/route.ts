import { NextRequest } from 'next/server';
import { listaDraftow, pocztaSkonfigurowana, rozlacz, usunDraft, wczytajDraft, wczytajPolaczenie, zapiszDraft } from '@/lib/poczta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Stan poczty: czy skrzynka podlaczona i jakie wersje robocze czekaja na prezesa. */
export async function GET() {
  const polaczenie = await wczytajPolaczenie();
  return Response.json({
    skonfigurowana: pocztaSkonfigurowana(),
    podlaczona: Boolean(polaczenie),
    adres: polaczenie?.adres ?? null,
    podlaczono: polaczenie?.podlaczono ?? null,
    drafty: await listaDraftow(),
  });
}

/** Pusta wiadomosc, ktora prezes pisze sam, bez udzialu asystenta. */
export async function POST() {
  const id = `wlasny-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  await zapiszDraft({
    id,
    do: '',
    temat: '',
    tresc: '',
    kontekst: 'Wiadomość napisana przez Ciebie.',
    utworzony: new Date().toISOString(),
  });
  return Response.json({ id });
}

/** Zapis poprawek prezesa w wersji roboczej. Nie wysyla niczego. */
export async function PUT(req: NextRequest) {
  const { id, do: adresat, temat, tresc } = await req.json();
  if (!id || !adresat || !temat) {
    return Response.json({ error: 'Brakuje adresata albo tematu.' }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return Response.json({ error: 'Nieprawidłowy identyfikator.' }, { status: 400 });
  }
  // Zachowujemy to, co juz bylo (kontekst od agenta, data powstania),
  // zeby poprawka prezesa nie kasowala historii wiadomosci.
  const poprzedni = await wczytajDraft(id);
  if (poprzedni?.wyslany) {
    return Response.json({ error: 'Ten mail został już wysłany.' }, { status: 409 });
  }
  await zapiszDraft({
    ...poprzedni,
    id,
    do: adresat,
    temat,
    tresc: tresc ?? '',
    utworzony: poprzedni?.utworzony ?? new Date().toISOString(),
  });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id, rozlaczSkrzynke } = await req.json();
  if (rozlaczSkrzynke) {
    await rozlacz();
    return Response.json({ ok: true });
  }
  if (!id) return Response.json({ error: 'Brak identyfikatora.' }, { status: 400 });
  await usunDraft(id);
  return Response.json({ ok: true });
}
