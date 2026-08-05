import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLIK = path.join(process.env.DANE_DIR ?? '/dane/aplikacja', 'rozmowy.json');

/** Pelna tresc jednej rozmowy - pobierana dopiero po kliknieciu w historie. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dane = JSON.parse(await readFile(PLIK, 'utf8'));
    const rozmowa = Array.isArray(dane) ? dane.find((r) => r.id === id) : null;
    if (!rozmowa) return Response.json({ error: 'Nie znaleziono rozmowy.' }, { status: 404 });
    return Response.json({ rozmowa });
  } catch {
    return Response.json({ error: 'Nie znaleziono rozmowy.' }, { status: 404 });
  }
}
