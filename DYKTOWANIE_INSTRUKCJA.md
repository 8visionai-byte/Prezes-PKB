# Dyktowanie głosowe w aplikacji PKB

Data: 2026-08-06

## Jak to działa

Prezes klika mikrofon przy polu wiadomości, mówi, klika jeszcze raz. Tekst pojawia się
w polu **do przeczytania i poprawienia**. Nic nie leci do asystenta automatycznie.

To celowe. Rozpoznawanie mowy myli się na nazwiskach i na cyfrach NIP-u. Prezes ma
zobaczyć, co wysyła, zanim wyśle. Mikrofon jest w dwóch miejscach: przy czacie
i przy treści maila w zakładce Poczta.

## Dlaczego NIE przez Hermesa

Pytanie było zasadne, ale odpowiedź brzmi: agent nie musi się w to mieszać.

1. Zamiana głosu na tekst to krok mechaniczny, nie praca agenta. Wpuszczenie go do
   Hermesa zabrałoby prezesowi możliwość poprawienia tekstu przed wysłaniem.
2. Zmiana dostawcy transkrypcji to u nas jedna zmienna środowiskowa. Gdyby siedziało
   to w konfiguracji agenta, każda zmiana wymagałaby restartu i testów całego agenta.
3. Model agenta chodzi przez OpenRouter, a OpenRouter w ogóle nie obsługuje dźwięku.
   I tak potrzebny byłby osobny dostawca.

Po stronie Hermesa **nie zmienia się nic**. Zero nowych skilli, zero zmian w konfiguracji.

## Wybrany model i dlaczego

**OpenAI `gpt-transcribe`**, przez `POST /v1/audio/transcriptions`.

Powody:
- Przyjmuje **podpowiedzi słownikowe**. Wysyłamy listę: „Partnerskie Kluby Biznesu",
  „NIP", „KRS", „biała lista VAT", „Radosław Rogiewicz". To najtańsza rzecz, jaką można
  zrobić dla jakości, i akurat u nas najważniejsza, bo cała rozmowa kręci się wokół
  polskich nazw firm i numerów rejestrowych.
- Jeden dostawca, jeden klucz, zwykłe multipart HTTP. Zero paczek npm w aplikacji.
- Wymuszamy `language=pl`, więc model nie zgaduje języka.

Czego NIE wybrałem i dlaczego:

| Opcja | Dlaczego odpadła |
|---|---|
| Whisper na naszym VPS | 2 rdzenie, brak karty graficznej, agent i tak zjada CPU. 30 sekund nagrania liczyłoby się dziesiątki sekund i zagłodziło asystenta. |
| Wbudowane rozpoznawanie mowy przeglądarki | Darmowe, ale na iPhonie działa słabo albo wcale, a prezes może mieć iPhone'a. Nie da się też podpowiedzieć słownictwa. |
| ElevenLabs Scribe | Dobry i Paweł ma tam konto, ale to drugi dostawca do pilnowania, a podpowiedzi słownikowych nie podamy tak wygodnie. Sensowny plan B. |

Koszt: rzędu setnych części centa za jedno dyktowanie. Przy kilkunastu dyktowaniach
dziennie to grosze miesięcznie, więc cena nie była tu kryterium wyboru.
NIEZWERYFIKOWANE: dokładnej stawki za minutę dla modelu plikowego nie potwierdziłem,
strona cennika OpenAI nie oddała tej tabeli. Potwierdzona jest stawka $0,017 za minutę
dla modelu strumieniowego `gpt-live-transcribe`, więc rząd wielkości jest ten sam.

## Co musisz zrobić (Paweł)

1. Wejdź na https://platform.openai.com/api-keys i utwórz klucz API.
   To OSOBNE konto od OpenRouter. Doładuj kilka dolarów, wystarczy na miesiące.
2. Wpisz klucz na serwerze:

```bash
ssh -F "C:/Users/PAWEPI~1/.ssh/config" pkb-vps
```

Potem na serwerze:

```bash
cat >> /root/pkb-stack/.env <<'KONIEC'
OPENAI_API_KEY=TU_WKLEJ_KLUCZ
KONIEC
chmod 600 /root/pkb-stack/.env
cd /root/pkb-stack && docker compose up -d app
```

3. Odśwież aplikację. Przy polu wiadomości pojawi się ikona mikrofonu.

Dopóki klucza nie ma, **mikrofon się nie pokazuje**. Celowo: lepiej żeby prezes nie
widział przycisku, który i tak nie zadziała.

Opcjonalnie można zmienić model bez ruszania kodu, dopisując do `.env`:
`TRANSKRYPCJA_MODEL=gpt-4o-transcribe`

## Co zmieniło się w aplikacji

| Element | Plik |
|---|---|
| Przycisk mikrofonu, nagrywanie, obsługa iPhone'a | `app/src/components/Dyktafon.tsx` |
| Wysyłka nagrania do rozpoznania | `app/src/app/api/transkrypcja/route.ts` |
| Mikrofon przy czacie | `app/src/app/page.tsx` |
| Mikrofon przy treści maila | `app/src/app/poczta/page.tsx` |

Pułapki, które już obsłużyłem:
- **iPhone nagrywa w `audio/mp4`**, a Chrome w `audio/webm`. Aplikacja sprawdza, co
  dana przeglądarka realnie potrafi, i dobiera rozszerzenie pliku, bo po nim serwer
  rozpoznaje format.
- **Mikrofon wymaga HTTPS.** Mamy go, więc działa. Na `http://` przeglądarka odmówi.
- Za krótkie nagranie (przypadkowe kliknięcie) nie idzie do rozpoznania, tylko dostaje
  komunikat „przytrzymaj i mów spokojnie".
- Gdyby model odrzucił parametry dodatkowe, aplikacja powtarza wysyłkę bez nich,
  żeby dyktowanie po prostu zadziałało.

## Co dalej (nie teraz)

Odpowiedź głosem asystenta, czyli czytanie odpowiedzi na głos. To osobny klocek
(zamiana tekstu na mowę) i osobna decyzja o głosie. Zrobimy, gdy dyktowanie się sprawdzi.
