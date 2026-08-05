'use client';

import { useEffect, useRef, useState } from 'react';

type Plik = { nazwa: string; rozmiar: number; zmieniony: string };

function rozmiar(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function BazaWiedzy() {
  const [pliki, setPliki] = useState<Plik[] | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pracuje, setPracuje] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);

  async function odswiez() {
    try {
      const r = await fetch('/api/pliki');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      setPliki(d.pliki ?? []);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void odswiez();
  }, []);

  async function wgraj(plik: File) {
    setBlad(null);
    setPracuje(true);
    try {
      const dane = new FormData();
      dane.append('plik', plik);
      const r = await fetch('/api/pliki', { method: 'POST', body: dane });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      await odswiez();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    } finally {
      setPracuje(false);
      if (plikRef.current) plikRef.current.value = '';
    }
  }

  async function usun(nazwa: string) {
    setBlad(null);
    try {
      const r = await fetch('/api/pliki', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nazwa }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      await odswiez();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Baza</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">wiedzy</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">
        Dokumenty, do których asystent sięga w rozmowie. Wgraj umowę, ofertę albo notatkę,
        a potem po prostu o nią zapytaj.
      </p>

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
        disabled={pracuje}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-pkb-border px-4 py-6 text-[14px] text-pkb-muted transition hover:border-pkb-copper hover:bg-pkb-surface/40 hover:text-pkb-gold disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {pracuje ? 'Wgrywam...' : 'Dodaj dokument'}
      </button>
      <p className="mt-2 text-center text-[12px] text-pkb-faint">
        PDF, Word, Excel, tekst, zdjęcia. Do 20 MB.
      </p>

      {blad ? (
        <p role="alert" className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {blad}
        </p>
      ) : null}

      {pliki === null ? (
        <div className="mt-6 space-y-2" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-pkb-border-soft bg-pkb-surface/40" />
          ))}
        </div>
      ) : pliki.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-pkb-muted">Baza jest pusta.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {pliki.map((p) => (
            <li
              key={p.nazwa}
              className="flex items-center gap-3 rounded-xl border border-pkb-border-soft bg-pkb-surface/50 px-4 py-3 transition hover:border-pkb-copper/50"
            >
              <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-pkb-copper" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px]">{p.nazwa}</span>
                <span className="block text-[11.5px] text-pkb-faint">
                  {rozmiar(p.rozmiar)} · {new Date(p.zmieniony).toLocaleDateString('pl-PL')}
                </span>
              </span>
              <button
                onClick={() => void usun(p.nazwa)}
                aria-label={`Usuń ${p.nazwa}`}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:bg-pkb-surface-2 hover:text-red-300"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
