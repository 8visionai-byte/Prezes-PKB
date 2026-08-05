# Struktura danych portalu PKB - odtworzona ze zrzutów ekranu

Data: 2026-08-04. Źródło: 9 zrzutów z konta Marcina Karpety (rola konta: "Gość"), odczytanych przez 3 agentów.
To jest podstawa wiedzy agenta o klubie. Gdy kiedyś będzie eksport albo dostęp do bazy, podmienimy dane, nie logikę.

## Co pokazują zrzuty

**Wszystkie 9 zrzutów to JEDEN ekran**: Ankieta -> sekcja "3. Co oferuje Twoja firma?", przewijana od góry do końca.
To akurat najważniejsza sekcja, więc trafienie jest dobre - ale reszta portalu jest jeszcze nieopisana (patrz "Czego brakuje").

## Nawigacja portalu (menu boczne, 4 grupy)

| Grupa | Pozycje |
|---|---|
| NETWORKING | Dashboard, Wiadomości, Moja sieć kontaktów (odznaka gwiazdki) |
| WYDARZENIA | Moje wydarzenia (licznik 3), Moje wyjazdy, Aktualności |
| MÓJ BIZNES | Profil firmy, Ankieta (odznaka 100%), Zamówienia (licznik 1) |
| WSPARCIE | Mój dyrektor z PKB |

Dodatkowo: powiadomienia (dzwonek), wiadomości (koperta), panel TIMELINE zwinięty przy dolnej krawędzi, autozapis formularza ("Zapisano automatycznie").

Ważne dla produktu: pozycja **"Mój dyrektor z PKB"** potwierdza, że w strukturze klubu istnieją dyrektorzy przypisani do członków. To jest ta warstwa, dla której planowaliśmy osobne profile agenta.

## Ankieta potrzeb: 21 sekcji (pełna lista)

1. Dane podstawowe
2. Informacje o firmie
3. **Co oferuje Twoja firma?**
4. Rozwój dzięki technologii
5. HR / Rekrutacja
6. Szkolenia i rozwój
7. Optymalizacja kosztów w firmie
8. Szukam możliwości na wygenerowanie wzrostów w firmie
9. Usługi prawne
10. Księgowość
11. Nieruchomości
12. Strefy ekonomiczne
13. Transport i Spedycja
14. Finanse
15. Nowe inwestycje
16. Pomoc w uzyskaniu dotacji
17. Praca vs czas wolny / Chwila relaksu
18. Nauka języków obcych
19. Beauty & Wellness
20. Usługi porządkowe i ochroniarskie
21. Priorytet kontaktu

**Wniosek o modelu danych klubu:** sekcja 3 opisuje, co firma DAJE (podaż). Sekcje 4-20 opisują, czego firma SZUKA (popyt). Sekcja 21 mówi, jak pilnie. Matching = przecięcie podaży jednej firmy z popytem drugiej. To jest dokładnie ten "wspólny mianownik", którego szukaliście z Marcinem.

## Sekcja 3 "Co oferuje Twoja firma?" - pełna taksonomia

Instrukcja na ekranie: *"Zaznacz usługi i produkty które oferujesz innym firmom"*.
Format zapisu wyboru (tag na dole ekranu): **KATEGORIA — Podkategoria** (np. `PRAWO — Inne`).
Każda kategoria ma licznik zaznaczeń i zawsze kończy się pozycją "Inne".

| Kategoria | Podkategorie |
|---|---|
| IT i technologia | Oprogramowanie, Strony i e-commerce, AI i automatyzacja, Wsparcie IT, Cybersecurity, Inne |
| Marketing i reklama | Social media, Reklama online, Branding, Content, Projektowanie graficzne, SEO SEM i GEO, PR i komunikacja, Inne |
| Prawo i doradztwo | Obsługa prawna, Doradztwo podatkowe, RODO, Windykacja, Doradztwo strategiczne, Notariat, Inne |
| Finanse i ubezpieczenia | Księgowość, Kredyty i leasing, Ubezpieczenia, Dotacje, Doradztwo inwestycyjne, Inne |
| Budownictwo i nieruchomości | Budowa, Wykończenia, Obrót nieruchomościami, Architektura, Instalacje, Inne |
| Transport i logistyka | Transport, Spedycja, Magazyny, Kurierzy, Inne |
| Przemysł | Maszyny i urządzenia, Automatyka i robotyka, Dostawcy i komponenty, Chemia przemysłowa, Energetyka, Inne |
| Produkcja | (nieodczytane - kategoria była zwinięta) |
| Handel i dystrybucja | (nieodczytane - kategoria była zwinięta) |
| Gastronomia i eventy | Restauracje, Catering, Eventy, Wynajem, Inne |
| Zdrowie i lifestyle | Medycyna, Rehabilitacja i terapia, Fitness i sport, Uroda i wellness, Inne |
| Rolnictwo i środowisko | Rolnictwo i hodowla, Energia OZE, Ekologia i recykling, Inne |
| Motoryzacja | Serwis i naprawy, Sprzedaż, Wynajem, Flota, Akcesoria, Inne |
| Edukacja i szkolenia | Szkoły i uczelnie, Kursy i szkolenia, E-learning, Inne |
| Media i komunikacja | Fotografia i wideo, Wydawnictwa i prasa, Portale i media online, Podcast i radio, Inne |
| Turystyka i hotelarstwo | Hotele i noclegi, Biura podróży, Agroturystyka, Wynajem krótkoterminowy, Inne |
| Usługi publiczne i NGO | Kluby sportowe, Samorządy i administracja, NGO fundacje i stowarzyszenia, Inne |
| Usługi dla firm | Utrzymanie czystości, Ochrona i obsługa biur, Druk i poligrafia, Outsourcing procesów, Rekrutacja i HR, Tłumaczenia, Inne |

