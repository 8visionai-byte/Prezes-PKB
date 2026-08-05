'use client';

import { useEffect, useRef, useState } from 'react';

type Rola = 'user' | 'assistant';
type Wiadomosc = { rola: Rola; tresc: string };

const PODPOWIEDZI = [
  'Przygotuj mnie do spotkania z firmą o NIP 8961660233',
  'Sprawdź firmę AVISTA OIL ze Strzegomia',
  'Kto jest dyrektorem PKB we Wrocławiu?',
];

export default function Czat() {
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState('');
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const dolRef = useRef<HTMLDivElement>(null);
  const polaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    dolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [wiadomosci, pracuje]);

  async function wyslij(trescWejscia?: string) {
    const pytanie = (trescWejscia ?? tekst).trim();
    if (!pytanie || pracuje) return;

    setBlad(null);
    setTekst('');
    const historia: Wiadomosc[] = [...wiadomosci, { rola: 'user', tresc: pytanie }];
    setWiadomosci([...historia, { rola: 'assistant', tresc: '' }]);
    setPracuje(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historia.map((m) => ({ role: m.rola, content: m.tresc })),
        }),
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
            const paczka = JSON.parse(dane);
            const kawalek = paczka?.choices?.[0]?.delta?.content ?? '';
            if (kawalek) {
              odpowiedz += kawalek;
              setWiadomosci([...historia, { rola: 'assistant', tresc: odpowiedz }]);
            }
          } catch {
            // pojedyncza niekompletna paczka - pomijamy, doklei się w następnej turze
          }
        }
      }

      if (!odpowiedz) {
        setWiadomosci([...historia, { rola: 'assistant', tresc: 'Asystent nie zwrócił odpowiedzi.' }]);
      }
    } catch (e) {
      const komunikat = e instanceof Error ? e.message : String(e);
      setBlad(komunikat);
      setWiadomosci(historia);
    } finally {
      setPracuje(false);
      polaRef.current?.focus();
    }
  }

  const pusto = wiadomosci.length === 0;

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4">
      <header className="flex items-center gap-3 py-5">
        <div className="grid size-9 place-items-center rounded-lg bg-pkb-accent/15 text-sm font-semibold tracking-wider text-pkb-accent">
          PKB
        </div>
        <div className="leading-tight">
          <h1 className="text-[15px] font-semibold">Asystent Prezesa</h1>
          <p className="text-xs text-pkb-muted">Partnerskie Kluby Biznesu</p>
        </div>
      </header>

      <main className="flex-1 pb-4">
        {pusto ? (
          <div className="flex flex-col items-start gap-6 pt-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Dzień dobry.</h2>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-pkb-muted">
                Podaj NIP albo nazwę firmy, a przygotuję brief przed spotkaniem: dane z rejestrów,
                czerwone flagi, co dzieje się w firmie i z kim z klubu ją skojarzyć.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {PODPOWIEDZI.map((p) => (
                <button
                  key={p}
                  onClick={() => wyslij(p)}
                  className="rounded-xl border border-pkb-border bg-pkb-surface px-4 py-3 text-left text-sm text-pkb-text/90 transition hover:border-pkb-accent-dim hover:bg-pkb-surface-2"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-5 pt-2">
            {wiadomosci.map((m, i) => {
              const ostatnia = i === wiadomosci.length - 1;
              return (
                <li key={i} className={m.rola === 'user' ? 'flex justify-end' : ''}>
                  {m.rola === 'user' ? (
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-pkb-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
                      {m.tresc}
                    </p>
                  ) : (
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {m.tresc}
                      {ostatnia && pracuje ? <span className="pkb-caret" aria-hidden /> : null}
                      {ostatnia && pracuje && !m.tresc ? (
                        <span className="text-pkb-muted">Sprawdzam...</span>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {blad ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {blad}
          </p>
        ) : null}
        <div ref={dolRef} />
      </main>

      <div className="sticky bottom-0 bg-pkb-bg/85 pb-5 pt-2 backdrop-blur">
        <div className="flex items-end gap-2 rounded-2xl border border-pkb-border bg-pkb-surface p-2 focus-within:border-pkb-accent-dim">
          <textarea
            ref={polaRef}
            rows={1}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void wyslij();
              }
            }}
            placeholder="Napisz wiadomość..."
            aria-label="Treść wiadomości"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-pkb-muted"
          />
          <button
            onClick={() => void wyslij()}
            disabled={pracuje || !tekst.trim()}
            aria-label="Wyślij"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-pkb-accent text-pkb-bg transition disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
