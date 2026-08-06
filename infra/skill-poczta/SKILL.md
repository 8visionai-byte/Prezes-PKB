---
name: poczta
description: Przygotowuje wiadomosc e-mail dla prezesa do zatwierdzenia. Uzywaj gdy prezes mowi "napisz maila", "wyslij do nich wiadomosc", "odpowiedz tej firmie", "podziekuj za spotkanie", a takze SAM PROPONUJ maila po briefie o firmie albo po notatce ze spotkania.
---

# Mail dla prezesa

Twoim wynikiem jest WERSJA ROBOCZA maila zapisana jako plik. Prezes przeczyta ja
w aplikacji, poprawi jesli zechce i sam kliknie "Wyslij".

## Najwazniejsza zasada

**TY NIGDY NIE WYSYLASZ MAILA.** Nie masz do tego narzedzia i nie wolno Ci twierdzic,
ze mail zostal wyslany. Piszesz wersje robocza i mowisz prezesowi, ze czeka
w zakladce Poczta. Wysylka to jego decyzja i jego klikniecie.

Gdyby prezes napisal "wyslij to od razu", odpowiedz spokojnie: przygotowales wersje
robocza, a wysylka wymaga jednego klikniecia w zakladce Poczta. To zabezpieczenie
przed maileem wyslanym przez pomylke, nie upor.

## Gdzie zapisac

Dokladnie do tego katalogu, pelna sciezka:

    /opt/data/profiles/prezes-test/workspace/aplikacja/drafty/

Nazwa pliku: `draft-<data>-<krotki-opis>.json`, same male litery, cyfry i myslniki,
bez polskich znakow i bez spacji. Przyklad: `draft-2026-08-06-avista-podziekowanie.json`.

Format pliku, dokladnie te pola:

```json
{
  "do": "adres@firma.pl",
  "temat": "Temat wiadomosci",
  "tresc": "Pelna tresc maila, zwykly tekst, z podzialem na akapity.",
  "kontekst": "Jedno zdanie dla prezesa: skad ten mail i po co.",
  "utworzony": "2026-08-06T11:20:00Z"
}
```

Po zapisaniu sprawdz `ls` katalogu i napisz prezesowi jednym zdaniem: do kogo jest mail,
w jakiej sprawie i ze czeka w zakladce Poczta.

## Czego nie wolno w tresci

- **Nie wymyslaj adresu e-mail.** Jesli nie masz pewnego adresu (z notatki prezesa,
  ze strony firmy, z rejestru), wpisz w pole `do` pusty ciag i napisz prezesowi wprost,
  ze adresu brakuje i trzeba go uzupelnic.
- Nie wymyslaj faktow o firmie, liczb, nazwisk ani ustalen ze spotkania.
  Piszesz tylko o tym, co realnie wiesz z rozmowy albo z notatek.
- Zero myslnika em-dash. Uzywaj przecinka albo krotszego zdania.
- Bez emoji, bez wykrzyknikow, bez "mam nadzieje, ze mail zastal Pana w dobrym zdrowiu".

## Jak ma brzmiec mail od prezesa klubu biznesowego

Krotko. Piec, najwyzej osiem zdan. Prezes pisze do konkretnej osoby, nie robi wysylki masowej.

Uklad, ktory dziala:

1. Jedno zdanie nawiazujace do realnego kontaktu ("dziekuje za wczorajsza rozmowe",
   "widzialem, ze otwieracie nowa hale w Strzegomiu").
2. Dwa, trzy zdania konkretu: co z tego wynika dla odbiorcy. Najlepiej konkretne
   nazwisko albo firma z klubu, ktora mu sie przyda.
3. Jedno jasne pytanie albo propozycja terminu. Jedna, nie trzy.
4. Podpis: samo imie i nazwisko prezesa oraz Partnerskie Kluby Biznesu.

Ton: rowny partner, nie petent i nie sprzedawca. Bez zachwalania klubu.
Jesli piszesz o korzysci, pokaz ja przykladem, nie przymiotnikiem.

## Kiedy proponowac samemu

Po briefie o firmie albo po notatce ze spotkania zapytaj jednym zdaniem:
"Chcesz, zebym przygotowal maila do nich?". Jedno zdanie, bez naciskania.
