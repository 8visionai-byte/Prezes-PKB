'use client';

import { useEffect, useRef } from 'react';
import { useUstawienia } from '@/lib/ustawienia';

/**
 * Pasek powitalny: dwie pikselowe pandy schodza sie z dwoch stron, podaja sobie lapy,
 * unosza uscisk do gory, a nad nimi ulatuja ikonki uscisnietych dloni. Potem rozchodza sie
 * i wszystko zaczyna sie od nowa.
 *
 * Nad glowa lewej pandy idzie napis SFAI, nad prawa PKB - dwie strony, ktore sie dogadaly.
 *
 * Rysowane w calosci kodem: zero obrazkow, zero bibliotek. Animacja stoi, gdy karta jest
 * w tle (bateria telefonu) i gdy uzytkownik prosi system o ograniczenie ruchu.
 */

const U = 4; // wielkosc jednego piksela rysunku, w px CSS
const WYS = 24; // wysokosc sceny w pikselach rysunku
const ZIEMIA = 22; // po tej linii chodza pandy
const PANDA_SZER = 10;
const PANDA_WYS = 13;
const GORA_PANDY = ZIEMIA - PANDA_WYS;

const CYKL = 8000;
const WEJSCIE = 2600;
const DOTKNIECIE = 3000;
const UNIESIENIE_DO = 4600;
const WYJSCIE = 7000;

/** Pikselowy krój 3x5. Tyle wystarczy na SFAI i PKB. */
const KROJ: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  F: ['111', '100', '111', '100', '100'],
  A: ['111', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  P: ['111', '101', '111', '100', '100'],
  K: ['101', '101', '110', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
};

const szerokoscNapisu = (napis: string) => napis.length * 4 - 1;

function napisz(ctx: CanvasRenderingContext2D, napis: string, x: number, y: number, kolor: string) {
  ctx.fillStyle = kolor;
  let kursor = Math.round(x);
  for (const znak of napis) {
    const glif = KROJ[znak];
    if (glif) {
      glif.forEach((wiersz, wy) => {
        [...wiersz].forEach((p, wx) => {
          if (p === '1') ctx.fillRect(kursor + wx, y + wy, 1, 1);
        });
      });
    }
    kursor += 4;
  }
}

type Paleta = { czern: string; biel: string; akcent: string; napis: string };

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
    const rx = kier === 1 ? x + dx : x + (PANDA_SZER - dx - w);
    ctx.fillRect(Math.round(rx), y + dy, w, h);
  };

  px(1, 0, 2, 2, p.czern); // ucho lewe
  px(7, 0, 2, 2, p.czern); // ucho prawe
  px(1, 1, 8, 5, p.biel); // glowa
  px(2, 3, 2, 2, p.czern); // obwodka oka
  px(6, 3, 2, 2, p.czern);
  px(3, 4, 1, 1, p.biel); // oko
  px(7, 4, 1, 1, p.biel);
  px(4, 4, 2, 1, p.czern); // nos
  px(2, 6, 6, 5, p.biel); // tulow
  px(0, 7, 2, 2, p.czern); // lapa tylna

  if (lapa === 'gora') px(8, 3, 2, 3, p.czern);
  else if (lapa === 'przod') px(8, 6, 2, 2, p.czern);
  else px(8, 7, 2, 2, p.czern);

  px(2, 11, 2, krok ? 2 : 1, p.czern); // nogi
  px(6, 11, 2, krok ? 1 : 2, p.czern);
}

