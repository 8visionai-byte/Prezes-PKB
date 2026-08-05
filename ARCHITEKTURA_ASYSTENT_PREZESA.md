# Asystent Prezesa PKB - werdykt wykonalności i architektura

Data: 2026-08-01. Oparte w 100% na aktualnej dokumentacji online (nie na wiedzy z pamięci).
Research: 10 agentów (5 researcherów + 5 weryfikatorów adwersaryjnych), 40 kluczowych twierdzeń sprawdzonych w oficjalnych źródłach, 40 potwierdzonych, 0 obalonych.
Pełna lista faktów ze źródłami: `RESEARCH_ZRODLA.md` (w tym folderze).

---

## 1. Werdykt: TAK, Twoja hipoteza jest wykonalna

Twoja architektura (Hermes na VPS Hostinger + własna aplikacja czatu z logo i kolorami PKB + panel bazy wiedzy + integracje + brief przed spotkaniem) jest oficjalnie wspierana przez dokumentację Hermesa. Nie trzeba nic hackować. Trzy korekty do Twojej wizji:

1. **Upload plików przez czat-API nie działa** (API przyjmuje tylko obrazki). Panel "wrzuć plik do bazy" musi mieć własny mały backend, który zapisuje plik prosto na dysk serwera (szczegóły w pkt 5). To proste do zrobienia.
2. **Obsidian nie jest potrzebny.** W oficjalnej dokumentacji nie ma integracji z Obsidianem. Baza wiedzy Hermesa to zwykłe pliki markdown w katalogach (pamięć MEMORY.md/USER.md, skille SKILL.md, pliki kontekstowe AGENTS.md/SOUL.md). Obsidian może być co najwyżej Twoim lokalnym edytorem tych plików, bo vault Obsidiana to też zwykłe pliki md.
3. **Dyrektorzy: nie budujesz osobnych Hermesów na osobnych serwerach.** Jeden VPS, jedna instalacja, a w niej PROFILE (`hermes profile create dyrektor1`). Każdy profil to osobny agent z własną pamięcią, konfiguracją, kluczami i portem API. Szczegóły w pkt 6.

Ważna uwaga o źródłach: oficjalna dokumentacja to **hermes-agent.nousresearch.com/docs** i repo **github.com/NousResearch/hermes-agent**. Strona hermes-agent.ai to serwis firm trzecich, nie Nous Research.

---

## 2. Odpowiedzi na Twoje pytania wprost

| Twoje pytanie | Odpowiedź | Skąd wiem |
|---|---|---|
| Czy własna aplikacja (a la GPT/WhatsApp) może gadać z Hermesem? | TAK. Hermes ma oficjalny API server zgodny z formatem OpenAI: port 8642, klucz Bearer, streaming SSE (odpowiedź "płynie" jak w GPT). Dla głębszej kontroli jest też WebSocket JSON-RPC (sterowanie sesjami, przerywanie, historia, zatwierdzenia). | docs: user-guide/features/api-server, developer-guide/programmatic-integration |
| Czy z poziomu czatu można wrzucać notatki do bazy? | TAK dla notatek (piszesz "zapamiętaj, że..." i agent zapisuje; komenda /learn buduje cały skill z materiałów). NIE dla plików przez API (tylko obrazki, reszta = błąd 400). Pliki wrzucamy własnym backendem prosto na dysk. | docs: features/memory, features/skills, features/api-server |
| Czy jedna instancja obsłuży prezesa i dyrektorów? | TAK, ale każda osoba musi mieć OSOBNY PROFIL. Wewnątrz jednego profilu pamięć jest wspólna, więc wrzucenie wszystkich do jednego = agent miesza konteksty i może wygadać dane jednej osoby drugiej. Profile działają równolegle na jednym VPS. | docs: user-guide/profiles, multi-profile-gateways, api-server |
| Czy Hermes może wołać zewnętrzne API (weryfikacja firm)? | TAK, trzema drogami: MCP (nasz własny serwer narzędzi), skille ze skryptami, oraz execute_code/terminal (curl). | docs: features/mcp, features/skills, features/delegation |
| Czy umie puścić "rój agentów" do researchu? | TAK. delegate_task odpala pod-agentów z izolowanym kontekstem, domyślnie 3 równolegle (konfigurowalne). Web search i czytanie stron ma wbudowane. | docs: features/delegation, features/tools |
| Czy Hostinger to ogarnie? | TAK. W katalogu Docker Manager są 3 szablony one-click: Hermes Agent, Hermes Workspace (agent + web UI), Hermes WebUI. Zalecany plan: KVM 2 (2 vCPU / 8 GB RAM, ok. 9-15 USD/mies). | hostinger.com/support + strony szablonów |
| Czy system jest powielalny? | TAK. Całość to: obraz Docker + katalog ~/.hermes (config, profile, skille, pamięć) + nasz frontend + nasz serwer MCP. Nowy klub = nowy VPS (albo nowy profil) + podmiana brandingu. | docs: user-guide/docker (wolumen z całym stanem) |

