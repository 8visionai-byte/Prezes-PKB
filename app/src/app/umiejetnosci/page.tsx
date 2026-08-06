import { redirect } from 'next/navigation';

/** Umiejetnosci sa teraz zakladka w ustawieniach. Stary adres kierujemy tam, zeby nie gubic zakladek. */
export default function Umiejetnosci() {
  redirect('/ustawienia?zakladka=umiejetnosci');
}
