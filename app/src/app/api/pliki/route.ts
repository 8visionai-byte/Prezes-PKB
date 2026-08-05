import { NextRequest } from 'next/server';
import { readdir, writeFile, stat, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Baza wiedzy: katalog wspoldzielony z agentem.
 * Aplikacja zapisuje tu pliki, agent czyta je swoimi narzedziami plikowymi.
 */
const KATALOG = process.env.BAZA_WIEDZY_DIR ?? '/dane/baza-wiedzy';
const MAX_BAJTOW = 20 * 1024 * 1024;
const DOZWOLONE = new Set(['.pdf', '.txt', '.md', '.csv', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.webp']);

/** Odcina sciezki i znaki, ktorymi mozna by wyjsc poza katalog. */
function bezpiecznaNazwa(nazwa: string) {
  return path
    .basename(nazwa)
    .replace(/[^\p{L}\p{N}. _-]/gu, '_')
    .slice(0, 120);
}

export async function GET() {
  try {
    await mkdir(KATALOG, { recursive: true });
    const nazwy = await readdir(KATALOG);
    const pliki = await Promise.all(
      nazwy.map(async (n) => {
        const s = await stat(path.join(KATALOG, n));
        return { nazwa: n, rozmiar: s.size, zmieniony: s.mtime.toISOString() };
      }),
    );
    pliki.sort((a, b) => b.zmieniony.localeCompare(a.zmieniony));
    return Response.json({ pliki });
  } catch (e) {
    return Response.json({ error: `Nie udało się odczytać bazy: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const dane = await req.formData();
    const plik = dane.get('plik');
    if (!(plik instanceof File)) {
      return Response.json({ error: 'Brak pliku w zapytaniu.' }, { status: 400 });
    }
    if (plik.size > MAX_BAJTOW) {
      return Response.json({ error: 'Plik jest za duży. Limit to 20 MB.' }, { status: 413 });
    }
    const nazwa = bezpiecznaNazwa(plik.name || 'plik');
    const rozszerzenie = path.extname(nazwa).toLowerCase();
    if (!DOZWOLONE.has(rozszerzenie)) {
      return Response.json(
        { error: `Nieobsługiwany typ pliku (${rozszerzenie || 'brak rozszerzenia'}).` },
        { status: 415 },
      );
    }

    await mkdir(KATALOG, { recursive: true });
    const bajty = Buffer.from(await plik.arrayBuffer());
    const docelowa = path.join(KATALOG, nazwa);
    if (!docelowa.startsWith(path.resolve(KATALOG))) {
      return Response.json({ error: 'Nieprawidłowa nazwa pliku.' }, { status: 400 });
    }
    await writeFile(docelowa, bajty);
    return Response.json({ ok: true, nazwa, rozmiar: bajty.length });
  } catch (e) {
    return Response.json({ error: `Nie udało się zapisać: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { nazwa } = await req.json();
    if (typeof nazwa !== 'string' || !nazwa) {
      return Response.json({ error: 'Brak nazwy pliku.' }, { status: 400 });
    }
    const docelowa = path.join(KATALOG, bezpiecznaNazwa(nazwa));
    if (!docelowa.startsWith(path.resolve(KATALOG))) {
      return Response.json({ error: 'Nieprawidłowa nazwa pliku.' }, { status: 400 });
    }
    await unlink(docelowa);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: `Nie udało się usunąć: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}
