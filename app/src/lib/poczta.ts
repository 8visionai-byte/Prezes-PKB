import { readFile, writeFile, mkdir, readdir, unlink, chmod, rename } from 'node:fs/promises';
import path from 'node:path';

/**
 * Poczta prezesa przez Gmail API.
 *
 * SWIADOME OGRANICZENIE UPRAWNIEN: prosimy wylacznie o zakres `gmail.send`.
 * Wedlug dokumentacji Google to zakres "wrazliwy", a nie "zastrzezony", i pozwala
 * TYLKO wysylac w imieniu uzytkownika. Asystent nie moze czytac skrzynki prezesa,
 * przegladac watkow ani niczego kasowac. Mniej uprawnien = latwiejsza zgoda i mniejsze ryzyko.
 *
 * Zadna wiadomosc nie wychodzi sama. Agent tworzy wersje robocza, prezes ja czyta
 * i dopiero jego klikniecie w aplikacji wysyla maila.
 */

const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK_TOKENOW = path.join(KATALOG, 'poczta.json');
const KATALOG_DRAFTOW = path.join(KATALOG, 'drafty');

export const ZAKRES = 'https://www.googleapis.com/auth/gmail.send';

const ID = process.env.GOOGLE_CLIENT_ID ?? '';
const SEKRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const PRZEKIEROWANIE = process.env.POCZTA_REDIRECT_URL ?? '';

export const pocztaSkonfigurowana = () => Boolean(ID && SEKRET && PRZEKIEROWANIE);

type Polaczenie = {
  refreshToken: string;
  adres: string;
  podlaczono: string;
};

/** Wersja robocza maila, ktora agent zostawia prezesowi do akceptacji. */
export type Draft = {
  id: string;
  do: string;
  temat: string;
  tresc: string;
  kontekst?: string;
  utworzony: string;
  wyslany?: string;
};

async function zapiszPolaczenie(p: Polaczenie) {
  await mkdir(KATALOG, { recursive: true });
  // Token odswiezajacy to sekret: prawa 600 nadajemy PRZED podmiana nazwy,
  // zeby ani przez chwile nie lezal czytelny dla innych.
  await zapiszAtomowo(PLIK_TOKENOW, JSON.stringify(p, null, 2), 0o600);
}

export async function wczytajPolaczenie(): Promise<Polaczenie | null> {
  try {
    return JSON.parse(await readFile(PLIK_TOKENOW, 'utf8'));
  } catch {
    return null;
  }
}

export async function rozlacz() {
  await unlink(PLIK_TOKENOW).catch(() => {});
}

/** Adres, pod ktory wysylamy prezesa, zeby zatwierdzil dostep do swojej skrzynki. */
export function adresZgody(stan: string) {
  const q = new URLSearchParams({
    client_id: ID,
    redirect_uri: PRZEKIEROWANIE,
    response_type: 'code',
    scope: ZAKRES,
    access_type: 'offline', // bez tego nie dostaniemy tokenu odswiezajacego
    prompt: 'consent', // wymusza wydanie nowego tokenu odswiezajacego
    include_granted_scopes: 'true',
    state: stan,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** Zamienia jednorazowy kod z Google na trwale polaczenie ze skrzynka. */
export async function odbierzKod(kod: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: kod,
      client_id: ID,
      client_secret: SEKRET,
      redirect_uri: PRZEKIEROWANIE,
      grant_type: 'authorization_code',
    }),
  });
  const dane = await res.json();
  if (!res.ok || !dane.refresh_token) {
    throw new Error(
      dane.error_description ??
        dane.error ??
        'Google nie odesłało tokenu odświeżającego. Odłącz aplikację w koncie Google i spróbuj raz jeszcze.',
    );
  }

  const adres = await pobierzAdres(dane.access_token);
  await zapiszPolaczenie({ refreshToken: dane.refresh_token, adres, podlaczono: new Date().toISOString() });
  return adres;
}

/** Swiezy token dostepowy. Google wydaje go na godzine, wiec bierzemy nowy przy kazdej wysylce. */
async function swiezyToken(): Promise<string> {
  const p = await wczytajPolaczenie();
  if (!p) throw new Error('Skrzynka nie jest podłączona.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: p.refreshToken,
      client_id: ID,
      client_secret: SEKRET,
      grant_type: 'refresh_token',
    }),
  });
  const dane = await res.json();
  if (!res.ok || !dane.access_token) {
    // Najczestsza przyczyna: aplikacja jest w trybie testowym Google (token wazny 7 dni)
    // albo uzytkownik zmienil haslo do konta Google.
    throw new Error('Połączenie ze skrzynką wygasło. Podłącz ją ponownie na stronie Poczta.');
  }
  return dane.access_token;
}