---

## 3. Rekomendowana architektura

```
                        TELEFON / PRZEGLĄDARKA PREZESA
                                   |
                    [ Nasza aplikacja PWA "Asystent PKB" ]
                    (logo PKB, kolory, czat a la GPT, panel bazy wiedzy)
                                   |  HTTPS
                    [ Backend naszej aplikacji (Next.js) ]
                    - logowanie per użytkownik (prezes, dyrektorzy)
                    - mapowanie: użytkownik -> profil Hermesa
                    - upload plików -> katalog bazy wiedzy profilu
                    - lista dokumentów w bazie
                                   |  localhost (VPS)
     +-----------------------------+------------------------------+
     |         VPS HOSTINGER (KVM 2, Docker, porty zamknięte)     |
     |                                                            |
     |  [ Hermes Agent - kontener Docker ]                        |
     |    profil "prezes"    -> API port 8642, własny klucz       |
     |    profil "dyrektor1" -> API port 8643, własny klucz       |
     |    profil "research"  -> do brudnej roboty w internecie    |
     |                                                            |
     |  [ Nasz serwer MCP "firmy-PL" ]                            |
     |    KRS API | biała lista VAT | GUS REGON | CEIDG           |
     |    KIPG API (jak Radek da dostęp) | baza ankiet PKB        |
     +------------------------------------------------------------+
                                   |
                    web_search / web_extract (internet, newsy)
```

Zasada bezpieczeństwa nr 1: **jedyną rzeczą wystawioną do internetu jest nasza aplikacja** (za HTTPS i logowaniem). Porty Hermesa (8642, 9119) zostają zamknięte firewallem, backend gada z nimi po localhost. Powód: na początku 2026 skany znalazły ok. 245 tys. publicznie wystawionych instancji podobnego agenta (OpenClaw) i był głośny RCE. Nie powtarzamy tego błędu.

---

## 4. Interfejs: trzy opcje, moja rekomendacja

| Opcja | Co daje | Wady | Kiedy |
|---|---|---|---|
| A. Open WebUI + profile | Gotowe konta użytkowników, przypisanie "modelu" (=profilu) per osoba, zero kodu. Oficjalnie udokumentowana integracja z obu stron. | Wygląd generyczny, ograniczony branding, brak panelu bazy wiedzy pod nasze potrzeby | Test wewnętrzny, demo dla Radka za tydzień |
| B. Fork Hermes Workspace (MIT) | Gotowy "command center": czat SSE, pliki, pamięć, skille, terminal, PWA na telefon. Licencja pozwala przebrandować. | Jedno wspólne hasło na wszystkich (brak kont per osoba!), projekt społeczności (nie Nous), trzeba forka utrzymywać | Podgląd możliwości, inspiracja UI |
| C. Własna aplikacja (Next.js PWA) | Pełny brand PKB, logowanie per użytkownik, czat przez /v1/chat/completions (SSE), panel dokumentów i upload po naszemu. To zwykły klient formatu OpenAI, dobrze znany kawałek roboty. | Trzeba napisać (realnie: MVP w kilka dni) | Produkt docelowy dla prezesa |

**Rekomendacja: A teraz (demo w tydzień), C jako produkt.** B potraktować jako źródło pomysłów na UI. Wariant C i tak jest konieczny, bo tylko on daje jednocześnie: branding PKB, konta per osoba i panel bazy wiedzy.

