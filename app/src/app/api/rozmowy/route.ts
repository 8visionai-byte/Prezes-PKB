import { NextRequest } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Historia rozmow trzymana NA SERWERZE, nie w przegladarce.
 * Dzieki temu prezes widzi te same rozmowy na komputerze i na telefonie.
 * Jeden plik JSON w katalogu danych: prosto, czytelnie, latwo zrobic kopie.
 */
const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK = path.join(KATALOG, 'rozmowy.json');
const LIMIT = 100;

type Wiadomosc = { rola: 'user' | 'assistant'; tresc: string };
type Rozmowa = { id: string; tytul: string; zmieniona: number; wiadomosci: Wiadomosc[] };

async function wczytaj(): Promise<Rozmowa[]> {
  try {
    const surowe = await readFile(PLIK, 'utf8');
    const dane = JSON.parse(surowe);
    return Array.isArray(dane) ? dane : [];
  } catch {
    return [];
  }
}

async function zapisz(lista: Rozmowa[]) {
  await mkdir(KATALOG, { recursive: true });
  await writeFile(PLIK, JSON.stringify(lista.slice(0, LIMIT), null, 2), 'utf8');
}

export async function GET() {
  try {
    const rozmowy = await wczytaj();
    // Do listy nie wysylamy calych rozmow, tylko naglowki - szybciej sie laduje.
    return Response.json({
      rozmowy: rozmowy.map((r) => ({ id: r.id, tytul: r.tytul, zmieniona: r.zmieniona })),
    });
  } catch (e) {
    return Response.json({ error: `Nie udało się odczytać historii: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rozmowa = (await req.json()) as Rozmowa;
    if (!rozmowa?.id || !Array.isArray(rozmowa.wiadomosci)) {
      return Response.json({ error: 'Nieprawidłowa rozmowa.' }, { status: 400 });
    }
    const wszystkie = await wczytaj();
    const bez = wszystkie.filter((r) => r.id !== rozmowa.id);
    bez.unshift(rozmowa);
    bez.sort((a, b) => b.zmieniona - a.zmieniona);
    await zapisz(bez);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: `Nie udało się zapisać: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'Brak identyfikatora.' }, { status: 400 });
    const wszystkie = await wczytaj();
    await zapisz(wszystkie.filter((r) => r.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: `Nie udało się usunąć: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}
