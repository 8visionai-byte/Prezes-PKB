import { NextRequest } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KATALOG = process.env.BAZA_WIEDZY_DIR ?? '/dane/baza-wiedzy';
const TEKSTOWE = new Set(['.txt', '.md', '.csv']);
const OBRAZY: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
const MAX_PODGLAD = 200 * 1024;

function bezpieczna(nazwa: string) {
  return path.basename(nazwa);
}

/** Podglad zawartosci pliku z bazy wiedzy: tekst inline, obrazy i PDF jako plik. */
export async function GET(req: NextRequest) {
  const nazwa = req.nextUrl.searchParams.get('nazwa');
  if (!nazwa) return Response.json({ error: 'Brak nazwy pliku.' }, { status: 400 });

  const sciezka = path.join(KATALOG, bezpieczna(nazwa));
  if (!sciezka.startsWith(path.resolve(KATALOG))) {
    return Response.json({ error: 'Nieprawidłowa nazwa pliku.' }, { status: 400 });
  }

  const rozszerzenie = path.extname(sciezka).toLowerCase();

  try {
    const info = await stat(sciezka);

    if (TEKSTOWE.has(rozszerzenie)) {
      const bufor = await readFile(sciezka);
      const tresc = bufor.subarray(0, MAX_PODGLAD).toString('utf8');
      return Response.json({
        typ: 'tekst',
        tresc,
        obciety: info.size > MAX_PODGLAD,
        rozmiar: info.size,
      });
    }

    if (OBRAZY[rozszerzenie]) {
      const bufor = await readFile(sciezka);
      return new Response(new Uint8Array(bufor), {
        headers: { 'Content-Type': OBRAZY[rozszerzenie], 'Cache-Control': 'private, max-age=60' },
      });
    }

    if (rozszerzenie === '.pdf') {
      const bufor = await readFile(sciezka);
      return new Response(new Uint8Array(bufor), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(bezpieczna(nazwa))}"`,
        },
      });
    }

    return Response.json({
      typ: 'brak-podgladu',
      komunikat: 'Tego formatu nie da się pokazać w przeglądarce. Asystent i tak go przeczyta.',
      rozmiar: info.size,
    });
  } catch {
    return Response.json({ error: 'Nie znaleziono pliku.' }, { status: 404 });
  }
}
