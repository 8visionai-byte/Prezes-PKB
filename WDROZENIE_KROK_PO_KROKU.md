# Wdrożenie Hermes Agent na Hostinger z OpenRouter - instrukcja krok po kroku

Data: 2026-08-02. Wszystko z NAJNOWSZEJ oficjalnej dokumentacji (hermes-agent.nousresearch.com/docs, stan: Hermes v0.19.1 z 30.07.2026) + aktualnych stron Hostingera i OpenRoutera. 30 kluczowych kroków/nazw zweryfikowanych adwersaryjnie: 30 potwierdzonych, 0 obalonych. Analiza Twoich 3 filmików: na końcu dokumentu.

**WAŻNE - jak to się ma do aplikacji PKB dla prezesa:** produktem dla prezesa jest NASZA aplikacja (logo i kolory PKB, czat jak GPT), która łączy się z Hermesem przez jego API server (port 8642). Prezes NIGDY nie zobaczy Telegrama, terminala ani panelu Hermesa. Ta instrukcja stawia tylko SILNIK (faza 1) - aplikacja musi mieć się z czym łączyć. Telegram w części E to wyłącznie nasz wewnętrzny kanał testowy (Ty i Marcin, zanim powstanie aplikacja) i jest CAŁKOWICIE OPCJONALNY - można go pominąć i testować w CLI albo Open WebUI.

**Czy Twój przypadek wymaga czegoś bardziej skomplikowanego?** Dla FAZY 1 (działający silnik + nasze testy) wystarczy ta instrukcja. Bardziej skomplikowana robi się FAZA 2 i to jest dokładnie to, czego NIE ma w żadnym z filmików: profile per osoba, API server pod własną aplikację czatu PKB, serwer MCP z danymi o firmach, pełny hardening. To mamy rozpisane w ARCHITEKTURA_ASYSTENT_PREZESA.md i zrobimy po fazie 1.

---

## CZĘŚĆ A: Konto OpenRouter i klucz API (Twój komputer, przeglądarka)

OpenRouter to dobra decyzja: oficjalna dokumentacja Hermesa wymienia go jako opcję DOMYŚLNĄ ("Just want it to work -> OpenRouter"). Jeden klucz = setki modeli, zero narzutu na ceny tokenów (płacisz tylko 5,5% prowizji przy doładowaniu karty).

1. Wejdź na **openrouter.ai** i kliknij Sign in. Zaloguj się Googlem (albo GitHubem/mailem). Karta nie jest potrzebna do założenia konta.
2. Doładuj kredyty: **openrouter.ai/settings/credits**. Minimum 5 USD, na start rekomendacja **10 USD** (dodatkowy bonus: przy saldzie 10+ USD darmowe modele mają limit 1000 zapytań dziennie zamiast 50). Płatność kartą przez Stripe, prowizja 5,5% (min. 0,80 USD).
3. Utwórz klucz: **openrouter.ai/keys** -> Create Key -> nazwa np. `hermes-pkb` -> **ustaw Credit limit, np. 10 USD** (twardy limit wydatków tego klucza; po wyczerpaniu klucz dostaje błąd 402 i nic więcej nie wyda). Klucz zaczyna się od `sk-or-v1-...`.
4. **Zapisz klucz w swoim menedżerze haseł.** Pokazuje się tylko raz. Nie wklejaj go do żadnego czatu (także mnie), nie zapisuj w plikach projektu.
5. Ustawienia prywatności (ważne pod dane klubu): **openrouter.ai/workspaces/default/settings**:
   - "Input & Output Logging" oraz "OpenRouter Use of Inputs/Outputs" zostaw **WYŁĄCZONE** (domyślnie są OFF; nie włączaj za 1% rabatu).
   - Wyłącz routing do providerów, którzy mogą trenować na danych (przełączniki dla modeli płatnych i darmowych).
   - OpenRouter sam nie zapisuje treści promptów (polityka zero-retencji), metadane (tokeny, czasy) zbiera zawsze.

**Modele (żywe ceny z API OpenRoutera, 2.08.2026, USD za mln tokenów wejście/wyjście):**

| Rola | Model (dokładne ID) | Cena |
|---|---|---|
| Główny (rekomendacja) | `anthropic/claude-sonnet-5` | $2 / $10, kontekst 1M |
| Do najtrudniejszych zadań | `anthropic/claude-opus-5` | $5 / $25 |
| Tani pomocniczy (kompresja kontekstu itp.) | `google/gemini-2.5-flash-lite` | $0.10 / $0.40 |
| Tani Claude (opcja) | `anthropic/claude-haiku-4.5` | $1 / $5 |

Nie kopiuj nazw modeli z filmików (tam ASR przekręca nazwy, a filmy są sprzed premier najnowszych wersji).

---

