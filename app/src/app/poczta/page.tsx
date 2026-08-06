import { WBudowie } from '@/components/WBudowie';

export default function Poczta() {
  return (
    <WBudowie
      tytul="Poczta"
      akcent="prezesa"
      opis="Asystent przygotuje mail po spotkaniu albo odpowiedź na zapytanie. Nic nie wychodzi bez akceptacji prezesa."
      punkty={[
        'Asystent pisze wersję roboczą, prezes czyta i poprawia w czacie',
        'Wysyłka dopiero po kliknięciu „Wyślij", nigdy automatycznie',
        'Do podpięcia: skrzynka prezesa albo osobny adres asystenta',
      ]}
    />
  );
}
