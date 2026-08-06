'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PodgladPliku } from '@/components/PodgladPliku';

type Plik = { nazwa: string; rozmiar: number; zmieniony: string };

const OBRAZ = /\.(png|jpe?g|webp)$/i;
const HTML = /\.html?$/i;

function ikonaTypu(nazwa: string) {
  if (OBRAZ.test(nazwa)) return 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6';
  if (HTML.test(nazwa)) return 'M4 4h16v16H4zM8 9l-2 3 2 3M16 9l2 3-2 3';
  return 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';
}

export default function Dokumenty() {
  const [pliki, setPliki] = useState<Plik[] | null>(null);
  const [wgrywa, setWgrywa] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [podglad, setPodglad] = useState<string | null>(null);
  const [nadPolem, setNadPolem] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);

  const odswiez = useCallback(async () => {
    try {
      const r = await fetch('/api/pliki');
      if (r.ok) setPliki((await r.json()).pliki ?? []);
    } catch {
      setPliki([]);
    }
  }, []);

  useEffect(() => {
    void odswiez();
  }, [odswiez]);

  async function wgraj(plik: File) {
    setWgrywa(true);
    setBlad(null);
    try {
      const dane = new FormData();
      dane.append('plik', plik);
      const r = await fetch('/api/pliki', { method: 'POST', body: dane });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      await odswiez();
      window.dispatchEvent(new CustomEvent('pkb-odswiez'));
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    } finally {
      setWgrywa(false);
      if (plikRef.current) plikRef.current.value = '';
    }
  }

  async function usun(nazwa: string) {
    await fetch('/api/pliki', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nazwa }),
    });
    await odswiez();
    window.dispatchEvent(new CustomEvent('pkb-odswiez'));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Dokumenty</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">prezesa</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">
        Notatki po spotkaniach, umowy, wykazy. Asystent czyta te pliki, gdy pytasz go
        o firmę albo o to, kogo z kim skojarzyć. Tu trafiają też rysunki, które sam przygotuje.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setNadPolem(true);
        }}
        onDragLeave={() => setNadPolem(false)}
        onDrop={(e) => {
          e.preventDefault();
          setNadPolem(false);
          const p = e.dataTransfer.files?.[0];
          if (p) void wgraj(p);
        }}
        className={`mt-6 rounded-2xl border border-dashed px-5 py-7 text-center transition-colors ${
          nadPolem ? 'border-pkb-gold bg-pkb-gold/10' : 'border-pkb-border bg-pkb-surface/30'
        }`}
      >
        <input
          ref={plikRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const p = e.target.files?.[0];
            if (p) void wgraj(p);
          }}
          accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.png,.jpg,.jpeg,.webp,.html"
        />
        <p className="text-[14px] text-pkb-muted">Przeciągnij plik tutaj albo</p>
        <button
          onClick={() => plikRef.current?.click()}
          disabled={wgrywa}
          className="mt-3 rounded-lg bg-pkb-gold px-4 py-2 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong disabled:opacity-50"
        >
          {wgrywa ? 'Wgrywam...' : 'Wybierz dokument'}
        </button>
      </div>

      {blad ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {blad}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
          W bazie wiedzy ({pliki?.length ?? 0})
        </h2>

        {pliki === null ? (
          <div className="mt-3 space-y-2" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-pkb-surface/40" />
            ))}
          </div>
        ) : pliki.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-pkb-border-soft px-5 py-6 text-[13.5px] leading-relaxed text-pkb-faint">
            Pusto. Wgraj notatkę ze spotkania, a potem po prostu o nią zapytaj w rozmowie.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {pliki.map((p) => (
              <li
                key={p.nazwa}
                className="group flex items-center gap-3 rounded-xl border border-pkb-border-soft bg-pkb-surface/40 px-4 py-3 transition-colors hover:border-pkb-copper/50 hover:bg-pkb-hover"
              >
                <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-pkb-copper" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ikonaTypu(p.nazwa)} />
                </svg>
                <button onClick={() => setPodglad(p.nazwa)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13.5px]">{p.nazwa}</span>
                  <span className="block text-[11.5px] text-pkb-faint">
                    {Math.max(1, Math.round(p.rozmiar / 1024))} KB
                  </span>
                </button>
                <a
                  href={`/api/pliki/podglad?nazwa=${encodeURIComponent(p.nazwa)}`}
                  download={p.nazwa}
                  className="shrink-0 rounded-lg border border-pkb-border px-2.5 py-1 text-[11.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
                >
                  Pobierz
                </a>
                <button
                  onClick={() => void usun(p.nazwa)}
                  aria-label={`Usuń ${p.nazwa}`}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-pkb-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus-visible:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {podglad ? <PodgladPliku nazwa={podglad} zamknij={() => setPodglad(null)} /> : null}
    </div>
  );
}
