'use client';

import { useEffect, useRef } from 'react';
import { useUstawienia } from '@/lib/ustawienia';

/**
 * Pasek powitalny. Każda panda ma swoje zajęcie: SFAI siedzi przy biurku i coś klepie
 * na klawiaturze (komputer pokazany z boku, żeby było widać, że siedzi), a PKB żongluje
 * piłką: odbija raz jedną nogą, przekręca się, odbija drugą. Po chwili SFAI wstaje,
 * PKB łapie piłkę, schodzą się na środek, podają sobie ręce, nad nimi ulatują ikonki
 * uścisku, po czym wracają na swoje miejsca i wszystko zaczyna się od nowa.
 *
 * Rysowane w całości kodem: zero obrazków, zero bibliotek. Animacja stoi, gdy karta
 * jest w tle (bateria telefonu) i gdy użytkownik prosi system o ograniczenie ruchu.
 */

const U = 4; // wielkosc jednego piksela rysunku, w px CSS
const WYS = 24;
const ZIEMIA = 22;
const PANDA_SZER = 10;
const PANDA_WYS = 13;
const GORA_PANDY = ZIEMIA - PANDA_WYS;

// Kolejne chwile cyklu, w milisekundach.
const PRACA_DO = 5600; // tyle trwa praca i zonglerka
const WSTAJE_DO = 6200; // SFAI wstaje od biurka, PKB lapie pilke
const ZEJSCIE_DO = 8400;
const DOTKNIECIE = 8800;
const UNIESIENIE_DO = 10600;
const POWROT_DO = 12800;
const CYKL = 16500;

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

function bitmapa(ctx: CanvasRenderingContext2D, wzor: string[], x: number, y: number, kolor: string) {
  ctx.fillStyle = kolor;
  wzor.forEach((wiersz, wy) => {
    [...wiersz].forEach((znak, wx) => {
      if (znak === '#') ctx.fillRect(Math.round(x) + wx, Math.round(y) + wy, 1, 1);
    });
  });
}

type Paleta = { czern: string; biel: string; akcent: string; napis: string; miedz: string; sprzet: string };
type Nogi = 'stoi' | 'krokA' | 'krokB' | 'kopie';
type Lapa = 'dol' | 'przod' | 'gora';

/** Panda na stojąco. Nogi rozrysowane wyraźnie, bo poprzedni krok był ledwo widoczny. */
function panda(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kier: 1 | -1,
  nogi: Nogi,
  lapa: Lapa,
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

  if (nogi === 'kopie') {
    px(1, 11, 3, 2, p.czern); // noga podporowa
    px(6, 11, 2, 1, p.czern); // udo wyrzucone do przodu
    px(8, 11, 2, 1, p.czern); // stopa pod piłką
  } else if (nogi === 'krokA') {
    px(0, 11, 3, 2, p.czern); // nogi szeroko: wyraźny krok
    px(6, 11, 3, 2, p.czern);
  } else if (nogi === 'krokB') {
    px(2, 11, 3, 2, p.czern); // nogi razem
    px(5, 11, 3, 2, p.czern);
  } else {
    px(2, 11, 2, 2, p.czern);
    px(6, 11, 2, 2, p.czern);
  }
}

/**
 * Panda siedząca przy biurku, w profilu. Współrzędne są bezwzględne, bo ta poza
 * pasuje tylko do tego jednego miejsca w scenie.
 */
function pandaPrzyBiurku(ctx: CanvasRenderingContext2D, x: number, pisze: boolean, p: Paleta) {
  // kier = -1: panda patrzy w lewo, czyli w stronę monitora
  const px = (dx: number, y: number, w: number, h: number, kolor: string) => {
    ctx.fillStyle = kolor;
    ctx.fillRect(Math.round(x) + (PANDA_SZER - dx - w), y, w, h);
  };

  // Cała poza jest o 3 piksele niżej niż na stojąco i ma udo wyrzucone poziomo
  // do przodu. Przy 2 pikselach różnicy siedzenie było nie do odróżnienia.
  px(1, 12, 2, 2, p.czern); // uszy
  px(7, 12, 2, 2, p.czern);
  px(1, 13, 8, 5, p.biel); // glowa
  px(2, 15, 2, 2, p.czern); // obwodki oczu
  px(6, 15, 2, 2, p.czern);
  px(3, 16, 1, 1, p.biel);
  px(7, 16, 1, 1, p.biel);
  px(4, 16, 2, 1, p.czern); // nos
  px(2, 18, 6, 3, p.biel); // tulow, przysiadniety
  px(8, pisze ? 17 : 18, 2, 1, p.czern); // lapa na klawiaturze
  px(6, 20, 4, 1, p.czern); // udo poziomo do przodu, pod blat
  px(6, 21, 2, 1, p.czern); // podudzie i stopa
}

