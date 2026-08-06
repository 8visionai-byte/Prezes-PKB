'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Ustawienia aplikacji prezesa. Trzymane w przegladarce, bo dotycza wygladu,
 * nie danych. Gdy dojdzie logowanie, przeniesiemy je na konto uzytkownika.
 */
export type Ustawienia = {
  pandy: boolean;
  animacje: boolean;
  powiadomieniaDzwiek: boolean;
  /** Wybrany mikrofon. Pusty ciag = ten, ktory system uznaje za domyslny. */
  mikrofonId: string;
};

export const DOMYSLNE: Ustawienia = {
  pandy: true,
  animacje: true,
  powiadomieniaDzwiek: false,
  mikrofonId: '',
};

const KLUCZ = 'pkb-ustawienia-v1';
const ZDARZENIE = 'pkb-ustawienia-zmiana';

export function wczytajUstawienia(): Ustawienia {
  if (typeof window === 'undefined') return DOMYSLNE;
  try {
    const surowe = window.localStorage.getItem(KLUCZ);
    if (!surowe) return DOMYSLNE;
    return { ...DOMYSLNE, ...JSON.parse(surowe) };
  } catch {
    return DOMYSLNE;
  }
}

export function zapiszUstawienie<K extends keyof Ustawienia>(klucz: K, wartosc: Ustawienia[K]) {
  if (typeof window === 'undefined') return;
  const nowe = { ...wczytajUstawienia(), [klucz]: wartosc };
  try {
    window.localStorage.setItem(KLUCZ, JSON.stringify(nowe));
  } catch {
    /* brak miejsca nie moze wywrocic aplikacji */
  }
  window.dispatchEvent(new CustomEvent(ZDARZENIE));
}

/**
 * Zwraca aktualne ustawienia i sam odswieza sie, gdy zmieni je inny ekran.
 * Pierwsze renderowanie zawsze na domyslnych, zeby serwer i przegladarka sie zgadzaly.
 */
export function useUstawienia(): [Ustawienia, <K extends keyof Ustawienia>(k: K, w: Ustawienia[K]) => void] {
  const [stan, setStan] = useState<Ustawienia>(DOMYSLNE);

  useEffect(() => {
    setStan(wczytajUstawienia());
    const naZmiane = () => setStan(wczytajUstawienia());
    window.addEventListener(ZDARZENIE, naZmiane);
    return () => window.removeEventListener(ZDARZENIE, naZmiane);
  }, []);

  const ustaw = useCallback(<K extends keyof Ustawienia>(k: K, w: Ustawienia[K]) => {
    zapiszUstawienie(k, w);
    setStan((s) => ({ ...s, [k]: w }));
  }, []);

  return [stan, ustaw];
}
