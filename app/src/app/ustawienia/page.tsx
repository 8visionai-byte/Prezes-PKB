'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Proza } from '@/components/Proza';
import { Powiadomienia } from '@/components/Powiadomienia';
import { useUstawienia } from '@/lib/ustawienia';

type Zakladka = 'wyglad' | 'asystent' | 'powiadomienia' | 'umiejetnosci' | 'mikrofon' | 'o-aplikacji';

const ZAKLADKI: { id: Zakladka; nazwa: string }[] = [
  { id: 'wyglad', nazwa: 'Wygląd' },
  { id: 'asystent', nazwa: 'Asystent' },
  { id: 'powiadomienia', nazwa: 'Powiadomienia' },
  { id: 'umiejetnosci', nazwa: 'Umiejętności' },
  { id: 'mikrofon', nazwa: 'Mikrofon' },
  { id: 'o-aplikacji', nazwa: 'O aplikacji' },
];

/* ---------- wspolne drobiazgi ---------- */

function Przelacznik({ wlaczone, zmien, etykieta }: { wlaczone: boolean; zmien: (w: boolean) => void; etykieta: string }) {
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

const Karta = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-pkb-border-soft bg-pkb-surface/40 px-5 py-4">{children}</div>
);

/* ---------- Wyglad ---------- */

