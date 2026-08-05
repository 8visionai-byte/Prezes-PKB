'use client';

import { useEffect, useState } from 'react';

type Podglad =
  | { typ: 'tekst'; tresc: string; obciety: boolean; rozmiar: number }
  | { typ: 'brak-podgladu'; komunikat: string; rozmiar: number };

const OBRAZ = /\.(png|jpe?g|webp)$/i;
const PDF = /\.pdf$/i;
const HTML = /\.html?$/i;

export function PodgladPliku({ nazwa, zamknij }: { nazwa: string; zamknij: () => void }) {
  const [dane, setDane] = useState<Podglad | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  const jestObraz = OBRAZ.test(nazwa);
  const jestPdf = PDF.test(nazwa);
  const jestHtml = HTML.test(nazwa);
  const url = `/api/pliki/podglad?nazwa=${encodeURIComponent(nazwa)}`;

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => e.key === 'Escape' && zamknij();
    window.addEventListener('keydown', naKlawisz);
    return () => window.removeEventListener('keydown', naKlawisz);
  }, [zamknij]);

  useEffect(() => {
    if (jestObraz || jestPdf || jestHtml) return;
    fetch(url)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
        setDane(d);
      })
      .catch((e) => setBlad(e instanceof Error ? e.message : String(e)));
  }, [url, jestObraz, jestPdf, jestHtml]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={zamknij}
      role="dialog"
      aria-modal="true"
      aria-label={`Podgląd: ${nazwa}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pkb-wejscie flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-pkb-border bg-pkb-panel sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-pkb-border-soft px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{nazwa}</p>
          <a
            href={url}
            download={nazwa}
            className="rounded-lg border border-pkb-border px-2.5 py-1 text-[12.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
          >
            Pobierz
          </a>
          <button
            onClick={zamknij}
            aria-label="Zamknij podgląd"
            className="grid size-8 place-items-center rounded-lg text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {blad ? (
            <p role="alert" className="text-[14px] text-red-200">{blad}</p>
          ) : jestObraz ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={nazwa} className="mx-auto max-h-[70dvh] w-auto rounded-lg" />
          ) : jestPdf ? (
            <iframe src={url} title={nazwa} className="h-[70dvh] w-full rounded-lg border border-pkb-border-soft" />
          ) : jestHtml ? (
            <iframe
              src={url}
              title={nazwa}
              sandbox=""
              className="h-[70dvh] w-full rounded-lg border border-pkb-border-soft bg-pkb-bg"
            />
          ) : dane?.typ === 'tekst' ? (
            <>
              <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-pkb-text">
                {dane.tresc}
              </pre>
              {dane.obciety ? (
                <p className="mt-3 text-[12.5px] text-pkb-faint">
                  Pokazany początek pliku. Asystent czyta całość.
                </p>
              ) : null}
            </>
          ) : dane?.typ === 'brak-podgladu' ? (
            <p className="text-[14px] leading-relaxed text-pkb-muted">{dane.komunikat}</p>
          ) : (
            <div className="h-40 animate-pulse rounded-lg bg-pkb-surface/50" aria-busy />
          )}
        </div>
      </div>
    </div>
  );
}
