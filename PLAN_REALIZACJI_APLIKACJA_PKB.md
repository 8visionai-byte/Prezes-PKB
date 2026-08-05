# Plan realizacji: Aplikacja PKB (czat prezesa) + silnik Hermes

Data: 2026-08-03. Decyzja Pawła: BEZ Telegrama. Testujemy od pierwszego połączenia "oczami prezesa", czyli przez gotową aplikację z designem PKB. Aplikacja przestaje być "fazą 2" i wchodzi do głównego toru od razu.

---

## 1. Co dokładnie budujemy (zakres MVP "oczami prezesa")

Aplikacja webowa PWA (instalowalna na telefonie jak apka), wygląd 1:1 w klimacie PKB:

**Dla prezesa (frontend):**
- Ekran logowania (na start 3 konta: prezes-test, Paweł, Marcin).
- Czat jak GPT: odpowiedź "płynie" na żywo (streaming SSE), historia rozmów z powrotem do starych wątków, markdown (pogrubienia, listy, tabele), wskaźnik "asystent myśli / szuka w internecie".
- Załączanie ZDJĘĆ w czacie (wizytówka, dokument) - API Hermesa wspiera obrazy, więc to wchodzi do MVP.
- Panel "Baza wiedzy": lista dokumentów + przycisk "Dodaj plik" (PDF/notatka trafia do bazy asystenta).
- Panel "Rozwój asystenta": lista umiejętności (z GET /v1/skills), licznik "czego się nauczył" (odznaki z wtyczki Achievements w kolejnej iteracji).
- Logo PKB, kolory PKB, ekran startowy z powitaniem po imieniu.

**Pod maską (backend, niewidoczny):**
- Serwer aplikacji stoi NA TYM SAMYM VPS co Hermes i gada z nim po localhost:8642 (klucz API nigdy nie wychodzi do przeglądarki).
- Logowanie + mapowanie użytkownik -> profil Hermesa (każdy user = osobny agent z osobną pamięcią).
- Rozmowy stanowe: nazwane konwersacje przez /v1/responses (parametr "conversation") albo nagłówki sesji - historia trzymana po stronie Hermesa.
- Upload plików: backend zapisuje do katalogu bazy wiedzy właściwego profilu (API czatu nie przyjmuje plików - to nasz backend robi tę robotę).
- HTTPS przez reverse proxy (Caddy - sam wyrabia certyfikat), porty Hermesa zamknięte na świat.

**Poza MVP (iteracja 2, po pierwszych testach):** głosówki w aplikacji (nagraj-wyślij + odpowiedź głosem), odznaki/oś rozwoju agenta, brief przed spotkaniem jako osobny przycisk, panel dla dyrektorów.

**Stack (nudny, sprawdzony u Ciebie):** Next.js + Tailwind + PWA (znasz z PAPI PLANERA), Prisma + SQLite na użytkowników, deploy Dockerem na VPS obok Hermesa, Caddy z TLS. Zero egzotyki.

---

## 2. Kolejność (co po czym)

**KROK 0 - Ty, przed budową (bez tego nie ruszam UI):**
1. Konto OpenRouter + klucz z limitem (WDROZENIE część A).
2. VPS KVM 2 + szablon Hermes Agent (WDROZENIE część B-C, Telegram POMIJAMY).
3. Od Marcina: zrzuty ekranów PKB, logo, kolory HEX. Wzorzec to specyfikacja - z opisu słownego nie zrobię designu "jak PKB".
4. Subdomena pod aplikację (np. asystent.twoja-domena.pl) - powiedz, jaką domeną dysponujemy na testy; bez tego postawię tymczasowo na porcie z IP, ale do pokazania Radkowi potrzebna ładna subdomena z HTTPS.

**KROK 1 - silnik (ja, przez SSH, ~1 wieczór):** API server ON + klucz, profile (prezes-test, pawel, marcin, research), hardening (docker backend, porty, backup), test curl-em, wyszukiwarka (na start darmowy backend, docelowo SearXNG).

**KROK 2 - aplikacja (Claude Code, GSD - patrz sekcja 3):** budowa fazami, każda faza kończy się czymś klikalnym.

**KROK 3 - testy oczami prezesa (Ty + Marcin):** scenariusze z życia Radka ("przygotuj mnie do spotkania z firmą X", "zapamiętaj, że...", wrzucenie PDF, zdjęcie wizytówki). Zbieramy: co działa, co nie, co zmienić w aplikacji. Po każdej rundzie poprawki.

---

## 3. Jak to uruchomić w Claude Code - rekomendacja

**Kręgosłup: GSD. Nie Superpowers, nie luźne czaty.** Uzasadnienie:
- Projekt jest wielofazowy i będzie trwał wiele sesji - GSD trzyma stan w .planning/ (roadmapa, plany, co zrobione), więc żadna sesja nie zaczyna od zera i nic nie ginie przy limitach.
- GSD ma wbudowane bramki jakości (plan -> wykonanie -> weryfikacja UAT), a "weryfikacja UAT" to dokładnie Twoje "wczuwamy się w prezesa".
- Znasz ten flow z KNF Desk Mobile, więc zero nauki nowego procesu.
- Superpowers (brainstorming, writing-plans...) to dobre narzędzia na pojedyncze featurki w jednej sesji - tu byłyby luźnymi kartkami zamiast segregatora. GSD używa podobnych mechanizmów wewnątrz swoich faz.

