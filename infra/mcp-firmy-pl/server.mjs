#!/usr/bin/env node
/**
 * Serwer MCP "firmy-PL" - twarde dane o polskich firmach dla Asystenta PKB.
 *
 * Zrodla (wszystkie darmowe, bez rejestracji i bez kluczy):
 *  - Biala lista podatnikow VAT (Ministerstwo Finansow): wl-api.mf.gov.pl
 *  - Krajowy Rejestr Sadowy (Ministerstwo Sprawiedliwosci): api-krs.ms.gov.pl
 *
 * Protokol: MCP po stdio (JSON-RPC, linia po linii). Zero zaleznosci npm celowo -
 * mniej powierzchni ataku i nic do aktualizowania.
 *
 * Limity do zapamietania: biala lista pozwala na 100 zapytan metoda "search" dziennie.
 * Po przekroczeniu blokada do polnocy.
 */

const LOG = (msg) => process.stderr.write(`[firmy-pl] ${msg}\n`);

// ---------------------------------------------------------------- pomocnicze

async function pobierzJson(url, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'asystent-pkb/1.0', Accept: 'application/json' },
    });
    const tekst = await res.text();
    if (!res.ok) {
      return { blad: `HTTP ${res.status}`, tresc: tekst.slice(0, 500) };
    }
    try {
      return JSON.parse(tekst);
    } catch {
      return { blad: 'odpowiedz nie jest poprawnym JSON', tresc: tekst.slice(0, 500) };
    }
  } catch (e) {
    return { blad: e.name === 'AbortError' ? 'przekroczono czas oczekiwania' : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

const oczyscNip = (nip) => String(nip || '').replace(/[^0-9]/g, '');
const oczyscKrs = (krs) => String(krs || '').replace(/[^0-9]/g, '').padStart(10, '0');
const dzisiaj = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- zrodla

async function bialaListaPoNip(nip) {
  const czysty = oczyscNip(nip);
  if (czysty.length !== 10) {
    return { blad: `NIP musi miec 10 cyfr, dostalem: "${nip}"` };
  }
  const url = `https://wl-api.mf.gov.pl/api/search/nip/${czysty}?date=${dzisiaj()}`;
  const dane = await pobierzJson(url);
  if (dane.blad) return { zrodlo: 'biala lista VAT', ...dane };

  const p = dane?.result?.subject;
  if (!p) {
    return {
      zrodlo: 'biala lista VAT',
      znaleziono: false,
      uwaga: 'Brak podmiotu o tym NIP w wykazie. Firma moze byc niezarejestrowana do VAT albo NIP jest bledny.',
    };
  }
  return {
    zrodlo: 'biala lista VAT (Ministerstwo Finansow)',
    znaleziono: true,
    nazwa: p.name,
    nip: p.nip,
    statusVat: p.statusVat,
    regon: p.regon,
    krs: p.krs,
    adresSiedziby: p.workingAddress || p.residenceAddress,
    dataRejestracjiVat: p.registrationLegalDate,
    dataWykresleniaVat: p.removalDate || null,
    podstawaWykreslenia: p.removalBasis || null,
    podstawaOdmowyRejestracji: p.registrationDenialBasis || null,
    reprezentanci: p.representatives || [],
    wspolnicy: p.partners || [],
    rachunkiBankowe: p.accountNumbers || [],
    dataSprawdzenia: dzisiaj(),
  };
}

async function krsOdpis(numerKrs, rodzaj = 'aktualny', rejestr = 'P') {
  const krs = oczyscKrs(numerKrs);
  if (krs.length !== 10) return { blad: `Numer KRS musi miec 10 cyfr, dostalem: "${numerKrs}"` };
  const sciezka = rodzaj === 'pelny' ? 'OdpisPelny' : 'OdpisAktualny';
  const url = `https://api-krs.ms.gov.pl/api/krs/${sciezka}/${krs}?rejestr=${rejestr}&format=json`;
  const dane = await pobierzJson(url, 35000);
  if (dane.blad) return { zrodlo: 'KRS', ...dane };
  if (!dane?.odpis) return { zrodlo: 'KRS', znaleziono: false, uwaga: 'Brak odpisu dla tego numeru KRS w rejestrze przedsiebiorcow.' };
  return { zrodlo: 'KRS (Ministerstwo Sprawiedliwosci)', znaleziono: true, ...dane };
}

/** Skrot najwazniejszych rzeczy z odpisu KRS, zeby nie zasypywac agenta calym JSON-em. */
function streszczKrs(odpisPelnyJson) {
  const o = odpisPelnyJson?.odpis;
  if (!o) return null;
  const dane = o.dane || {};
  const dzial1 = dane.dzial1 || {};
  const dzial2 = dane.dzial2 || {};
  const dzial3 = dane.dzial3 || {};
  const dzial4 = dane.dzial4 || {};
  const dzial6 = dane.dzial6 || {};

  return {
    numerKRS: o.naglowekA?.numerKRS,
    stanZDnia: o.naglowekA?.stanZDnia,
    dataRejestracjiWKRS: o.naglowekA?.dataRejestracjiWKRS,
    nazwa: dzial1.danePodmiotu?.nazwa,
    formaPrawna: dzial1.danePodmiotu?.formaPrawna,
    nip: dzial1.danePodmiotu?.identyfikatory?.nip,
    regon: dzial1.danePodmiotu?.identyfikatory?.regon,
    adres: dzial1.siedzibaIAdres?.adres,
    kapitalZakladowy: dzial1.kapital?.wysokoscKapitaluZakladowego,
    organReprezentacji: dzial2.reprezentacja || null,
    wspolnicy: dzial1.wspolnicy || null,
    przedmiotDzialalnosci: dzial3.przedmiotDzialalnosci || null,
    sprawozdaniaFinansowe: dzial3.wzmiankiOZlozonychDokumentach || null,
    zaleglosciPodatkowe: dzial4.zaleglosciPodatkowe || null,
    zaleglosciZus: dzial4.zaleglosciCelneZus || null,
    wierzyciele: dzial4.wierzytelnosci || null,
    postepowanieUpadlosciowe: dzial6.informacjaOPostepowaniuUpadlosciowym || null,
    likwidacja: dzial6.likwidacja || null,
    postepowanieNaprawcze: dzial6.informacjaOPostepowaniuNaprawczym || null,
  };
}

// ---------------------------------------------------------------- narzedzia

const NARZEDZIA = [
  {
    name: 'firma_po_nip',
    description:
      'Sprawdza polska firme po numerze NIP w Bialej liscie podatnikow VAT. Zwraca: pelna nazwe, status VAT (Czynny/Zwolniony/brak), REGON, numer KRS, adres siedziby, date rejestracji VAT oraz oficjalne rachunki bankowe. Uzyj tego ZAWSZE jako pierwszego kroku, gdy masz NIP - zwrocony numer KRS podaj potem do narzedzia krs_odpis.',
    inputSchema: {
      type: 'object',
      properties: { nip: { type: 'string', description: 'NIP firmy, 10 cyfr (mysliniki i spacje sa ignorowane)' } },
      required: ['nip'],
    },
  },
  {
    name: 'krs_odpis',
    description:
      'Pobiera odpis z Krajowego Rejestru Sadowego po numerze KRS. Zwraca streszczenie najwazniejszych danych: zarzad i sposob reprezentacji, wspolnicy, kapital zakladowy, przedmiot dzialalnosci PKD, zlozone sprawozdania finansowe oraz CZERWONE FLAGI: zaleglosci podatkowe, zaleglosci ZUS, wierzyciele, upadlosc, likwidacja, postepowanie naprawcze.',
    inputSchema: {
      type: 'object',
      properties: {
        krs: { type: 'string', description: 'Numer KRS, 10 cyfr (wiodace zera sa dopisywane automatycznie)' },
        rodzaj: { type: 'string', enum: ['aktualny', 'pelny'], description: 'aktualny = stan obecny (domyslnie), pelny = z cala historia wpisow' },
        pelnyJson: { type: 'boolean', description: 'true zwraca surowy, bardzo dlugi JSON zamiast streszczenia. Uzywaj rzadko.' },
      },
      required: ['krs'],
    },
  },
  {
    name: 'firma_raport',
    description:
      'JEDNYM ZAPYTANIEM buduje komplet twardych danych o firmie po NIP: laczy Biala liste VAT z odpisem KRS. To jest najszybsza droga do przygotowania briefu przed spotkaniem. Zwraca dane rejestrowe, zarzad, kapital, PKD oraz czerwone flagi (zaleglosci, upadlosc, likwidacja).',
    inputSchema: {
      type: 'object',
      properties: { nip: { type: 'string', description: 'NIP firmy, 10 cyfr' } },
      required: ['nip'],
    },
  },
];

async function wykonajNarzedzie(nazwa, args) {
  switch (nazwa) {
    case 'firma_po_nip':
      return await bialaListaPoNip(args?.nip);

    case 'krs_odpis': {
      const surowy = await krsOdpis(args?.krs, args?.rodzaj || 'aktualny');
      if (surowy.blad || surowy.znaleziono === false) return surowy;
      if (args?.pelnyJson) return surowy;
      const skrot = streszczKrs(surowy);
      return { zrodlo: surowy.zrodlo, znaleziono: true, ...(skrot || {}) };
    }

    case 'firma_raport': {
      const vat = await bialaListaPoNip(args?.nip);
      if (vat.blad) return { etap: 'biala lista VAT', ...vat };
      if (!vat.znaleziono) return { bialaListaVat: vat, krs: null, uwaga: vat.uwaga };
      if (!vat.krs) {
        return {
          bialaListaVat: vat,
          krs: null,
          uwaga: 'Podmiot nie ma numeru KRS (najpewniej jednoosobowa dzialalnosc gospodarcza - dane sa w CEIDG, nie w KRS).',
        };
      }
      const surowy = await krsOdpis(vat.krs, 'aktualny');
      const skrot = surowy?.znaleziono ? streszczKrs(surowy) : null;
      return { bialaListaVat: vat, krs: skrot || surowy };
    }

    default:
      return { blad: `Nieznane narzedzie: ${nazwa}` };
  }
}

// ---------------------------------------------------------------- MCP po stdio

let bufor = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (kawalek) => {
  bufor += kawalek;
  let idx;
  while ((idx = bufor.indexOf('\n')) >= 0) {
    const linia = bufor.slice(0, idx).trim();
    bufor = bufor.slice(idx + 1);
    if (linia) obsluzLinie(linia);
  }
});

function wyslij(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function obsluzLinie(linia) {
  let zad;
  try {
    zad = JSON.parse(linia);
  } catch {
    LOG(`niepoprawny JSON: ${linia.slice(0, 120)}`);
    return;
  }
  const { id, method, params } = zad;
  const jestPowiadomienie = id === undefined || id === null;

  try {
    if (method === 'initialize') {
      return wyslij({
        jsonrpc: '2.0',
        id,
        result: {
          // odbijamy wersje protokolu klienta - dziala z kazda wersja Hermesa
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'firmy-pl', version: '1.0.0' },
        },
      });
    }

    if (method === 'notifications/initialized' || method === 'initialized') return;

    if (method === 'tools/list') {
      return wyslij({ jsonrpc: '2.0', id, result: { tools: NARZEDZIA } });
    }

    if (method === 'tools/call') {
      const wynik = await wykonajNarzedzie(params?.name, params?.arguments || {});
      return wyslij({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(wynik, null, 2) }],
          isError: Boolean(wynik?.blad),
        },
      });
    }

    if (method === 'ping') return wyslij({ jsonrpc: '2.0', id, result: {} });

    if (!jestPowiadomienie) {
      wyslij({ jsonrpc: '2.0', id, error: { code: -32601, message: `Nieobslugiwana metoda: ${method}` } });
    }
  } catch (e) {
    LOG(`blad obslugi ${method}: ${e?.stack || e}`);
    if (!jestPowiadomienie) {
      wyslij({ jsonrpc: '2.0', id, error: { code: -32603, message: String(e?.message || e) } });
    }
  }
}

LOG('serwer firmy-PL wystartowal (biala lista VAT + KRS)');
