'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoPKB } from './LogoPKB';

type Pozycja = { href: string; etykieta: string; ikona: React.ReactNode; odznaka?: string };

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const GRUPY: { tytul: string; pozycje: Pozycja[] }[] = [
  {
    tytul: 'Asystent',
    pozycje: [
      { href: '/', etykieta: 'Rozmowa', ikona: <I d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
      { href: '/firmy', etykieta: 'Briefy o firmach', ikona: <I d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" /> },
    ],
  },
  {
    tytul: 'Wiedza',
    pozycje: [
      { href: '/baza-wiedzy', etykieta: 'Baza wiedzy', ikona: <I d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { href: '/umiejetnosci', etykieta: 'Rozwój asystenta', ikona: <I d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.8 2.8m8.4 8.4L19 19M19 5l-2.8 2.8m-8.4 8.4L5 19" /> },
    ],
  },
];

export function Nawigacja() {
  const sciezka = usePathname();
  const [otwarte, setOtwarte] = useState(false);

  // Na telefonie zamykamy szufladę po przejściu na inną stronę.
  useEffect(() => setOtwarte(false), [sciezka]);

  return (
    <>
      {/* Pasek górny, tylko na wąskich ekranach */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-pkb-border-soft bg-pkb-bg/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOtwarte(true)}
          aria-label="Otwórz menu"
          className="grid size-9 place-items-center rounded-lg border border-pkb-border text-pkb-muted transition hover:text-pkb-gold"
        >
          <I d="M4 6h16M4 12h16M4 18h16" />
        </button>
        <LogoPKB />
      </div>

      {/* Przyciemnienie tła pod szufladą */}
      {otwarte ? (
        <button
          aria-label="Zamknij menu"
          onClick={() => setOtwarte(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-pkb-border-soft bg-pkb-panel',
          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0',
          otwarte ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="px-5 pb-4 pt-5">
          <LogoPKB />
        </div>

        <div className="mx-4 flex items-center gap-3 rounded-xl border border-pkb-border-soft bg-pkb-surface/60 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pkb-copper/20 text-[13px] font-semibold text-pkb-gold">
            RR
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13.5px] font-medium">Radosław Rogiewicz</span>
            <span className="block text-[11.5px] text-pkb-faint">Prezes PKB</span>
          </span>
        </div>

        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          {GRUPY.map((grupa) => (
            <div key={grupa.tytul} className="mb-5">
              <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
                {grupa.tytul}
              </p>
              <ul className="flex flex-col gap-0.5">
                {grupa.pozycje.map((p) => {
                  const aktywna = sciezka === p.href;
                  return (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        aria-current={aktywna ? 'page' : undefined}
                        className={[
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors duration-150',
                          aktywna
                            ? 'bg-pkb-surface text-pkb-gold'
                            : 'text-pkb-muted hover:bg-pkb-surface/60 hover:text-pkb-text',
                        ].join(' ')}
                      >
                        {aktywna ? (
                          <span className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r bg-pkb-gold" />
                        ) : null}
                        {p.ikona}
                        <span className="truncate">{p.etykieta}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-pkb-border-soft px-3 py-3">
          <p className="px-3 text-[11px] text-pkb-faint">Wersja testowa</p>
        </div>
      </aside>
    </>
  );
}