Zanim ruszę z UI: potrzebuję logo PKB, kolory (HEX) i screenshoty ze stron PKB, o których mówił Marcin. Wzorzec jest specyfikacją, nie robię grafiki ze słownego opisu. Pokażę jeden ekran do akceptacji zanim zbuduję całość.

---

## 5. Baza wiedzy i wrzucanie plików

Jak to naprawdę działa w Hermesie:

- **Pamięć rozmów**: automatyczna, w SQLite (pełna historia sesji + wyszukiwanie). Agent "uczy się" prezesa przez MEMORY.md/USER.md (notatki o użytkowniku wstrzykiwane do każdej rozmowy) - dokładnie to, co chciałeś ("prezes go wszystkiego nauczy").
- **Notatki**: prezes pisze na czacie "zapamiętaj, że firmy transportowe pytamy najpierw o flotę" i agent to trwale zapisuje.
- **Dokumenty/pliki**: API czatu ich nie przyjmuje. Rozwiązanie: przycisk "Dodaj do bazy" w naszej aplikacji wysyła plik do naszego backendu, backend zapisuje go do katalogu bazy wiedzy danego profilu na VPS (wolumen Dockera), a panel pokazuje listę tego katalogu. Agent czyta te pliki narzędziami plikowymi.
- **Skille**: powtarzalne procedury (np. "jak robimy brief przed spotkaniem") zapisujemy jako skill (SKILL.md) - prezes może odpalić to jedną komendą, a my mamy kontrolę nad jakością procedury.
- **Opcjonalnie później**: wtyczka pamięci zewnętrznej (np. Honcho) z wyszukiwaniem semantycznym, jeśli baza urośnie.

---

## 6. Prezes + dyrektorzy: jeden silnik, wiele profili

Odpowiedź na Twoje pytanie "czy dla każdego dyrektora budować osobnego Hermesa": **nie budujesz osobnych serwerów, tworzysz profile w jednej instalacji**.

- `hermes profile create prezes`, `hermes profile create dyrektor1`... Każdy profil = osobny agent: własny config, własna pamięć, własne sesje, własne klucze, własny port API (8642, 8643, 8644...).
- Nasza aplikacja loguje użytkownika i kieruje jego czat do jego profilu. Ograniczony zakres dla dyrektorów robimy dwiema warstwami: (1) w naszej aplikacji (co widzą w panelu), (2) w profilu (jakie narzędzia i skille ma ich agent).
- Wspólna wiedza klubowa (np. baza ankiet) siedzi w naszym serwerze MCP, więc każdy profil korzysta z tych samych danych firmowych, ale prywatne rozmowy i pamięć są rozdzielone.
- Wydajność: KVM 2 wystarczy na start (prezes + 1-2 profile); przy 5+ aktywnych profilach z automatyzacją przeglądarki celować w KVM 4.

---

## 7. Integracje danych o firmach (Polska)

| Źródło | Co daje | Dostęp | Koszt |
|---|---|---|---|
| KRS (api-krs.ms.gov.pl) | pełny odpis spółki JSON | bez klucza, bez rejestracji (research odpytał je na żywo - działa) | 0 zł |
| Biała lista VAT (wl-api.mf.gov.pl) | status VAT + rachunki | bez klucza; limit 100 zapytań "search"/dzień | 0 zł |
| GUS REGON (BIR1.1) | wyszukiwanie po NIP/REGON/KRS | darmowy klucz po rejestracji | 0 zł |
| CEIDG v3 | JDG-i | token po wniosku podpisanym Profilem Zaufanym | 0 zł |
| KRZ (upadłości, restrukturyzacje) | red flags | BRAK oficjalnego API; komercyjnie MGBI / iMSiG | np. iMSiG ~600 zł netto/rok |
| MSiG | ogłoszenia sądowe | jw. (komercyjnie) | jw. |
| **KIPG - znalazłem!** | kipg.pl = Krajowy Instytut Prawa Gospodarczego, wywiad gospodarczy, ocena firm z 75 źródeł ("Można robić interesy" / "Uważaj" / "Omijaj z daleka") | MA ofertę API (weryfikacja, monitoring NIP-ów, alerty), ale bez publicznej dokumentacji - dostęp przez kontakt handlowy, czyli przez Radka | do ustalenia z KIPG |
| Portal PKB (partnerskieklubybiznesu.pl) | ankiety potrzeb, oferty członków | BRAK publicznego API. Operator: Partnerskie Kluby Biznesu Sp. z o.o. (KRS 0001207862). Potrzebny dostęp od Radka: najlepiej eksport bazy ankiet albo dostęp do bazy danych | do ustalenia z Radkiem |

