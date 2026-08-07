'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { LogoPKB } from './LogoPKB';
import { PanelUzytkownika } from './PanelUzytkownika';

type Naglowek = { id: string; tytul: string; zmieniona: number; pracuje?: boolean };

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const POZYCJE = [
  { adres: '/poczta', nazwa: 'Poczta', ikona: 'M4 4h16v16H4zM4 7l8 6 8-6' },
  { adres: '/dokumenty', nazwa: 'Dokumenty', ikona: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6' },
  {
    adres: '/ustawienia',
    nazwa: 'Ustawienia',
    ikona: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  },
];

function kiedy(z: number) {
  const min = Math.round((Date.now() - z) / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const g = Math.round(min / 60);
  if (g < 24) return `${g} godz. temu`;
  const d = Math.round(g / 24);
  return d === 1 ? 'wczoraj' : `${d} dni temu`;
}

function TrescNawigacji() {
  const sciezka = usePathname();
  const parametry = useSearchParams();
  const router = useRouter();
  const aktywnaRozmowa = parametry.get('rozmowa');

  const [otwarte, setOtwarte] = useState(false);
  const [historia, setHistoria] = useState<Naglowek[]>([]);
  const [szukaj, setSzukaj] = useState('');
  const [panelUzytkownika, setPanelUzytkownika] = useState(false);

  const odswiez = useCallback(async () => {
    try {
      const r = await fetch('/api/rozmowy');
      if (r.ok) setHistoria((await r.json()).rozmowy ?? []);
    } catch { /* panel boczny nie moze wywrocic aplikacji */ }
  }, []);

  useEffect(() => {
    void odswiez();
    const naZmiane = () => void odswiez();
    window.addEventListener('pkb-odswiez', naZmiane);
    return () => window.removeEventListener('pkb-odswiez', naZmiane);
  }, [odswiez]);

  // Gdy asystent nad czyms pracuje, odswiezamy liste co 3 sekundy, zeby kropka
  // zgasla sama w chwili, gdy odpowiedz bedzie gotowa. Poza tym cisza.
  const cospracuje = historia.some((r) => r.pracuje);
  useEffect(() => {
    if (!cospracuje) return;
    const tik = window.setInterval(() => void odswiez(), 3000);
    return () => window.clearInterval(tik);
  }, [cospracuje, odswiez]);

  useEffect(() => setOtwarte(false), [sciezka, aktywnaRozmowa]);

  async function usunRozmowe(id: string) {
    await fetch('/api/rozmowy', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await odswiez();
    if (aktywnaRozmowa === id) nowaRozmowa();
  }

  /**
   * Nowa rozmowa naprawde zaczyna od zera.
   * Samo przejscie pod "/" nie wystarczalo: gdy prezes juz tam byl, nic sie nie dzialo.
   * Dlatego dodatkowo wysylamy sygnal, na ktory ekran czatu czysci watek.
   */
  const nowaRozmowa = useCallback(() => {
    router.push('/');
    window.dispatchEvent(new CustomEvent('pkb-nowa-rozmowa'));
    setOtwarte(false);
  }, [router]);

  const znalezione = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    if (!q) return historia;
    return historia.filter((r) => r.tytul.toLowerCase().includes(q));
  }, [historia, szukaj]);

  const pozycjaKlasa = (aktywna: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors duration-150 ${
      aktywna ? 'bg-pkb-active text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-hover hover:text-pkb-text'
    }`;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-pkb-border-soft bg-pkb-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button onClick={() => setOtwarte(true)} aria-label="Otwórz menu" className="grid size-9 place-items-center rounded-lg border border-pkb-border text-pkb-muted transition hover:text-pkb-gold">
          <I d="M4 6h16M4 12h16M4 18h16" />
        </button>
        <LogoPKB szerokosc={124} />
      </div>

      {otwarte ? <button aria-label="Zamknij menu" onClick={() => setOtwarte(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" /> : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-pkb-border-soft bg-pkb-panel',
          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0',
          otwarte ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="shrink-0 px-5 pb-3 pt-5">
          <LogoPKB szerokosc={162} />
        </div>

        <button
          onClick={() => setPanelUzytkownika(true)}
          className="mx-4 flex shrink-0 items-center gap-3 rounded-xl border border-pkb-border-soft bg-pkb-surface/60 px-3 py-2.5 text-left transition hover:border-pkb-copper/60 hover:bg-pkb-hover"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pkb-copper/20 text-[13px] font-semibold text-pkb-gold">RR</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-medium">Radosław Rogiewicz</span>
            <span className="block text-[11.5px] text-pkb-faint">Prezes PKB</span>
          </span>
          <I d="M6 9l6 6 6-6" />
        </button>

        <div className="shrink-0 px-3 pt-4">
          <button
            onClick={nowaRozmowa}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pkb-gold px-3 py-2.5 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
          >
            <I d="M12 5v14M5 12h14" />
            Nowa rozmowa
          </button>
        </div>

        {/* Szukanie w historii. Im dluzej prezes korzysta, tym wazniejsze. */}
        <div className="relative shrink-0 px-3 pt-3">
          <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-pkb-faint">
            <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </span>
          <input
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Szukaj w rozmowach"
            aria-label="Szukaj w rozmowach"
            className="w-full rounded-lg border border-pkb-border-soft bg-pkb-surface/50 py-2 pl-9 pr-8 text-[13px] outline-none transition-colors placeholder:text-pkb-faint focus:border-pkb-copper"
          />
          {szukaj ? (
            <button
              onClick={() => setSzukaj('')}
              aria-label="Wyczyść"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-pkb-faint transition hover:text-pkb-text"
            >
              ×
            </button>
          ) : null}
        </div>

        {/* Historia rozmow: jedyna rzecz, ktora rosnie, wiec tylko ona sie przewija. */}
        <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-2" aria-label="Historia rozmów">
          {znalezione.length === 0 ? (
            <p className="px-3 py-4 text-[12.5px] leading-relaxed text-pkb-faint">
              {szukaj ? 'Nic nie pasuje do tego, czego szukasz.' : 'Tu pojawią się rozmowy i briefy o firmach.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {znalezione.map((r) => (
                <li key={r.id} className="group relative">
                  <Link
                    href={`/?rozmowa=${r.id}`}
                    className={`block rounded-lg py-2 pl-3 pr-9 transition-colors duration-150 ${
                      aktywnaRozmowa === r.id
                        ? 'bg-pkb-active text-pkb-gold'
                        : 'text-pkb-muted hover:bg-pkb-hover hover:text-pkb-text'
                    }`}
                  >
                    <span className="block truncate text-[13px]">{r.tytul}</span>
                    {r.pracuje ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-pkb-gold">
                        <span className="flex gap-[3px]">
                          <i className="pkb-kropka size-[4px] rounded-full bg-pkb-gold" />
                          <i className="pkb-kropka size-[4px] rounded-full bg-pkb-gold [animation-delay:0.18s]" />
                          <i className="pkb-kropka size-[4px] rounded-full bg-pkb-gold [animation-delay:0.36s]" />
                        </span>
                        asystent pracuje
                      </span>
                    ) : (
                      <span className="block text-[11px] text-pkb-faint">{kiedy(r.zmieniona)}</span>
                    )}
                  </Link>
                  <button
                    onClick={() => void usunRozmowe(r.id)}
                    aria-label={`Usuń rozmowę: ${r.tytul}`}
                    className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100"
                  >
                    <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="shrink-0 border-t border-pkb-border-soft px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {POZYCJE.map((p) => (
              <li key={p.adres}>
                <Link href={p.adres} className={pozycjaKlasa(sciezka === p.adres)}>
                  <I d={p.ikona} />
                  {p.nazwa}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href="https://simplefast.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block px-3 py-1.5 text-[11px] text-pkb-faint transition hover:text-pkb-copper"
          >
            zasilany przez SimpleFast AI
          </a>
        </div>
      </aside>

      {panelUzytkownika ? <PanelUzytkownika zamknij={() => setPanelUzytkownika(false)} /> : null}
    </>
  );
}

function SzkieletPanelu() {
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-pkb-border-soft bg-pkb-bg/90 px-4 py-2.5 lg:hidden">
        <div className="size-9 rounded-lg border border-pkb-border" />
        <LogoPKB szerokosc={124} />
      </div>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[272px] flex-col border-r border-pkb-border-soft bg-pkb-panel lg:flex">
        <div className="px-5 pb-3 pt-5">
          <LogoPKB szerokosc={162} />
        </div>
        <div className="mx-4 h-[58px] rounded-xl border border-pkb-border-soft bg-pkb-surface/60" />
        <div className="px-3 pt-4">
          <div className="h-[42px] rounded-lg bg-pkb-gold/80" />
        </div>
      </aside>
    </>
  );
}

export function Nawigacja() {
  return (
    <Suspense fallback={<SzkieletPanelu />}>
      <TrescNawigacji />
    </Suspense>
  );
}
