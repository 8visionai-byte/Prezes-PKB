'use client';

import { useEffect, useState } from 'react';

type Umiejetnosc = { name?: string; description?: string; category?: string };

export default function Umiejetnosci() {
  const [lista, setLista] = useState<Umiejetnosc[] | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState('');

  useEffect(() => {
    fetch('/api/umiejetnosci')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
        setLista(d.umiejetnosci ?? []);
      })
      .catch((e) => setBlad(e instanceof Error ? e.message : String(e)));
  }, []);

  const widoczne = (lista ?? []).filter((u) => {
    if (!szukaj.trim()) return true;
    const q = szukaj.toLowerCase();
    return `${u.name ?? ''} ${u.description ?? ''} ${u.category ?? ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Rozwój</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">asystenta</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">
        Lista rzeczy, które asystent już potrafi. Ta lista rośnie: gdy nauczy się nowej procedury,
        zapisuje ją jako umiejętność i korzysta z niej w kolejnych rozmowach.
      </p>

      {lista === null && !blad ? (
        <div className="mt-8 space-y-2.5" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-pkb-border-soft bg-pkb-surface/40" />
          ))}
        </div>
      ) : null}

      {blad ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {blad}
        </p>
      ) : null}

      {lista !== null && !blad ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-pkb-copper/40 bg-pkb-copper/10 px-3 py-1 text-[12.5px] text-pkb-gold">
              {lista.length} umiejętności
            </span>
            <input
              value={szukaj}
              onChange={(e) => setSzukaj(e.target.value)}
              placeholder="Szukaj..."
              aria-label="Szukaj w umiejętnościach"
              className="min-w-0 flex-1 rounded-lg border border-pkb-border bg-pkb-surface/60 px-3 py-2 text-[14px] outline-none transition-colors placeholder:text-pkb-faint focus:border-pkb-copper"
            />
          </div>

          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {widoczne.map((u, i) => (
              <li
                key={`${u.name ?? i}`}
                className="rounded-xl border border-pkb-border-soft bg-pkb-surface/50 p-4 transition duration-200 hover:border-pkb-copper/50"
              >
                <p className="text-[14px] font-medium text-pkb-gold">{u.name ?? 'bez nazwy'}</p>
                {u.description ? (
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-snug text-pkb-muted">{u.description}</p>
                ) : null}
                {u.category ? (
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-pkb-faint">{u.category}</p>
                ) : null}
              </li>
            ))}
          </ul>

          {widoczne.length === 0 ? (
            <p className="mt-6 text-[14px] text-pkb-muted">Nic nie pasuje do wyszukiwania.</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
