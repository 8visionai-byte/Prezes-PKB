'use client';

import { useEffect, useMemo, useState } from 'react';
import { Proza } from '@/components/Proza';

type Umiejetnosc = { name?: string; description?: string; category?: string };

const NASZE = ['brief-firmy'];
const NIEISTOTNE = new Set(['software-development', 'github', 'mlops', 'autonomous-ai-agents']);

const OPIS_KATEGORII: Record<string, string> = {
  creative: 'Grafika, wideo, prezentacje',
  productivity: 'Dokumenty, arkusze, organizacja',
  research: 'Szukanie i analiza informacji',
  media: 'Obraz i dźwięk',
  email: 'Poczta',
  'note-taking': 'Notatki',
  'smart-home': 'Dom',
  'social-media': 'Media społecznościowe',
  'software-development': 'Programowanie',
  github: 'Programowanie',
  mlops: 'Programowanie',
  'autonomous-ai-agents': 'Programowanie',
};

function Szczegoly({ u, zamknij }: { u: Umiejetnosc; zamknij: () => void }) {
  const [tresc, setTresc] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => e.key === 'Escape' && zamknij();
    window.addEventListener('keydown', naKlawisz);
    return () => window.removeEventListener('keydown', naKlawisz);
  }, [zamknij]);

  useEffect(() => {
    fetch(`/api/umiejetnosci/tresc?nazwa=${encodeURIComponent(u.name ?? '')}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
        setTresc(d.tresc ?? '');
      })
      .catch((e) => setBlad(e instanceof Error ? e.message : String(e)));
  }, [u.name]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={zamknij}
      role="dialog"
      aria-modal="true"
      aria-label={`Umiejętność: ${u.name}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pkb-wejscie flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-pkb-border bg-pkb-panel sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-pkb-border-soft px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-pkb-gold">{u.name}</p>
            {u.category ? (
              <p className="mt-0.5 text-[11.5px] uppercase tracking-wider text-pkb-faint">
                {OPIS_KATEGORII[u.category] ?? u.category}
              </p>
            ) : null}
          </div>
          <button
            onClick={zamknij}
            aria-label="Zamknij"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {u.description ? <p className="mb-4 text-[14px] leading-relaxed text-pkb-muted">{u.description}</p> : null}
          {blad ? (
            <p className="text-[13.5px] text-pkb-muted">
              Ta umiejętność nie ma osobnego opisu. Asystent i tak z niej korzysta.
            </p>
          ) : tresc === null ? (
            <div className="h-32 animate-pulse rounded-lg bg-pkb-surface/50" aria-busy />
          ) : (
            <Proza tresc={tresc} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Umiejetnosci() {
  const [lista, setLista] = useState<Umiejetnosc[] | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState('');
  const [pokazTechniczne, setPokazTechniczne] = useState(false);
  const [otwarta, setOtwarta] = useState<Umiejetnosc | null>(null);

  useEffect(() => {
    fetch('/api/umiejetnosci')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
        setLista(d.umiejetnosci ?? []);
      })
      .catch((e) => setBlad(e instanceof Error ? e.message : String(e)));
  }, []);

  const { nasze, przydatne, techniczne } = useMemo(() => {
    const w = lista ?? [];
    const q = szukaj.trim().toLowerCase();
    const pasuje = (u: Umiejetnosc) => !q || `${u.name ?? ''} ${u.description ?? ''}`.toLowerCase().includes(q);
    return {
      nasze: w.filter((u) => NASZE.includes(u.name ?? '')).filter(pasuje),
      przydatne: w.filter((u) => !NASZE.includes(u.name ?? '') && !NIEISTOTNE.has(u.category ?? '')).filter(pasuje),
      techniczne: w.filter((u) => NIEISTOTNE.has(u.category ?? '')).filter(pasuje),
    };
  }, [lista, szukaj]);

  const Karta = ({ u, wyroznona }: { u: Umiejetnosc; wyroznona?: boolean }) => (
    <li>
      <button
        onClick={() => setOtwarta(u)}
        className={[
          'w-full rounded-xl border p-4 text-left transition duration-200',
          wyroznona
            ? 'border-pkb-copper/60 bg-pkb-copper/10 hover:border-pkb-gold'
            : 'border-pkb-border-soft bg-pkb-surface/50 hover:border-pkb-copper/50',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-medium text-pkb-gold">{u.name ?? 'bez nazwy'}</p>
          {wyroznona ? (
            <span className="shrink-0 rounded-full bg-pkb-gold/15 px-2 py-0.5 text-[10.5px] font-medium text-pkb-gold">
              dla PKB
            </span>
          ) : null}
        </div>
        {u.description ? <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-pkb-muted">{u.description}</p> : null}
        <p className="mt-2 text-[11.5px] text-pkb-faint">Kliknij, aby zobaczyć pełny opis</p>
      </button>
    </li>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Rozwój</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">asystenta</span>
      </header>
      <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-pkb-muted">
        Umiejętności, z których asystent korzysta w rozmowie. Wszystkie są aktywne: sięga po nie sam,
        gdy pasują do pytania.
      </p>

      {lista === null && !blad ? (
        <div className="mt-8 space-y-2.5" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-pkb-border-soft bg-pkb-surface/40" />
          ))}
        </div>
      ) : null}

      {blad ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{blad}</p>
      ) : null}

      {lista !== null && !blad ? (
        <>
          <input
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Szukaj umiejętności..."
            aria-label="Szukaj umiejętności"
            className="mt-6 w-full rounded-lg border border-pkb-border bg-pkb-surface/60 px-3.5 py-2.5 text-[14px] outline-none transition-colors placeholder:text-pkb-faint focus:border-pkb-copper"
          />

          {nasze.length > 0 ? (
            <section className="mt-7">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">Zbudowane dla PKB</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {nasze.map((u) => <Karta key={u.name} u={u} wyroznona />)}
              </ul>
            </section>
          ) : null}

          <section className="mt-7">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
              Wyposażenie standardowe ({przydatne.length})
            </h2>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {przydatne.map((u) => <Karta key={u.name} u={u} />)}
            </ul>
          </section>

          {techniczne.length > 0 ? (
            <section className="mt-7">
              <button
                onClick={() => setPokazTechniczne((v) => !v)}
                className="text-[13px] text-pkb-muted underline underline-offset-4 transition hover:text-pkb-gold"
              >
                {pokazTechniczne ? 'Ukryj' : 'Pokaż'} narzędzia techniczne ({techniczne.length})
              </button>
              {pokazTechniczne ? (
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {techniczne.map((u) => <Karta key={u.name} u={u} />)}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      {otwarta ? <Szczegoly u={otwarta} zamknij={() => setOtwarta(null)} /> : null}
    </div>
  );
}
