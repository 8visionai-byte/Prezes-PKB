import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Zadania po stronie SERWERA.
 *
 * Powod: wczesniej odpowiedz plynela prosto do przegladarki. Zamkniecie aplikacji
 * przerywalo generowanie. Teraz serwer prowadzi zadanie do konca niezaleznie od tego,
 * czy prezes patrzy na ekran, a po skonczeniu wysyla powiadomienie na telefon.
 */

export type StatusZadania = 'pracuje' | 'gotowe' | 'blad';

export type Zadanie = {
  id: string;
  rozmowaId: string;
  pytanie: string;
  tresc: string;
  status: StatusZadania;
  blad?: string;
  zaczete: number;
  skonczone?: number;
  /** Pliki, ktore agent stworzyl w trakcie tego zadania - pokazujemy je jako karty w czacie. */
  nowePliki?: string[];
};

const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK = path.join(KATALOG, 'zadania.json');

/** Zadania w pamieci procesu; kopia na dysku, zeby przetrwaly restart kontenera. */
const pamiec = new Map<string, Zadanie>();
let wczytane = false;

async function wczytajZDysku() {
  if (wczytane) return;
  wczytane = true;
  try {
    const dane = JSON.parse(await readFile(PLIK, 'utf8'));
    if (Array.isArray(dane)) {
      for (const z of dane as Zadanie[]) {
        // Zadanie "pracuje" po restarcie jest juz martwe - proces, ktory je prowadzil, nie zyje.
        pamiec.set(z.id, z.status === 'pracuje' ? { ...z, status: 'blad', blad: 'Przerwane restartem serwera.' } : z);
      }
    }
  } catch {
    /* brak pliku przy pierwszym uruchomieniu */
  }
}

async function zapiszNaDysk() {
  try {
    await mkdir(KATALOG, { recursive: true });
    const ostatnie = [...pamiec.values()].sort((a, b) => b.zaczete - a.zaczete).slice(0, 60);
    await writeFile(PLIK, JSON.stringify(ostatnie, null, 2), 'utf8');
  } catch {
    /* utrata kopii nie moze przerwac zadania */
  }
}

export async function utworzZadanie(z: Omit<Zadanie, 'status' | 'tresc' | 'zaczete'>): Promise<Zadanie> {
  await wczytajZDysku();
  const zadanie: Zadanie = { ...z, tresc: '', status: 'pracuje', zaczete: Date.now() };
  pamiec.set(zadanie.id, zadanie);
  void zapiszNaDysk();
  return zadanie;
}

export async function pobierzZadanie(id: string): Promise<Zadanie | null> {
  await wczytajZDysku();
  return pamiec.get(id) ?? null;
}

export async function aktualizujTresc(id: string, tresc: string) {
  const z = pamiec.get(id);
  if (!z) return;
  z.tresc = tresc;
  // Bez zapisu na dysk przy kazdym kawalku tekstu - to setki zapisow na jedna odpowiedz.
}

export async function zakonczZadanie(id: string, status: 'gotowe' | 'blad', blad?: string, nowePliki?: string[]) {
  const z = pamiec.get(id);
  if (!z) return;
  z.status = status;
  z.blad = blad;
  z.nowePliki = nowePliki;
  z.skonczone = Date.now();
  await zapiszNaDysk();
}

/** Zadania, ktore wlasnie trwaja - do wskaznika w interfejsie. */
export async function trwajace(): Promise<Zadanie[]> {
  await wczytajZDysku();
  return [...pamiec.values()].filter((z) => z.status === 'pracuje');
}
