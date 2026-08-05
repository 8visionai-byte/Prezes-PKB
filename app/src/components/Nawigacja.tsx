'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { LogoPKB } from './LogoPKB';
import { Pandy } from './Pandy';

type Naglowek = { id: string; tytul: string; zmieniona: number };
type Plik = { nazwa: string; rozmiar: number; zmieniony: string };

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
  const [sekcja, setSekcja] = useState<'rozmowy' | 'dokumenty'>('rozmowy');
  const [wgrywa, setWgrywa] = useState(false);
  const [pandy, setPandy] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);

  const odswiez = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([fetch('/api/rozmowy'), fetch('/api/pliki')]);
      if (r.ok) setHistoria((await r.json()).rozmowy ?? []);
      if (p.ok) setPliki((await p.json()).pliki ?? []);
    } catch { /* panel boczny nie moze wywrocic aplikacji */ }
  }, []);

  useEffect(() => {
    void odswiez();
    const naZmiane = () => void odswiez();
    window.addEventListener('pkb-odswiez', naZmiane);
    return () => window.removeEventListener('pkb-odswiez', naZmiane);
  }, [odswiez]);

  useEffect(() => {
    setOtwarte(false);
  }, [sciezka, aktywnaRozmowa]);

  useEffect(() => {
    setPandy(localStorage.getItem('pkb-pandy') !== 'off');
  }, []);

  function przelaczPandy() {
    setPandy((v) => {
      localStorage.setItem('pkb-pandy', v ? 'off' : 'on');
      return !v;
    });
  }

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
    await fetch('/api/rozmowy', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await odswiez();
    if (aktywnaRozmowa === id) router.push('/');
  }

  async function usunPlik(nazwa: string) {
    await fetch('/api/pliki', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nazwa }),
    });
    await odswiez();
    window.dispatchEvent(new CustomEvent('pkb-odswiez'));
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-pkb-border-soft bg-pkb-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button
          onClick={() => setOtwarte(true)}
          aria-label="Otwórz menu"
          className="grid size-9 place-items-center rounded-lg border border-pkb-border text-pkb-muted transition hover:text-pkb-gold"
        >
          <I d="M4 6h16M4 12h16M4 18h16" />
        </button>
        <LogoPKB szerokosc={124} />
      </div>

      {otwarte ? (
        <button aria-label="Zamknij menu" onClick={() => setOtwarte(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
      ) : null}

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

        <div className="px-3 pb-1 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg bg-pkb-gold px-3 py-2.5 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
          >
            <I d="M12 5v14M5 12h14" />
            Nowa rozmowa
          </Link>
        </div>

        <div className="mt-3 flex gap-1 px-3">
          {(['rozmowy', 'dokumenty'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSekcja(s)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[12.5px] transition ${
                sekcja === s ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60'
              }`}
            >
              {s === 'rozmowy' ? `Rozmowy (${historia.length})` : `Dokumenty (${pliki.length})`}
            </button>
          ))}
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto px-3 pb-3">
          {sekcja === 'rozmowy' ? (
            historia.length === 0 ? (
              <p className="px-3 py-4 text-[12.5px] leading-relaxed text-pkb-faint">
                Tu pojawią się rozmowy i briefy o firmach.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {historia.map((r) => {
                  const aktywna = aktywnaRozmowa === r.id;
                  return (
                    <li key={r.id} className="group flex items-center gap-1">
                      <Link
                        href={`/?rozmowa=${r.id}`}
                        className={`min-w-0 flex-1 rounded-lg px-3 py-2 transition ${
                          aktywna ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60 hover:text-pkb-text'
                        }`}
                      >
                        <span className="block truncate text-[13px]">{r.tytul}</span>
                        <span className="block text-[11px] text-pkb-faint">{kiedy(r.zmieniona)}</span>
                      </Link>
                      <button
                        onClick={() => void usunRozmowe(r.id)}
                        aria-label={`Usuń rozmowę: ${r.tytul}`}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100"
                      >
                        <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <>
              <input
                ref={plikRef}
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const p = e.target.files?.[0];
                  if (p) void wgraj(p);
                }}
                accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
              />
              <button
                onClick={() => plikRef.current?.click()}
                disabled={wgrywa}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-pkb-border px-3 py-2.5 text-[12.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold disabled:opacity-50"
              >
                <I d="M12 5v14M5 12h14" />
                {wgrywa ? 'Wgrywam...' : 'Dodaj dokument'}
              </button>
              {pliki.length === 0 ? (
                <p className="px-3 py-2 text-[12.5px] leading-relaxed text-pkb-faint">
                  Wgraj umowę albo notatkę, potem po prostu o nią zapytaj.
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {pliki.map((p) => (
                    <li key={p.nazwa} className="group flex items-center gap-1">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('pkb-podglad', { detail: p.nazwa }))}
                        className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-pkb-muted transition hover:bg-pkb-surface/60 hover:text-pkb-text"
                      >
                        <span className="block truncate text-[13px]">{p.nazwa}</span>
                        <span className="block text-[11px] text-pkb-faint">{Math.max(1, Math.round(p.rozmiar / 1024))} KB</span>
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('pkb-dolacz', { detail: p.nazwa }))}
                        aria-label={`Dołącz ${p.nazwa}`}
                        title="Dołącz do rozmowy"
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:text-pkb-gold"
                      >
                        <I d="M12 5v14M5 12h14" />
                      </button>
                      <button
                        onClick={() => void usunPlik(p.nazwa)}
                        aria-label={`Usuń ${p.nazwa}`}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100"
                      >
                        <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-pkb-border-soft px-3 py-2">
          <Link
            href="/umiejetnosci"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition ${
              sciezka === '/umiejetnosci' ? 'bg-pkb-surface text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-surface/60 hover:text-pkb-text'
            }`}
          >
            <I d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.8 2.8m8.4 8.4L19 19M19 5l-2.8 2.8m-8.4 8.4L5 19" />
            Rozwój asystenta
          </Link>

          {pandy ? <Pandy widoczne /> : null}

          <div className="flex items-center justify-between px-3 py-1.5">
            <a
              href="https://simplefast.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-pkb-faint transition hover:text-pkb-copper"
            >
              zasilany przez SimpleFast AI
            </a>
            <button
              onClick={przelaczPandy}
              aria-pressed={pandy}
              title={pandy ? 'Wyłącz pandy' : 'Włącz pandy'}
              className="text-[11px] text-pkb-faint transition hover:text-pkb-gold"
            >
              {pandy ? 'pandy wł.' : 'pandy wył.'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Nawigacja() {
  return (
    <Suspense fallback={null}>
      <TrescNawigacji />
    </Suspense>
  );
}