Wniosek: **darmowy "biały wywiad" (KRS + VAT + REGON + internet) możemy mieć od pierwszego dnia bez niczyich zgód.** Pełny obraz finansowy i matching wymagają dwóch rzeczy od Radka: dostępu API do KIPG i eksportu/dostępu do ankiet PKB. To jest główna zależność projektu, nie technika.

---

## 8. Flow "brief przed spotkaniem" (moduł po module)

1. Prezes pisze (albo dyktuje) w naszej aplikacji: "Jadę do firmy XYZ, przygotuj mnie".
2. Agent dopytuje o NIP albo potwierdza firmę linkiem (tak jak chciałeś w transkrypcji).
3. Narzędzia MCP: KRS + biała lista + REGON (+ KIPG, jak będzie dostęp) - twarde dane i red flags.
4. delegate_task: 2-3 pod-agentów równolegle przeszukuje internet (newsy, inwestycje, problemy, wypowiedzi zarządu).
5. Narzędzie MCP "ankiety PKB": czego szukają członkowie klubu, kto oferuje to, czego XYZ może potrzebować (matching "ból firmy -> firma z klubu, która to rozwiązuje").
6. Agent składa brief: sytuacja firmy, red flags, 10 zaczepień do rozmowy, propozycje połączeń z konkretnymi członkami klubu, zdania-klucze do przekonania na wstąpienie do PKB.
7. Brief wraca na czat + zapisuje się w bazie wiedzy (historia briefów per firma).

---

## 9. Ryzyka (nazwane wprost) i jak je zdejmujemy

