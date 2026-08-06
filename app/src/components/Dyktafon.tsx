'use client';

import { useEffect, useRef, useState } from 'react';
import { wczytajUstawienia } from '@/lib/ustawienia';

/**
 * Mikrofon przy polu wpisywania. Prezes trzyma telefon i mowi, a tekst laduje
 * w polu do POPRAWIENIA, nie leci od razu do asystenta. To celowe: rozpoznawanie
 * mowy myli sie na nazwiskach i numerach, a prezes ma zobaczyc, co wysyla.
 *
 * Obsluga iPhone'a: Safari nagrywa w audio/mp4, Chrome i Android w audio/webm.
 * Wybieramy format, ktory dana przegladarka realnie potrafi, i dobieramy rozszerzenie
 * pliku, bo po nim rozpoznaje go serwer transkrypcji.
 */

const FORMATY = [
  { mime: 'audio/webm;codecs=opus', koncowka: 'webm' },
  { mime: 'audio/webm', koncowka: 'webm' },
  { mime: 'audio/mp4', koncowka: 'mp4' },
  { mime: 'audio/ogg;codecs=opus', koncowka: 'ogg' },
];

type Stan = 'gotowy' | 'nagrywa' | 'rozpoznaje';

export function Dyktafon({
  naTekst,
  etykieta = 'Dyktuj wiadomość',
}: {
  naTekst: (tekst: string) => void;
  etykieta?: string;
}) {
  const [dostepny, setDostepny] = useState(false);
  const [stan, setStan] = useState<Stan>('gotowy');
  const [blad, setBlad] = useState<string | null>(null);
  const [sekundy, setSekundy] = useState(0);

  const rejestrator = useRef<MediaRecorder | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const zegar = useRef<number | null>(null);

  useEffect(() => {
    // Mikrofon ma sens tylko wtedy, gdy przegladarka go daje ORAZ serwer ma czym
    // rozpoznawac mowe. Inaczej nie pokazujemy przycisku, ktory i tak nie zadziala.
    const maSprzet =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';
    if (!maSprzet) return;

    fetch('/api/transkrypcja')
      .then((r) => (r.ok ? r.json() : { skonfigurowane: false }))
      .then((d) => setDostepny(Boolean(d.skonfigurowane)))
      .catch(() => setDostepny(false));
  }, []);

  useEffect(() => () => {
    if (zegar.current) window.clearInterval(zegar.current);
    rejestrator.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    setBlad(null);
    try {
      // Mikrofon wybrany w ustawieniach. Pusty ciag = ten, ktory system uznaje za domyslny.
      const wybrany = wczytajUstawienia().mikrofonId;
      const strumien = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          ...(wybrany ? { deviceId: { exact: wybrany } } : {}),
        },
      });

      const format = FORMATY.find((f) => MediaRecorder.isTypeSupported(f.mime));
      const rec = new MediaRecorder(strumien, format ? { mimeType: format.mime } : undefined);
      kawalki.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) kawalki.current.push(e.data);
      };

      rec.onstop = async () => {
        strumien.getTracks().forEach((t) => t.stop());
        if (zegar.current) window.clearInterval(zegar.current);
        setSekundy(0);

        const koncowka = format?.koncowka ?? 'webm';
        const nagranie = new Blob(kawalki.current, { type: format?.mime ?? 'audio/webm' });
        if (nagranie.size < 1200) {
          setStan('gotowy');
          setBlad('Za krótkie nagranie. Przytrzymaj mikrofon i mów spokojnie.');
          return;
        }

        setStan('rozpoznaje');
        try {
          const dane = new FormData();
          dane.append('nagranie', nagranie, `dyktowanie.${koncowka}`);
          const r = await fetch('/api/transkrypcja', { method: 'POST', body: dane });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
          if (d.tekst) naTekst(d.tekst);
          else setBlad('Nic nie usłyszałem. Spróbuj jeszcze raz.');
        } catch (e) {
          setBlad(e instanceof Error ? e.message : String(e));
        } finally {
          setStan('gotowy');
        }
      };

      rec.start();
      rejestrator.current = rec;
      setStan('nagrywa');
      zegar.current = window.setInterval(() => setSekundy((s) => s + 1), 1000);
    } catch {
      setBlad('Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki.');
    }
  }

  function stop() {
    rejestrator.current?.stop();
    rejestrator.current = null;
  }

  if (!dostepny) return null;

  const czas = `${Math.floor(sekundy / 60)}:${String(sekundy % 60).padStart(2, '0')}`;

  return (
    <>
      <button
        type="button"
        onClick={() => (stan === 'nagrywa' ? stop() : stan === 'gotowy' ? void start() : undefined)}
        disabled={stan === 'rozpoznaje'}
        aria-label={stan === 'nagrywa' ? 'Zakończ nagrywanie' : etykieta}
        title={stan === 'nagrywa' ? 'Kliknij, aby zakończyć' : etykieta}
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition ${
          stan === 'nagrywa'
            ? 'bg-red-900/40 text-red-200'
            : 'text-pkb-muted hover:bg-pkb-surface-2 hover:text-pkb-gold'
        } disabled:opacity-50`}
      >
        {stan === 'rozpoznaje' ? (
          <span className="pkb-puls text-[11px]">...</span>
        ) : stan === 'nagrywa' ? (
          <span className="size-3 rounded-[3px] bg-red-300" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
          </svg>
        )}
      </button>

      {stan === 'nagrywa' ? (
        <span className="flex items-center gap-1.5 text-[12px] text-red-200" role="status">
          <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
          {czas}
        </span>
      ) : null}

      {stan === 'rozpoznaje' ? (
        <span className="text-[12px] text-pkb-faint" role="status">
          zamieniam na tekst...
        </span>
      ) : null}

      {blad ? (
        <span role="alert" className="text-[12px] text-red-200">
          {blad}
        </span>
      ) : null}
    </>
  );
}
