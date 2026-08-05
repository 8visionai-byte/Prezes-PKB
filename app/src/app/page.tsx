'use client';

import { useEffect, useRef, useState } from 'react';
import { Proza } from '@/components/Proza';

type Rola = 'user' | 'assistant';
type Wiadomosc = { rola: Rola; tresc: string };

const PODPOWIEDZI = [
  { tytul: 'Brief przed spotkaniem', tresc: 'Przygotuj mnie do spotkania z firmą o NIP 8961660233' },
  { tytul: 'Sprawdź firmę po nazwie', tresc: 'Sprawdź firmę AVISTA OIL ze Strzegomia' },
  { tytul: 'Znajdź dyrektora', tresc: 'Który dyrektor PKB odpowiada za Wrocław i jak się z nim skontaktować?' },
];

export default function Rozmowa() {
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState('');
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const dolRef = useRef<HTMLDivElement>(null);
  const poleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    dolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [wiadomosci, pracuje]);

  async function wyslij(trescWejscia?: string) {
    const pytanie = (trescWejscia ?? tekst).trim();
    if (!pytanie || pracuje) return;

    setBlad(null);
    setTekst('');
    if (poleRef.current) poleRef.current.style.height = 'auto';

    const historia: Wiadomosc[] = [...wiadomosci, { rola: 'user', tresc: pytanie }];
    setWiadomosci([...historia, { rola: 'assistant', tresc: '' }]);
    setPracuje(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historia.map((m) => ({ role: m.rola, content: m.tresc })) }),
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
              setWiadomosci([...historia, { rola: 'assistant', tresc: odpowiedz }]);
            }
          } catch {
            /* niekompletna paczka, doklei sie przy nastepnym odczycie */
          }
        }
      }

      if (!odpowiedz) {
        setWiadomosci([...historia, { rola: 'assistant', tresc: 'Asystent nie zwrócił odpowiedzi.' }]);
      }
    } catch (e) {
      setBlad(e instanceof Error ? e.message : String(e));
      setWiadomosci(historia);
    } finally {
      setPracuje(false);
      poleRef.current?.focus();
    }
  }

  const pusto = wiadomosci.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 lg:px-8">
      <header className="hidden items-baseline gap-2.5 py-7 lg:flex">
        <h1 className="text-[26px] font-semibold tracking-tight">Asystent</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">prezesa</span>
      </header>

      <main className="flex-1 pb-6 pt-4 lg:pt-0">
        {pusto ? (
          <div className="pkb-wejscie flex flex-col gap-7 pt-6 lg:pt-2">
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
                    <p className="max-w-[85%] rounded-2xl rounded-br-md border border-pkb-border-soft bg-pkb-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
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
                      m.tresc ? (
                        <span className="pkb-kursor" aria-hidden />
                      ) : (
                        <span className="pkb-puls text-[14px] text-pkb-muted">Sprawdzam w rejestrach i w sieci...</span>
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {blad ? (
          <p role="alert" className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {blad}
          </p>
        ) : null}
        <div ref={dolRef} />
      </main>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-pkb-bg via-pkb-bg to-transparent px-4 pb-5 pt-3 lg:-mx-8 lg:px-8">
        <div className="flex items-end gap-2 rounded-2xl border border-pkb-border bg-pkb-surface/90 p-2 backdrop-blur transition-colors focus-within:border-pkb-copper">
          <textarea
            ref={poleRef}
            rows={1}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 168)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void wyslij();
              }
            }}
            placeholder="Napisz wiadomość albo wklej NIP..."
            aria-label="Treść wiadomości"
            className="max-h-42 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] outline-none placeholder:text-pkb-faint"
          />
          <button
            onClick={() => void wyslij()}
            disabled={pracuje || !tekst.trim()}
            aria-label="Wyślij wiadomość"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-pkb-gold text-pkb-bg transition duration-200 hover:bg-pkb-gold-strong disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
