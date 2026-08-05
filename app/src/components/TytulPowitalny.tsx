'use client';

import { useEffect, useState } from 'react';

const PELNY = 'Asystent prezesa';

/**
 * Tytul, ktory dopisuje sie sam przy wejsciu, a po nim pojawia sie podpis
 * "zasilany przez SimpleFast AI" z odnosnikiem do strony.
 * Pokazuje sie raz na sesje przegladarki, zeby nie meczyc przy kazdym odswiezeniu.
 */
export function TytulPowitalny() {
  const [znaki, setZnaki] = useState(0);
  const [podpis, setPodpis] = useState(false);

  useEffect(() => {
    const ograniczony = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const juzBylo = sessionStorage.getItem('pkb-tytul-pokazany') === '1';

    if (ograniczony || juzBylo) {
      setZnaki(PELNY.length);
      setPodpis(true);
      return;
    }

    sessionStorage.setItem('pkb-tytul-pokazany', '1');
    let i = 0;
    const krok = window.setInterval(() => {
      i += 1;
      setZnaki(i);
      if (i >= PELNY.length) {
        window.clearInterval(krok);
        window.setTimeout(() => setPodpis(true), 260);
      }
    }, 55);

    return () => window.clearInterval(krok);
  }, []);

  const widoczny = PELNY.slice(0, znaki);
  const pierwsze = widoczny.slice(0, 8);
  const drugie = widoczny.slice(8);
  const pisze = znaki < PELNY.length;

  return (
    <div className="min-h-[62px]">
      <h1 className="flex items-baseline gap-2.5 text-[26px] font-semibold tracking-tight">
        <span>{pierwsze}</span>
        <span className="font-serif italic text-pkb-gold">{drugie}</span>
        {pisze ? <span className="pkb-kursor" aria-hidden /> : null}
      </h1>
      <p
        className={`mt-1 text-[12.5px] text-pkb-faint transition-opacity duration-500 ${
          podpis ? 'opacity-100' : 'opacity-0'
        }`}
      >
        zasilany przez{' '}
        <a
          href="https://simplefast.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-pkb-copper underline decoration-pkb-copper/40 underline-offset-2 transition hover:text-pkb-gold hover:decoration-pkb-gold"
        >
          SimpleFast AI
        </a>
      </p>
    </div>
  );
}