**Dokładna ścieżka komend:**

1. Nowy folder aplikacji jako OSOBNE repo (potrzebne do deployu na VPS):
   `C:\Users\Paweł Pieloch\CLAUDE CODE\Asytent Prezesa PKB\app` + repo GitHub `pkb-asystent-app` (prywatne).
2. W tym folderze: **`/gsd-new-project`** - w rozmowie startowej wskaż mu 3 pliki kontekstu: ARCHITEKTURA_ASYSTENT_PREZESA.md, WDROZENIE_KROK_PO_KROKU.md, MOC_HERMESA_NOTATKI.md (są piętro wyżej) + folder ze zrzutami PKB. Cel projektu: "PWA czat PKB dla prezesa nad API Hermesa, zakres MVP wg PLAN_REALIZACJI sekcja 1".
3. Proponowana roadmapa (GSD ją doprecyzuje, ale trzymajmy ten kształt):
   - **Faza 1: Szkielet + czat.** Next.js, backend-proxy do Hermesa, czat ze streamingiem, bez logowania, brzydki ale DZIAŁA end-to-end z prawdziwym Hermesem. (Najpierw ryzyko techniczne, potem malowanie.)
   - **Faza 2: Design PKB.** Przed nią **`/gsd-ui-phase`** - powstaje UI-SPEC ze zrzutów PKB (kolory, typografia, komponenty). Tu pokazuję Ci JEDEN ekran do akceptacji, dopiero potem całość.
   - **Faza 3: Logowanie + profile.** Konta, mapowanie user->profil, wylogowanie, sesje. Po niej **`/gsd-secure-phase`** (audyt bezpieczeństwa auth).
   - **Faza 4: Baza wiedzy.** Upload + lista dokumentów + panel rozwoju asystenta (/v1/skills).
   - **Faza 5: Deploy na VPS + HTTPS.** Docker, Caddy, subdomena, smoke-testy z telefonu.
   - **Faza 6: UAT oczami prezesa.** **`/gsd-verify-work`** - scenariusze Radka, lista poprawek, iteracja.
4. Rytm każdej fazy: **`/gsd-discuss-phase N`** (doprecyzowanie) -> **`/gsd-plan-phase N`** -> **`/gsd-execute-phase N`** -> weryfikacja. Na "kontynuuj" po przerwie: **`/gsd-resume-work`**.
5. Dodatki punktowe (nie zamiast GSD, tylko w środku):
   - skill **frontend-design** przy fazie 2 (premium wygląd, nie generyczny AI-look),
   - persona **qa-auditor** po fazie 3 i przed oddaniem Radkowi (niezależny audyt "spróbuj to zepsuć"),
   - **/gsd-code-review** po fazach 3 i 5.

**Czego NIE robić:** nie odpalaj równolegle drugiego toru w Superpowers ani "jeszcze jednego przegadania" - architektura jest przegadana i zweryfikowana (40/40), decyzje zapadły. Następna rozmowa koncepcyjna to dopiero wnioski z testów oczami prezesa.

---

## 4. Co mi jest potrzebne od Ciebie (checklista startowa)

| # | Co | Status |
|---|---|---|
| 1 | Klucz OpenRouter (założony, z limitem) - NIE wklejaj do czatu, wpiszesz go w kreatorze/na VPS | czeka |
| 2 | VPS KVM 2 z szablonem Hermes Agent | czeka |
| 3 | Zrzuty PKB + logo + HEX od Marcina | czeka |
| 4 | Subdomena na testy (jaka domena?) | czeka |
| 5 | Decyzja: 3 konta testowe wystarczą na start? (prezes-test, Ty, Marcin) | czeka |

Gdy 1-2 będą gotowe, robimy krok 1 (silnik) i od razu wchodzę w `/gsd-new-project`.

---

## 5. Ryzyka tego etapu (krótko)

- **Design bez wzorca** = największe ryzyko poślizgu. Stąd twardy warunek: zrzuty od Marcina przed fazą 2 i akceptacja 1 ekranu przed resztą.
- **Streaming przez proxy** bywa kapryśny (buforowanie) - dlatego faza 1 jest właśnie o tym, na brzydkim UI, żeby ryzyko techniczne zdjąć na samym początku.
- **Aplikacja musi stać na VPS** (backend gada z Hermesem po localhost) - Vercel odpada dla backendu; to świadoma decyzja, dane zostają na Twoim serwerze (argument RODO dla Radka).
- Sekrety (klucz OpenRouter, API_SERVER_KEY, hasła) tylko w env na VPS - nigdy w repo, nigdy w czacie.

---

## NIEZWERYFIKOWANE
- Plan opiera się na zweryfikowanej dokumentacji (API server, /v1/responses, obrazy inline, profile - wszystko CONFIRMED w RESEARCH_ZRODLA.md), ale nic nie było jeszcze uruchamiane na żywym VPS - pierwsze potwierdzenie w kroku 1.
- Kształt roadmapy GSD może się lekko zmienić po /gsd-new-project (to nie problem, kręgosłup zostaje).
