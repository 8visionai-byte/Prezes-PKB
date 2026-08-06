'use client';

import { useEffect, useState } from 'react';

type ZdarzenieInstalacji = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Zachęta do zainstalowania aplikacji na telefonie.
 * Android i desktop: przycisk instalacji. iPhone: instrukcja, bo Safari nie daje przycisku.
 */
export function ZachetaPWA() {
  const [zdarzenie, setZdarzenie] = useState<ZdarzenieInstalacji | null>(null);
  const [iphone, setIphone] = useState(false);
  const [ukryte, setUkryte] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('pkb-instalacja-ukryta') === '1') return;

    const juzZainstalowana =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (juzZainstalowana) return;

    const toIphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (toIphone) {
      setIphone(true);
      setUkryte(false);
      return;
    }

    const naZdarzenie = (e: Event) => {
      e.preventDefault();
      setZdarzenie(e as ZdarzenieInstalacji);
      setUkryte(false);
    };
    window.addEventListener('beforeinstallprompt', naZdarzenie);
    return () => window.removeEventListener('beforeinstallprompt', naZdarzenie);
  }, []);

  function schowaj() {
    localStorage.setItem('pkb-instalacja-ukryta', '1');
    setUkryte(true);
  }

  if (ukryte) return null;

  return (
    <div className="pkb-wejscie mb-4 flex items-center gap-3 rounded-xl border border-pkb-copper/40 bg-pkb-copper/10 px-4 py-3">
      <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-pkb-gold" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-pkb-text">
        {iphone ? (
          <>Dodaj do ekranu głównego: przycisk <strong>Udostępnij</strong>, potem <strong>Dodaj do ekranu początkowego</strong>.</>
        ) : (
          <>Zainstaluj asystenta jako aplikację na telefonie.</>
        )}
      </p>
      {zdarzenie ? (
        <button
          onClick={async () => {
            await zdarzenie.prompt();
            await zdarzenie.userChoice;
            schowaj();
          }}
          className="shrink-0 rounded-lg bg-pkb-gold px-3 py-1.5 text-[12.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
        >
          Zainstaluj
        </button>
      ) : null}
      <button onClick={schowaj} aria-label="Ukryj" className="shrink-0 text-pkb-muted transition hover:text-pkb-text">×</button>
    </div>
  );
}
