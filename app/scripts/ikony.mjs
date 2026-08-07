/**
 * Generuje ikony aplikacji (PWA + apple-touch) z logo PKB.
 * Czysty Node, bez zadnych paczek: dekoder i koder PNG siedza nizej.
 *
 * Uruchomienie z katalogu app/:   node scripts/ikony.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KATALOG = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(KATALOG, '..');

const TLO = [20, 16, 12]; // #14100c, to samo co w manifescie
const ZNAK = { x: 11, y: 0, w: 169, h: 85 }; // sam symbol z logo, bez napisu
const UDZIAL = 0.62; // ile szerokosci ikony zajmuje znak (reszta to margines maskable)
const PODPIS_KOLOR = [184, 125, 63]; // miedz #b87d3f, ten sam akcent co w aplikacji

// --- dekoder PNG (RGBA8, bez przeplotu) ---
function dekoduj(buf) {
  let o = 8;
  let ihdr = null;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    const typ = buf.slice(o + 4, o + 8).toString('latin1');
    const dane = buf.slice(o + 8, o + 8 + len);
    if (typ === 'IHDR') ihdr = { w: dane.readUInt32BE(0), h: dane.readUInt32BE(4), bit: dane[8], color: dane[9], interlace: dane[12] };
    if (typ === 'IDAT') idat.push(dane);
    o += 12 + len;
    if (typ === 'IEND') break;
  }
  if (!ihdr || ihdr.bit !== 8 || ihdr.color !== 6 || ihdr.interlace !== 0) {
    throw new Error('Skrypt obsluguje tylko PNG RGBA 8-bit bez przeplotu.');
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { w, h } = ihdr;
  const stride = w * 4;
  const out = Buffer.alloc(w * h * 4);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filtr = raw[p++];
    const linia = raw.slice(p, p + stride);
    p += stride;
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const a = x >= 4 ? out[i - 4] : 0;
      const b = y > 0 ? out[i - stride] : 0;
      const c = x >= 4 && y > 0 ? out[i - stride - 4] : 0;
      let v = linia[x];
      if (filtr === 1) v += a;
      else if (filtr === 2) v += b;
      else if (filtr === 3) v += (a + b) >> 1;
      else if (filtr === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 255;
    }
  }
  return { w, h, dane: out };
}

// --- koder PNG ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function czesc(typ, dane) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dane.length);
  const cialo = Buffer.concat([Buffer.from(typ, 'latin1'), dane]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cialo));
  return Buffer.concat([len, cialo, crc]);
}

function koduj(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    czesc('IHDR', ihdr),
    czesc('IDAT', zlib.deflateSync(raw, { level: 9 })),
    czesc('IEND', Buffer.alloc(0)),
  ]);
}

/** Srednia z prostokata zrodla: proste zmniejszanie bez schodkow. */
function probka(zrodlo, sx0, sy0, sx1, sy1) {
  const { w, h, dane } = zrodlo;
  let r = 0, g = 0, b = 0, a = 0, n = 0;
  const x0 = Math.max(0, Math.floor(sx0));
  const y0 = Math.max(0, Math.floor(sy0));
  const x1 = Math.min(w, Math.ceil(sx1));
  const y1 = Math.min(h, Math.ceil(sy1));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const al = dane[i + 3] / 255;
      r += dane[i] * al;
      g += dane[i + 1] * al;
      b += dane[i + 2] * al;
      a += al;
      n++;
    }
  }
  if (!n || a === 0) return [0, 0, 0, 0];
  return [r / a, g / a, b / a, a / n];
}

/**
 * Krój 5x7 na podpis pod znakiem. Rysowany pikselami, bo skrypt celowo nie ma
 * żadnych zależności: własny koder PNG i własne litery, zero paczek npm.
 */
const KROJ = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
};

const PODPIS = 'ASYSTENT';
const SZER_ZNAKU = 5;
const WYS_ZNAKU = 7;
const ODSTEP = 1;
const SZER_PODPISU = PODPIS.length * SZER_ZNAKU + (PODPIS.length - 1) * ODSTEP;

