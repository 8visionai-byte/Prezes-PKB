import { WBudowie } from '@/components/WBudowie';

export default function BazaWiedzy() {
  return (
    <WBudowie
      tytul="Baza"
      akcent="wiedzy"
      opis="Dokumenty, notatki i materiały, z których korzysta asystent przy przygotowywaniu briefów."
      punkty={[
        'Wgrywanie plików PDF i dokumentów prosto z telefonu',
        'Lista tego, co asystent już wie, z możliwością usunięcia',
        'Notatki o firmach zapisywane jednym zdaniem w rozmowie',
      ]}
    />
  );
}
