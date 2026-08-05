'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Proza } from '@/components/Proza';
import { PodgladPliku } from '@/components/PodgladPliku';

type Wiadomosc = { rola: 'user' | 'assistant'; tresc: string };
type Naglowek = { id: string; tytul: string; zmieniona: number };
type Plik = { nazwa: string; rozmiar: number; zmieniony: string };

const PODPOWIEDZI = [
  { tytul: 'Brief przed spotkaniem', tresc: 'Przygotuj mnie do spotkania z firmą o NIP 8961660233' },
  { tytul: 'Sprawdź firmę po nazwie', tresc: 'Sprawdź firmę AVISTA OIL ze Strzegomia' },
  { tytul: 'Znajdź dyrektora', tresc: 'Który dyrektor PKB odpowiada za Wrocław i jak się z nim skontaktować?' },
];

const SCIEZKA_BAZY = '/opt/data/profiles/prezes-test/workspace/baza-wiedzy';

function kiedy(z: number) {
  const min = Math.round((Date.now() - z) / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const g = Math.round(min / 60);
  if (g < 24) return `${g} godz. temu`;
  const d = Math.round(g / 24);
  return d === 1 ? 'wczoraj' : `${d} dni temu`;
}

function rozmiarPliku(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function Czat() {
  const [id, setId] = useState('');
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState('');
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  const [historia, setHistoria] = useState<Naglowek[]>([]);
  const [panel, setPanel] = useState<'brak' | 'historia' | 'baza'>('brak');
  const [pliki, setPliki] = useState<Plik[] | null>(null);
  const [zalaczniki, setZalaczniki] = useState<string[]>([]);
  const [wysylaPlik, setWysylaPlik] = useState(false);
  const [podglad, setPodglad] = useState<string | null>(null);

  const dolRef = useRef<HTMLDivElement>(null);
  const poleRef = useRef<HTMLTextAreaElement>(null);
  const plikRef = useRef<HTMLInputElement>(null);

  const odswiezHistorie = useCallback(async () => {
    try {
      const r = await fetch('/api/rozmowy');
      const d = await r.json();
      if (r.ok) setHistoria(d.rozmowy ?? []);
    } catch { /* historia nie jest krytyczna */ }
  }, []);

  const odswiezPliki = useCallback(async () => {
    try {
      const r = await fetch('/api/pliki');
      const d = await r.json();
      if (r.ok) setPliki(d.pliki ?? []);
    } catch { /* jw. */ }
  }, []);

  useEffect(() => {
    setId(`r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    void odswiezHistorie();
    void odswiezPliki();
  }, [odswiezHistorie, odswiezPliki]);

  useEffect(() => {
    dolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [wiadomosci, pracuje]);

  async function zapisz(lista: Wiadomosc[]) {
    if (!id || lista.length === 0) return;
    const pierwsza = lista.find((m) => m.rola === 'user')?.tresc ?? '';
    const tytul = pierwsza.replace(/\s+/g, ' ').trim().slice(0, 60) || 'Nowa rozmowa';
    try {
      await fetch('/api/rozmowy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tytul, zmieniona: Date.now(), wiadomosci: lista }),
      });
      await odswiezHistorie();
    } catch { /* zapis historii nie moze przerwac rozmowy */ }
  }

  function nowaRozmowa() {
    setId(`r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setWiadomosci([]);
    setZalaczniki([]);
    setBlad(null);
    setPanel('brak');
    poleRef.current?.focus();
  }

  async function otworz(n: Naglowek) {
    try {
      const r = await fetch(`/api/rozmowy/${encodeURIComponent(n.id)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Nie udało się wczytać rozmowy.');
      setId(d.rozmowa.id);
      setWiadomosci(d.rozmowa.wiadomosci ?? []);
      setZalaczniki([]);
      setPanel('brak');
      setBlad(null);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    }
  }

  async function usunRozmowe(rid: string) {
    await fetch('/api/rozmowy', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rid }),
    });
    await odswiezHistorie();
    if (rid === id) nowaRozmowa();
  }

  async function wgrajPlik(plik: File) {
    setBlad(null);
    setWysylaPlik(true);
    try {
      const dane = new FormData();
      dane.append('plik', plik);
      const r = await fetch('/api/pliki', { method: 'POST', body: dane });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
      setZalaczniki((z) => [...new Set([...z, d.nazwa])]);
      await odswiezPliki();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
    } finally {
      setWysylaPlik(false);
      if (plikRef.current) plikRef.current.value = '';
    }
  }

  async function usunPlik(nazwa: string) {
    await fetch('/api/pliki', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nazwa }),
    });
    setZalaczniki((z) => z.filter((n) => n !== nazwa));
    await odswiezPliki();
  }

  async function wyslij(trescWejscia?: string) {
    const pytanie = (trescWejscia ?? tekst).trim();
    if ((!pytanie && zalaczniki.length === 0) || pracuje) return;

    setBlad(null);
    setTekst('');
    if (poleRef.current) poleRef.current.style.height = 'auto';

    const doModelu =
      zalaczniki.length > 0
        ? `${pytanie}\n\n[Dołączone pliki: ${zalaczniki.map((n) => `${SCIEZKA_BAZY}/${n}`).join(', ')}. Przeczytaj je, jeśli są potrzebne.]`
        : pytanie;

    const widoczne: Wiadomosc[] = [
      ...wiadomosci,
      { rola: 'user', tresc: zalaczniki.length ? `${pytanie}\n\nZałączniki: ${zalaczniki.join(', ')}` : pytanie },
    ];
    const kontekst: Wiadomosc[] = [...wiadomosci, { rola: 'user', tresc: doModelu }];

    setWiadomosci([...widoczne, { rola: 'assistant', tresc: '' }]);
    setZalaczniki([]);
    setPracuje(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: kontekst.map((m) => ({ role: m.rola, content: m.tresc })) }),
      });
      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => ({ error: 'Nieznany błąd' }));
        throw new Error(info.error ?? `Błąd ${res.status}`);
      }

      const czytnik = res.body.getReader();
      const dekoder = new TextDecoder();
      let bufor = '';
      let odpowiedz = '';

      for (;;) {
        const { done, value } = await czytnik.read();
        if (done) break;
        bufor += dekoder.decode(value, { stream: true });
        const linie = bufor.split('\n');
        bufor = linie.pop() ?? '';
        for (const linia of linie) {
          const l = linia.trim();
          if (!l.startsWith('data:')) continue;
          const dane = l.slice(5).trim();
          if (!dane || dane === '[DONE]') continue;
          try {
            const kawalek = JSON.parse(dane)?.choices?.[0]?.delta?.content ?? '';
            if (kawalek) {
              odpowiedz += kawalek;
              setWiadomosci([...widoczne, { rola: 'assistant', tresc: odpowiedz }]);
            }
          } catch { /* niekompletna paczka */ }
        }
      }

      const finalne: Wiadomosc[] = [
        ...widoczne,
        { rola: 'assistant', tresc: odpowiedz || 'Asystent nie zwrócił odpowiedzi.' },
      ];
      setWiadomosci(finalne);
      void zapisz(finalne);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
      setWiadomosci(widoczne);
    } finally {
      setPracuje(false);
      poleRef.current?.focus();
    }
  }

  const pusto = wiadomosci.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 lg:px-8">
      <header className="flex items-center gap-2 py-5 lg:py-7">
        <div className="mr-auto hidden items-baseline gap-2.5 lg:flex">
          <h1 className="text-[26px] font-semibold tracking-tight">Asystent</h1>
          <span className="font-serif text-[26px] italic text-pkb-gold">prezesa</span>
        </div>
        <button
          onClick={() => setPanel(panel === 'historia' ? 'brak' : 'historia')}
          aria-expanded={panel === 'historia'}
          className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
            panel === 'historia'
              ? 'border-pkb-copper bg-pkb-surface text-pkb-gold'
              : 'border-pkb-border text-pkb-muted hover:border-pkb-copper hover:text-pkb-gold'
          }`}
        >
          Rozmowy ({historia.length})
        </button>
        <button
          onClick={() => setPanel(panel === 'baza' ? 'brak' : 'baza')}
          aria-expanded={panel === 'baza'}
          className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
            panel === 'baza'
              ? 'border-pkb-copper bg-pkb-surface text-pkb-gold'
              : 'border-pkb-border text-pkb-muted hover:border-pkb-copper hover:text-pkb-gold'
          }`}
        >
          Dokumenty ({pliki?.length ?? 0})
        </button>
        {!pusto ? (
          <button
            onClick={nowaRozmowa}
            className="rounded-lg bg-pkb-gold px-3 py-1.5 text-[13px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong"
          >
            Nowa
          </button>
        ) : null}
      </header>

      {panel === 'historia' ? (
        <div className="pkb-wejscie mb-5 rounded-xl border border-pkb-border-soft bg-pkb-surface/60 p-3">
          {historia.length === 0 ? (
            <p className="px-2 py-3 text-[13.5px] text-pkb-muted">Nie ma jeszcze zapisanych rozmów.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {historia.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <button onClick={() => void otworz(r)} className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left transition hover:bg-pkb-surface-2">
                    <span className="block truncate text-[13.5px]">{r.tytul}</span>
                    <span className="block text-[11.5px] text-pkb-faint">{kiedy(r.zmieniona)}</span>
                  </button>
                  <button
                    onClick={() => void usunRozmowe(r.id)}
                    aria-label={`Usuń rozmowę: ${r.tytul}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:bg-pkb-surface-2 hover:text-red-300"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {panel === 'baza' ? (
        <div className="pkb-wejscie mb-5 rounded-xl border border-pkb-border-soft bg-pkb-surface/60 p-3">
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <p className="text-[12.5px] text-pkb-muted">Dokumenty, które czyta asystent</p>
            <button
              onClick={() => plikRef.current?.click()}
              disabled={wysylaPlik}
              className="rounded-lg bg-pkb-gold px-2.5 py-1 text-[12.5px] font-medium text-pkb-bg transition hover:bg-pkb-gold-strong disabled:opacity-40"
            >
              {wysylaPlik ? 'Wgrywam...' : 'Dodaj'}
            </button>
          </div>
          {pliki && pliki.length > 0 ? (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {pliki.map((p) => (
                <li key={p.nazwa} className="flex items-center gap-2">
                  <button onClick={() => setPodglad(p.nazwa)} className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left transition hover:bg-pkb-surface-2">
                    <span className="block truncate text-[13.5px]">{p.nazwa}</span>
                    <span className="block text-[11.5px] text-pkb-faint">
                      {rozmiarPliku(p.rozmiar)} · {new Date(p.zmieniony).toLocaleDateString('pl-PL')} · kliknij, aby zobaczyć
                    </span>
                  </button>
                  <button
                    onClick={() => setZalaczniki((z) => [...new Set([...z, p.nazwa])])}
                    aria-label={`Dołącz ${p.nazwa} do rozmowy`}
                    title="Dołącz do rozmowy"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:bg-pkb-surface-2 hover:text-pkb-gold"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                  <button
                    onClick={() => void usunPlik(p.nazwa)}
                    aria-label={`Usuń ${p.nazwa}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-pkb-faint transition hover:bg-pkb-surface-2 hover:text-red-300"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-[13.5px] text-pkb-muted">Brak dokumentów. Dodaj pierwszy przyciskiem powyżej.</p>
          )}
        </div>
      ) : null}

      <main className="flex-1 pb-6">
        {pusto ? (
          <div className="pkb-wejscie flex flex-col gap-7 pt-2">
            <p className="max-w-lg text-[15.5px] leading-relaxed text-pkb-muted">
              Podaj NIP albo nazwę firmy, a przygotuję brief przed spotkaniem: dane z rejestrów,
              czerwone flagi, co słychać w firmie i z kim z klubu ją skojarzyć.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PODPOWIEDZI.map((p) => (
                <button
                  key={p.tytul}
                  onClick={() => void wyslij(p.tresc)}
                  className="group rounded-xl border border-pkb-border-soft bg-pkb-surface/50 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-pkb-copper/60 hover:bg-pkb-surface"
                >
                  <span className="block text-[13.5px] font-medium text-pkb-gold">{p.tytul}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-pkb-muted">{p.tresc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-6">
            {wiadomosci.map((m, i) => {
              const ostatnia = i === wiadomosci.length - 1;
              if (m.rola === 'user') {
                return (
                  <li key={i} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-pkb-border-soft bg-pkb-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
                      {m.tresc}
                    </p>
                  </li>
                );
              }
              return (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-pkb-copper/40 bg-pkb-copper/10 text-[10px] font-semibold tracking-wider text-pkb-gold">
                    PKB
                  </span>
                  <div className="min-w-0 flex-1">
                    {m.tresc ? <Proza tresc={m.tresc} /> : null}
                    {ostatnia && pracuje ? (
                      m.tresc ? <span className="pkb-kursor" aria-hidden /> : <span className="pkb-puls text-[14px] text-pkb-muted">Sprawdzam w rejestrach i w sieci...</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {blad ? (
          <p role="alert" className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{blad}</p>
        ) : null}
        <div ref={dolRef} />
      </main>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-pkb-bg via-pkb-bg to-transparent px-4 pb-5 pt-3 lg:-mx-8 lg:px-8">
        {zalaczniki.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {zalaczniki.map((n) => (
              <span key={n} className="flex items-center gap-2 rounded-lg border border-pkb-copper/40 bg-pkb-copper/10 px-2.5 py-1 text-[12.5px] text-pkb-gold">
                <button onClick={() => setPodglad(n)} className="underline underline-offset-2">{n}</button>
                <button onClick={() => setZalaczniki((z) => z.filter((x) => x !== n))} aria-label={`Odepnij ${n}`} className="text-pkb-muted transition hover:text-pkb-text">×</button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-2xl border border-pkb-border bg-pkb-surface/90 p-2 backdrop-blur transition-colors focus-within:border-pkb-copper">
          <input
            ref={plikRef}
            type="file"
            className="sr-only"
            onChange={(e) => { const p = e.target.files?.[0]; if (p) void wgrajPlik(p); }}
            accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
          />
          <button
            onClick={() => plikRef.current?.click()}
            disabled={wysylaPlik}
            aria-label="Dołącz dokument"
            title="Dołącz dokument"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-pkb-muted transition hover:bg-pkb-surface-2 hover:text-pkb-gold disabled:opacity-40"
          >
            {wysylaPlik ? <span className="pkb-puls text-[11px]">...</span> : (
              <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>
          <textarea
            ref={poleRef}
            rows={1}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 168)}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void wyslij(); } }}
            placeholder="Napisz wiadomość albo wklej NIP..."
            aria-label="Treść wiadomości"
            className="max-h-42 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-pkb-faint"
          />
          <button
            onClick={() => void wyslij()}
            disabled={pracuje || (!tekst.trim() && zalaczniki.length === 0)}
            aria-label="Wyślij wiadomość"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-pkb-gold text-pkb-bg transition duration-200 hover:bg-pkb-gold-strong disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
      </div>

      {podglad ? <PodgladPliku nazwa={podglad} zamknij={() => setPodglad(null)} /> : null}
    </div>
  );
}