## CZĘŚĆ B: VPS Hostinger + szablon Hermes Agent (panel Hostinger)

6. Zakup: **hostinger.pl/vps/docker/hermes-agent** -> plan **KVM 2** ("Najpopularniejszy": 2 vCPU, 8 GB RAM, 100 GB NVMe; w promocji 33,99 zł/mies. przy 2 latach, odnowienie 64,99 zł/mies.). KVM 1 (4 GB RAM) wystarczy tylko do lekkiego czatu bez automatyzacji przeglądarki; wszystkie 3 filmiki i tutorial Hostingera zgodnie mówią: bierz min. KVM 2. Kod **AIPOWER10** daje dodatkowe 10% przy planach 12+ mies. (z filmiku Startuj AI działa też STARTUJAI10).
7. W checkoucie Hostinger zaproponuje kredyty **nexos.ai** i **Oxylabs** - **POMIŃ OBA** (support Hostingera potwierdza: "Hermes will still deploy"). Providera ustawimy sami na OpenRouter, a wyszukiwarkę osobno (część D).
8. Jeśli masz już VPS: panel VPS -> **Docker Manager -> Catalog** -> wyszukaj "Hermes Agent" -> Select -> w formularzu podaj wymyślony **login i hasło administratora** (do web terminala; zapisz w menedżerze haseł), pola kluczy nexos.ai/Oxylabs zostaw puste -> **Deploy**. Instalacja ok. 5 minut. (Uwaga: ścieżka "Change OS -> Hermes" na istniejącym VPS kasuje wszystkie dane serwera.)
9. Po wdrożeniu w Docker Manager -> Projects zobaczysz projekt `hermes-agent-...` (+ kontener Traefik od ruchu/TLS w wariancie z filmiku). Oba muszą być zielone.

---

## CZĘŚĆ C: Kreator pierwszego uruchomienia (terminal Hermesa w przeglądarce)

10. Docker Manager -> Projects -> przycisk **Open** przy projekcie Hermes -> zaloguj się loginem/hasłem z kroku 8. Otwiera się Hermes CLI i kreator startuje automatycznie (jeśli nie: wpisz `hermes setup`).
11. Wybierz **Quick setup** (Full setup dodaje backend terminala, personę itd.; wszystko ustawimy później komendami, patrz część F).
12. Kreator krok po kroku:
    1. "Select an LLM provider" -> **OpenRouter** (jest wprost na liście; Nous Portal POMIŃ - to płatna subskrypcja, do naszego układu niepotrzebna, a jej status RODO jest niejasny).
    2. "Enter your API key" -> wklej klucz `sk-or-v1-...`. **UWAGA: web-terminale przekłamują znaki** (oficjalne ostrzeżenie z dokumentacji: ":" potrafi dojść jako ";", "@" się psuje). Po wklejeniu sprawdź wzrokowo początek i koniec klucza. Jak coś nie zadziała, zrób to po SSH (część E, krok 18) komendą: `hermes config set OPENROUTER_API_KEY twój_klucz`.
    3. "Choose a model" -> wybierz **anthropic/claude-sonnet-5** (filmik GeekWork słusznie radzi: nie zostawiaj domyślnego taniego modelu, bo całość sprawia złe wrażenie).
    4. "Connect a messaging platform" -> **pomiń** (Telegram zrobimy porządnie w części E, z allowlistą).
13. Test pierwszej rozmowy w CLI: napisz np. "Przedstaw się i powiedz, co potrafisz. Odpowiadaj po polsku." Sprawdź też `/model` (przełączanie modeli) i `hermes doctor` (diagnostyka). Zasada z oficjalnego quickstartu: najpierw jedna czysta rozmowa w CLI, dopiero potem gateway/cron/kanały.

---

## CZĘŚĆ D: Wyszukiwarka internetowa (bez Nous Portal)

Ważne ograniczenie, którego nie ma w żadnym filmiku: pakiet narzędzi "z pudełka" (web search, obrazy, TTS, cloud browser) to funkcja płatnej subskrypcji Nous Portal. Z OpenRouterem web search trzeba podpiąć osobno - narzędzia `web_search`/`web_extract` mają 5 backendów: **firecrawl** (domyślny, klucz FIRECRAWL_API_KEY), **searxng** (darmowy, self-hosted, SEARXNG_URL), **tavily**, **exa**, **parallel**; w referencji env jest też BRAVE_SEARCH_API_KEY.