Razem: **18 kategorii, ok. 90 podkategorii** (2 kategorie do uzupełnienia).

## Obserwacja o jakości danych w klubie

Profil Marcina pokazuje ankietę wypełnioną w **100% (21/21 sekcji)**, ale w sekcji 3 zaznaczona jest tylko **jedna** pozycja: `PRAWO — Inne`.

To jest ważny sygnał produktowy: **"100% wypełnienia" nie znaczy "dane nadają się do kojarzenia firm"**. Licznik liczy odwiedzone sekcje, nie jakość odpowiedzi. Jeśli tak wygląda typowy profil w klubie, automatyczny matching po samych checkboxach da słabe wyniki - i to jest realny argument za tym, żeby agent budował wiedzę z notatek prezesa, a nie tylko z ankiet.

## DRUGA TURA ZRZUTÓW (8 sztuk, 2026-08-04) - najważniejsze odkrycia

### 1. Ekran "Mój dyrektor z PKB"

- Opiekunem Marcina jest **Radosław Rogiewicz, Prezes PKB** - czyli klient tego projektu.
- Pod spodem katalog **19 dyrektorów regionalnych** z pełnymi danymi kontaktowymi (telefon, e-mail, klub).
- Dane zapisane w `dane-dyrektorow-PKB.md` (plik w .gitignore, dane osobowe).
- Każda karta ma: telefon (klikalny), e-mail (mailto), przycisk "Wiadomość" (czat w panelu).
- **Brak wyszukiwarki, filtrów i sortowania** - to statyczna siatka 19 kart. Agent, który potrafi
  w tym szukać po regionie lub branży, od razu daje wartość, której sam portal nie ma.
- Zasięg: 16 miast w Polsce + **PKB Niemcy** + Fundacja ESPA.

### 2. Ekran "Profil firmy" - i tu jest najważniejsze odkrycie całej analizy

Formularz profilu ma **dwie równoległe listy tych samych kategorii branżowych**:

| Lista | Znaczenie |
|---|---|
| **CO OFERUJE TWOJA FIRMA?** | podaż - co firma sprzedaje |
| **JAKICH BRANŻ SZUKASZ?** | popyt - czego firma szuka |

Do tego trzeci blok: **"Jakich firm szukasz?"** - lista konkretnych firm po **nazwie i NIP-ie, do 10 pozycji**.

To jest gotowy model matchingu wbudowany w portal: podaż firmy A x popyt firmy B. A blok "jakich firm szukasz"
to wprost deklaracja celu - firma sama mówi, do kogo chce dotrzeć. Dla agenta to najmocniejszy sygnał w całym systemie,
bo podaje NIP, czyli można od razu sprawdzić firmę w KRS i na białej liście naszym serwerem MCP.

Pozostałe pola profilu: imię i nazwisko, telefon, region, nazwa firmy, NIP, branża, strona WWW, adres,
opis firmy (edytor tekstu), galeria zdjęć, social media, osoby kontaktowe.
E-mail jest wyszarzony (login konta, nieedytowalny).

Na końcu formularza: sekcja **ZGODY I PRYWATNOŚĆ (RODO)** z przełącznikiem newslettera oraz **USUNIĘCIE KONTA**.

### 3. Uzupełnienie taksonomii

Sekcja "Co oferuje Twoja firma" w profilu ma **20 kategorii** (w ankiecie widzieliśmy 18 rozwiniętych).
Podkategorie są tam prezentowane jako klikalne chipy, nie checkboxy - ten sam zbiór wartości, inny widok.

## Czego brakuje (do ewentualnego dorobienia)

Znamy tylko NAZWY sekcji 1, 2 i 4-21, nie znamy ich zawartości. Najbardziej przydałyby się:
- **Sekcja 4 "Rozwój dzięki technologii"** - to nasza branża, tam siedzą pytania o AI i automatyzację
- **Sekcja 2 "Informacje o firmie"** - jakie dane firmowe portal w ogóle zbiera
- **Sekcja 21 "Priorytet kontaktu"** - jak firma określa pilność
- **Profil firmy** (osobna pozycja w menu) - jak wygląda wizytówka członka
- **Moja sieć kontaktów** - czy jest katalog innych firm i co w nim widać
- **Dashboard** - co prezes/członek widzi po zalogowaniu
- Kategorie "Produkcja" i "Handel i dystrybucja" rozwinięte

## NIEZWERYFIKOWANE
- Wszystko powyżej pochodzi z odczytu obrazu, nie z API ani eksportu bazy. Nazwy pól są przepisane z ekranu.
- Widok pochodzi z konta o roli "Gość" - prezes i dyrektorzy mogą widzieć inne pozycje menu i inne pola.
- Nie wiemy, jak portal przechowuje te dane wewnętrznie ani czy udostępnia je gdziekolwiek poza interfejsem.