/**
 * Biurko i monitor widziane Z BOKU: widac, ze panda przy nim siedzi, a nie stoi.
 * Obudowa w kolorze `sprzet`, bo czern na czarnym tle byla po prostu niewidoczna.
 */
function biurko(ctx: CanvasRenderingContext2D, x: number, p: Paleta, jasno: boolean) {
  ctx.fillStyle = p.miedz;
  ctx.fillRect(x, 18, 12, 1); // blat, siega az pod pande
  ctx.fillRect(x, 19, 1, 3); // noga biurka
  ctx.fillStyle = p.sprzet;
  ctx.fillRect(x + 2, 12, 3, 6); // monitor z profilu
  ctx.fillStyle = jasno ? p.akcent : p.miedz;
  ctx.fillRect(x + 5, 13, 1, 4); // swiecaca krawedz ekranu, zwrocona do pandy
}

/** Krzesło z boku: oparcie za plecami pandy. */
function krzeslo(ctx: CanvasRenderingContext2D, x: number, p: Paleta) {
  ctx.fillStyle = p.sprzet;
  ctx.fillRect(x, 21, 5, 1); // siedzisko
  ctx.fillRect(x + 4, 15, 1, 6); // oparcie
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
      sprzet: '#584336', // ciepla szarosc: widoczna na ciemnym tle, ale nie krzyczy
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

      // Rekwizyty potrzebuja miejsca. Na waskim ekranie pandy po prostu czekaja u siebie.
      const jestMiejsce = szerU >= 70;
      const biurkoX = 2;
      const siedziskoX = 9; // panda siedzaca
      const stojiPrzyBiurku = 15; // gdzie staje, gdy wstanie
      const startL = jestMiejsce ? stojiPrzyBiurku : 2;
      const stacjaP = jestMiejsce ? szerU - 19 : szerU - PANDA_SZER - 2;
      const srodekPilkarza = stacjaP + PANDA_SZER / 2;

      let xl = startL;
      let xp = stacjaP;
      let kierL: 1 | -1 = 1;
      let kierP: 1 | -1 = -1;
      let nogiL: Nogi = 'stoi';
      let nogiP: Nogi = 'stoi';
      let lapaL: Lapa = 'dol';
      let lapaP: Lapa = 'dol';
      let uniesienie = 0;
      let siedzi = false;
      let zongluje = false;

      const faza = t < PRACA_DO ? 'praca' : t < WSTAJE_DO ? 'wstaje' : t < ZEJSCIE_DO ? 'idzie' : t < DOTKNIECIE ? 'wita' : t < UNIESIENIE_DO ? 'uscisk' : t < POWROT_DO ? 'wraca' : 'siada';

      if (faza === 'praca') {
        siedzi = jestMiejsce;
        zongluje = jestMiejsce;
        kierL = -1;
        if (!jestMiejsce) lapaL = Math.floor(t / 200) % 2 === 0 ? 'przod' : 'dol';
      } else if (faza === 'wstaje') {
        kierL = -1;
        kierP = 1;
      } else if (faza === 'idzie') {
        const k = gladko((t - WSTAJE_DO) / (ZEJSCIE_DO - WSTAJE_DO));
        xl = startL + (spotL - startL) * k;
        xp = stacjaP + (spotP - stacjaP) * k;
        nogiL = Math.floor(t / 150) % 2 === 0 ? 'krokA' : 'krokB';
        nogiP = nogiL;
      } else if (faza === 'wita') {
        xl = spotL;
        xp = spotP;
        lapaL = 'przod';
        lapaP = 'przod';
      } else if (faza === 'uscisk') {
        xl = spotL;
        xp = spotP;
        lapaL = 'gora';
        lapaP = 'gora';
        uniesienie = gladko((t - DOTKNIECIE) / 700);
      } else if (faza === 'wraca') {
        const k = gladko((t - UNIESIENIE_DO) / (POWROT_DO - UNIESIENIE_DO));
        xl = spotL + (startL - spotL) * k;
        xp = spotP + (stacjaP - spotP) * k;
        nogiL = Math.floor(t / 150) % 2 === 0 ? 'krokA' : 'krokB';
        nogiP = nogiL;
        kierL = -1;
        kierP = 1;
      } else {
        siedzi = jestMiejsce;
        zongluje = jestMiejsce;
        kierL = -1;
      }

      // --- lewa strona: biurko i SFAI ---
      // Kolejnosc ma znaczenie: najpierw krzeslo, potem panda, a blat NA WIERZCHU.
      // Dzieki temu nogi chowaja sie pod biurkiem i od razu widac, ze panda siedzi.
      if (jestMiejsce) krzeslo(ctx, siedziskoX + 5, p);

      if (siedzi) {
        pandaPrzyBiurku(ctx, siedziskoX, Math.floor(t / 190) % 2 === 0, p);
      } else {
        panda(ctx, xl, GORA_PANDY, kierL, nogiL, lapaL, p);
      }

      if (jestMiejsce) biurko(ctx, biurkoX, p, Math.floor(t / 240) % 2 === 0);

      // --- prawa strona: PKB i piłka ---
      if (zongluje) {
        // Piłka wędruje od stopy do stopy. Gdy jest nisko przy nodze, panda kopie;
        // gdy przelatuje górą, panda przekręca się na drugą stronę.
        const s = Math.sin(t / 330);
        const wysoko = Math.abs(Math.cos(t / 330));
        kierP = s >= 0 ? 1 : -1;
        nogiP = Math.abs(s) > 0.68 ? 'kopie' : 'stoi';
        bitmapa(ctx, PILKA, srodekPilkarza - 2 + s * 5.5, ZIEMIA - 4.5 - wysoko * 8, p.akcent);
      } else if (jestMiejsce && (faza === 'wstaje' || faza === 'wita' || faza === 'uscisk' || faza === 'idzie' || faza === 'wraca')) {
        bitmapa(ctx, PILKA, srodekPilkarza - 2, ZIEMIA - 4, p.miedz);
      }

      panda(ctx, xp, GORA_PANDY, kierP, nogiP, lapaP, p);

      // złączone łapy: przy uniesieniu wędrują w górę
      if (faza === 'wita' || faza === 'uscisk') {
        const yl = faza === 'uscisk' ? GORA_PANDY + 3 - uniesienie * 2 : GORA_PANDY + 6;
        ctx.fillStyle = p.akcent;
        ctx.fillRect(spotL + 9, yl, spotP - spotL - 8, 2);
      }

      // Ikonki uścisku ulatują nad pandami. Rysowane PRZED napisami, więc przelatują
      // za nimi i nie zasłaniają SFAI ani PKB.
      if (t >= DOTKNIECIE && t < POWROT_DO) {
        ctx.font = '5px ui-sans-serif, system-ui, "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const opoznienie of [0, 520, 1040]) {
          const wiek = t - DOTKNIECIE - opoznienie;
          if (wiek < 0 || wiek > 1600) continue;
          const k = wiek / 1600;
          ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.5) / 0.5);
          ctx.fillText('🤝', srodek + Math.sin(k * Math.PI * 2) * 1.5, GORA_PANDY + 1 - k * 13);
          ctx.globalAlpha = 1;
        }
      }

      const yNapisu = GORA_PANDY - 7;
      const xNapisuL = siedzi ? siedziskoX : xl;
      napisz(ctx, 'SFAI', xNapisuL + PANDA_SZER / 2 - szerokoscNapisu('SFAI') / 2, yNapisu, p.napis);
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
