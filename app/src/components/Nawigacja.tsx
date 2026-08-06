'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { LogoPKB } from './LogoPKB';

type Naglowek = { id: string; tytul: string; zmieniona: number };
type Plik = { nazwa: string; rozmiar: number; zmieniony: string };
type Umiejetnosc = { name?: string; description?: string };

/** Umiejetnosci zbudowane pod PKB. Ida na gore listy w panelu. */
const NASZE = ['brief-firmy', 'wizualizacja'];

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

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
  const [pliki, setPliki] = useState<Plik[]>([]);
  const [skille, setSkille] = useState<Umiejetnosc[]>([]);
  const [sekcja, setSekcja] = useState<'rozmowy' | 'dokumenty' | 'skille'>('rozmowy');
  const [wgrywa, setWgrywa] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);

  const odswiez = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([fetch('/api/rozmowy'), fetch('/api/pliki')]);
      if (r.ok) setHistoria((await r.json()).rozmowy ?? []);
      if (p.ok) setPliki((await p.json()).pliki ?? []);
    } catch { /* panel boczny nie moze wywrocic aplikacji */ }
  }, []);

  // Umiejetnosci pobieramy raz: lista zmienia sie tylko przy zmianie konfiguracji agenta.
  useEffect(() => {
    fetch('/api/umiejetnosci')
      .then(async (r) => (r.ok ? ((await r.json()).umiejetnosci ?? []) : []))
      .then((lista: Umiejetnosc[]) =>
        setSkille(
          [...lista].sort((a, b) => {
            const wa = NASZE.includes(a.name ?? '') ? 0 : 1;
            const wb = NASZE.includes(b.name ?? '') ? 0 : 1;
            return wa - wb || (a.name ?? '').localeCompare(b.name ?? '', 'pl');
          }),
        ),
      )
      .catch(() => { /* brak listy nie moze zablokowac panelu */ });
  }, []);

  useEffect(() => {
    void odswiez();
    const naZmiane = () => void odswiez();
    window.addEventListener('pkb-odswiez', naZmiane);
    return () => window.removeEventListener('pkb-odswiez', naZmiane);
  }, [odswiez]);

  useEffect(() => setOtwarte(false), [sciezka, aktywnaRozmowa]);

  async function wgraj(plik: File) {
    setWgrywa(true);
    try {
      const dane = new FormData();
      dane.append('plik', plik);
      await fetch('/api/pliki', { method: 'POST', body: dane });
      await odswiez();
      window.dispatchEvent(new CustomEvent('pkb-odswiez'));
    } finally {
      setWgrywa(false);
      if (plikRef.current) plikRef.current.value = '';
    }
  }

  async function usunRozmowe(id: string) {
    await fetch('/api/rozmowy', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await odswiez();
    if (aktywnaRozmowa === id) router.push('/');
  }

  async function usunPlik(nazwa: string) {
    await fetch('/api/pliki', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nazwa }) });
    await odswiez();
    window.dispatchEvent(new CustomEvent('pkb-odswiez'));
  }

  const pozycjaKlasa = (aktywna: boolean) =>
    `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
      aktywna ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60 hover:text-pkb-text'
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
        <div className="px-5 pb-3 pt-5">
          <LogoPKB szerokosc={162} />
        </div>

        <div className="mx-4 flex items-center gap-3 rounded-xl border border-pkb-border-soft bg-pkb-surface/60 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pkb-copper/20 text-[13px] font-semibold text-pkb-gold">RR</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13.5px] font-medium">Radosław Rogiewicz</span>
            <span className="block text-[11.5px] text-pkb-faint">Prezes PKB</span>
          </span>
        </div>

        <div className="px-3 pt-4">
          <Link href="/" className="flex items-center justify-center gap-2 rounded-lg bg-pkb-gold px-3 py-2.5 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong">
            <I d="M12 5v14M5 12h14" />
            Nowa rozmowa
          </Link>
        </div>

        {/* Stale pozycje nawigacji */}
        <nav className="px-3 pt-4">
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">Asystent</p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link href="/" className={pozycjaKlasa(sciezka === '/' && !aktywnaRozmowa)}>
                <I d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                Rozmowa
              </Link>
            </li>
            <li>
              <Link href="/umiejetnosci" className={pozycjaKlasa(sciezka === '/umiejetnosci')}>
                <I d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.8 2.8m8.4 8.4L19 19M19 5l-2.8 2.8m-8.4 8.4L5 19" />
                Rozwój asystenta
              </Link>
            </li>
            <li>
              <Link href="/poczta" className={pozycjaKlasa(sciezka === '/poczta')}>
                <I d="M4 4h16v16H4zM4 7l8 6 8-6" />
                Poczta
              </Link>
            </li>
            <li>
              <Link href="/ustawienia" className={pozycjaKlasa(sciezka === '/ustawienia')}>
                <I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                Ustawienia
              </Link>
            </li>
          </ul>
        </nav>

        {/* Rozmowy, dokumenty i umiejetnosci */}
        <div className="mt-4 flex gap-1 px-3">
          {([
            ['rozmowy', 'Rozmowy', historia.length],
            ['dokumenty', 'Dokumenty', pliki.length],
            ['skille', 'Skille', skille.length],
          ] as const).map(([s, etykieta, ile]) => (
            <button
              key={s}
              onClick={() => setSekcja(s)}
              className={`flex-1 rounded-lg px-1.5 py-1.5 text-[12px] transition ${
                sekcja === s ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60'
              }`}
            >
              {etykieta}
              {ile > 0 ? <span className="ml-1 text-pkb-faint">{ile}</span> : null}
            </button>
          ))}
        </div>

        <div className="mt-2 flex-1 overflow-y-auto px-3 pb-3">
          {sekcja === 'rozmowy' ? (
            historia.length === 0 ? (
              <p className="px-3 py-4 text-[12.5px] leading-relaxed text-pkb-faint">Tu pojawią się rozmowy i briefy o firmach.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {historia.map((r) => (
                  <li key={r.id} className="group flex items-center gap-1">
                    <Link
                      href={`/?rozmowa=${r.id}`}
                      className={`min-w-0 flex-1 rounded-lg px-3 py-2 transition ${
                        aktywnaRozmowa === r.id ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60 hover:text-pkb-text'
                      }`}
                    >
                      <span className="block truncate text-[13px]">{r.tytul}</span>
                      <span className="block text-[11px] text-pkb-faint">{kiedy(r.zmieniona)}</span>
                    </Link>
                    <button onClick={() => void usunRozmowe(r.id)} aria-label={`Usuń rozmowę: ${r.tytul}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100">
                      <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : sekcja === 'skille' ? (
            skille.length === 0 ? (
              <p className="px-3 py-4 text-[12.5px] leading-relaxed text-pkb-faint">Wczytuję umiejętności asystenta...</p>
            ) : (
              <>
                <ul className="flex flex-col gap-0.5">
                  {skille.map((u) => (
                    <li key={u.name}>
                      <Link
                        href="/umiejetnosci"
                        className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-pkb-muted transition hover:bg-pkb-surface/60 hover:text-pkb-text"
                      >
                        <span
                          className={`mt-[7px] size-1.5 shrink-0 rounded-full ${
                            NASZE.includes(u.name ?? '') ? 'bg-pkb-gold' : 'bg-pkb-copper/40'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px]">{u.name}</span>
                          {u.description ? (
                            <span className="block truncate text-[11px] text-pkb-faint">{u.description}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/umiejetnosci" className="mt-2 block px-3 py-2 text-[12px] text-pkb-muted underline underline-offset-4 transition hover:text-pkb-gold">
                  Zobacz pełne opisy
                </Link>
              </>
            )
          ) : (
            <>
              <input ref={plikRef} type="file" className="sr-only" onChange={(e) => { const p = e.target.files?.[0]; if (p) void wgraj(p); }} accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.png,.jpg,.jpeg,.webp,.html" />
              <button onClick={() => plikRef.current?.click()} disabled={wgrywa} className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-pkb-border px-3 py-2.5 text-[12.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold disabled:opacity-50">
                <I d="M12 5v14M5 12h14" />
                {wgrywa ? 'Wgrywam...' : 'Dodaj dokument'}
              </button>
              {pliki.length === 0 ? (
                <p className="px-3 py-2 text-[12.5px] leading-relaxed text-pkb-faint">Wgraj umowę albo notatkę, potem po prostu o nią zapytaj.</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {pliki.map((p) => (
                    <li key={p.nazwa} className="group flex items-center gap-1">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('pkb-podglad', { detail: p.nazwa }))} className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-pkb-muted transition hover:bg-pkb-surface/60 hover:text-pkb-text">
                        <span className="block truncate text-[13px]">{p.nazwa}</span>
                        <span className="block text-[11px] text-pkb-faint">{Math.max(1, Math.round(p.rozmiar / 1024))} KB</span>
                      </button>
                      <button onClick={() => window.dispatchEvent(new CustomEvent('pkb-dolacz', { detail: p.nazwa }))} aria-label={`Dołącz ${p.nazwa}`} title="Dołącz do rozmowy" className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:text-pkb-gold">
                        <I d="M12 5v14M5 12h14" />
                      </button>
                      <button onClick={() => void usunPlik(p.nazwa)} aria-label={`Usuń ${p.nazwa}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100">
                        <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="border-t border-pkb-border-soft px-3 py-2.5">
          <a href="https://simplefast.ai" target="_blank" rel="noopener noreferrer" className="block px-3 text-[11px] text-pkb-faint transition hover:text-pkb-copper">
            zasilany przez SimpleFast AI
          </a>
        </div>
      </aside>
    </>
  );
}

/**
 * Szkielet panelu na pierwsza klatke. Bez niego prezes widzi czarny ekran,
 * bo caly panel jest komponentem klienckim i czeka na wczytanie skryptow.
 */
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
        <div className="flex flex-col gap-1.5 px-3 pt-6" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[38px] rounded-lg bg-pkb-surface/40" />
          ))}
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
