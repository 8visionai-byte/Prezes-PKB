import { NextRequest } from 'next/server';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { utworzZadanie, aktualizujTresc, zakonczZadanie, trwajace } from '@/lib/zadania';
import { wyslijPowiadomienie } from '@/lib/push';
import { naWiadomoscSystemowa, wczytajPersonalizacje } from '@/lib/personalizacja';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERMES_URL = process.env.HERMES_API_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = process.env.HERMES_API_KEY ?? '';
const KATALOG = process.env.DANE_DIR ?? '/dane/aplikacja';
const PLIK_ROZMOW = path.join(KATALOG, 'rozmowy.json');
const BAZA = process.env.BAZA_WIEDZY_DIR ?? '/dane/baza-wiedzy';

/** Lista plikow w bazie wiedzy - do porownania przed i po zadaniu. */
async function spisPlikow(): Promise<string[]> {
  try {
    return await readdir(BAZA);
  } catch {
    return [];
  }
}

type Wiadomosc = { rola: 'user' | 'assistant'; tresc: string; pliki?: string[] };

/**
 * Agent czasem podaje pelna sciezke systemowa do zapisanego pliku.
 * Prezesowi nic ona nie mowi, a wyglada jak usterka - zostawiamy sama nazwe pliku.
 */
function bezSciezekSystemowych(tekst: string) {
  return tekst.replace(/\/opt\/data\/profiles\/[^/\s]+\/workspace\/baza-wiedzy\//g, '');
}

/** Dopisuje gotowa odpowiedz do historii rozmow, zeby nie zginela po zamknieciu aplikacji. */
async function dopiszDoHistorii(rozmowaId: string, tytul: string, wiadomosci: Wiadomosc[]) {
  try {
    await mkdir(KATALOG, { recursive: true });
    let wszystkie: { id: string; tytul: string; zmieniona: number; wiadomosci: Wiadomosc[] }[] = [];
    try {
      const d = JSON.parse(await readFile(PLIK_ROZMOW, 'utf8'));
      if (Array.isArray(d)) wszystkie = d;
    } catch { /* pierwsza rozmowa */ }

    const bez = wszystkie.filter((r) => r.id !== rozmowaId);
    bez.unshift({ id: rozmowaId, tytul, zmieniona: Date.now(), wiadomosci });
    bez.sort((a, b) => b.zmieniona - a.zmieniona);
    await writeFile(PLIK_ROZMOW, JSON.stringify(bez.slice(0, 100), null, 2), 'utf8');
  } catch { /* historia nie moze wywrocic zadania */ }
}

/**
 * Prowadzi rozmowe z agentem W TLE.
 * Celowo nie jest awaitowane w handlerze: odpowiedz HTTP wraca od razu,
 * a ta funkcja zyje dalej w procesie serwera, nawet gdy przegladarka sie rozlaczy.
 */
async function prowadzZadanie(
  idZadania: string,
  rozmowaId: string,
  tytul: string,
  kontekst: Wiadomosc[],
  widoczne: Wiadomosc[],
) {
  const plikiPrzed = new Set(await spisPlikow());
  try {
    // Personalizacja od prezesa idzie na sam poczatek jako wiadomosc systemowa.
    // Dzieki temu zmiana "zwracaj sie do mnie po imieniu" dziala od nastepnej
    // wiadomosci, bez ruszania konfiguracji agenta i bez restartu Hermesa.
    const wstep = naWiadomoscSystemowa(await wczytajPersonalizacje());
    const wiadomosci = [
      ...(wstep ? [{ role: 'system', content: wstep }] : []),
      ...kontekst.map((m) => ({ role: m.rola, content: m.tresc })),
    ];

    const res = await fetch(`${HERMES_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HERMES_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'hermes-agent', messages: wiadomosci, stream: true }),
    });

    if (!res.ok || !res.body) {
      const detal = await res.text().catch(() => '');
      throw new Error(`Asystent odpowiedział błędem ${res.status}. ${detal.slice(0, 200)}`);
    }

    const czytnik = res.body.getReader();
    const dekoder = new TextDecoder();
    let bufor = '';
    let odpowiedz = '';

    for (;;) {
      const { done, value } = await czytnik.read();
      if (done) break;
      bufor += dekoder.decode(value, { stream: true });
      const linie = bufor.split('\n');
      bufor = linie.pop() ?? '';
      for (const linia of linie) {
        const l = linia.trim();
        if (!l.startsWith('data:')) continue;
        const dane = l.slice(5).trim();
        if (!dane || dane === '[DONE]') continue;
        try {
          const kawalek = JSON.parse(dane)?.choices?.[0]?.delta?.content ?? '';
          if (kawalek) {
            odpowiedz += kawalek;
            void aktualizujTresc(idZadania, bezSciezekSystemowych(odpowiedz));
          }
        } catch { /* niekompletna paczka */ }
      }
    }

    const finalna = bezSciezekSystemowych(odpowiedz) || 'Asystent nie zwrócił odpowiedzi.';
    await aktualizujTresc(idZadania, finalna);
    const nowePliki = (await spisPlikow()).filter((n) => !plikiPrzed.has(n));
    await zakonczZadanie(idZadania, 'gotowe', undefined, nowePliki);
    // Pliki ida do historii razem z odpowiedzia: po ponownym otwarciu rozmowy
    // rysunek nadal jest widoczny jako kafelek, a nie znika.
    await dopiszDoHistorii(rozmowaId, tytul, [
      ...widoczne,
      { rola: 'assistant', tresc: finalna, ...(nowePliki.length ? { pliki: nowePliki } : {}) },
    ]);

    const zajawka = finalna.replace(/[#*`>_-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110);
    await wyslijPowiadomienie('Asystent skończył', zajawka || 'Odpowiedź jest gotowa.', `/?rozmowa=${rozmowaId}`);
  } catch (e) {
    const komunikat = e instanceof Error ? e.message : String(e);
    await zakonczZadanie(idZadania, 'blad', komunikat);
    await wyslijPowiadomienie('Asystent napotkał błąd', komunikat.slice(0, 110), `/?rozmowa=${rozmowaId}`);
  }
}

export async function GET() {
  return Response.json({ trwajace: await trwajace() });
}

export async function POST(req: NextRequest) {
  if (!HERMES_KEY) {
    return Response.json({ error: 'Brak konfiguracji po stronie serwera.' }, { status: 500 });
  }
  try {
    const { rozmowaId, tytul, kontekst, widoczne } = await req.json();
    if (!rozmowaId || !Array.isArray(kontekst) || kontekst.length === 0) {
      return Response.json({ error: 'Nieprawidłowe zapytanie.' }, { status: 400 });
    }

    const id = `z-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pytanie = kontekst[kontekst.length - 1]?.tresc ?? '';
    await utworzZadanie({ id, rozmowaId, pytanie });

    // Bez await: zadanie zyje dalej po odeslaniu odpowiedzi HTTP.
    void prowadzZadanie(id, rozmowaId, tytul || 'Nowa rozmowa', kontekst, widoczne ?? kontekst);

    return Response.json({ id });
  } catch (e) {
    return Response.json({ error: `Nie udało się uruchomić: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}