14. Na start (najprościej): załóż darmowe konto Firecrawl albo Tavily, wygeneruj klucz i po SSH wpisz go do `~/.hermes/.env` (np. `FIREKRAWL... = patrz nazwy wyżej`), Hermes sam wykryje backend z dostępnych kluczy. Limity darmowych planów sprawdź przy rejestracji (nie weryfikowałem ich).
15. Docelowo (0 zł, pełna prywatność - polecane pod dane klubu): postawimy **SearXNG** na tym samym VPS (własna wyszukiwarka, zapytania nie idą do zewnętrznego API) i ustawimy `SEARXNG_URL`. To zrobię ja przy hardeningu.
16. Test: poproś agenta "wyszukaj w internecie najnowsze informacje o firmie X i podaj źródła".

---

## CZĘŚĆ E (OPCJONALNA - tylko nasz kanał testowy): Telegram z allowlistą (BotFather + SSH)

To NIE jest kanał dla prezesa (on dostanie aplikację PKB). Telegram daje nam za darmo mobilny dostęp do agenta na czas testów fazy 1. Jeśli wolisz bez niego - pomiń całą część E i testuj w CLI albo przez Open WebUI.

17. Na telefonie/desktopie w Telegramie: **@BotFather** -> `/newbot` -> nazwa np. "Asystent PKB" -> dostajesz **token** (format `123456789:ABC...`). Potem napisz do **@userinfobot** - odeśle Twój numeryczny **user ID**. Token traktuj jak hasło: nie wklejaj go do rozmowy z agentem (filmik GeekWork tak robi - wygodne, ale sekrety mają siedzieć w .env).
18. SSH na VPS z Windows: hPanel -> VPS -> Manage -> na VPS Overview karta "VPS details" (SSH username + IP), hasło root ustawisz przyciskiem Change. W PowerShell na Twoim komputerze:
    ```
    ssh root@ADRES_IP
    ```
    (pierwszy raz potwierdź "yes"; kursor nie pokazuje znaków hasła).
19. Dopisz do `~/.hermes/.env` dwie linie (edytorem nano/vi albo `hermes config set ...`):
    - `TELEGRAM_BOT_TOKEN=` (token z BotFathera)
    - `TELEGRAM_ALLOWED_USERS=` (Twój ID; później dodamy ID Marcina/Radka po przecinku)
    Bez allowlisty Hermes domyślnie ODRZUCA wszystkich (fail-closed), więc bot nie będzie otwarty dla obcych; ale nigdy nie ustawiaj GATEWAY_ALLOW_ALL_USERS=true.
20. Restart gatewaya: `hermes gateway restart` (albo w Docker Manager: Options -> Restart). Test: napisz do bota na Telegramie - ma odpowiedzieć w kilka sekund. Alternatywa dla dopisywania ID: parowanie kodami (`hermes pairing approve telegram KOD`).

---

## CZĘŚĆ F: Minimalny hardening na start (SSH, 15 minut)

Z oficjalnej 10-punktowej checklisty produkcyjnej + lekcji z filmiku detechtive (jego testowy VPS: 1000+ prób logowania botów w kilka dni):

21. `hermes config set terminal.backend docker` (komendy agenta w sandboxie, nie na gołym serwerze; w kontenerowym wdrożeniu Hostingera zapis plików jest już ograniczony do /opt/data przez HERMES_WRITE_SAFE_ROOT).
22. Firewall: `ufw allow OpenSSH`, `ufw deny 8642`, `ufw deny 9119`, `ufw enable` (API i dashboard tylko lokalnie; domyślnie i tak bindują 127.0.0.1, firewall to pas i szelki).
23. SSH po kluczu zamiast hasła + wyłącz logowanie hasłem (zrobię przy wdrożeniu; do tego czasu mocne hasło root).
24. Aktualizacje: co 1-2 tygodnie Docker Manager -> Options -> **Update** (dane w wolumenie ~/.hermes przeżywają aktualizację; kontener sam migruje config z backupami). Nowe wydania śledź na github.com/NousResearch/hermes-agent/releases.
25. Backup: regularnie kopiuj katalog `~/.hermes` (cały stan: config, klucze, pamięć, sesje, skille). Zrobię crona z paczką tar.
26. Nigdy: tryb YOLO, GATEWAY_ALLOW_ALL_USERS=true, skille instalowane z huba bez przeglądu kodu (lekcja ClawHavoc: ~20% skilli w rejestrze OpenClaw było złośliwych).
27. Higiena skilli (z filmiku detechtive, potwierdzone logiką dokumentacji): nieużywane skille wyłączaj - każdy nagłówek skilla dokleja się do kontekstu i podnosi koszty.

Po fazie 1 (u mnie na liście przy wdrożeniu): profile `prezes`/`research`, API server pod własną aplikację, SearXNG, cron ze strefą Europe/Warsaw (na Hostingerze bywa przesunięta ~2h), izolacja i testy.

---

## Werdykt o Twoich 3 filmikach (zdobyłem pełne transkrypty wszystkich)