function Wyglad() {
  const [ustawienia, ustaw] = useUstawienia();
  const pozycje = [
    {
      klucz: 'pandy' as const,
      tytul: 'Pandy na górze',
      opis: 'Dwie pandy pracują, schodzą się i podają sobie ręce. Czysta przyjemność, nic nie zmienia w działaniu.',
    },
    {
      klucz: 'animacje' as const,
      tytul: 'Ruch w interfejsie',
      opis: 'Napis, który sam się dopisuje, i chodzące pandy. Po wyłączeniu wszystko pojawia się od razu.',
    },
  ];

  return (
    <ul className="overflow-hidden rounded-2xl border border-pkb-border-soft bg-pkb-surface/40">
      {pozycje.map((p, i) => (
        <li key={p.klucz} className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? 'border-t border-pkb-border-soft' : ''}`}>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium">{p.tytul}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">{p.opis}</p>
          </div>
          <Przelacznik wlaczone={Boolean(ustawienia[p.klucz])} zmien={(w) => ustaw(p.klucz, w)} etykieta={p.tytul} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Asystent: jak ma sie zwracac ---------- */

const PRZYKLADY_ZWROTU = ['Panie Prezesie', 'Radku', 'Radosławie', 'Szefie'];

function Asystent() {
  const [zwrot, setZwrot] = useState('');
  const [oMnie, setOMnie] = useState('');
  const [wskazowki, setWskazowki] = useState('');
  const [wczytane, setWczytane] = useState(false);
  const [zapisuje, setZapisuje] = useState(false);
  const [komunikat, setKomunikat] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personalizacja')
      .then((r) => r.json())
      .then((d) => {
        setZwrot(d.zwrot ?? '');
        setOMnie(d.oMnie ?? '');
        setWskazowki(d.wskazowki ?? '');
      })
      .catch(() => {})
      .finally(() => setWczytane(true));
  }, []);

  async function zapisz() {
    setZapisuje(true);
    setKomunikat(null);
    try {
      const r = await fetch('/api/personalizacja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zwrot, oMnie, wskazowki }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'Nie udało się zapisać.');
      setKomunikat('Zapisane. Asystent zastosuje to od następnej wiadomości.');
    } catch (e) {
      setKomunikat(e instanceof Error ? e.message : String(e));
    } finally {
      setZapisuje(false);
    }
  }

  if (!wczytane) return <div className="h-64 animate-pulse rounded-2xl bg-pkb-surface/40" aria-busy />;

  return (
    <div className="flex flex-col gap-5">
      <Karta>
        <label className="block text-[14.5px] font-medium">Jak asystent ma się do Ciebie zwracać</label>
        <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">
          Wpisz dokładnie to, co chcesz słyszeć. Asystent użyje tego w każdej odpowiedzi.
        </p>
        <input
          value={zwrot}
          onChange={(e) => setZwrot(e.target.value)}
          placeholder="Panie Prezesie"
          className="mt-3 w-full rounded-lg border border-pkb-border bg-pkb-bg/60 px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-pkb-copper"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRZYKLADY_ZWROTU.map((p) => (
            <button
              key={p}
              onClick={() => setZwrot(p)}
              className="rounded-full border border-pkb-border px-2.5 py-1 text-[11.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
            >
              {p}
            </button>
          ))}
        </div>
      </Karta>

      <Karta>
        <label className="block text-[14.5px] font-medium">Kim jesteś</label>
        <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">
          Kilka zdań o Tobie i o klubie. Asystent nie musi się tego domyślać przy każdej rozmowie.
        </p>
        <textarea
          value={oMnie}
          onChange={(e) => setOMnie(e.target.value)}
          rows={5}
          placeholder="Prowadzę sieć klubów biznesowych w całej Polsce. Spotykam się z firmami, które rozważają wejście do klubu, i z członkami, którym szukam kontaktów."
          className="mt-3 w-full resize-y rounded-lg border border-pkb-border bg-pkb-bg/60 px-3.5 py-2.5 text-[14px] leading-relaxed outline-none transition-colors focus:border-pkb-copper"
        />
      </Karta>

      <Karta>
        <label className="block text-[14.5px] font-medium">Jak ma z Tobą pracować</label>
        <p className="mt-1 text-[13px] leading-relaxed text-pkb-muted">
          Twoje zasady. Na przykład: krótko, bez wstępów, zawsze z konkretną propozycją kolejnego kroku.
        </p>
        <textarea
          value={wskazowki}
          onChange={(e) => setWskazowki(e.target.value)}
          rows={5}
          placeholder="Odpowiadaj krótko. Zawsze podawaj źródło informacji o firmie. Gdy czegoś nie wiesz, powiedz wprost."
          className="mt-3 w-full resize-y rounded-lg border border-pkb-border bg-pkb-bg/60 px-3.5 py-2.5 text-[14px] leading-relaxed outline-none transition-colors focus:border-pkb-copper"
        />
      </Karta>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void zapisz()}
          disabled={zapisuje}
          className="rounded-lg bg-pkb-gold px-4 py-2.5 text-[13.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong disabled:opacity-50"
        >
          {zapisuje ? 'Zapisuję...' : 'Zapisz'}
        </button>
        {komunikat ? <span className="text-[13px] text-pkb-gold">{komunikat}</span> : null}
      </div>
    </div>
  );
}

/* ---------- Umiejetnosci ---------- */

type Umiejetnosc = { name?: string; description?: string; category?: string };

const NASZE = ['brief-firmy', 'wizualizacja', 'poczta'];
const NIEISTOTNE = new Set(['software-development', 'github', 'mlops', 'autonomous-ai-agents']);

function SzczegolyUmiejetnosci({ u, zamknij }: { u: Umiejetnosc; zamknij: () => void }) {
  const [tresc, setTresc] = useState<string | null>(null);
  const [blad, setBlad] = useState(false);

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => e.key === 'Escape' && zamknij();
    window.addEventListener('keydown', naKlawisz);
    return () => window.removeEventListener('keydown', naKlawisz);
  }, [zamknij]);

  useEffect(() => {
    fetch(`/api/umiejetnosci/tresc?nazwa=${encodeURIComponent(u.name ?? '')}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error();
        setTresc(d.tresc ?? '');
      })
      .catch(() => setBlad(true));
  }, [u.name]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={zamknij}
      role="dialog"
      aria-modal="true"
      aria-label={`Umiejętność: ${u.name}`}
    >
      <div onClick={(e) => e.stopPropagation()} className="pkb-wejscie flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-pkb-border bg-pkb-panel sm:rounded-2xl">
        <div className="flex items-start gap-3 border-b border-pkb-border-soft px-5 py-4">
          <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-pkb-gold">{u.name}</p>
          <button onClick={zamknij} aria-label="Zamknij" className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-text">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {u.description ? <p className="mb-4 text-[14px] leading-relaxed text-pkb-muted">{u.description}</p> : null}
          {blad ? (
            <p className="text-[13.5px] text-pkb-muted">Ta umiejętność nie ma osobnego opisu. Asystent i tak z niej korzysta.</p>
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

function Umiejetnosci() {
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

  const KartaU = ({ u, wyrozniona }: { u: Umiejetnosc; wyrozniona?: boolean }) => (
    <li>
      <button
        onClick={() => setOtwarta(u)}
        className={`w-full rounded-xl border p-4 text-left transition duration-200 ${
          wyrozniona ? 'border-pkb-copper/60 bg-pkb-copper/10 hover:border-pkb-gold' : 'border-pkb-border-soft bg-pkb-surface/50 hover:border-pkb-copper/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-medium text-pkb-gold">{u.name ?? 'bez nazwy'}</p>
          {wyrozniona ? <span className="shrink-0 rounded-full bg-pkb-gold/15 px-2 py-0.5 text-[10.5px] font-medium text-pkb-gold">dla PKB</span> : null}
        </div>
        {u.description ? <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-pkb-muted">{u.description}</p> : null}
      </button>
    </li>
  );

  if (blad) {
    return <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{blad}</p>;
  }
  if (lista === null) {
    return (
      <div className="space-y-2.5" aria-busy>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-pkb-surface/40" />
        ))}
      </div>
    );
  }

  return (
    <>
      <p className="text-[14px] leading-relaxed text-pkb-muted">
        Wszystkie są aktywne. Asystent sięga po nie sam, gdy pasują do pytania.
      </p>
      <input
        value={szukaj}
        onChange={(e) => setSzukaj(e.target.value)}
        placeholder="Szukaj umiejętności..."
        aria-label="Szukaj umiejętności"
        className="mt-4 w-full rounded-lg border border-pkb-border bg-pkb-surface/60 px-3.5 py-2.5 text-[14px] outline-none transition-colors placeholder:text-pkb-faint focus:border-pkb-copper"
      />

      {nasze.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">Zbudowane dla PKB</h3>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{nasze.map((u) => <KartaU key={u.name} u={u} wyrozniona />)}</ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">
          Wyposażenie standardowe ({przydatne.length})
        </h3>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{przydatne.map((u) => <KartaU key={u.name} u={u} />)}</ul>
      </section>

      {techniczne.length > 0 ? (
        <section className="mt-6">
          <button onClick={() => setPokazTechniczne((v) => !v)} className="text-[13px] text-pkb-muted underline underline-offset-4 transition hover:text-pkb-gold">
            {pokazTechniczne ? 'Ukryj' : 'Pokaż'} narzędzia techniczne ({techniczne.length})
          </button>
          {pokazTechniczne ? (
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{techniczne.map((u) => <KartaU key={u.name} u={u} />)}</ul>
          ) : null}
        </section>
      ) : null}

      {otwarta ? <SzczegolyUmiejetnosci u={otwarta} zamknij={() => setOtwarta(null)} /> : null}
    </>
  );
}

/* ---------- Mikrofon ---------- */

function Mikrofon() {
  const [ustawienia, ustaw] = useUstawienia();
  const [urzadzenia, setUrzadzenia] = useState<MediaDeviceInfo[] | null>(null);
  const [gotowe, setGotowe] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [poziom, setPoziom] = useState(0);
  const [sluchamy, setSluchamy] = useState(false);

  useEffect(() => {
    fetch('/api/transkrypcja')
      .then((r) => r.json())
      .then((d) => setGotowe(Boolean(d.skonfigurowane)))
      .catch(() => setGotowe(false));
  }, []);

  const wczytajUrzadzenia = useCallback(async () => {
    try {
      // Nazwy mikrofonow sa ukryte, dopoki uzytkownik raz nie zgodzi sie na dostep.
      const strumien = await navigator.mediaDevices.getUserMedia({ audio: true });
      strumien.getTracks().forEach((t) => t.stop());
      const lista = await navigator.mediaDevices.enumerateDevices();
      setUrzadzenia(lista.filter((d) => d.kind === 'audioinput'));
      setBlad(null);
    } catch {
      setBlad('Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki dla tej strony.');
    }
  }, []);

  /** Krotki test: prezes mowi i widzi, czy pasek się rusza. */
  async function sprawdz() {
    setSluchamy(true);
    try {
      const strumien = await navigator.mediaDevices.getUserMedia({
        audio: ustawienia.mikrofonId ? { deviceId: { exact: ustawienia.mikrofonId } } : true,
      });
      const kontekst = new AudioContext();
      const zrodlo = kontekst.createMediaStreamSource(strumien);
      const analizator = kontekst.createAnalyser();
      analizator.fftSize = 512;
      zrodlo.connect(analizator);
      const dane = new Uint8Array(analizator.frequencyBinCount);
      const koniec = Date.now() + 6000;

      const mierz = () => {
        analizator.getByteTimeDomainData(dane);
        let suma = 0;
        for (const v of dane) suma += Math.abs(v - 128);
        setPoziom(Math.min(1, suma / dane.length / 40));
        if (Date.now() < koniec) requestAnimationFrame(mierz);
        else {
          strumien.getTracks().forEach((t) => t.stop());
          void kontekst.close();
          setSluchamy(false);
          setPoziom(0);
        }
      };
      requestAnimationFrame(mierz);
    } catch {
      setBlad('Nie udało się uruchomić tego mikrofonu.');
      setSluchamy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!gotowe ? (
        <Karta>
          <p className="text-[14.5px] font-medium">Dyktowanie czeka na konfigurację</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-pkb-muted">
            Na serwerze brakuje jeszcze klucza do rozpoznawania mowy. Do tego czasu mikrofon
            nie pokazuje się przy polu wiadomości.
          </p>
        </Karta>
      ) : null}

      <Karta>
        <p className="text-[14.5px] font-medium">Którego mikrofonu używać</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-pkb-muted">
          Na telefonie zwykle jest jeden i nie ma czego wybierać. Na komputerze bywa kilka:
          wbudowany, kamera, słuchawki.
        </p>

        {urzadzenia === null ? (
          <button
            onClick={() => void wczytajUrzadzenia()}
            className="mt-3 rounded-lg border border-pkb-border px-3.5 py-2 text-[13px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
          >
            Pokaż dostępne mikrofony
          </button>
        ) : (
          <select
            value={ustawienia.mikrofonId}
            onChange={(e) => ustaw('mikrofonId', e.target.value)}
            aria-label="Wybór mikrofonu"
            className="mt-3 w-full rounded-lg border border-pkb-border bg-pkb-bg/60 px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-pkb-copper"
          >
            <option value="">Domyślny mikrofon systemu</option>
            {urzadzenia.map((u, i) => (
              <option key={u.deviceId} value={u.deviceId}>
                {u.label || `Mikrofon ${i + 1}`}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => void sprawdz()}
            disabled={sluchamy}
            className="rounded-lg border border-pkb-border px-3.5 py-2 text-[13px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold disabled:opacity-50"
          >
            {sluchamy ? 'Mów...' : 'Sprawdź mikrofon'}
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-pkb-surface-2">
            <div
              className="h-full rounded-full bg-pkb-gold transition-[width] duration-75"
              style={{ width: `${Math.round(poziom * 100)}%` }}
            />
          </div>
        </div>

        {blad ? <p className="mt-3 text-[13px] text-red-200">{blad}</p> : null}
      </Karta>
    </div>
  );
}

/* ---------- O aplikacji ---------- */

function OAplikacji() {
  return (
    <div className="flex flex-col gap-5">
      <Karta>
        <p className="text-[13.5px] leading-relaxed text-pkb-muted">
          Asystent Prezesa Partnerskich Klubów Biznesu. Silnik i dane stoją na własnym serwerze
          w Niemczech, nic nie przechodzi przez cudze narzędzia poza modelem językowym.
        </p>
        <p className="mt-2 text-[13.5px] text-pkb-muted">
          Zbudowane przez{' '}
          <a href="https://simplefast.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-pkb-copper underline decoration-pkb-copper/40 underline-offset-2 transition hover:text-pkb-gold">
            SimpleFast AI
          </a>
          .
        </p>
      </Karta>
    </div>
  );
}

/* ---------- strona ---------- */

function TrescUstawien() {
  const parametry = useSearchParams();
  const router = useRouter();
  const zParametru = parametry.get('zakladka') as Zakladka | null;
  const aktywna: Zakladka = ZAKLADKI.some((z) => z.id === zParametru) ? (zParametru as Zakladka) : 'wyglad';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">Ustawienia</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">aplikacji</span>
      </header>

      <div className="mt-5 -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div className="flex w-max gap-1 border-b border-pkb-border-soft pb-px">
          {ZAKLADKI.map((z) => (
            <button
              key={z.id}
              onClick={() => router.replace(`/ustawienia?zakladka=${z.id}`, { scroll: false })}
              className={`relative whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-[13.5px] transition-colors ${
                aktywna === z.id ? 'text-pkb-gold' : 'text-pkb-muted hover:bg-pkb-hover hover:text-pkb-text'
              }`}
            >
              {z.nazwa}
              {aktywna === z.id ? <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-pkb-gold" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {aktywna === 'wyglad' ? <Wyglad /> : null}
        {aktywna === 'asystent' ? <Asystent /> : null}
        {aktywna === 'powiadomienia' ? <Powiadomienia wariant="ustawienia" /> : null}
        {aktywna === 'umiejetnosci' ? <Umiejetnosci /> : null}
        {aktywna === 'mikrofon' ? <Mikrofon /> : null}
        {aktywna === 'o-aplikacji' ? <OAplikacji /> : null}
      </div>
    </div>
  );
}

export default function Ustawienia() {
  return (
    <Suspense fallback={null}>
      <TrescUstawien />
    </Suspense>
  );
}
