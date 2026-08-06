'use client';

import { useEffect, useRef } from 'react';
import { useUstawienia } from '@/lib/ustawienia';

/**
 * Pasek powitalny. Dwie pandy pracują u siebie: SFAI klepie coś przy komputerze,
 * PKB odbija piłkę. Po chwili zostawiają swoje zajęcia, schodzą się na środek,
 * podają sobie ręce, nad nimi ulatują ikonki uścisku, po czym wracają do swoich
 * miejsc i wszystko zaczyna się od nowa.
 *
 * Nad głowami wędrują napisy SFAI i PKB, czyli dwie strony, które się dogadały.
 *
 * Rysowane w całości kodem: zero obrazków, zero bibliotek. Animacja stoi, gdy karta
 * jest w tle (bateria telefonu) i gdy użytkownik prosi system o ograniczenie ruchu.
 */

const U = 4; // wielkosc jednego piksela rysunku, w px CSS
const WYS = 24; // wysokosc sceny w pikselach rysunku
const ZIEMIA = 22;
const PANDA_SZER = 10;
const PANDA_WYS = 13;
const GORA_PANDY = ZIEMIA - PANDA_WYS;

// Kolejne chwile cyklu, w milisekundach.
const PRACA_DO = 4200;
const ZEJSCIE_DO = 6400;
const DOTKNIECIE = 6800;
const UNIESIENIE_DO = 8600;
const POWROT_DO = 10800;
const CYKL = 14000;

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

/**
 * Ikonka uścisku, rysowana pikselami w tym samym stylu co pandy.
 * Górna połowa w złocie, dolna w miedzi, przerwa w środku to miejsce złączenia:
 * dwie strony, które trzymają się razem. Zastąpiła emoji, które odstawało od reszty.
 */
const IKONA_USCISKU = [
  '..111..',
  '.11111.',
  '111.111',
  '222.222',
  '.22222.',
  '..222..',
];

const PILKA = ['.##.', '####', '####', '.##.'];

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

/** Rysuje bitmapę opisaną znakami. Kropka = przezroczyste. */
function bitmapa(
  ctx: CanvasRenderingContext2D,
  wzor: string[],
  x: number,
  y: number,
  kolory: Record<string, string>,
) {
  wzor.forEach((wiersz, wy) => {
    [...wiersz].forEach((znak, wx) => {
      const kolor = kolory[znak];
      if (kolor) {
        ctx.fillStyle = kolor;
        ctx.fillRect(Math.round(x) + wx, Math.round(y) + wy, 1, 1);
      }
    });
  });
}

type Paleta = { czern: string; biel: string; akcent: string; napis: string; miedz: string };

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