**1. GeekWork - "Ten agent AI POKONAŁ Claude Code 14:4" (18.06.2026, 22 min).** Najbliższy naszemu stackowi: Hostinger + OpenRouter + Claude Sonnet jako model. Warte wzięcia: rekomendacja KVM 2+, OpenRouter jako jeden klucz do wielu modeli, cron w naturalnym języku ("codziennie o 7:00 wyślij mi..."), statystyki kosztów per sesja. Ostrożnie: liczby marketingowe (14:4, gwiazdki GitHuba) niezweryfikowane i sprzeczne wewnętrznie; token BotFathera wkleja do czatu z agentem (u nas: do .env); zero tematu bezpieczeństwa.

**2. detechtive - "Lepszy od Claude Code? Hermes Agent krok po kroku" (18.07.2026, 78 min). Najbardziej wartościowy z trójki.** Pokrywa dokładnie naszą ścieżkę: `hermes setup` -> pomiń Nous Portal -> OpenRouter -> limit dolarowy na kluczu -> tanie modele. Unikalne smaczki: SearXNG jako darmowa prywatna wyszukiwarka (bierzemy!), zewnętrzny darmowy provider pamięci (holographic) zamiast ograniczonego MEMORY.md, wyłączanie nieużywanych skilli, realne koszty (kilkanaście centów za sesję), twarde dane o atakach botów na publiczny panel, poradnik hardeningu autora, patent na onboarding agenta ("zadaj mi pytania, żeby zrozumieć czym się zajmuję" - idealne do sprofilowania agenta pod Radka). Ostrożnie: nazwy modeli przekręcone przez ASR; skill Google Meet u autora nie działał; panel potrafi się lagować.

**3. Startuj AI - "TWÓJ AGENT AI 24/7" (04.07.2026, 20 min).** Dobre potwierdzenie ścieżki Hostinger (KVM 2, projekt + Traefik, przycisk Open) i wzorca "cron -> plik .md -> podsumowanie na komunikator -> skill". Ale: w ogóle nie pokazuje OpenRoutera (autor loguje się darmowym kontem ChatGPT i 2x wpada na limit w trakcie nagrania - antywzorzec dla agenta 24/7), wszystko robi czatem zamiast przez config, zero bezpieczeństwa.

**Czego nie ma w ŻADNYM filmiku, a jest kluczowe dla nas:** API server (fundament własnej aplikacji czatu), profile per osoba (prezes vs dyrektorzy), allowlisty/pairing, ograniczenie Tool Gateway przy OpenRouter (web search trzeba podpiąć samemu). Filmiki są dobre na fazę 1, faza 2 idzie wyłącznie z oficjalnej dokumentacji i naszego feasibility.

---

## Zrzuty ekranu PKB zamiast API - plan

Dobry plan B. Jak zrobisz zrzuty, wykorzystam je tak:
1. Odtworzę z nich STRUKTURĘ danych klubu (sekcje ankiety potrzeb 1-4, kategorie ofert, profil firmy, pola kontaktów) jako dokument markdown.
2. Z tego powstanie skill "matching PKB" + plik wiedzy w bazie agenta: jak czytać potrzeby firm, po czym łączyć firmy, jakie pytania zadawać.
3. Gdy kiedyś dostaniemy eksport/dostęp, podmienimy wiedzę statyczną na żywe dane bez zmiany logiki.

Co zrzucać (po zalogowaniu jako Marcin): ankieta potrzeb - wszystkie sekcje po rozwinięciu (szczególnie "3. Co oferuje Twoja firma" i "4. Rozwój dzięki technologii"), profil/wizytówka przykładowej firmy, lista kategorii branż, panel Klubowicza (menu). Bez danych wrażliwych innych firm, jeśli się da - najlepiej na własnym profilu Marcina.

---

## NIEZWERYFIKOWANE

- Niczego nie uruchamiałem na żywym VPS - kroki pochodzą z aktualnej oficjalnej dokumentacji Hermesa, artykułów supportu Hostingera i dokumentacji OpenRoutera (zweryfikowane adwersaryjnie, 30/30 potwierdzone). Pierwsze realne przejście zrobimy razem na Twoim VPS.
- Dokładny wygląd/kolejność ekranów kreatora może się minimalnie różnić od opisu (projekt wydaje wersje co 1-2 tygodnie; lista kroków kreatora pochodzi z tutoriala Hostingera, oficjalne docs potwierdzają tylko zakres pytań).
- Darmowe limity Firecrawl/Tavily/Brave - do sprawdzenia przy rejestracji.
- Przebieg płatności OpenRouter polską kartą (3DS, przewalutowanie) - do potwierdzenia przy doładowaniu.
- Treść filmików znam z pełnych transkryptów automatycznych (ASR) - obrazu nie widziałem, więc dokładne kliknięcia w panelach znam z narracji autorów.
