import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import webpush from 'web-push';

/**
 * Powiadomienia na telefon (Web Push).
 * Prezes wychodzi z aplikacji, agent konczy prace, telefon dzwoni.
 */

const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK = path.join(KATALOG, 'subskrypcje.json');

const KLUCZ_PUBLICZNY = process.env.VAPID_PUBLIC_KEY ?? '';
const KLUCZ_PRYWATNY = process.env.VAPID_PRIVATE_KEY ?? '';
const KONTAKT = process.env.VAPID_KONTAKT ?? 'mailto:biuro@simplefast.ai';

let skonfigurowane = false;
function skonfiguruj() {
  if (skonfigurowane || !KLUCZ_PUBLICZNY || !KLUCZ_PRYWATNY) return;
  webpush.setVapidDetails(KONTAKT, KLUCZ_PUBLICZNY, KLUCZ_PRYWATNY);
  skonfigurowane = true;
}

export function kluczPubliczny() {
  return KLUCZ_PUBLICZNY;
}

type Subskrypcja = { endpoint: string; keys: { p256dh: string; auth: string } };

async function wczytaj(): Promise<Subskrypcja[]> {
  try {
    const d = JSON.parse(await readFile(PLIK, 'utf8'));
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

async function zapisz(lista: Subskrypcja[]) {
  await mkdir(KATALOG, { recursive: true });
  await writeFile(PLIK, JSON.stringify(lista, null, 2), 'utf8');
}

export async function dodajSubskrypcje(s: Subskrypcja) {
  const lista = await wczytaj();
  if (!lista.some((x) => x.endpoint === s.endpoint)) {
    lista.push(s);
    await zapisz(lista);
  }
}

export async function usunSubskrypcje(endpoint: string) {
  await zapisz((await wczytaj()).filter((s) => s.endpoint !== endpoint));
}

export async function wyslijPowiadomienie(tytul: string, tresc: string, url = '/') {
  skonfiguruj();
  if (!skonfigurowane) return;

  const lista = await wczytaj();
  const martwe: string[] = [];

  await Promise.all(
    lista.map(async (s) => {
      try {
        await webpush.sendNotification(s, JSON.stringify({ tytul, tresc, url }));
      } catch (e) {
        // 404 i 410 znacza, ze subskrypcja wygasla - sprzatamy ja.
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) martwe.push(s.endpoint);
      }
    }),
  );

  if (martwe.length) {
    await zapisz(lista.filter((s) => !martwe.includes(s.endpoint)));
  }
}
