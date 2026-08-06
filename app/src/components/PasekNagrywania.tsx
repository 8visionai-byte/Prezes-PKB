'use client';

/**
 * Pasek, ktory zastepuje pole wiadomosci na czas dyktowania.
 * Uklad znany z ChatGPT: fala dzwieku, krzyzyk (anuluj) i ptaszek (zamien na tekst).
 * Po ptaszku ptaszek zamienia sie w kolko, bo trwa rozpoznawanie.
 */
export function PasekNagrywania({
  poziomy,
  sekundy,
  rozpoznaje,
  anuluj,
  zatwierdz,
}: {
  poziomy: number[];
  sekundy: number;
  rozpoznaje: boolean;
  anuluj: () => void;
  zatwierdz: () => void;
}) {
  const czas = `${Math.floor(sekundy / 60)}:${String(sekundy % 60).padStart(2, '0')}`;

  return (
    <div className="pkb-wejscie flex items-center gap-3 rounded-2xl border border-pkb-copper/50 bg-pkb-surface/90 px-3 py-2.5 backdrop-blur">
      <button
        onClick={anuluj}
        disabled={rozpoznaje}
        aria-label="Anuluj dyktowanie"
        title="Anuluj"
        className="grid size-9 shrink-0 place-items-center rounded-full text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-text disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>

      <span className="w-[42px] shrink-0 text-center text-[12.5px] tabular-nums text-pkb-muted">{czas}</span>

      {/* Fala dzwieku: prezes widzi, ze mikrofon naprawde slyszy. */}
      <div className="flex h-9 min-w-0 flex-1 items-center justify-center gap-[2px] overflow-hidden" aria-hidden>
        {poziomy.map((p, i) => (
          <span
            key={i}
            className={`w-[3px] shrink-0 rounded-full ${rozpoznaje ? 'bg-pkb-faint' : 'bg-pkb-gold'}`}
            style={{ height: `${Math.max(3, Math.round(p * 30))}px`, opacity: rozpoznaje ? 0.5 : 0.55 + p * 0.45 }}
          />
        ))}
      </div>

      <button
        onClick={zatwierdz}
        disabled={rozpoznaje}
        aria-label={rozpoznaje ? 'Zamieniam na tekst' : 'Zakończ i zamień na tekst'}
        title={rozpoznaje ? 'Zamieniam na tekst...' : 'Gotowe'}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-pkb-gold text-pkb-bg transition hover:bg-pkb-gold-strong disabled:opacity-70"
      >
        {rozpoznaje ? (
          <svg viewBox="0 0 24 24" className="size-[18px] animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </button>
    </div>
  );
}

/** Sam przycisk mikrofonu przy polu wiadomosci. */
export function PrzyciskMikrofonu({ start, etykieta = 'Dyktuj wiadomość' }: { start: () => void; etykieta?: string }) {
  return (
    <button
      type="button"
      onClick={start}
      aria-label={etykieta}
      title={etykieta}
      className="grid size-10 shrink-0 place-items-center rounded-xl text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-gold"
    >
      <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
      </svg>
    </button>
  );
}
