'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Proza } from '@/components/Proza';
import { PodgladPliku } from '@/components/PodgladPliku';
import { TytulPowitalny } from '@/components/TytulPowitalny';
import { Pandy } from '@/components/Pandy';
import { Powiadomienia } from '@/components/Powiadomienia';
import { KartaPliku } from '@/components/KartaPliku';
import { PasekNagrywania, PrzyciskMikrofonu } from '@/components/PasekNagrywania';
import { useDyktowanie } from '@/lib/dyktowanie';
import { ZachetaPWA } from '@/components/ZachetaPWA';

type Wiadomosc = { rola: 'user' | 'assistant'; tresc: string; pliki?: string[] };

const SCIEZKA_BAZY = '/opt/data/profiles/prezes-test/workspace/baza-wiedzy';

function Czat() {
  const parametry = useSearchParams();
  const rozmowaZUrl = parametry.get('rozmowa');

  const [id, setId] = useState('');
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState('');
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [zalaczniki, setZalaczniki] = useState<string[]>([]);
  const [wysylaPlik, setWysylaPlik] = useState(false);
  const [podglad, setPodglad] = useState<string | null>(null);

  const dolRef = useRef<HTMLDivElement>(null);
  const poleRef = useRef<HTMLTextAreaElement>(null);
  const plikRef = useRef<HTMLInputElement>(null);
  const odpytywanie = useRef<number | null>(null);

  const nowyId = () => `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const dyktowanie = useDyktowanie((rozpoznane) => {
    // Dopisujemy do tego, co juz jest w polu. Prezes czyta i poprawia,
    // nic nie leci do asystenta bez jego klikniecia.
    setTekst((t) => (t.trim() ? `${t.trim()} ${rozpoznane}` : rozpoznane));
    poleRef.current?.focus();
  });
  const nagrywamy = dyktowanie.stan === 'nagrywa' || dyktowanie.stan === 'rozpoznaje';

  /**
   * Pole rosnie razem z tekstem. Liczymy wysokosc z ZAWARTOSCI, a nie w obsludze
   * pisania: inaczej wklejony tekst i tekst z dyktowania nie powiekszaly pola
   * i prezes widzial tylko dwie linijki.
   */
  useEffect(() => {
    const pole = poleRef.current;
    if (!pole) return;
    pole.style.height = 'auto';
    pole.style.height = `${Math.min(pole.scrollHeight, 280)}px`;
  }, [tekst]);

  useEffect(() => {
    if (!rozmowaZUrl) {
      setId(nowyId());
      setWiadomosci([]);
      return;
    }
    fetch(`/api/rozmowy/${encodeURIComponent(rozmowaZUrl)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? 'Nie udało się wczytać rozmowy.');
        setId(d.rozmowa.id);
        setWiadomosci(d.rozmowa.wiadomosci ?? []);
      })
      .catch((e) => setBlad(e instanceof Error ? e.message : String(e)));
  }, [rozmowaZUrl]);

  useEffect(() => {
    dolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [wiadomosci, pracuje]);

  useEffect(() => {
    const naPodglad = (e: Event) => setPodglad((e as CustomEvent<string>).detail);
    const naDolacz = (e: Event) => {
      setZalaczniki((z) => [...new Set([...z, (e as CustomEvent<string>).detail])]);
      poleRef.current?.focus();
    };
    // "Nowa rozmowa" ma naprawde czyscic watek, takze gdy prezes juz jest na tym ekranie.
    const naNowa = () => {
      if (odpytywanie.current) window.clearInterval(odpytywanie.current);
      odpytywanie.current = null;
      setId(nowyId());
      setWiadomosci([]);
      setZalaczniki([]);
      setTekst('');
      setBlad(null);
      setPracuje(false);
    };
    window.addEventListener('pkb-podglad', naPodglad);
    window.addEventListener('pkb-dolacz', naDolacz);
    window.addEventListener('pkb-nowa-rozmowa', naNowa);
    return () => {
      window.removeEventListener('pkb-podglad', naPodglad);
      window.removeEventListener('pkb-dolacz', naDolacz);
      window.removeEventListener('pkb-nowa-rozmowa', naNowa);
    };
  }, []);

  useEffect(() => () => {
    if (odpytywanie.current) window.clearInterval(odpytywanie.current);
  }, []);

  const sledzZadanie = useCallback((idZadania: string, widoczne: Wiadomosc[]) => {
    if (odpytywanie.current) window.clearInterval(odpytywanie.current);
    odpytywanie.current = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/zadania/${idZadania}`);
        if (!r.ok) return;
        const z = await r.json();
        if (z.tresc) {
          setWiadomosci([...widoczne, { rola: 'assistant', tresc: z.tresc, pliki: z.nowePliki ?? [] }]);
        }
        if (z.status !== 'pracuje') {
          if (odpytywanie.current) window.clearInterval(odpytywanie.current);
          odpytywanie.current = null;
          setPracuje(false);
          if (z.status === 'blad') setBlad(z.blad ?? 'Coś poszło nie tak.');
          window.dispatchEvent(new CustomEvent('pkb-odswiez'));
        }
      } catch { /* chwilowy brak sieci */ }
    }, 900);
  }, []);

  async function wgrajPlik(plik: File) {
    setBlad(null);
    setWysylaPlik(true);
    try {
      const dane = new FormData();
      dane.append('plik', plik);
      const r = await fetch('/api/pliki', { method: 'POST', body: dane });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      setZalaczniki((z) => [...new Set([...z, d.nazwa])]);
      window.dispatchEvent(new CustomEvent('pkb-odswiez'));
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    } finally {
      setWysylaPlik(false);
      if (plikRef.current) plikRef.current.value = '';
    }
  }

  async function wyslij() {
    const pytanie = tekst.trim();
    if ((!pytanie && zalaczniki.length === 0) || pracuje) return;

    setBlad(null);
    setTekst('');
    if (poleRef.current) poleRef.current.style.height = 'auto';

    const doModelu =
      zalaczniki.length > 0
        ? `${pytanie}\n\n[Dołączone pliki: ${zalaczniki.map((n) => `${SCIEZKA_BAZY}/${n}`).join(', ')}. Przeczytaj je, jeśli są potrzebne.]`
        : pytanie;

    const widoczne: Wiadomosc[] = [
      ...wiadomosci,
      { rola: 'user', tresc: pytanie, pliki: zalaczniki.length ? [...zalaczniki] : undefined },
    ];
    const kontekst: Wiadomosc[] = [...wiadomosci, { rola: 'user', tresc: doModelu }];

    setWiadomosci([...widoczne, { rola: 'assistant', tresc: '' }]);
    setZalaczniki([]);
    setPracuje(true);

    try {
      const tytul = (widoczne.find((m) => m.rola === 'user')?.tresc ?? 'Nowa rozmowa').replace(/\s+/g, ' ').slice(0, 60);
      const r = await fetch('/api/zadania', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rozmowaId: id, tytul, kontekst, widoczne }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      sledzZadanie(d.id, widoczne);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
      setWiadomosci(widoczne);
      setPracuje(false);
    }
  }

  const pusto = wiadomosci.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 lg:px-8">
      {/* Napis, pasek z pandami i dzwonek. Na telefonie pandy schodza pod tytul,
          na duzym ekranie ida obok niego i wypelniaja wolne miejsce. */}
      <header className="flex flex-wrap items-center gap-x-5 gap-y-1 py-4 lg:py-6">
        <TytulPowitalny />
        <div className="order-3 min-w-0 basis-full lg:order-2 lg:basis-0 lg:grow">
          <Pandy />
        </div>
        <div className="order-2 ml-auto lg:order-3 lg:ml-0">
          <Powiadomienia />
        </div>
      </header>

      <ZachetaPWA />

      <main className="flex-1 pb-6">
        {pusto ? (
          <p className="pkb-wejscie max-w-lg pt-4 text-[15.5px] leading-relaxed text-pkb-muted">
            Podaj NIP albo nazwę firmy, a przygotuję brief przed spotkaniem: dane z rejestrów,
            czerwone flagi, co słychać w firmie i z kim z klubu ją skojarzyć.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {wiadomosci.map((m, i) => {
              const ostatnia = i === wiadomosci.length - 1;

              if (m.rola === 'user') {
                return (
                  <li key={i} className="flex flex-col items-end gap-1.5">
                    <p className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-pkb-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
                      {m.tresc}
                    </p>
                    {m.pliki?.length ? (
                      <span className="text-[11.5px] text-pkb-faint">załączniki: {m.pliki.join(', ')}</span>
                    ) : null}
                  </li>
                );
              }

              return (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-pkb-copper/40 bg-pkb-copper/10 text-[10px] font-semibold tracking-wider text-pkb-gold">
                    PKB
                  </span>
                  <div className="min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-md border border-pkb-border-soft bg-pkb-surface/45 px-4 py-3">
                    {m.tresc ? <Proza tresc={m.tresc} /> : null}
                    {ostatnia && pracuje ? (
                      m.tresc ? (
                        <span className="pkb-kursor" aria-hidden />
                      ) : (
                        <span className="pkb-puls text-[14px] text-pkb-muted">Sprawdzam w rejestrach i w sieci...</span>
                      )
                    ) : null}
                    {m.pliki?.map((n) => (
                      <KartaPliku key={n} nazwa={n} otworz={setPodglad} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pracuje ? (
          <p className="mt-4 text-[12.5px] text-pkb-faint">
            Możesz zamknąć aplikację. Asystent pracuje dalej i da znać, gdy skończy.
          </p>
        ) : null}

        {blad ? (
          <p role="alert" className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {blad}
          </p>
        ) : null}
        <div ref={dolRef} />
      </main>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-pkb-bg via-pkb-bg to-transparent px-4 pb-4 pt-3 lg:-mx-8 lg:px-8">
        {zalaczniki.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {zalaczniki.map((n) => (
              <span key={n} className="flex items-center gap-2 rounded-lg border border-pkb-copper/40 bg-pkb-copper/10 px-2.5 py-1 text-[12.5px] text-pkb-gold">
                <button onClick={() => setPodglad(n)} className="underline underline-offset-2">{n}</button>
                <button onClick={() => setZalaczniki((z) => z.filter((x) => x !== n))} aria-label={`Odepnij ${n}`} className="text-pkb-muted transition hover:text-pkb-text">×</button>
              </span>
            ))}
          </div>
        ) : null}

        {dyktowanie.blad ? (
          <p role="alert" className="mb-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-[12.5px] text-red-200">
            {dyktowanie.blad}
          </p>
        ) : null}

        <input
          ref={plikRef}
          type="file"
          className="sr-only"
          onChange={(e) => { const p = e.target.files?.[0]; if (p) void wgrajPlik(p); }}
          accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.png,.jpg,.jpeg,.webp,.html"
        />

        {nagrywamy ? (
          <PasekNagrywania
            poziomy={dyktowanie.poziomy}
            sekundy={dyktowanie.sekundy}
            rozpoznaje={dyktowanie.stan === 'rozpoznaje'}
            anuluj={dyktowanie.anuluj}
            zatwierdz={dyktowanie.zatwierdz}
          />
        ) : (
        <div className="flex items-end gap-2 rounded-2xl border border-pkb-border bg-pkb-surface/90 p-2 backdrop-blur transition-colors focus-within:border-pkb-copper">
          <button
            onClick={() => plikRef.current?.click()}
            disabled={wysylaPlik}
            aria-label="Dołącz dokument"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-gold disabled:opacity-40"
          >
            {wysylaPlik ? <span className="pkb-puls text-[11px]">...</span> : (
              <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>
          <textarea
            ref={poleRef}
            rows={1}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void wyslij();
              }
            }}
            placeholder="Napisz wiadomość albo wklej NIP..."
            aria-label="Treść wiadomości"
            className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[15px] leading-relaxed outline-none placeholder:text-pkb-faint"
          />
          {dyktowanie.stan === 'gotowy' ? <PrzyciskMikrofonu start={() => void dyktowanie.start()} /> : null}
          <button
            onClick={() => void wyslij()}
            disabled={pracuje || (!tekst.trim() && zalaczniki.length === 0)}
            aria-label="Wyślij wiadomość"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-pkb-gold text-pkb-bg transition duration-200 hover:bg-pkb-gold-strong disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
        )}
      </div>

      {podglad ? <PodgladPliku nazwa={podglad} zamknij={() => setPodglad(null)} /> : null}
    </div>
  );
}

/** Pierwsza klatka czatu: naglowek i pole na wiadomosc sa na miejscu od razu. */
function SzkieletCzatu() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 lg:px-8" aria-busy>
      <header className="py-5 lg:py-7">
        <div className="h-[30px] w-56 rounded-md bg-pkb-surface/50" />
        <div className="mt-2 h-[14px] w-40 rounded bg-pkb-surface/30" />
      </header>
      <main className="flex-1">
        <div className="mt-4 h-[18px] w-full max-w-lg rounded bg-pkb-surface/30" />
        <div className="mt-2 h-[18px] w-4/5 max-w-lg rounded bg-pkb-surface/20" />
      </main>
      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 lg:-mx-8 lg:px-8">
        <div className="h-[60px] rounded-2xl border border-pkb-border bg-pkb-surface/70" />
      </div>
    </div>
  );
}

export default function Strona() {
  return (
    <Suspense fallback={<SzkieletCzatu />}>
      <Czat />
    </Suspense>
  );
}
