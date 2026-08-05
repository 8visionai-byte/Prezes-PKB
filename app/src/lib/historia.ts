export type Rola = 'user' | 'assistant';
export type Wiadomosc = { rola: Rola; tresc: string };
export type Rozmowa = { id: string; tytul: string; zmieniona: number; wiadomosci: Wiadomosc[] };

const KLUCZ = 'pkb-rozmowy-v1';
const LIMIT = 40;

/**
 * Historia rozmow trzymana w przegladarce prezesa.
 * Swiadoma decyzja na ten etap: dziala od razu, nie wymaga logowania ani bazy.
 * Gdy dojdzie logowanie, przeniesiemy to na serwer, zeby historia byla na kazdym urzadzeniu.
 */
export function wczytajRozmowy(): Rozmowa[] {
  if (typeof window === 'undefined') return [];
  try {
    const surowe = window.localStorage.getItem(KLUCZ);
    if (!surowe) return [];
    const dane = JSON.parse(surowe);
    return Array.isArray(dane) ? dane : [];
  } catch {
    return [];
  }
}

export function zapiszRozmowe(rozmowa: Rozmowa) {
  if (typeof window === 'undefined') return;
  const wszystkie = wczytajRozmowy().filter((r) => r.id !== rozmowa.id);
  wszystkie.unshift(rozmowa);
  try {
    window.localStorage.setItem(KLUCZ, JSON.stringify(wszystkie.slice(0, LIMIT)));
  } catch {
    /* brak miejsca w pamieci przegladarki - historia nie jest krytyczna */
  }
}

export function usunRozmowe(id: string) {
  if (typeof window === 'undefined') return;
  const zostaje = wczytajRozmowy().filter((r) => r.id !== id);
  window.localStorage.setItem(KLUCZ, JSON.stringify(zostaje));
}

export function tytulZTresci(tresc: string) {
  const czysty = tresc.replace(/\s+/g, ' ').trim();
  return czysty.length > 52 ? `${czysty.slice(0, 52)}...` : czysty || 'Nowa rozmowa';
}

export function nowyId() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function kiedy(znacznik: number) {
  const min = Math.round((Date.now() - znacznik) / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const godz = Math.round(min / 60);
  if (godz < 24) return `${godz} godz. temu`;
  const dni = Math.round(godz / 24);
  return dni === 1 ? 'wczoraj' : `${dni} dni temu`;
}
