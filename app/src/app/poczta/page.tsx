'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Draft = {
  id: string;
  do: string;
  temat: string;
  tresc: string;
  kontekst?: string;
  utworzony: string;
  wyslany?: string;
};

type Stan = {
  skonfigurowana: boolean;
  podlaczona: boolean;
  adres: string | null;
  drafty: Draft[];
};

function kiedy(iso?: string) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const g = Math.round(min / 60);
  if (g < 24) return `${g} godz. temu`;
  return `${Math.round(g / 24)} dni temu`;
}

function KartaDraftu({ d, odswiez }: { d: Draft; odswiez: () => void }) {
  const [adresat, setAdresat] = useState(d.do);
  const [temat, setTemat] = useState(d.temat);
  const [tresc, setTresc] = useState(d.tresc);
  const [pytamy, setPytamy] = useState(false);
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [zapisano, setZapisano] = useState(false);

  const zmienione = adresat !== d.do || temat !== d.temat || tresc !== d.tresc;

  async function zapisz() {
    setPracuje(true);
    setBlad(null);
    try {
      const r = await fetch('/api/poczta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id, do: adresat, temat, tresc }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'Nie udało się zapisać.');
      setZapisano(true);
      setTimeout(() => setZapisano(false), 2000);
      odswiez();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    } finally {
      setPracuje(false);
    }
  }

  async function wyslij() {
    setPracuje(true);
    setBlad(null);
    try {
      if (zmienione) {
        await fetch('/api/poczta', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: d.id, do: adresat, temat, tresc }),
        });
      }
      const r = await fetch('/api/poczta/wyslij', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id, potwierdzenie: 'wyslij' }),
      });
      const dane = await r.json();
      if (!r.ok) throw new Error(dane.error ?? 'Nie udało się wysłać.');
      setPytamy(false);
      odswiez();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
      setPytamy(false);
    } finally {
      setPracuje(false);
    }
  }

  async function usun() {
    await fetch('/api/poczta', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id }),
    });
    odswiez();
  }

  if (d.wyslany) {
    return (
      <li className="rounded-2xl border border-pkb-border-soft bg-pkb-surface/30 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-900/40 text-emerald-300">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px]">{d.temat}</p>
            <p className="mt-0.5 text-[12.5px] text-pkb-faint">
              wysłane do {d.do}, {kiedy(d.wyslany)}
            </p>
          </div>
          <button onClick={() => void usun()} className="shrink-0 text-[12px] text-pkb-faint transition hover:text-pkb-text">
            ukryj
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-pkb-border bg-pkb-surface/50 px-5 py-4">
      {d.kontekst ? <p className="mb-3 text-[12.5px] text-pkb-faint">{d.kontekst}</p> : null}

      <label className="block text-[11.5px] uppercase tracking-wider text-pkb-faint">Do</label>
      <input
        value={adresat}
        onChange={(e) => setAdresat(e.target.value)}
        className="mt-1 w-full rounded-lg border border-pkb-border bg-pkb-bg/60 px-3 py-2 text-[14px] outline-none transition-colors focus:border-pkb-copper"
      />

      <label className="mt-3 block text-[11.5px] uppercase tracking-wider text-pkb-faint">Temat</label>
      <input
        value={temat}
        onChange={(e) => setTemat(e.target.value)}
        className="mt-1 w-full rounded-lg border border-pkb-border bg-pkb-bg/60 px-3 py-2 text-[14px] outline-none transition-colors focus:border-pkb-copper"
      />

      <label className="mt-3 block text-[11.5px] uppercase tracking-wider text-pkb-faint">Treść</label>
      <textarea
        value={tresc}
        onChange={(e) => setTresc(e.target.value)}
        rows={Math.min(16, Math.max(6, tresc.split('\n').length + 1))}
        className="mt-1 w-full resize-y rounded-lg border border-pkb-border bg-pkb-bg/60 px-3 py-2 text-[14px] leading-relaxed outline-none transition-colors focus:border-pkb-copper"
      />

      {blad ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-[13px] text-red-200">
          {blad}
        </p>
      ) : null}

      {pytamy ? (
        <div className="mt-4 rounded-xl border border-pkb-gold/50 bg-pkb-gold/10 px-4 py-3">
          <p className="text-[13.5px] leading-relaxed">
            Wysłać ten mail do <strong className="text-pkb-gold">{adresat}</strong>? Tego się nie cofnie.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void wyslij()}
              disabled={pracuje}
              className="rounded-lg bg-pkb-gold px-4 py-2 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong disabled:opacity-50"
            >
              {pracuje ? 'Wysyłam...' : 'Tak, wyślij'}
            </button>
            <button
              onClick={() => setPytamy(false)}
              className="rounded-lg border border-pkb-border px-4 py-2 text-[13.5px] text-pkb-muted transition hover:text-pkb-text"
            >
              Jeszcze nie
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPytamy(true)}
            className="rounded-lg bg-pkb-gold px-4 py-2 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
          >
            Wyślij
          </button>
          <button
            onClick={() => void zapisz()}
            disabled={pracuje || !zmienione}
            className="rounded-lg border border-pkb-border px-4 py-2 text-[13.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold disabled:opacity-40"
          >
            {zapisano ? 'Zapisane' : 'Zapisz poprawki'}
          </button>
          <button
            onClick={() => void usun()}
            className="ml-auto text-[12.5px] text-pkb-faint transition hover:text-red-300"
          >
            Odrzuć
          </button>
        </div>
      )}
    </li>
  );
}

