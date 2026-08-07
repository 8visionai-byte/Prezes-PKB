'use client';

import { useCallback, useEffect, useState } from 'react';

type ZdarzenieInstalacji = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Zgoda = 'nieznana' | 'brak' | 'tak' | 'nie';

/**
 * Pierwsze uruchomienie na telefonie: najpierw zaproszenie do zainstalowania aplikacji,
 * a zaraz po nim jedno miejsce, w którym prezes włącza mikrofon i powiadomienia.
 *
 * WAŻNE OGRANICZENIE PRZEGLĄDAREK, którego nie da się obejść: o mikrofon i o powiadomienia
 * wolno zapytać WYŁĄCZNIE w odpowiedzi na dotknięcie ekranu. Nie da się ich włączyć samemu
 * przy starcie. Dlatego zamiast udawać automat, pokazujemy dwa duże przyciski.
 * Na iPhonie powiadomienia działają dopiero po dodaniu aplikacji do ekranu głównego.
 */

/** Zamienia klucz z serwera na format wymagany przez przegladarke. */
function doTablicy(base64: string) {
  const uzupelnienie = '='.repeat((4 - (base64.length % 4)) % 4);
  const czysty = (base64 + uzupelnienie).replace(/-/g, '+').replace(/_/g, '/');
  const surowe = atob(czysty);
  return Uint8Array.from([...surowe].map((z) => z.charCodeAt(0)));
}

