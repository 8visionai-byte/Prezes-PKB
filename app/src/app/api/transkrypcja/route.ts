import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Zamiana nagrania glosowego na tekst.
 *
 * DLACZEGO TU, A NIE W HERMESIE: to krok mechaniczny, nie praca agenta.
 * Rozdzielenie daje trzy rzeczy:
 *  1. prezes WIDZI rozpoznany tekst i moze go poprawic, zanim pojdzie do asystenta
 *     (przy polskich nazwiskach i numerach NIP to nie jest luksus, tylko koniecznosc),
 *  2. zmiana dostawcy transkrypcji to jedna zmienna srodowiskowa, agent zostaje nietkniety,
 *  3. OpenRouter, przez ktory chodzi model agenta, w ogole nie obsluguje dzwieku.
 */

const KLUCZ = process.env.OPENAI_API_KEY ?? '';
const MODEL = process.env.TRANSKRYPCJA_MODEL ?? 'gpt-transcribe';
const LIMIT_BAJTOW = 20 * 1024 * 1024; // ok. 20 minut mowy w opusie

/**
 * Slownik podpowiedzi. Model sam z siebie nie wie, ze "NIP" to nie "nip",
 * a "Rogiewicz" to nazwisko. To najtansza rzecz, jaka mozna zrobic dla jakosci.
 */
const PODPOWIEDZI = [
  'Partnerskie Kluby Biznesu',
  'PKB',
  'Radosław Rogiewicz',
  'NIP',
  'KRS',
  'REGON',
  'biała lista VAT',
  'brief',
  'networking',
  'dyrektor regionalny',
  'członek klubu',
  'spotkanie',
  'rekomendacja',
];

const PROMPT = `Rozmowa po polsku o firmach i klubie biznesowym. Zapisuj z polskimi znakami i interpunkcją. Słownictwo, które może wystąpić: ${PODPOWIEDZI.join(', ')}.`;

async function wyslijDoOpenAI(plik: File, zPodpowiedziami: boolean) {
  const dane = new FormData();
  dane.append('file', plik);
  dane.append('model', MODEL);
  dane.append('response_format', 'json');
  if (zPodpowiedziami) {
    dane.append('language', 'pl');
    dane.append('prompt', PROMPT);
  }

  return fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KLUCZ}` },
    body: dane,
  });
}

export async function POST(req: NextRequest) {
  if (!KLUCZ) {
    return Response.json(
      { error: 'Dyktowanie nie jest jeszcze skonfigurowane po stronie serwera.' },
      { status: 503 },
    );
  }

  try {
    const formularz = await req.formData();
    const nagranie = formularz.get('nagranie');
    if (!(nagranie instanceof File)) {
      return Response.json({ error: 'Brak nagrania.' }, { status: 400 });
    }
    if (nagranie.size === 0) {
      return Response.json({ error: 'Nagranie jest puste. Powiedz coś i spróbuj jeszcze raz.' }, { status: 400 });
    }
    if (nagranie.size > LIMIT_BAJTOW) {
      return Response.json({ error: 'Nagranie jest za długie. Podziel je na krótsze kawałki.' }, { status: 413 });
    }

    let res = await wyslijDoOpenAI(nagranie, true);

    // Nie kazdy model transkrypcji przyjmuje te same parametry dodatkowe.
    // Gdy odrzuci podpowiedzi, powtarzamy bez nich, zeby dyktowanie po prostu dzialalo.
    if (res.status === 400) {
      res = await wyslijDoOpenAI(nagranie, false);
    }

    const wynik = await res.json().catch(() => ({}));
    if (!res.ok) {
      const powod = wynik?.error?.message ?? `kod ${res.status}`;
      return Response.json({ error: `Nie udało się rozpoznać mowy: ${powod}` }, { status: 502 });
    }

    return Response.json({ tekst: (wynik.text ?? '').trim() });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/** Interfejs pyta o to, zeby nie pokazywac mikrofonu, ktory i tak nie zadziala. */
export async function GET() {
  return Response.json({ skonfigurowane: Boolean(KLUCZ), model: KLUCZ ? MODEL : null });
}
