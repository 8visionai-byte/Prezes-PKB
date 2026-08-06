import { readFile, writeFile, mkdir, rename, chmod } from 'node:fs/promises';
import path from 'node:path';

/**
 * Personalizacja asystenta: jak ma się zwracać do prezesa i co ma o nim wiedzieć.
 *
 * Trzymane po stronie serwera, nie w przeglądarce, bo to musi działać tak samo
 * na telefonie i na komputerze. Trafia do agenta jako wiadomość systemowa
 * doklejana na początek KAŻDEJ rozmowy. Dzięki temu nie ruszamy konfiguracji
 * Hermesa i nie trzeba go restartować, żeby zmiana zadziałała.
 */

const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK = path.join(KATALOG, 'personalizacja.json');

export type Personalizacja = {
  zwrot: string;
  oMnie: string;
  wskazowki: string;
};

export const DOMYSLNA: Personalizacja = {
  zwrot: 'Panie Prezesie',
  oMnie: '',
  wskazowki: '',
};

const LIMIT = 2000;

export async function wczytajPersonalizacje(): Promise<Personalizacja> {
  try {
    return { ...DOMYSLNA, ...JSON.parse(await readFile(PLIK, 'utf8')) };
  } catch {
    return DOMYSLNA;
  }
}

export async function zapiszPersonalizacje(p: Personalizacja) {
  await mkdir(KATALOG, { recursive: true });
  const czyste: Personalizacja = {
    zwrot: String(p.zwrot ?? '').slice(0, 120).trim(),
    oMnie: String(p.oMnie ?? '').slice(0, LIMIT).trim(),
    wskazowki: String(p.wskazowki ?? '').slice(0, LIMIT).trim(),
  };
  const tymczasowy = `${PLIK}.${process.pid}.tmp`;
  await writeFile(tymczasowy, JSON.stringify(czyste, null, 2), 'utf8');
  await chmod(tymczasowy, 0o664).catch(() => {});
  await rename(tymczasowy, PLIK);
  return czyste;
}

/**
 * Zamienia ustawienia prezesa na jedną wiadomość systemową dla agenta.
 * Zwraca null, gdy nie ma czego przekazywać: wtedy nie zaśmiecamy promptu.
 */
export function naWiadomoscSystemowa(p: Personalizacja): string | null {
  const czesci: string[] = [];

  if (p.zwrot && p.zwrot !== DOMYSLNA.zwrot) {
    czesci.push(`Zwracaj się do użytkownika dokładnie tak: "${p.zwrot}". Trzymaj się tego w każdej odpowiedzi.`);
  }
  if (p.oMnie) czesci.push(`Kim jest użytkownik: ${p.oMnie}`);
  if (p.wskazowki) czesci.push(`Jak z nim pracować: ${p.wskazowki}`);

  return czesci.length ? czesci.join('\n\n') : null;
}