/** Wyprowadzenie: 0 na starcie, 1 na koncu, z lagodnym hamowaniem. */
const gladko = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export function Pandy() {
  const ref = useRef<HTMLCanvasElement>(null);
  const oprawaRef = useRef<HTMLDivElement>(null);
  const [ustawienia] = useUstawienia();
  const wlaczone = ustawienia.pandy;
  const ruch = ustawienia.animacje;

  useEffect(() => {
    if (!wlaczone) return;
    const canvas = ref.current;
    const oprawa = oprawaRef.current;
    if (!canvas || !oprawa) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p: Paleta = { czern: '#2a2119', biel: '#f0e6d8', akcent: '#e8b87a', napis: '#b87d3f' };
    const systemOgranicza = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statycznie = systemOgranicza || !ruch;

    let szerU = 60; // szerokosc sceny w pikselach rysunku
    let anim = 0;
    let start = performance.now();

    const dopasuj = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      // Na telefonie mniejszy piksel: pasek zajmuje 72 px zamiast 96 px i nie zjada ekranu.
      const u = window.innerWidth < 640 ? U - 1 : U;
      const szerCss = Math.max(160, Math.round(oprawa.clientWidth));
      szerU = Math.floor(szerCss / u);
      canvas.width = Math.round(szerU * u * dpr);
      canvas.height = Math.round(WYS * u * dpr);
      canvas.style.width = `${szerU * u}px`;
      canvas.style.height = `${WYS * u}px`;
      ctx.setTransform(u * dpr, 0, 0, u * dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    };

    /** Jedna klatka sceny dla zadanego czasu w cyklu. */
    const scena = (t: number) => {
      ctx.clearRect(0, 0, szerU, WYS);

      const srodek = szerU / 2;
      // Odleglosc spotkania dobrana tak, zeby napisy SFAI i PKB nad glowami sie nie zlewaly.
      const spotL = Math.round(srodek - 13);
      const spotP = Math.round(srodek + 3);
      const startL = -PANDA_SZER - 2;
      const startP = szerU + 2;

      let xl: number;
      let xp: number;
      let lapa: 'dol' | 'przod' | 'gora' = 'dol';
      let uniesienie = 0;
      let idzie = false;

      if (t < WEJSCIE) {
        const k = gladko(t / WEJSCIE);
        xl = startL + (spotL - startL) * k;
        xp = startP + (spotP - startP) * k;
        idzie = k < 0.98;
      } else if (t < DOTKNIECIE) {
        xl = spotL;
        xp = spotP;
        lapa = 'przod';
      } else if (t < UNIESIENIE_DO) {
        xl = spotL;
        xp = spotP;
        lapa = 'gora';
        uniesienie = gladko((t - DOTKNIECIE) / 700);
      } else if (t < WYJSCIE) {
        const k = gladko((t - UNIESIENIE_DO) / (WYJSCIE - UNIESIENIE_DO));
        xl = spotL + (startL - spotL) * k;
        xp = spotP + (startP - spotP) * k;
        idzie = true;
      } else {
        xl = startL;
        xp = startP;
      }

      const krok = idzie ? Math.floor(t / 130) % 2 === 0 : false;

      panda(ctx, xl, GORA_PANDY, 1, krok, lapa, p);
      panda(ctx, xp, GORA_PANDY, -1, krok, lapa, p);

      // zlaczone lapy: przy uniesieniu wedruja w gore
      if (lapa !== 'dol') {
        const yl = lapa === 'gora' ? GORA_PANDY + 3 - uniesienie * 2 : GORA_PANDY + 6;
        ctx.fillStyle = p.akcent;
        ctx.fillRect(spotL + 9, yl, spotP - spotL - 8, 2);
      }

      // Ikonki uscisnietych dloni ulatuja nad pandami po przybiciu.
      // Rysowane PRZED napisami, zeby przelatywaly za nimi i nie zaslanialy SFAI ani PKB.
      if (t >= DOTKNIECIE && t < WYJSCIE) {
        ctx.font = '5px ui-sans-serif, system-ui, "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        for (const opoznienie of [0, 520, 1040]) {
          const wiek = t - DOTKNIECIE - opoznienie;
          if (wiek < 0 || wiek > 1500) continue;
          const k = wiek / 1500;
          const y = GORA_PANDY + 2 - k * 13;
          const bok = Math.sin(k * Math.PI * 2) * 1.2;
          ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.5) / 0.5);
          ctx.fillText('🤝', srodek + bok, y);
          ctx.globalAlpha = 1;
        }
      }

      // napisy wedruja razem z pandami, dokladnie nad glowami, zawsze na wierzchu
      const yNapisu = GORA_PANDY - 7;
      napisz(ctx, 'SFAI', xl + PANDA_SZER / 2 - szerokoscNapisu('SFAI') / 2, yNapisu, p.napis);
      napisz(ctx, 'PKB', xp + PANDA_SZER / 2 - szerokoscNapisu('PKB') / 2, yNapisu, p.napis);
    };

    const rysuj = (teraz: number) => {
      scena((teraz - start) % CYKL);
      anim = requestAnimationFrame(rysuj);
    };

    const wstrzymaj = () => {
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
    };

    const wznow = () => {
      if (anim || statycznie) return;
      start = performance.now() - (performance.now() - start) % CYKL;
      anim = requestAnimationFrame(rysuj);
    };

    const naWidocznosc = () => (document.hidden ? wstrzymaj() : wznow());

    dopasuj();
    if (statycznie) scena(DOTKNIECIE + 320); // sam moment przybicia
    else anim = requestAnimationFrame(rysuj);

    const obserwator = new ResizeObserver(() => {
      dopasuj();
      if (statycznie) scena(DOTKNIECIE + 320);
    });
    obserwator.observe(oprawa);
    document.addEventListener('visibilitychange', naWidocznosc);

    return () => {
      wstrzymaj();
      obserwator.disconnect();
      document.removeEventListener('visibilitychange', naWidocznosc);
    };
  }, [wlaczone, ruch]);

  if (!wlaczone) return null;

  return (
    <div ref={oprawaRef} className="w-full overflow-hidden" aria-hidden>
      <canvas ref={ref} className="block" />
    </div>
  );
}
