---
name: wizualizacja
description: Tworzy wizualizacje dla prezesa - schematy powiazan, wykresy, jednostronicowe prezentacje i podsumowania do druku. Uzywaj gdy uzytkownik prosi "narysuj", "zwizualizuj", "pokaz schemat", "zrob prezentacje", "wykres", "diagram", "jednostronicowka", a takze SAM PROPONUJ wizualizacje, gdy odpowiedz zawiera powiazania miedzy firmami, porownanie kilku opcji albo dane liczbowe.
---

# Wizualizacja dla prezesa

Twoim wynikiem jest PLIK HTML, ktory prezes otworzy w aplikacji, pokaze na spotkaniu
albo wydrukuje. Nie opisuj wizualizacji slowami - zbuduj ja.

## Gdzie zapisywac

ZAWSZE dokladnie do tego katalogu, pelna sciezka, bez skracania:

    /opt/data/profiles/prezes-test/workspace/baza-wiedzy/

To jedyne miejsce, ktore aplikacja pokazuje prezesowi. Plik zapisany gdzie indziej
(np. w `/opt/data/`) NIE bedzie dla niego widoczny, wiec praca pojdzie na marne.
Po zapisaniu sprawdz `ls` tego katalogu i upewnij sie, ze plik tam jest.

Nazwa pliku: krotka, po polsku, z data, np. `schemat-powiazan-avista-2026-08-05.html`.

W ODPOWIEDZI DLA PREZESA NIE PODAWAJ SCIEZKI SYSTEMOWEJ. Pelna sciezka jest potrzebna
Tobie do zapisu, prezesowi nie mowi nic i wyglada jak usterka. Napisz po ludzku, np.:
"Rysunek gotowy: trzy kroki wspolpracy firmy budowlanej z finansowa." Gotowy rysunek
sam pojawi sie w rozmowie jako kafelek z podgladem i przyciskiem pobierania,
a takze w panelu bocznym w sekcji Dokumenty.

## Kiedy proponowac samemu

Po przygotowaniu briefu o firmie zaproponuj krotko: "Chcesz, zebym narysowal schemat
powiazan tej firmy z klubem?". Jedno zdanie, bez nachalnosci. Gdy odpowiedz zawiera
trzy lub wiecej powiazanych elementow, wizualizacja niemal zawsze pomaga.

## Jak budowac

Jeden samodzielny plik HTML. Zero odwolan do internetu: bez czcionek z sieci,
bez bibliotek z CDN, bez obrazkow z zewnatrz. Wszystko inline, bo plik ma dzialac
takze bez internetu i po pobraniu na telefon.

Wykresy i schematy rysuj jako **inline SVG** liczone recznie. Nie uzywaj bibliotek.

### Kolory (paleta Partnerskich Klubow Biznesu)

- tlo strony: `#0c0908`
- powierzchnia karty: `#1a1411`
- obramowania: `#33261e`
- zloto (akcent glowny): `#e8b87a`
- miedz (akcent drugi): `#b87d3f`
- tekst: `#f5f0e8`
- tekst drugorzedny: `#8a7f70`
- czerwona flaga: `#d9776a`
- dobry sygnal: `#7fae7a`

### Zasady skladu

- Naglowek: tytul + data + stopka "Partnerskie Kluby Biznesu".
- Czcionki systemowe: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`.
- Duzo powietrza, jeden ekran to jedna mysl.
- Kazda liczba i fakt musi pochodzic z danych, ktore realnie masz. Nie wymyslaj wartosci.
  Czego nie wiesz, tego nie rysuj, albo oznacz wprost jako "brak danych".
- Dodaj `@media print { body { background: white; color: black } }`, zeby wydruk byl czytelny.
- Zadnego myslnika em-dash w tekstach.

## Trzy najczestsze rodzaje

**Schemat powiazan** - firma w srodku, wokol niej kregi: czego szuka, co oferuje,
kto z klubu pasuje. Linie laczace z krotkim podpisem, dlaczego pasuje.

**Jednostronicowka o firmie** - naglowek z nazwa i NIP, trzy kolumny:
dane rejestrowe, sygnaly z rynku, czerwone flagi. Na dole pasek z zaczepkami do rozmowy.

**Porownanie** - tabela albo slupki, gdy prezes wybiera miedzy opcjami.
Slupki rysuj jako prostokaty SVG z podpisana wartoscia.

## Po zapisaniu

Sprawdz, ze plik istnieje i ma sensowny rozmiar. Potem napisz jedno, najwyzej dwa
zdania o tym, co rysunek przedstawia. Bez sciezki systemowej, bez opisywania calej
zawartosci: prezes i tak zobaczy rysunek obok Twojej odpowiedzi.