| Ryzyko | Skala | Mitygacja |
|---|---|---|
| Prompt injection: spreparowana strona "o firmie" każe agentowi coś zrobić (otwarte issue #18981 - Hermes NIE ma twardej obrony na dane z internetu) | wysokie | Osobny profil "research" bez dostępu do danych klubu i bez narzędzi wysyłki; sandbox Docker; HERMES_WRITE_SAFE_ROOT; brief zawsze przechodzi przez człowieka zanim poleci dalej |
| Wystawiony agent z shellem = przejęcie serwera (lekcja OpenClaw: RCE + 245 tys. wystawionych instancji) | wysokie | Porty 8642/9119 zamknięte (ufw deny); jedyny publiczny punkt = nasza aplikacja za HTTPS i logowaniem; terminal.backend=docker; nigdy tryb YOLO |
| Złośliwe skille z huba (lekcja ClawHavoc: ~20% rejestru OpenClaw było złośliwe) | średnie | Instalujemy wyłącznie skille pisane przez nas; zero instalek community bez przeglądu kodu |
| Młody projekt: CVE (np. adapter WeChat Work bez patcha w maju), wydania co kilka tygodni | średnie | Wyłączyć nieużywane adaptery; proces: śledzenie releases/security advisories, aktualizacja przez Docker Manager, backup ~/.hermes przed każdą |
| Mieszanie danych osób w jednym profilu | wysokie, jeśli zaniedbane | Profil per osoba, twardo (pkt 6); test izolacji przed oddaniem dyrektorom |
| RODO (NIP-y JDG, ankiety członków = dane osobowe) | średnie | DPA z dostawcą modelu (Anthropic API ma DPA, retencja do 30 dni; pełna rezydencja EU: Claude przez AWS Bedrock Frankfurt); dla danych osobowych własny klucz API zamiast Nous Portal (status DPA Portalu niezweryfikowany); umowa powierzenia z Hostingerem; polityka retencji historii SQLite; minimalizacja danych wysyłanych do modelu |
| Koszty tokenów przy roju agentów | średnie | Limit współbieżności (domyślnie 3), tani model do pod-zadań, mocny model (np. Claude) tylko do syntezy briefu; monitoring kosztów per zadanie |
| Zależność od Nous Research (narzędzia przez ich Portal) | niskie/średnie | Własne klucze API do modeli; własny serwer MCP zamiast bundlowanych narzędzi tam, gdzie się da |

---

## 10. Koszty na start (orientacyjnie)

- VPS Hostinger KVM 2: ok. 9 USD/mies promo (odnowienie ~15 USD). Alternatywa bez administracji: Managed Hermes od ~6 USD/mies (backup dzienny w cenie), ale mniej kontroli - do produktu dla klienta wolę pełny VPS.
- Modele: klucz API (np. Anthropic) - koszt zależny od użycia; jeden brief z researchem to realnie kilkadziesiąt groszy do kilku zł w tokenach zależnie od modelu i głębokości.
- KIPG API / iMSiG: do wyceny (KIPG przez handlowca, iMSiG ~600 zł netto/rok).
- Nasza praca: MVP aplikacji + serwer MCP + konfiguracja = główny koszt projektu.

---

## 11. Następne kroki

1. **[Ty, decyzja]** Zatwierdź kierunek: profile na jednym VPS + własna aplikacja (opcja C) z Open WebUI jako demo przejściowe. Powiedz też, czy demo dla Radka robimy na Twoim istniejącym VPS, czy kupujemy czysty KVM 2 pod ten projekt (rekomendacja: czysty, bo to produkt dla klienta).
2. **[Panel Hostinger]** Zakup/wybór VPS -> Docker Manager -> Catalog -> "Hermes Agent" -> Deploy (login+hasło zapisz w swoim menedżerze haseł). Nie wpisuj kluczy przez konsolę w przeglądarce, tylko przez SSH (konsola przekłamuje znaki).
3. **[Ja, SSH na VPS]** Hardening i konfiguracja: ufw deny 8642/9119, terminal.backend=docker, WRITE_SAFE_ROOT, profile "prezes" i "research", API server + klucze (podam Ci nazwy zmiennych env, wartości ustawisz sam), test API z localhost.
4. **[Ja]** Serwer MCP "firmy-PL" v1: KRS + biała lista + REGON (wszystko darmowe, bez zgód). Test na 3 realnych NIP-ach i pokazuję Ci wynik briefu.
5. **[Ty -> Marcin/Radek]** Dwie prośby do Radka: (a) kontakt/dostęp API do KIPG, (b) eksport ankiet potrzeb z portalu PKB (albo dostęp). Plus od Marcina: logo, kolory HEX, screenshoty stron PKB.
6. **[Ja]** Demo: Open WebUI podpięte do profilu "prezes" (test z Marcinem od poniedziałku, jak planowaliście), równolegle jeden ekran własnej aplikacji do Twojej akceptacji.
7. **[Wspólnie]** Po akceptacji ekranu: buduję MVP aplikacji (czat SSE + logowanie + upload do bazy + lista dokumentów) i spinamy flow briefu end-to-end na prawdziwej firmie.

---

## NIEZWERYFIKOWANE

- Nic nie było uruchamiane na żywo: całość pochodzi z lektury aktualnej oficjalnej dokumentacji i źródeł (zweryfikowanej adwersaryjnie przez drugą falę agentów). Jedyny test na żywo wykonany podczas researchu: API KRS odpowiedziało poprawnym odpisem JSON bez klucza. Resztę potwierdzimy dopiero na VPS (krok 3).
- Izolacja pamięci wielu użytkowników WEWNĄTRZ jednego profilu nie jest wprost opisana w dokumentacji (wniosek "pamięć per profil" wynika z dokumentacji profili) - dlatego twardo zakładamy profil per osoba i przetestujemy to przed oddaniem dyrektorom.
- Szczegóły API KIPG (endpointy, ceny) - brak publicznej dokumentacji, wymaga kontaktu handlowego.
- Status DPA/RODO Nous Portal - niepotwierdzony; do czasu wyjaśnienia dla danych osobowych używamy własnych kluczy API.
- Ceny Hostingera podane w USD z wersji promocyjnej strony US, bez VAT; cennik PLN sprawdzić przy zakupie.
