'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { wczytajUstawienia } from './ustawienia';

/**
 * Dyktowanie w stylu, jaki prezes zna z ChatGPT: podczas nagrywania pole wiadomości
 * znika, a na jego miejscu pojawia się pasek z falą dźwięku, krzyżykiem (anuluj)
 * i ptaszkiem (zamień na tekst). Dopiero po ptaszku tekst ląduje w polu.
 *
 * Anulowanie naprawdę wyrzuca nagranie: nic nie idzie do rozpoznania.
 */

export type StanDyktowania = 'niedostepny' | 'gotowy' | 'nagrywa' | 'rozpoznaje';

const FORMATY = [
  { mime: 'audio/webm;codecs=opus', koncowka: 'webm' },
  { mime: 'audio/webm', koncowka: 'webm' },
  { mime: 'audio/mp4', koncowka: 'mp4' }, // iPhone
  { mime: 'audio/ogg;codecs=opus', koncowka: 'ogg' },
];

const SLUPKOW = 40;

export function useDyktowanie(naTekst: (tekst: string) => void) {
  const [stan, setStan] = useState<StanDyktowania>('niedostepny');
  const [poziomy, setPoziomy] = useState<number[]>(() => Array(SLUPKOW).fill(0));
  const [sekundy, setSekundy] = useState(0);
  const [blad, setBlad] = useState<string | null>(null);

  const rejestrator = useRef<MediaRecorder | null>(null);
  const strumienRef = useRef<MediaStream | null>(null);
  const kontekstRef = useRef<AudioContext | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const koncowkaRef = useRef('webm');
  const porzucone = useRef(false);
  const animacja = useRef(0);
  const zegar = useRef<number | null>(null);

  useEffect(() => {
    const maSprzet =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';
    if (!maSprzet) return;

    fetch('/api/transkrypcja')
      .then((r) => (r.ok ? r.json() : { skonfigurowane: false }))
      .then((d) => setStan(d.skonfigurowane ? 'gotowy' : 'niedostepny'))
      .catch(() => setStan('niedostepny'));
  }, []);

  const sprzataj = useCallback(() => {
    if (animacja.current) cancelAnimationFrame(animacja.current);
    animacja.current = 0;
    if (zegar.current) window.clearInterval(zegar.current);
    zegar.current = null;
    strumienRef.current?.getTracks().forEach((t) => t.stop());
    strumienRef.current = null;
    void kontekstRef.current?.close().catch(() => {});
    kontekstRef.current = null;
    setPoziomy(Array(SLUPKOW).fill(0));
    setSekundy(0);
  }, []);

  useEffect(() => () => sprzataj(), [sprzataj]);

  const start = useCallback(async () => {
    setBlad(null);
    porzucone.current = false;
    try {
      const wybrany = wczytajUstawienia().mikrofonId;
      const strumien = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          ...(wybrany ? { deviceId: { exact: wybrany } } : {}),
        },
      });
      strumienRef.current = strumien;

      const format = FORMATY.find((f) => MediaRecorder.isTypeSupported(f.mime));
      koncowkaRef.current = format?.koncowka ?? 'webm';
      const rec = new MediaRecorder(strumien, format ? { mimeType: format.mime } : undefined);
      kawalki.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) kawalki.current.push(e.data);
      };

      rec.onstop = async () => {
        const nagranie = new Blob(kawalki.current, { type: format?.mime ?? 'audio/webm' });
        sprzataj();

        if (porzucone.current) {
          setStan('gotowy');
          return;
        }
        if (nagranie.size < 1200) {
          setStan('gotowy');
          setBlad('Za krótkie nagranie. Powiedz coś i dopiero wtedy zatwierdź.');
          return;
        }

        setStan('rozpoznaje');
        try {
          const dane = new FormData();
          dane.append('nagranie', nagranie, `dyktowanie.${koncowkaRef.current}`);
          const r = await fetch('/api/transkrypcja', { method: 'POST', body: dane });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error ?? `Błąd ${r.status}`);
          if (d.tekst) naTekst(d.tekst);
          else setBlad('Nic nie usłyszałem. Spróbuj jeszcze raz.');
        } catch (e) {
          setBlad(e instanceof Error ? e.message : String(e));
        } finally {
          setStan('gotowy');
        }
      };

      // Fala dzwieku: prezes widzi, ze mikrofon naprawde slyszy.
      const kontekst = new AudioContext();
      kontekstRef.current = kontekst;
      const analizator = kontekst.createAnalyser();
      analizator.fftSize = 512;
      kontekst.createMediaStreamSource(strumien).connect(analizator);
      const probki = new Uint8Array(analizator.frequencyBinCount);

      const mierz = () => {
        analizator.getByteTimeDomainData(probki);
        let suma = 0;
        for (const v of probki) suma += Math.abs(v - 128);
        const poziom = Math.min(1, suma / probki.length / 26);
        setPoziomy((p) => [...p.slice(1), poziom]);
        animacja.current = requestAnimationFrame(mierz);
      };
      animacja.current = requestAnimationFrame(mierz);

      rec.start();
      rejestrator.current = rec;
      setStan('nagrywa');
      zegar.current = window.setInterval(() => setSekundy((s) => s + 1), 1000);
    } catch {
      sprzataj();
      setBlad('Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki.');
      setStan('gotowy');
    }
  }, [naTekst, sprzataj]);

  const zatwierdz = useCallback(() => {
    porzucone.current = false;
    rejestrator.current?.stop();
    rejestrator.current = null;
  }, []);

  const anuluj = useCallback(() => {
    porzucone.current = true;
    if (rejestrator.current) {
      rejestrator.current.stop();
      rejestrator.current = null;
    } else {
      sprzataj();
      setStan('gotowy');
    }
    setBlad(null);
  }, [sprzataj]);

  return { stan, poziomy, sekundy, blad, start, zatwierdz, anuluj, wyczyscBlad: () => setBlad(null) };
}