/** Adres skrzynki, ktora wlasnie podlaczono. Bez czytania poczty: to tylko profil konta. */
async function pobierzAdres(accessToken: string) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return 'nieznany adres';
  return (await res.json()).emailAddress ?? 'nieznany adres';
}

const base64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Naglowek z polskimi znakami musi byc zakodowany, inaczej temat przyjdzie jako krzaki. */
const naglowekUtf8 = (tekst: string) =>
  /^[\x20-\x7E]*$/.test(tekst) ? tekst : `=?UTF-8?B?${Buffer.from(tekst, 'utf8').toString('base64')}?=`;

function zbudujWiadomosc(d: Pick<Draft, 'do' | 'temat' | 'tresc'>) {
  const naglowki = [
    `To: ${d.do}`,
    `Subject: ${naglowekUtf8(d.temat)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ];
  const cialo = Buffer.from(d.tresc, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
  return `${naglowki.join('\r\n')}\r\n\r\n${cialo}`;
}

/** Wysylka. Wolana WYLACZNIE po kliknieciu prezesa w aplikacji, nigdy automatycznie. */
export async function wyslijMaila(d: Pick<Draft, 'do' | 'temat' | 'tresc'>) {
  const token = await swiezyToken();
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64url(Buffer.from(zbudujWiadomosc(d), 'utf8')) }),
  });
  const dane = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(dane?.error?.message ?? `Gmail odmówił wysyłki (kod ${res.status}).`);
  }
  return dane.id as string;
}

// --- wersje robocze ---

export async function listaDraftow(): Promise<Draft[]> {
  try {
    const pliki = (await readdir(KATALOG_DRAFTOW)).filter((n) => n.endsWith('.json'));
    const wczytane = await Promise.all(
      pliki.map(async (n) => {
        try {
          const d = JSON.parse(await readFile(path.join(KATALOG_DRAFTOW, n), 'utf8'));
          return { ...d, id: n.replace(/\.json$/, '') } as Draft;
        } catch {
          return null;
        }
      }),
    );
    return wczytane
      .filter((d): d is Draft => Boolean(d?.do))
      .sort((a, b) => (b.utworzony ?? '').localeCompare(a.utworzony ?? ''));
  } catch {
    return [];
  }
}

/**
 * Zapis przez plik tymczasowy i podmiane nazwy.
 *
 * Powod nie jest kosmetyczny: wersje robocze zaklada AGENT (uzytkownik 10000),
 * a poprawki prezesa zapisuje APLIKACJA (uzytkownik 1001). Nadpisanie cudzego pliku
 * wprost konczy sie bledem "brak uprawnien". Podmiana nazwy wymaga prawa do KATALOGU,
 * ktore aplikacja ma, wiec dziala zawsze. Przy okazji nie zostawia polowicznych plikow.
 */
async function zapiszAtomowo(sciezka: string, tresc: string, tryb?: number) {
  const tymczasowy = `${sciezka}.${process.pid}.tmp`;
  await writeFile(tymczasowy, tresc, 'utf8');
  if (tryb !== undefined) await chmod(tymczasowy, tryb).catch(() => {});
  await rename(tymczasowy, sciezka);
}

export async function zapiszDraft(d: Draft) {
  await mkdir(KATALOG_DRAFTOW, { recursive: true });
  const { id, ...reszta } = d;
  await zapiszAtomowo(path.join(KATALOG_DRAFTOW, `${id}.json`), JSON.stringify(reszta, null, 2), 0o664);
}

export async function wczytajDraft(id: string): Promise<Draft | null> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null; // zadnego wychodzenia z katalogu
  try {
    const d = JSON.parse(await readFile(path.join(KATALOG_DRAFTOW, `${id}.json`), 'utf8'));
    return { ...d, id };
  } catch {
    return null;
  }
}

export async function usunDraft(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return;
  await unlink(path.join(KATALOG_DRAFTOW, `${id}.json`)).catch(() => {});
}
