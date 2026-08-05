import { WBudowie } from '@/components/WBudowie';

export default function Firmy() {
  return (
    <WBudowie
      tytul="Briefy o"
      akcent="firmach"
      opis="Historia sprawdzonych firm: do czego wrócić przed kolejnym spotkaniem i co się od tego czasu zmieniło."
      punkty={[
        'Lista firm sprawdzonych wcześniej, z datą i wynikiem',
        'Ponowne sprawdzenie jednym kliknięciem, z pokazaniem różnic',
        'Notatka prezesa przy każdej firmie, widoczna dla asystenta',
      ]}
    />
  );
}
