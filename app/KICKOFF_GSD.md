# Start projektu w VS Code - ściąga

Folder `app` to OSOBNE repo git (już zainicjowane, gałąź main) na aplikację PKB.

## Jak wystartować (VS Code)

1. Otwórz w VS Code TEN folder: `C:\Users\Paweł Pieloch\CLAUDE CODE\Asytent Prezesa PKB\app`
2. Otwórz terminal (Ctrl+`) i uruchom `claude`
3. Wpisz `/gsd-new-project` i wklej prompt startowy z sekcji niżej
4. Odpowiadaj na pytania GSD; roadmapę trzymaj w kształcie 6 faz z planu realizacji

## Prompt startowy do /gsd-new-project (skopiuj w całości)

```
Budujemy "Asystent PKB" - aplikację webową PWA (czat AI) dla prezesa Partnerskich
Klubów Biznesu. Frontend w klimacie/brandingu PKB, backend to cienkie proxy do
działającego na tym samym VPS agenta Hermes (Nous Research) przez jego
OpenAI-compatible API server na localhost:8642 (Bearer API_SERVER_KEY, streaming SSE).

PRZECZYTAJ NAJPIERW te dokumenty (pełny kontekst decyzji i zakresu):
- ../PLAN_REALIZACJI_APLIKACJA_PKB.md  (zakres MVP = sekcja 1, roadmapa 6 faz = sekcja 3)
- ../ARCHITEKTURA_ASYSTENT_PREZESA.md  (architektura całości, profile Hermesa, ryzyka)
- ../WDROZENIE_KROK_PO_KROKU.md        (silnik Hermes na VPS - kontekst, nie zakres tego repo)
- ../STATUS.md                          (decyzje: BEZ Telegrama, testy "oczami prezesa")

ZAKRES MVP: logowanie (3 konta: prezes-test, pawel, marcin), czat jak GPT ze
streamingiem i historią rozmów, załączanie zdjęć, panel Bazy wiedzy (upload plików
przez backend na dysk profilu Hermesa + lista dokumentów), panel Rozwój asystenta
(GET /v1/skills), pełny branding PKB, PWA instalowalna na telefonie.

STACK (zatwierdzony, nie zmieniać): Next.js + Tailwind + PWA, Prisma + SQLite
(użytkownicy), deploy Dockerem na VPS Hostinger obok Hermesa, Caddy z HTTPS.

TWARDE ZASADY:
- Sekrety (API_SERVER_KEY, hasła) tylko w env na serwerze - nigdy w repo i nigdy w czacie.
- Klucz do Hermesa zostaje na backendzie, frontend nigdy go nie widzi.
- Wartości i wygląd wg zrzutów PKB (wzorzec = specyfikacja); przed pełnym UI
  jeden ekran do akceptacji Pawła.
- Odpowiedzi i UI po polsku, prosty język, zero em-dash w tekstach dla klienta.
- Faza 1 = szkielet + czat E2E na brzydkim UI (najpierw ryzyko techniczne: streaming
  przez proxy), design dopiero w fazie 2 po /gsd-ui-phase.

ROADMAPA (trzymaj ten kształt): F1 szkielet+czat SSE, F2 design PKB, F3 logowanie
+ mapowanie user->profil, F4 baza wiedzy + rozwój asystenta, F5 deploy VPS+Caddy,
F6 UAT "oczami prezesa".
```

## Czego NIE robić w tym repo

- Nie wklejać żadnych kluczy (OpenRouter, API_SERVER_KEY) do czatu ani plików repo.
- Klucz OpenRouter NIE jest używany przez tę aplikację w ogóle - on żyje na VPS w
  konfiguracji Hermesa. Aplikacja używa INNEGO klucza (API_SERVER_KEY do Hermesa),
  który powstanie na VPS i trafi do .env na serwerze.
- Nie zaczynać fazy 2 (design) bez zrzutów/logo/HEX od Marcina.

## Zależność zewnętrzna

Faza 1 potrzebuje żywego Hermesa do testu end-to-end. Jeśli VPS jeszcze nie stoi,
GSD może zrobić discuss/plan fazy 1, a wykonanie odpalamy po postawieniu silnika
(instrukcja: ../WDROZENIE_KROK_PO_KROKU.md, części B-C, bez części E).
