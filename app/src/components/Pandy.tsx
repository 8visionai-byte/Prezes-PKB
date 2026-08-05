'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Pasek z pikselowymi pandami. Odslania sie przeciagnieciem palcem w dol
 * na gorze strony (jak odswiezanie), na komputerze przyciskiem w stopce sidebara.
 *
 * Rysowane w calosci kodem: zero obrazkow, zero bibliotek, kilka kilobajtow.
 * Scena zapetla sie: dwie pandy ida ku sobie, spotykaja sie, podaja lapy, machaja, wracaja.
 */

const P = 4; // wielkosc jednego piksela sceny
const SZER = 120; // szerokosc sceny w pikselach
const WYS = 26;

type Paleta = { czern: string; biel: string; tlo: string; akcent: string };

function rysujPande(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kierunek: 1 | -1,
  faza: number,
  lapaWGorze: boolean,
  p: Paleta,
) {
  const px = (dx: number, dy: number, w: number, h: number, kolor: string) => {
    ctx.fillStyle = kolor;
    const rx = kierunek === 1 ? x + dx : x + (10 - dx - w);
    ctx.fillRect(rx * P, (y + dy) * P, w * P, h * P);
  };

  const krok = faza % 2 === 0;

  // uszy
  px(1, 0, 2, 2, p.czern);
  px(7, 0, 2, 2, p.czern);
  // glowa
  px(1, 1, 8, 5, p.biel);
  // obwodki oczu
  px(2, 3, 2, 2, p.czern);
  px(6, 3, 2, 2, p.czern);
  // oczy
  px(3, 4, 1, 1, p.biel);
  px(7, 4, 1, 1, p.biel);
  // nos
  px(4, 4, 2, 1, p.czern);
  // tulow
  px(2, 6, 6, 5, p.biel);
  // lapy przednie
  if (lapaWGorze) {
    px(8, 5, 2, 2, p.czern);
  } else {
    px(8, 7, 2, 2, p.czern);
  }
  px(0, 7, 2, 2, p.czern);
  // nogi w ruchu
  px(2, 11, 2, 2, krok ? p.czern : p.tlo);
  px(6, 11, 2, 2, krok ? p.tlo : p.czern);
  px(2, 11, 2, krok ? 2 : 1, p.czern);
  px(6, 11, 2, krok ? 1 : 2, p.czern);
}

function rysujSerce(ctx: CanvasRenderingContext2D, x: number, y: number, kolor: string) {
  const px = (dx: number, dy: number) => {
    ctx.fillStyle = kolor;
    ctx.fillRect((x + dx) * P, (y + dy) * P, P, P);
  };
  [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [3, 1], [6, 1], [0, 2], [6, 2], [1, 3], [5, 3], [2, 4], [4, 4], [3, 5]].forEach(
    ([a, b]) => px(a, b),
  );
}

export function Pandy({ widoczne }: { widoczne: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!widoczne) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ograniczonyRuch = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paleta: Paleta = { czern: '#2a2119', biel: '#f0e6d8', tlo: 'transparent', akcent: '#e8b87a' };

    ctx.imageSmoothingEnabled = false;
    let klatka = 0;
    let animacja = 0;

    const START_L = 6;
    const START_P = SZER - 16;
    const SPOTKANIE_L = SZER / 2 - 12;
    const SPOTKANIE_P = SZER / 2 + 2;

    const rysuj = () => {
      klatka += 1;
      const t = klatka % 300; // pelna petla sceny
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ziemia
      ctx.fillStyle = 'rgba(184,125,63,0.25)';
      ctx.fillRect(0, (WYS - 1) * P, canvas.width, P);

      let xl: number;
      let xp: number;
      let uscisk = false;
      let machanie = false;

      if (t < 90) {
        const post = t / 90;
        xl = START_L + (SPOTKANIE_L - START_L) * post;
        xp = START_P + (SPOTKANIE_P - START_P) * post;
      } else if (t < 150) {
        xl = SPOTKANIE_L;
        xp = SPOTKANIE_P;
        uscisk = true;
      } else if (t < 210) {
        xl = SPOTKANIE_L;
        xp = SPOTKANIE_P;
        machanie = true;
      } else {
        const post = (t - 210) / 90;
        xl = SPOTKANIE_L + (START_L - SPOTKANIE_L) * post;
        xp = SPOTKANIE_P + (START_P - SPOTKANIE_P) * post;
      }

      const idzie = t < 90 || t >= 210;
      const faza = idzie ? Math.floor(klatka / 8) : 0;
      const machniecie = machanie && Math.floor(klatka / 10) % 2 === 0;

      rysujPande(ctx, xl, WYS - 14, 1, faza, uscisk || machniecie, paleta);
      rysujPande(ctx, xp, WYS - 14, -1, faza + 1, uscisk, paleta);

      if (uscisk) {
        ctx.fillStyle = paleta.akcent;
        ctx.fillRect((SPOTKANIE_L + 10) * P, (WYS - 9) * P, (SPOTKANIE_P - SPOTKANIE_L - 10) * P, 2 * P);
      }
      if (machanie) {
        rysujSerce(ctx, SZER / 2 - 3, 2 + (Math.floor(klatka / 12) % 2), paleta.akcent);
      }

      animacja = requestAnimationFrame(rysuj);
    };

    if (ograniczonyRuch) {
      // Bez ruchu: jedna statyczna klatka ze spotkaniem.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rysujPande(ctx, SZER / 2 - 12, WYS - 14, 1, 0, true, paleta);
      rysujPande(ctx, SZER / 2 + 2, WYS - 14, -1, 0, true, paleta);
    } else {
      animacja = requestAnimationFrame(rysuj);
    }

    return () => cancelAnimationFrame(animacja);
  }, [widoczne]);

  if (!widoczne) return null;

  return (
    <div className="pointer-events-none flex justify-center overflow-hidden" aria-hidden>
      <canvas ref={ref} width={SZER * P} height={WYS * P} className="h-[68px] w-full max-w-[480px] opacity-90" />
    </div>
  );
}

/** Odslanianie paska przeciagnieciem palcem w dol na samej gorze strony. */
export function PandyPrzeciagnij({ wlaczone }: { wlaczone: boolean }) {
  const [odslona, setOdslona] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!wlaczone) return;

    const dotknij = (e: TouchEvent) => {
      start.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const przesun = (e: TouchEvent) => {
      if (start.current === null) return;
      const delta = e.touches[0].clientY - start.current;
      if (delta > 0) setOdslona(Math.min(delta / 2, 76));
    };
    const puscil = () => {
      start.current = null;
      setOdslona((o) => (o > 40 ? 76 : 0));
      window.setTimeout(() => setOdslona(0), 6000);
    };

    window.addEventListener('touchstart', dotknij, { passive: true });
    window.addEventListener('touchmove', przesun, { passive: true });
    window.addEventListener('touchend', puscil, { passive: true });
    return () => {
      window.removeEventListener('touchstart', dotknij);
      window.removeEventListener('touchmove', przesun);
      window.removeEventListener('touchend', puscil);
    };
  }, [wlaczone]);

  if (!wlaczone) return null;

  return (
    <div
      className="overflow-hidden transition-[height] duration-200 ease-out lg:hidden"
      style={{ height: odslona }}
    >
      <Pandy widoczne={odslona > 6} />
    </div>
  );
}
