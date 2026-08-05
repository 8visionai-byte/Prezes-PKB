import { NextRequest } from 'next/server';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Katalog skilli profilu, zamontowany tylko do odczytu. */
const KATALOG = process.env.SKILLE_DIR ?? '/skille';
const MAX = 40 * 1024;

/** Szuka SKILL.md danej umiejetnosci: albo w katalogu glownym, albo w podkategorii. */
async function znajdz(nazwa: string): Promise<string | null> {
  const bezpieczna = path.basename(nazwa);
  const wprost = path.join(KATALOG, bezpieczna, 'SKILL.md');
  try {
    await readFile(wprost);
    return wprost;
  } catch { /* szukamy glebiej */ }

  try {
    const kategorie = await readdir(KATALOG, { withFileTypes: true });
    for (const k of kategorie) {
      if (!k.isDirectory()) continue;
      const kandydat = path.join(KATALOG, k.name, bezpieczna, 'SKILL.md');
      try {
        await readFile(kandydat);
        return kandydat;
      } catch { /* szukamy dalej */ }
    }
  } catch { /* brak katalogu */ }
  return null;
}

export async function GET(req: NextRequest) {
  const nazwa = req.nextUrl.searchParams.get('nazwa');
  if (!nazwa) return Response.json({ error: 'Brak nazwy umiejętności.' }, { status: 400 });

  const sciezka = await znajdz(nazwa);
  if (!sciezka || !sciezka.startsWith(path.resolve(KATALOG))) {
    return Response.json({ error: 'Nie znaleziono opisu tej umiejętności.' }, { status: 404 });
  }

  try {
    const surowe = (await readFile(sciezka, 'utf8')).slice(0, MAX);
    // Odcinamy naglowek YAML - dla czytajacego to szum techniczny.
    const tresc = surowe.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    return Response.json({ tresc, obciety: surowe.length >= MAX });
  } catch (e) {
    return Response.json({ error: `Nie udało się odczytać: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}