export function ZachetaPWA() {
  const [zdarzenie, setZdarzenie] = useState<ZdarzenieInstalacji | null>(null);
  const [iphone, setIphone] = useState(false);
  const [telefon, setTelefon] = useState(false);
  const [zainstalowana, setZainstalowana] = useState(false);
  const [ukryte, setUkryte] = useState(true);

  const [mikrofon, setMikrofon] = useState<Zgoda>('nieznana');
  const [dzwonek, setDzwonek] = useState<Zgoda>('nieznana');
  const [pracuje, setPracuje] = useState<'mikrofon' | 'dzwonek' | null>(null);

  const sprawdzZgody = useCallback(async () => {
    // Mikrofon pokazujemy tylko wtedy, gdy serwer ma czym rozpoznawac mowe.
    try {
      const r = await fetch('/api/transkrypcja');
      const d = await r.json();
      if (!d.skonfigurowane || !navigator.mediaDevices?.getUserMedia) setMikrofon('brak');
      else if (navigator.permissions?.query) {
        try {
          const s = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMikrofon(s.state === 'granted' ? 'tak' : s.state === 'denied' ? 'nie' : 'nieznana');
        } catch {
          setMikrofon('nieznana');
        }
      }
    } catch {
      setMikrofon('brak');
    }

    if (typeof Notification === 'undefined' || !('PushManager' in window)) setDzwonek('brak');
    else if (Notification.permission === 'granted') setDzwonek('tak');
    else if (Notification.permission === 'denied') setDzwonek('nie');
    else setDzwonek('nieznana');
  }, []);

  useEffect(() => {
    const wStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setZainstalowana(wStandalone);
    setTelefon(window.matchMedia('(max-width: 820px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent));
    setIphone(/iphone|ipad|ipod/i.test(navigator.userAgent));

    void sprawdzZgody();

    const naZdarzenie = (e: Event) => {
      e.preventDefault();
      setZdarzenie(e as ZdarzenieInstalacji);
    };
    window.addEventListener('beforeinstallprompt', naZdarzenie);

    if (localStorage.getItem('pkb-start-ukryty') !== '1') setUkryte(false);
    return () => window.removeEventListener('beforeinstallprompt', naZdarzenie);
  }, [sprawdzZgody]);

  async function wlaczMikrofon() {
    setPracuje('mikrofon');
    try {
      const strumien = await navigator.mediaDevices.getUserMedia({ audio: true });
      strumien.getTracks().forEach((t) => t.stop());
      setMikrofon('tak');
    } catch {
      setMikrofon('nie');
    } finally {
      setPracuje(null);
    }
  }

  async function wlaczDzwonek() {
    setPracuje('dzwonek');
    try {
      const zgoda = await Notification.requestPermission();
      if (zgoda !== 'granted') {
        setDzwonek('nie');
        return;
      }
      const { klucz, dostepne } = await (await fetch('/api/push')).json();
      if (!dostepne) {
        setDzwonek('brak');
        return;
      }
      const rej = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub =
        (await rej.pushManager.getSubscription()) ??
        (await rej.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: doTablicy(klucz) }));
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setDzwonek('tak');
    } catch {
      setDzwonek('nie');
    } finally {
      setPracuje(null);
    }
  }

  function schowaj() {
    localStorage.setItem('pkb-start-ukryty', '1');
    setUkryte(true);
  }

  const trzebaInstalowac = !zainstalowana && (Boolean(zdarzenie) || (iphone && telefon));
  // Pokazujemy karte takze wtedy, gdy przegladarka juz cos ZABLOKOWALA. Inaczej prezes
  // nie dowiedzialby sie, dlaczego mikrofon nie dziala i gdzie to odblokowac.
  const trzebaZgody = [mikrofon, dzwonek].some((s) => s === 'nieznana' || s === 'nie');
  if (ukryte || (!trzebaInstalowac && !trzebaZgody)) return null;

  const Wiersz = ({
    tytul,
    opis,
    stan,
    klucz,
    wlacz,
  }: {
    tytul: string;
    opis: string;
    stan: Zgoda;
    klucz: 'mikrofon' | 'dzwonek';
    wlacz: () => void;
  }) => {
    if (stan === 'brak') return null;
    return (
      <li className="flex items-center gap-3 border-t border-pkb-border-soft px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium">{tytul}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-pkb-muted">
            {stan === 'nie' ? 'Zablokowane w przeglądarce. Odblokuj to w jej ustawieniach dla tej strony.' : opis}
          </p>
        </div>
        {stan === 'tak' ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-900/40 text-emerald-300">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
        ) : (
          <button
            onClick={wlacz}
            disabled={pracuje === klucz || stan === 'nie'}
            className="shrink-0 rounded-lg border border-pkb-copper/60 px-3 py-1.5 text-[12.5px] text-pkb-gold transition hover:bg-pkb-copper/15 disabled:opacity-40"
          >
            {pracuje === klucz ? '...' : 'Włącz'}
          </button>
        )}
      </li>
    );
  };

  return (
    <section className="pkb-wejscie mb-4 overflow-hidden rounded-2xl border border-pkb-copper/40 bg-pkb-copper/10">
      <header className="flex items-start gap-3 px-4 py-3">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-pkb-gold" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">Ustaw asystenta na telefonie</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-pkb-muted">
            Chwila roboty, a potem asystent działa jak zwykła aplikacja.
          </p>
        </div>
        <button onClick={schowaj} aria-label="Ukryj" className="shrink-0 text-pkb-muted transition hover:text-pkb-text">×</button>
      </header>

      <ul>
        {trzebaInstalowac ? (
          <li className="flex items-center gap-3 border-t border-pkb-border-soft px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium">Dodaj do ekranu głównego</p>
              <p className="mt-0.5 text-[12px] leading-snug text-pkb-muted">
                {iphone ? (
                  <>Przycisk <strong>Udostępnij</strong>, potem <strong>Dodaj do ekranu początkowego</strong>. Na iPhonie powiadomienia działają dopiero po tym kroku.</>
                ) : (
                  <>Ikona z logo klubu, podpis „Asystent". Otwiera się bez paska przeglądarki.</>
                )}
              </p>
            </div>
            {zdarzenie ? (
              <button
                onClick={async () => {
                  await zdarzenie.prompt();
                  await zdarzenie.userChoice;
                  setZdarzenie(null);
                }}
                className="shrink-0 rounded-lg bg-pkb-gold px-3 py-1.5 text-[12.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
              >
                Zainstaluj
              </button>
            ) : null}
          </li>
        ) : null}

        <Wiersz
          tytul="Mikrofon"
          opis="Żebyś mógł dyktować zamiast pisać."
          stan={mikrofon}
          klucz="mikrofon"
          wlacz={() => void wlaczMikrofon()}
        />
        <Wiersz
          tytul="Powiadomienia"
          opis="Sygnał na telefon, gdy asystent skończy dłuższą pracę."
          stan={dzwonek}
          klucz="dzwonek"
          wlacz={() => void wlaczDzwonek()}
        />
      </ul>
    </section>
  );
}
