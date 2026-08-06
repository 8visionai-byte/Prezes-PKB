'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Dwie pikselowe pandy przy tytule. Ida ku sobie, podaja lapy, unosza je do gory
 * na znak dobitej umowy, po czym rozchodza sie. Petla.
 *
 * Rysowane w calosci kodem: zero obrazkow, zero bibliotek, kilka kilobajtow.
 */

const P = 3;
const SZER = 74;
const WYS = 22;

type Paleta = { czern: string; biel: string; akcent: string };

function panda(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kier: 1 | -1,
  krok: boolean,
  lapa: 'dol' | 'przod' | 'gora',
  p: Paleta,
) {
  const px = (dx: number, dy: number, w: number, h: number, kolor: string) => {
    ctx.fillStyle = kolor;
    const rx = kier === 1 ? x + dx : x + (10 - dx - w);
    ctx.fillRect(rx * P, (y + dy) * P, w * P, h * P);
  };

  px(1, 0, 2, 2, p.czern);      // ucho lewe
  px(7, 0, 2, 2, p.czern);      // ucho prawe
  px(1, 1, 8, 5, p.biel);       // glowa
  px(2, 3, 2, 2, p.czern);      // obwodka oka
  px(6, 3, 2, 2, p.czern);
  px(3, 4, 1, 1, p.biel);       // oko
  px(7, 4, 1, 1, p.biel);
  px(4, 4, 2, 1, p.czern);      // nos
  px(2, 6, 6, 5, p.biel);       // tulow
  px(0, 7, 2, 2, p.czern);      // lapa tylna

  if (lapa === 'gora') px(8, 3, 2, 3, p.czern);
  else if (lapa === 'przod') px(8, 6, 2, 2, p.czern);
  else px(8, 7, 2, 2, p.czern);

  px(2, 11, 2, krok ? 2 : 1, p.czern);  // nogi
  px(6, 11, 2, krok ? 1 : 2, p.czern);
}

export function Pandy() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [wlaczone, setWlaczone] = useState(true);

  useEffect(() => {
    setWlaczone(localStorage.getItem('pkb-pandy') !== 'off');
    const naZmiane = () => setWlaczone(localStorage.getItem('pkb-pandy') !== 'off');
    window.addEventListener('pkb-pandy-zmiana', naZmiane);
    return () => window.removeEventListener('pkb-pandy-zmiana', naZmiane);
  }, []);

  useEffect(() => {
    if (!wlaczone) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const p: Paleta = { czern: '#2a2119', biel: '#f0e6d8', akcent: '#e8b87a' };
    const ograniczony = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const START_L = 2;
    const START_P = SZER - 12;
    const SPOT_L = SZER / 2 - 11;
    const SPOT_P = SZER / 2 + 1;

    let klatka = 0;
    let anim = 0;

    const rysuj = () => {
      klatka += 1;
      const t = klatka % 330;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let xl: number;
      let xp: number;
      let lapa: 'dol' | 'przod' | 'gora' = 'dol';
      let uniesienie = 0;

      if (t < 100) {
        const k = t / 100;
        xl = START_L + (SPOT_L - START_L) * k;
        xp = START_P + (SPOT_P - START_P) * k;
      } else if (t < 140) {
        xl = SPOT_L; xp = SPOT_P; lapa = 'przod';
      } else if (t < 230) {
        // uscisk unosi sie do gory
        xl = SPOT_L; xp = SPOT_P; lapa = 'gora';
        uniesienie = Math.min(1, (t - 140) / 45);
      } else {
        const k = (t - 230) / 100;
        xl = SPOT_L + (START_L - SPOT_L) * k;
        xp = SPOT_P + (START_P - SPOT_P) * k;
      }

      const idzie = t < 100 || t >= 230;
      const krok = idzie ? Math.floor(klatka / 7) % 2 === 0 : false;
      const y = WYS - 14;

      panda(ctx, xl, y, 1, krok, lapa, p);
      panda(ctx, xp, y, -1, krok, lapa, p);

      // zlaczone lapy: przy uniesieniu wedruja w gore
      if (lapa !== 'dol') {
        const yl = lapa === 'gora' ? y + 3 - uniesienie * 2 : y + 6;
        ctx.fillStyle = p.akcent;
        ctx.fillRect((SPOT_L + 9) * P, yl * P, (SPOT_P - SPOT_L - 8) * P, 2 * P);
      }

      anim = requestAnimationFrame(rysuj);
    };

    if (ograniczony) {
      panda(ctx, SPOT_L, WYS - 14, 1, false, 'gora', p);
      panda(ctx, SPOT_P, WYS - 14, -1, false, 'gora', p);
      ctx.fillStyle = p.akcent;
      ctx.fillRect((SPOT_L + 9) * P, (WYS - 13) * P, (SPOT_P - SPOT_L - 8) * P, 2 * P);
    } else {
      anim = requestAnimationFrame(rysuj);
    }

    return () => cancelAnimationFrame(anim);
  }, [wlaczone]);

  if (!wlaczone) return null;

  return (
    <canvas
      ref={ref}
      width={SZER * P}
      height={WYS * P}
      className="h-[52px] w-[168px] shrink-0 opacity-90"
      aria-hidden
    />
  );
}

export function PrzelacznikPand() {
  const [wl, setWl] = useState(true);
  useEffect(() => setWl(localStorage.getItem('pkb-pandy') !== 'off'), []);
  return (
    <button
      onClick={() => {
        const nowy = !wl;
        localStorage.setItem('pkb-pandy', nowy ? 'on' : 'off');
        setWl(nowy);
        window.dispatchEvent(new CustomEvent('pkb-pandy-zmiana'));
      }}
      aria-pressed={wl}
      className="text-[11px] text-pkb-faint transition hover:text-pkb-gold"
    >
      {wl ? 'pandy wł.' : 'pandy wył.'}
    </button>
  );
}
