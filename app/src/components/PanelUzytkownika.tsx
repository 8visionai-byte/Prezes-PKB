'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Panel konta. Na razie konto jest jedno i pilnuje go brama na serwerze,
 * wiec panel mowi wprost, jak jest, zamiast udawac pelny system uzytkownikow.
 */
export function PanelUzytkownika({ zamknij }: { zamknij: () => void }) {
  const [wylogowuje, setWylogowuje] = useState(false);

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => e.key === 'Escape' && zamknij();
    window.addEventListener('keydown', naKlawisz);
    return () => window.removeEventListener('keydown', naKlawisz);
  }, [zamknij]);

  async function wyloguj() {
    setWylogowuje(true);
    try {
      // Brama na serwerze pamieta haslo w przegladarce. Zapytanie, ktore celowo
      // konczy sie odmowa, kasuje te pamiec i przy nastepnym wejsciu pyta od nowa.
      await fetch('/api/wyloguj', { cache: 'no-store' }).catch(() => {});
    } finally {
      window.location.replace('/');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={zamknij}
      role="dialog"
      aria-modal="true"
      aria-label="Konto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pkb-wejscie w-full max-w-md overflow-hidden rounded-t-2xl border border-pkb-border bg-pkb-panel sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-pkb-border-soft px-5 py-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pkb-copper/20 text-[15px] font-semibold text-pkb-gold">RR</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">Radosław Rogiewicz</p>
            <p className="text-[12.5px] text-pkb-faint">Prezes Partnerskich Klubów Biznesu</p>
          </div>
          <button
            onClick={zamknij}
            aria-label="Zamknij"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-3 py-2">
          <Link
            href="/ustawienia?zakladka=asystent"
            onClick={zamknij}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-pkb-muted transition hover:bg-pkb-hover hover:text-pkb-text"
          >
            <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Jak asystent ma się do mnie zwracać
          </Link>
          <Link
            href="/ustawienia"
            onClick={zamknij}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-pkb-muted transition hover:bg-pkb-hover hover:text-pkb-text"
          >
            <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M19 5l-2 2M7 17l-2 2" /></svg>
            Ustawienia aplikacji
          </Link>
        </div>

        <div className="border-t border-pkb-border-soft px-3 py-2">
          <button
            onClick={() => void wyloguj()}
            disabled={wylogowuje}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] text-pkb-muted transition hover:bg-red-950/30 hover:text-red-200 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            {wylogowuje ? 'Wylogowuję...' : 'Wyloguj'}
          </button>
        </div>

        <p className="border-t border-pkb-border-soft px-5 py-3 text-[11.5px] leading-relaxed text-pkb-faint">
          Aplikacja jest na razie chroniona jednym wspólnym hasłem na serwerze. Osobne konta
          dla prezesa i dyrektorów to następny etap.
        </p>
      </div>
    </div>
  );
}