/** Biurko z monitorem. Ekran migocze, wiec widac, ze cos sie tam dzieje. */
function komputer(ctx: CanvasRenderingContext2D, x: number, p: Paleta, jasno: boolean) {
  ctx.fillStyle = p.czern;
  ctx.fillRect(x + 1, 13, 8, 6); // obudowa monitora
  ctx.fillRect(x + 4, 19, 2, 1); // podstawka
  ctx.fillStyle = jasno ? p.akcent : p.miedz;
  ctx.fillRect(x + 2, 14, 6, 4); // ekran
  ctx.fillStyle = p.miedz;
  ctx.fillRect(x, 20, 10, 1); // blat
  ctx.fillRect(x + 1, 21, 1, 1); // nogi biurka
  ctx.fillRect(x + 8, 21, 1, 1);
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

    const p: Paleta = {
      czern: '#2a2119',
      biel: '#f0e6d8',
      akcent: '#e8b87a',
      napis: '#b87d3f',
      miedz: '#b87d3f',
    };
    const systemOgranicza = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statycznie = systemOgranicza || !ruch;

    let szerU = 60;
    let anim = 0;
    let start = performance.now();

    const dopasuj = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const u = window.innerWidth < 640 ? U - 1 : U;
      const szerCss = Math.max(160, Math.round(oprawa.clientWidth));
      szerU = Math.floor(szerCss / u);
      canvas.width = Math.round(szerU * u * dpr);
      canvas.height = Math.round(WYS * u * dpr);
      canvas.style.width = `${szerU * u}px`;
      canvas.style.height = `${WYS * u}px`;
      ctx.setTransform(u * dpr, 0, 0, u * dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    const scena = (t: number) => {
      ctx.clearRect(0, 0, szerU, WYS);

      const srodek = szerU / 2;
      const spotL = Math.round(srodek - 13);
      const spotP = Math.round(srodek + 3);

      // Miejsca pracy. Na waskim ekranie rekwizyty by sie nakladaly na pandy,
      // wiec wtedy pandy po prostu czekaja u siebie bez komputera i pilki.
      const jestMiejsce = szerU >= 62;
      const stacjaL = jestMiejsce ? 13 : 2;
      const stacjaP = jestMiejsce ? szerU - 23 : szerU - PANDA_SZER - 2;
      const komputerX = 2;
      const pilkaX = stacjaP + 13;

      let xl: number;
      let xp: number;
      let kierL: 1 | -1 = 1;
      let kierP: 1 | -1 = -1;
      let lapa: 'dol' | 'przod' | 'gora' = 'dol';
      let lapaL: 'dol' | 'przod' | 'gora' = 'dol';
      let lapaP: 'dol' | 'przod' | 'gora' = 'dol';
      let uniesienie = 0;
      let idzie = false;
      let przyPracy = false;

      if (t < PRACA_DO) {
        // każdy u siebie: SFAI patrzy w monitor, PKB odbija piłkę
        xl = stacjaL;
        xp = stacjaP;
        kierL = -1;
        kierP = 1;
        przyPracy = true;
        lapaL = Math.floor(t / 180) % 2 === 0 ? 'przod' : 'dol';
        lapaP = Math.sin(t / 190) > 0 ? 'przod' : 'dol';
      } else if (t < ZEJSCIE_DO) {
        const k = gladko((t - PRACA_DO) / (ZEJSCIE_DO - PRACA_DO));
        xl = stacjaL + (spotL - stacjaL) * k;
        xp = stacjaP + (spotP - stacjaP) * k;
        idzie = k < 0.97;
      } else if (t < DOTKNIECIE) {
        xl = spotL;
        xp = spotP;
        lapa = 'przod';
      } else if (t < UNIESIENIE_DO) {
        xl = spotL;
        xp = spotP;
        lapa = 'gora';
        uniesienie = gladko((t - DOTKNIECIE) / 700);
      } else if (t < POWROT_DO) {
        const k = gladko((t - UNIESIENIE_DO) / (POWROT_DO - UNIESIENIE_DO));
        xl = spotL + (stacjaL - spotL) * k;
        xp = spotP + (stacjaP - spotP) * k;
        idzie = k < 0.97;
        if (k > 0.9) {
          kierL = -1;
          kierP = 1;
        }
      } else {
        xl = stacjaL;
        xp = stacjaP;
        kierL = -1;
        kierP = 1;
        przyPracy = true;
        lapaL = Math.floor(t / 180) % 2 === 0 ? 'przod' : 'dol';
        lapaP = Math.sin(t / 190) > 0 ? 'przod' : 'dol';
      }

      if (lapa !== 'dol') {
        lapaL = lapa;
        lapaP = lapa;
      }

      // rekwizyty za pandami
      if (jestMiejsce) {
        komputer(ctx, komputerX, p, Math.floor(t / 220) % 2 === 0);
        if (przyPracy) {
          const wysokosc = Math.abs(Math.sin(t / 190)) * 7;
          bitmapa(ctx, PILKA, pilkaX, ZIEMIA - 4 - wysokosc, { '#': p.akcent });
        } else {
          bitmapa(ctx, PILKA, pilkaX, ZIEMIA - 4, { '#': p.miedz });
        }
      }

      const krok = idzie ? Math.floor(t / 130) % 2 === 0 : false;

      panda(ctx, xl, GORA_PANDY, kierL, krok, lapaL, p);
      panda(ctx, xp, GORA_PANDY, kierP, krok, lapaP, p);

      // złączone łapy: przy uniesieniu wędrują w górę
      if (lapa !== 'dol') {
        const yl = lapa === 'gora' ? GORA_PANDY + 3 - uniesienie * 2 : GORA_PANDY + 6;
        ctx.fillStyle = p.akcent;
        ctx.fillRect(spotL + 9, yl, spotP - spotL - 8, 2);
      }

      // ikonki uścisku ulatują nad pandami, rysowane PRZED napisami,
      // więc przelatują za nimi i nie zasłaniają SFAI ani PKB
      if (t >= DOTKNIECIE && t < POWROT_DO) {
        for (const opoznienie of [0, 520, 1040]) {
          const wiek = t - DOTKNIECIE - opoznienie;
          if (wiek < 0 || wiek > 1600) continue;
          const k = wiek / 1600;
          const y = GORA_PANDY + 1 - k * 13;
          const bok = Math.sin(k * Math.PI * 2) * 1.5;
          ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.5) / 0.5);
          bitmapa(ctx, IKONA_USCISKU, srodek - 3.5 + bok, y, { '1': p.akcent, '2': p.miedz });
          ctx.globalAlpha = 1;
        }
      }

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
      start = performance.now() - ((performance.now() - start) % CYKL);
      anim = requestAnimationFrame(rysuj);
    };

    const naWidocznosc = () => (document.hidden ? wstrzymaj() : wznow());

    dopasuj();
    if (statycznie) scena(DOTKNIECIE + 320);
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