function TrescPoczty() {
  const parametry = useSearchParams();
  const [stan, setStan] = useState<Stan | null>(null);
  const [komunikat, setKomunikat] = useState<{ typ: 'ok' | 'blad'; tekst: string } | null>(null);

  const odswiez = useCallback(async () => {
    try {
      const r = await fetch('/api/poczta');
      if (r.ok) setStan(await r.json());
    } catch {
      /* strona nie moze sie wywrocic przez chwilowy brak sieci */
    }
  }, []);

  useEffect(() => {
    void odswiez();
  }, [odswiez]);

  useEffect(() => {
    const podlaczono = parametry.get('podlaczono');
    const blad = parametry.get('blad');
    if (podlaczono) setKomunikat({ typ: 'ok', tekst: `Skrzynka ${podlaczono} podłączona.` });
    else if (blad) setKomunikat({ typ: 'blad', tekst: blad });
  }, [parametry]);

  async function odlacz() {
    await fetch('/api/poczta', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rozlaczSkrzynke: true }),
    });
    setKomunikat({ typ: 'ok', tekst: 'Skrzynka odłączona.' });
    void odswiez();
  }

  const czekajace = stan?.drafty.filter((d) => !d.wyslany) ?? [];
  const wyslane = stan?.drafty.filter((d) => d.wyslany) ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Poczta</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">prezesa</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">
        Asystent przygotowuje wiadomość, Ty ją czytasz i poprawiasz. Nic nie wychodzi
        bez Twojego kliknięcia.
      </p>

      {komunikat ? (
        <p
          role="status"
          className={`mt-5 rounded-xl px-4 py-3 text-[13.5px] ${
            komunikat.typ === 'ok'
              ? 'border border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
              : 'border border-red-900/50 bg-red-950/30 text-red-200'
          }`}
        >
          {komunikat.tekst}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-pkb-border-soft bg-pkb-surface/40 px-5 py-4">
        {stan === null ? (
          <div className="h-10 animate-pulse rounded-lg bg-pkb-surface/60" aria-busy />
        ) : !stan.skonfigurowana ? (
          <>
            <p className="text-[14.5px] font-medium">Poczta czeka na konfigurację</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-pkb-muted">
              Na serwerze brakuje jeszcze danych aplikacji Google. Instrukcja krok po kroku
              jest w pliku <code className="text-pkb-gold">POCZTA_INSTRUKCJA.md</code> w repozytorium projektu.
            </p>
          </>
        ) : stan.podlaczona ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-900/40 text-emerald-300">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-medium">{stan.adres}</p>
              <p className="text-[12.5px] text-pkb-faint">
                Asystent może wysyłać z tej skrzynki. Czytać jej nie może.
              </p>
            </div>
            <button
              onClick={() => void odlacz()}
              className="rounded-lg border border-pkb-border px-3 py-1.5 text-[12.5px] text-pkb-muted transition hover:border-red-800 hover:text-red-300"
            >
              Odłącz
            </button>
          </div>
        ) : (
          <>
            <p className="text-[14.5px] font-medium">Podłącz swoją skrzynkę</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-pkb-muted">
              Google zapyta o jedno uprawnienie: wysyłanie wiadomości w Twoim imieniu.
              Asystent nie zobaczy Twojej poczty, nie przeczyta ani jednej wiadomości.
            </p>
            <a
              href="/api/poczta/polacz"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pkb-gold px-4 py-2.5 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
            >
              Podłącz skrzynkę Google
            </a>
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
          Do wysłania ({czekajace.length})
        </h2>
        {czekajace.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-pkb-border px-5 py-6 text-[13.5px] leading-relaxed text-pkb-faint">
            Nic nie czeka. Powiedz asystentowi w rozmowie: „napisz maila do tej firmy",
            a wersja robocza pojawi się tutaj.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {czekajace.map((d) => (
              <KartaDraftu key={d.id} d={d} odswiez={odswiez} />
            ))}
          </ul>
        )}
      </section>

      {wyslane.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
            Wysłane ({wyslane.length})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {wyslane.map((d) => (
              <KartaDraftu key={d.id} d={d} odswiez={odswiez} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function Poczta() {
  return (
    <Suspense fallback={null}>
      <TrescPoczty />
    </Suspense>
  );
}
