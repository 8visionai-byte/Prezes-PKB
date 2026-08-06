'use client';

import { useEffect, useState } from 'react';
import { useUstawienia, type Ustawienia } from '@/lib/ustawienia';

type Pozycja = {
  klucz: keyof Ustawienia;
  tytul: string;
  opis: string;
};

const WYGLAD: Pozycja[] = [
  {
    klucz: 'pandy',
    tytul: 'Pandy na górze',
    opis: 'Dwie pandy schodzą się i podają sobie ręce. Czysta przyjemność, nic nie zmienia w działaniu.',
  },
  {
    klucz: 'animacje',
    tytul: 'Ruch w interfejsie',
    opis: 'Napis, który sam się dopisuje, i chodzące pandy. Po wyłączeniu wszystko pojawia się od razu.',
  },
];

function Przelacznik({
  wlaczone,
  zmien,
  etykieta,
}: {
  wlaczone: boolean;
  zmien: (w: boolean) => void;
  etykieta: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={wlaczone}
      aria-label={etykieta}
      onClick={() => zmien(!wlaczone)}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full border transition-colors duration-200 ${
        wlaczone ? 'border-pkb-gold bg-pkb-gold/85' : 'border-pkb-border bg-pkb-surface-2'
      }`}
    >
      <span
        className={`absolute top-[3px] size-[18px] rounded-full transition-all duration-200 ${
          wlaczone ? 'left-[23px] bg-pkb-bg' : 'left-[3px] bg-pkb-muted'
        }`}
      />
    </button>
  );
}

export default function Ustawienia() {
  const [ustawienia, ustaw] = useUstawienia();
  const [zgodaNaPowiadomienia, setZgoda] = useState<string>('sprawdzam');

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setZgoda('brak w tej przeglądarce');
      return;
    }
    setZgoda(
      Notification.permission === 'granted'
        ? 'włączone'
        : Notification.permission === 'denied'
          ? 'zablokowane w przeglądarce'
          : 'jeszcze niewłączone',
    );
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Ustawienia</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">aplikacji</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">
        Zmiany zapisują się od razu i dotyczą tego urządzenia. Nic tu nie wpływa na to,
        co asystent wie i co potrafi.
      </p>

      <section className="mt-7">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">Wygląd</h2>
        <ul className="mt-3 overflow-hidden rounded-2xl border border-pkb-border-soft bg-pkb-surface/40">
          {WYGLAD.map((poz, i) => (
            <li
              key={poz.klucz}
              className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? 'border-t border-pkb-border-soft' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium">{poz.tytul}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">{poz.opis}</p>
              </div>
              <Przelacznik
                wlaczone={Boolean(ustawienia[poz.klucz])}
                zmien={(w) => ustaw(poz.klucz, w)}
                etykieta={poz.tytul}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">Powiadomienia</h2>
        <div className="mt-3 rounded-2xl border border-pkb-border-soft bg-pkb-surface/40 px-5 py-4">
          <p className="text-[14.5px] font-medium">
            Stan: <span className="text-pkb-gold">{zgodaNaPowiadomienia}</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">
            Gdy asystent skończy dłuższą pracę, dostaniesz powiadomienie nawet przy zamkniętej
            aplikacji. Włącza się dzwonkiem na ekranie rozmowy. Jeśli widzisz „zablokowane",
            trzeba to odblokować w ustawieniach przeglądarki dla tej strony.
          </p>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">O aplikacji</h2>
        <div className="mt-3 rounded-2xl border border-pkb-border-soft bg-pkb-surface/40 px-5 py-4 text-[13.5px] leading-relaxed text-pkb-muted">
          <p>
            Asystent Prezesa Partnerskich Klubów Biznesu. Silnik i dane stoją na własnym serwerze
            w Niemczech, nic nie przechodzi przez cudze narzędzia poza modelem językowym.
          </p>
          <p className="mt-2">
            Zbudowane przez{' '}
            <a
              href="https://simplefast.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-pkb-copper underline decoration-pkb-copper/40 underline-offset-2 transition hover:text-pkb-gold"
            >
              SimpleFast AI
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