function pisz(plotno, bok, tekst, x0, y0, jednostka, kolor) {
  let kursor = x0;
  for (const znak of tekst) {
    const glif = KROJ[znak];
    if (glif) {
      glif.forEach((wiersz, wy) => {
        [...wiersz].forEach((p, wx) => {
          if (p !== '#') return;
          for (let dy = 0; dy < jednostka; dy++) {
            for (let dx = 0; dx < jednostka; dx++) {
              const x = kursor + wx * jednostka + dx;
              const y = y0 + wy * jednostka + dy;
              if (x < 0 || y < 0 || x >= bok || y >= bok) continue;
              const i = (y * bok + x) * 4;
              plotno[i] = kolor[0];
              plotno[i + 1] = kolor[1];
              plotno[i + 2] = kolor[2];
            }
          }
        });
      });
    }
    kursor += (SZER_ZNAKU + ODSTEP) * jednostka;
  }
}

/**
 * @param bok       rozmiar ikony w pikselach
 * @param zPodpisem czy dopisać "ASYSTENT" pod znakiem. Na favikonie 96 px litery
 *                  zlewałyby się w plamę, więc tam zostaje sam znak PKB.
 */
function zrobIkone(logo, bok, zPodpisem) {
  const plotno = Buffer.alloc(bok * bok * 4);
  for (let i = 0; i < bok * bok; i++) {
    plotno[i * 4] = TLO[0];
    plotno[i * 4 + 1] = TLO[1];
    plotno[i * 4 + 2] = TLO[2];
    plotno[i * 4 + 3] = 255;
  }

  // Jednostka podpisu zawsze całkowita, inaczej litery wychodzą rozmyte.
  const jednostka = zPodpisem ? Math.max(1, Math.floor((bok * 0.55) / SZER_PODPISU)) : 0;
  const wysPodpisu = zPodpisem ? WYS_ZNAKU * jednostka : 0;

  const szer = Math.round(bok * (zPodpisem ? 0.54 : UDZIAL));
  const wys = Math.round((szer * ZNAK.h) / ZNAK.w);
  const ox = Math.round((bok - szer) / 2);
  // Znak i podpis traktujemy jak jeden blok i centrujemy razem.
  const przerwa = zPodpisem ? Math.round(bok * 0.07) : 0;
  const oy = Math.round((bok - (wys + przerwa + wysPodpisu)) / 2);
  const skala = ZNAK.w / szer;

  for (let y = 0; y < wys; y++) {
    for (let x = 0; x < szer; x++) {
      const [r, g, b, a] = probka(
        logo,
        ZNAK.x + x * skala,
        ZNAK.y + y * skala,
        ZNAK.x + (x + 1) * skala,
        ZNAK.y + (y + 1) * skala,
      );
      if (a <= 0) continue;
      const i = ((oy + y) * bok + ox + x) * 4;
      plotno[i] = Math.round(plotno[i] * (1 - a) + r * a);
      plotno[i + 1] = Math.round(plotno[i + 1] * (1 - a) + g * a);
      plotno[i + 2] = Math.round(plotno[i + 2] * (1 - a) + b * a);
    }
  }

  if (zPodpisem) {
    const x0 = Math.round((bok - SZER_PODPISU * jednostka) / 2);
    pisz(plotno, bok, PODPIS, x0, oy + wys + przerwa, jednostka, PODPIS_KOLOR);
  }

  return koduj(bok, bok, plotno);
}

const logo = dekoduj(fs.readFileSync(path.join(APP, 'public', 'logo-pkb.png')));

const cele = [
  // Ikona na ekranie telefonu: znak PKB i podpis ASYSTENT pod nim.
  [path.join(APP, 'public', 'ikona-192.png'), 192, true],
  [path.join(APP, 'public', 'ikona-512.png'), 512, true],
  [path.join(APP, 'src', 'app', 'apple-icon.png'), 180, true],
  // Favikona w karcie przegladarki: sam znak. Podpis w tej skali bylby plama.
  [path.join(APP, 'src', 'app', 'icon.png'), 96, false],
];

for (const [sciezka, bok, zPodpisem] of cele) {
  const png = zrobIkone(logo, bok, zPodpisem);
  fs.writeFileSync(sciezka, png);
  console.log(`${bok}x${bok}${zPodpisem ? ' + podpis' : ''} -> ${sciezka} (${png.length} B)`);
}
