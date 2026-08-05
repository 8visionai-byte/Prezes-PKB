# STATUS — Asystent Prezesa PKB (badanie wykonalności)

Data startu: 2026-07-31

## Etapy

| Etap | Stan | Dowód |
|---|---|---|
| 1. Rozpoznanie: czym jest Hermes Agent | DONE | WebSearch: Hermes Agent = open-source agent Nous Research, Docker, szablon Hostinger, Hermes Workspace (web UI) |
| 2. Research wieloagentowy (dokumentacja Hermesa, UI/API, Hostinger, integracje PL, ryzyka) | DONE | Workflow wf_dd856ee5: 10 agentów, 0 błędów; wynik w RESEARCH_ZRODLA.md |
| 3. Weryfikacja adwersaryjna kluczowych twierdzeń | DONE | 40 twierdzeń sprawdzonych, 40 CONFIRMED, 0 REFUTED (sekcje VERDICTS w RESEARCH_ZRODLA.md) |
| 4. Synteza: dokument architektury + werdykt wykonalności | DONE | ARCHITEKTURA_ASYSTENT_PREZESA.md (werdykt: wykonalne; 3 korekty wizji) |
| 5. Decyzja Pawła: kierunek (opcja C + demo Open WebUI), VPS, prośby do Radka (KIPG API, eksport ankiet PKB) | NIERUSZONE | czeka na Pawła |
| 6. Wdrożenie: VPS + hardening + profile + MCP firmy-PL + demo | NIERUSZONE | po decyzji |
| 7. Instrukcja wdrożenia krok po kroku (Hostinger + OpenRouter) + analiza 3 filmików YT | DONE | Workflow wf_52cce419 (9 agentów, 30/30 CONFIRMED); WDROZENIE_KROK_PO_KROKU.md; pełne transkrypty 3 filmików przeanalizowane |
| 8. Faza 1 wykonawcza: Paweł zakłada OpenRouter + VPS wg instrukcji, potem wspólne przejście kreatora | NIERUSZONE | czeka na Pawła |
| 9. Zrzuty ekranu PKB od Pawła/Marcina -> struktura danych klubu -> skill "matching PKB" | NIERUSZONE | plan B wobec braku API PKB |
| 10. Analiza 5 kolejnych filmików YT + panel rozwoju agenta | DONE | Workflow wf_5c0885e5 (6 agentów, pełne transkrypty); MOC_HERMESA_NOTATKI.md; panel = wtyczka Hermes Achievements (PCinkusz) do dashboardu :9119 |
| 11. Plan realizacji aplikacji PKB (zakres MVP + ścieżka GSD) | DONE | PLAN_REALIZACJI_APLIKACJA_PKB.md |
| 12. Checklista startowa Pawła: OpenRouter DONE (klucz w menedżerze haseł Pawła); VPS, zrzuty/logo/HEX od Marcina, subdomena, decyzja o kontach - czekają | W TOKU | sekcja 4 planu realizacji |
| 12a. Folder app/ przygotowany: osobne repo git (main) + KICKOFF_GSD.md z promptem startowym do /gsd-new-project | DONE | app/KICKOFF_GSD.md |
| 13. Silnik na VPS (API server, profile, hardening, search) | W TOKU | Patrz szczegóły niżej |

### Stan silnika 2026-08-03 (zweryfikowane na żywo)

- Obraz hermes-agent 3.95 GB pobrany, uruchamia się poprawnie.
- Kreator przerwany przez zerwane SSH, ale **klucz OPENROUTER_API_KEY zapisany** w /root/hermes-data/.env (73 znaki).
- config.yaml naprawiony i ustawiony przeze mnie: `model.default: anthropic/claude-opus-5`, `provider: openrouter`, dodany brakujący `_config_version: 12` (bez niego Hermes ostrzegał o niemigrowalnej konfiguracji).
- **Test end-to-end: łańcuch DZIAŁA** (SSH -> Docker -> Hermes -> OpenRouter -> Anthropic). Zatrzymał się wyłącznie na HTTP 402: brak środków.
- Stan konta OpenRouter (z API): `is_free_tier: true`, `usage: 0`, `limit: null`. Czyli **wydane dotąd $0.00** i brak limitu na kluczu.
- Składnia: jednorazowy prompt to `hermes -z "..."` (nie `-p`).
- Paweł doładował kredyty i ustawił limit $10 na kluczu (`is_free_tier: false`, `limit: 10`).

### SILNIK DZIAŁA - dowody z żywego serwera (2026-08-03)

1. **Agent odpowiada po polsku**: `hermes -z "..."` zwrócił "Jestem Hermes Agent... działam na anthropic/claude-opus-5 (przez OpenRouter)".
2. **Bramka chodzi jako usługa**: kontener `hermes` z /root/pkb-stack/docker-compose.yml, pod nadzorem s6 (auto-restart po awarii).
3. **Serwer API odpowiada**: `GET /v1/models` -> `{"id":"hermes-agent"}`.
4. **KLUCZOWY DOWÓD - aplikacja PKB ma z czym gadać**: `POST /v1/chat/completions` zwrócił po polsku "Jestem asystentem prezesa." (22 625 tokenów promptu, 15 wyjścia).

Konfiguracja ustawiona:
- model główny `anthropic/claude-opus-5`, provider openrouter
- 9 slotów pomocniczych na tani `google/gemini-3.6-flash` (tytuły, kompresja, web_extract, approval, vision, curator, triage, kanban, profile)
- fallback `openai/gpt-5.6-sol` (agent nie zamilknie przy awarii Anthropic)
- strefa czasowa serwera **Europe/Warsaw** (było UTC)
- `tool_loop_guardrails.hard_stop_enabled: true` (twardy stop zapętlonych narzędzi = ochrona kosztów)
- API server: `API_SERVER_ENABLED=true`, klucz wygenerowany na serwerze (openssl rand -hex 32, nigdy nie wyświetlony), port 8642 **tylko na 127.0.0.1 od strony hosta**
- PUŁAPKA rozwiązana: `API_SERVER_HOST` musi być 0.0.0.0 WEWNĄTRZ kontenera (bind na 127.0.0.1 w kontenerze = mapowanie portu nie działa); bezpieczeństwo daje bind hosta w compose.
- `_config_version: 12` dopisany ręcznie (bez tego Hermes ostrzegał o niemigrowalnej konfiguracji).

### SILNIK UKOŃCZONY 2026-08-04 (wszystko zweryfikowane na żywo)

- Model główny zmieniony na **openai/gpt-5.6-terra** (decyzja Pawła: Opus 5 za drogi). Zmierzone realnie:
  - Opus 5: ~22 600 tokenów promptu na wiadomość = **ok. $0,14** -> z $10 wychodzi **ok. 70 wiadomości**
  - Terra: ~13 450 tokenów promptu = **ok. $0,017** -> z $10 wychodzi **ok. 590 wiadomości**
  - Czyli Terra jest ok. 8x tańsza w praktyce. Stan po wszystkich testach: wydane $0,3032 z $10.
- Osierocony kontener z przerwanego kreatora zatrzymany (dokumentacja zakazuje dwóch kontenerów na jednym katalogu danych).
- **Firewall ufw aktywny**: wpuszcza tylko SSH + 80/443 (pod przyszłą aplikację). Porty agenta 8642/8643/9119 NIE są wystawione - nasłuchują wyłącznie na 127.0.0.1.
- **Profile utworzone i skonfigurowane**: `default`, `prezes-test` (własny serwer API na 8643 + własny klucz), `research`. Każdy z własnym .env (chmod 600).
- **Panel webowy działa** na 127.0.0.1:9119, zabezpieczony logowaniem (login `pkb`, hasło wygenerowane losowo na serwerze i zapisane w `/root/hermes-dashboard-haslo.txt`, chmod 600 - NIGDY nie przechodziło przez czat).
  - Pułapka: panel ODMAWIA startu przy bindzie na 0.0.0.0 bez skonfigurowanego logowania (komunikat "Refusing to bind dashboard to 0.0.0.0"). Rozwiązane basic auth ze scrypt.
- **Kopie zapasowe**: skrypt `/root/backup-hermes.sh` + cron codziennie 3:30, retencja 14 dni, katalog `/root/backups` (pierwsza kopia 22 MB).

### WYSZUKIWARKA DZIAŁA (2026-08-04)

- **SearXNG postawiony jako drugi kontener** w stosie (`/root/searxng`, limit 1 GB RAM). Celowo BEZ mapowania portów - dostępny tylko w sieci Dockera, niewidoczny z internetu.
- Domyślnie SearXNG oddaje tylko HTML; dopisany `search.formats: [html, json]` w settings.yml, inaczej agent nie potrafi czytać wyników.
- `SEARXNG_URL=http://searxng:8080` w .env wszystkich trzech profili, `web.backend: searxng` w config.yaml.
- **DOWÓD**: agent zapytany o Partnerskie Kluby Biznesu przeszukał internet i odpowiedział po polsku z linkiem do źródła (partnerskieklubybiznesu.pl).
- Korzyść RODO: zapytania o firmy członków klubu nie wychodzą do zewnętrznego dostawcy wyszukiwania.

### SILNIK KOMPLETNY - co działa

| Element | Stan | Dowód |
|---|---|---|
| Agent odpowiada po polsku | DZIAŁA | test `hermes -z` |
| API dla aplikacji PKB | DZIAŁA | `POST /v1/chat/completions` -> odpowiedź |
| Panel webowy + logowanie | DZIAŁA | HTTP 200 po zalogowaniu, też po restarcie |
| Wyszukiwanie w internecie | DZIAŁA | brief o PKB ze źródłem |
| Profile (3) | DZIAŁA | widoczne w panelu, każdy z własnym .env |
| Firewall | DZIAŁA | ufw active, porty agenta tylko lokalnie |
| Kopie zapasowe | DZIAŁA | cron 3:30, retencja 14 dni |

### SERWER MCP "firmy-PL" DZIAŁA (2026-08-04)

Kod: `infra/mcp-firmy-pl/server.mjs` (wersjonowany w repo), na serwerze `/opt/data/mcp/firmy-pl/server.mjs`.
Node.js bez żadnych zależności npm (mniejsza powierzchnia ataku, nic do aktualizowania).

Trzy narzędzia dla agenta:
- `firma_po_nip` - biała lista VAT: nazwa, status VAT, REGON, KRS, adres, rachunki bankowe
- `krs_odpis` - odpis KRS ze streszczeniem: zarząd, kapitał, PKD, sprawozdania + CZERWONE FLAGI (zaległości podatkowe, ZUS, wierzyciele, upadłość, likwidacja, postępowanie naprawcze)
- `firma_raport` - jednym zapytaniem NIP -> biała lista -> KRS -> komplet danych do briefu

Zarejestrowany w `mcp_servers` w config.yaml, widoczny jako `✓ enabled` w `hermes mcp list`.

**DOWÓD (test na żywo)** - agent zapytany o NIP 8961660233 wygenerował brief:
nazwa i KRS, status VAT czynny od 15.12.2025, kapitał 50 000 zł, adres, brak czerwonych flag,
plus własna trafna uwaga: "spółka jest bardzo nowa, wpis do KRS 26.11.2025, brak sprawozdań finansowych".

Koszt: 0 zł. Oba rejestry są darmowe i nie wymagają kluczy. Limit białej listy: 100 zapytań dziennie.

### ZRZUTY PKB PRZEANALIZOWANE (2026-08-04)

9 zrzutów z konta Marcina. Wynik: `STRUKTURA_PKB.md`. Kluczowe ustalenia:
- Wszystkie 9 to JEDEN ekran: Ankieta -> sekcja 3 "Co oferuje Twoja firma?", przewijana. Akurat najważniejsza.
- **Ankieta ma 21 sekcji** - mamy pełną listę nazw. Model danych klubu: sekcja 3 = co firma DAJE (podaż), sekcje 4-20 = czego SZUKA (popyt), sekcja 21 = priorytet kontaktu. Matching = przecięcie podaży z popytem.
- **Taksonomia sekcji 3: 18 kategorii, ok. 90 podkategorii** - spisane co do słowa. Format zapisu: `KATEGORIA — Podkategoria`.
- Menu portalu: 4 grupy (NETWORKING / WYDARZENIA / MÓJ BIZNES / WSPARCIE). Pozycja **"Mój dyrektor z PKB"** potwierdza warstwę dyrektorów w strukturze klubu.
- **WAŻNA OBSERWACJA**: profil Marcina ma ankietę "100% (21/21)", ale w sekcji 3 zaznaczona jest TYLKO JEDNA pozycja (`PRAWO — Inne`). Licznik mierzy odwiedzone sekcje, nie jakość danych. Jeśli tak wyglądają typowe profile, sam matching po checkboxach da słabe wyniki -> mocny argument za budowaniem wiedzy z notatek prezesa.
- Brakuje: zawartości sekcji 1, 2, 4-21 (znamy tylko nazwy), ekranu "Profil firmy", "Moja sieć kontaktów", Dashboardu, oraz kategorii Produkcja i Handel i dystrybucja.

### DRUGA TURA ZRZUTÓW + DECYZJE (2026-08-04)

8 kolejnych zrzutów: ekran "Mój dyrektor z PKB" i "Profil firmy". Wyniki w STRUKTURA_PKB.md.
- **Klient zidentyfikowany: Radosław Rogiewicz, Prezes PKB** (opiekun Marcina w portalu).
- **19 dyrektorów regionalnych** z pełnymi danymi -> `dane-dyrektorow-PKB.md` (w .gitignore, dane osobowe).
  Zasięg: 16 miast + PKB Niemcy + Fundacja ESPA. Portal NIE MA wyszukiwarki po dyrektorach.
- **NAJWAŻNIEJSZE ODKRYCIE**: profil firmy ma DWIE równoległe listy tych samych kategorii -
  "CO OFERUJE TWOJA FIRMA?" (podaż) i "JAKICH BRANŻ SZUKASZ?" (popyt) - plus blok
  **"Jakich firm szukasz?" z nazwą i NIP-em, do 10 firm**. To gotowy model matchingu wbudowany w portal,
  a NIP-y można od razu sprawdzić naszym serwerem MCP.
- Utworzony `.gitignore` chroniący dane osobowe i sekrety.

Decyzje techniczne rozpisane w **DECYZJA_TESTY_I_MAILE.md**:
- Testy: profil `prezes-test` + `memory.write_approval: true`; przekazanie prezesowi przez
  **Profile Distribution** (NIE klonowanie - kod kopiuje MEMORY.md mimo obietnicy w dokumentacji).
- Maile: wtyczka z hookiem `pre_tool_call` zwracająca `{"action":"approve"}` -> bramka zatwierdzenia
  -> w aplikacji przepływ `POST /v1/runs` -> SSE `approval.request` -> `POST /v1/runs/{id}/approval`.

### SKILL "brief-firmy" DZIAŁA - PRÓBA GENERALNA UDANA (2026-08-04)

Skill `infra/skill-brief-firmy/` wgrany do profilu prezes-test (SKILL.md + references/taksonomia-pkb.md + references/dyrektorzy.md). Serwer MCP firmy-pl dodany też do tego profilu.

Test na AVISTA OIL (firma Marcina). Agent na profilu prezes-test wygenerował PEŁNY brief:
- **Sam wyłapał, że podany NIP jest błędny**, znalazł firmę po nazwie, podał poprawny NIP i KRS.
- Twarde dane z rejestrów (KRS 0000866132, kapitał 1 mln, PKD, sprawozdania do 2025), zero czerwonych flag.
- 4 fakty z życia firmy Z LINKAMI (przetarg gminny, 16 nowych cystern 2025, przejęcie MAIN B.V., Transporeon).
- Ocena strony WWW + wskazanie luki (brak samodzielnej strony polskiej spółki = szansa dla firm z klubu).
- 7 zaczepek do rozmowy, każda oparta na fakcie.
- Kojarzenie w klubie po kategoriach (transport, automatyka, prawo/RODO, marketing) + wskazał WŁAŚCIWEGO
  dyrektora: Arkadiusz Kłusek PKB Wrocław, bo Strzegom = Dolny Śląsk.
- Argument za wstąpieniem do PKB szyty pod tę firmę.

To jest poziom "wow" dla prezesa. Model: gpt-5.6-terra (tani). Do oceny przez Pawła.

### APLIKACJA PKB DZIAŁA (2026-08-05) - ZMIANA KOLEJNOŚCI

Paweł zdecydował: NIE testujemy przez panel Hermesa, tylko od razu przez aplikację.
Aplikacja zbudowana i uruchomiona na serwerze, kod w `app/`.

- Next.js 15 + Tailwind 4, PWA, `output: standalone`, obraz Dockera bez roota.
- Paleta odtworzona ze zrzutów PKB: ciemne ciepłe tło #14100c, miedziany akcent #e8a33d, rozmyte okręgi w tle.
- `/api/chat` to proxy: przeglądarka NIGDY nie widzi klucza do Hermesa, aplikacja gada z agentem po sieci Dockera.
- Strumieniowanie SSE bez buforowania (nagłówek X-Accel-Buffering: no).
- **ZWERYFIKOWANE NA ŻYWO**: strona HTTP 200 z polskim interfejsem, `/api/chat` zwraca strumień
  token po tokenie ("Tak, dział..." w paczkach SSE od hermes-agent).
- Port 3100 tylko na 127.0.0.1. Publicznie wyjdzie przez Caddy z HTTPS.
- Pułapka rozwiązana: `@tailwindcss/postcss` i `tailwindcss` przypięte na sztywno do 4.0.0 wywalały build
  ("Missing field `negated` on ScannerOptions.sources") - trzeba zakresów `^4`, żeby rozwiązały się spójnie.

Repo GitHub: **https://github.com/8visionai-byte/Prezes-PKB** (dane osobowe i zrzuty wykluczone przez .gitignore).

### PANEL PKB + NAPRAWA LINKÓW (2026-08-05)

**Błąd z linkami był PO NASZEJ STRONIE, nie po stronie Hermesa.** Aplikacja renderowała
odpowiedź jako `whitespace-pre-wrap`, czyli goły tekst, więc markdown od agenta nie zamieniał się
w klikalne linki. Naprawione przez react-markdown + remark-gfm.
**Zweryfikowane w przeglądarce**: `link "kipg.pl" href="https://kipg.pl"` jako prawdziwy element `<a>`.

Design wg wzorca ze zrzutów portalu (pipeline: wzorzec -> budowa -> audyt impeccable):
- lewy sidebar 264 px z logo, kartą użytkownika (Radosław Rogiewicz, Prezes PKB) i grupami sekcji
- ogromne rozmyte sfery w tle, czyste gradienty CSS (zero obrazków, zero przesunięcia układu)
- paleta: tło #0c0908, złoto #e8b87a, miedź #b87d3f, serif w akcentach nagłówków
- szuflada na telefonie, focus-visible, obsługa prefers-reduced-motion
- **Logo to odwzorowanie ze zrzutu, NIE oryginał.** Do podmiany na oficjalny plik od klienta.

Ekrany: Rozmowa, Rozwój asystenta (realne dane z `GET /v1/skills`), Baza wiedzy, Briefy o firmach.
Wszystkie zwracają HTTP 200, API umiejętności zwraca prawdziwą listę skilli agenta.

**HTTPS przygotowany, czeka na DNS**: `infra/Caddyfile` + profil `publiczny` w compose.
`flush_interval -1` w Caddy, żeby streaming czatu nie był buforowany.
Ustalone: nameservery simplefast.ai to Hostinger (dns-parking.com), domena główna na 216.198.79.1
(Horizons), `prezes.simplefast.ai` nie istnieje. Dodanie subdomeny NIE ruszy głównej strony.

### DO ZROBIENIA
- **DNS: rekord A `prezes` -> 187.124.30.210** (Paweł w hPanel albo token API Hostingera dla mnie).
  Potem: `docker compose --profile publiczny up -d caddy` i HTTPS działa sam.
- Logowanie (3 konta testowe) - teraz aplikacja jest bez auth, dostępna tylko lokalnie.
- Panel bazy wiedzy (upload plików) + panel rozwoju asystenta (GET /v1/skills).
- Subdomena prezes.simplefast.ai + Caddy z HTTPS -> dopiero wtedy Paweł testuje z telefonu.
- Ocena briefu przez Pawła -> ewentualne poprawki skilla.
- Wtyczka zatwierdzania wysyłki maili + dedykowane konto pocztowe (od Pawła/Radka).
- Repo GitHub pod projekt (backup stanu agenta + Profile Distribution do przekazania prezesowi).
- Później: aplikacja PKB (VS Code + GSD) - gdy brief zaakceptowany.
- Uzupełniające zrzuty PKB (sekcja 4, Dashboard) - opcjonalne.
- Aplikacja PKB (VS Code + GSD, repo `app/`).
- SSH: wyłączenie logowania hasłem, fail2ban.
- Wtyczka Hermes Achievements - Paweł ODŁOŻYŁ na później (2026-08-04).
- Później: KRZ/MSiG (upadłości, komercyjne), KIPG (przez Radka), GUS REGON (darmowy klucz).
- Subdomena prezes.simplefast.ai + Caddy (faza 5 aplikacji).
| 14. /gsd-new-project w folderze app + fazy 1-6 | NIERUSZONE | po kroku 13 |

## Infrastruktura Pawła (stan 2026-08-03, ze zrzutów hPanel)

| Serwer | IP | Plan | Wygasa | Co na nim jest | Przeznaczenie |
|---|---|---|---|---|---|
| srv1670856.hstgr.cloud | 187.127.85.198 | KVM 2 | **2026-08-14 (11 dni!)** | PapiShop + Onyx (produkcja) | NIE RUSZAMY |
| srv1469630.hstgr.cloud | 187.124.30.210 | KVM 2, Frankfurt | 2027-03-07 | tylko OpenClaw (zatrzymany, nieużywany), dysk 10/100 GB, RAM 7% | **KANDYDAT POD PKB** |

- Wniosek: NIE trzeba kupować nowego VPS. srv1469630 jest praktycznie pusty i opłacony do marca 2027.
- 2026-08-03 16:27: Paweł zrobił snapshot srv1469630 (wygasa 2026-08-04!) i USUNĄŁ projekt openclaw-tuw7. Serwer czysty, Ubuntu 24.04.
- 2026-08-03: wygenerowany dedykowany klucz SSH `~/.ssh/pkb_vps` + alias hosta `pkb-vps`. **POŁĄCZENIE DZIAŁA** (zweryfikowane: hostname srv1469630, Ubuntu 24.04.4).
- WAŻNE dla przyszłych sesji: ssh.exe nie czyta ścieżek z "ł". Komenda wzorcowa:
  `ssh -F "C:/Users/PAWEPI~1/.ssh/config" pkb-vps "..."`

### Diagnostyka serwera 2026-08-03 (read-only, zweryfikowana na żywo)

- OpenClaw usunięty czysto: brak kontenerów, brak katalogów, brak wolumenów.
- POZOSTAŁOŚĆ: zatrzymany kontener `traefik-traefik-1` (Exited 8 tyg. temu), obraz traefik 242 MB, 2 wolumeny letsencrypt, katalog /docker/traefik. Do decyzji: usunąć (używamy Caddy) czy zostawić.
- Porty nasłuchujące: TYLKO SSH 22 + lokalny resolver DNS. Nic wystawionego.
- Zasoby: RAM 7.8 GB (używane 0.6), dysk 3.7/96 GB, 2 vCPU, uptime 94 dni.
- Docker 29.2.1, Docker Compose v5.0.2. Brak /root/.hermes = czysta instalacja.
- **Strefa czasowa Etc/UTC** - do zmiany na Europe/Warsaw (inaczej crony/briefy o złej godzinie).
- PILNE (poza projektem): srv1670856 z PapiShop/Onyx wygasa 2026-08-14 - Paweł musi odnowić.
- Przed instalacją: snapshot + diagnostyka read-only (co realnie działa na srv1469630), potem usunięcie OpenClaw.

## DECYZJE Pawła (2026-08-03)

- TELEGRAM WYPADA CAŁKOWICIE. Testy od pierwszego połączenia wyłącznie przez aplikację PKB ("oczami prezesa" - Paweł i Marcin wcielają się w prezesa testowego).
- Aplikacja PKB przesunięta z fazy 2 do głównego toru: budujemy ją od razu po postawieniu silnika.
- Kręgosłup realizacji: GSD (osobne repo app/, /gsd-new-project, roadmapa 6 faz wg PLAN_REALIZACJI_APLIKACJA_PKB.md sekcja 3).

## Nowe wytyczne Pawła (2026-08-02)

- Dostępu API do PKB może nie być. Plan B: Paweł zrobi ZRZUTY EKRANU portalu PKB -> budujemy z nich logikę/wiedzę agenta (struktury firm, ankiety, czego się spodziewać).
- Provider modeli: OPENROUTER (nie nexos.ai) - Paweł chce instrukcję logowania/konfiguracji krok po kroku.
- Filmiki YT do przejrzenia: Hqgs6Ap6l_s, Kkcn6aO1O7Q, v6qGsxS76ic.

## Kluczowe ustalenia (2026-08-01)

- Hipoteza Pawła WYKONALNA. Własna aplikacja czatu: oficjalny API server Hermesa (OpenAI-compatible, port 8642, Bearer, SSE) lub WebSocket JSON-RPC.
- Upload plików przez API NIE działa (tylko obrazki) -> panel bazy wiedzy przez własny backend piszący na dysk profilu.
- Obsidian niepotrzebny (brak integracji w oficjalnych dokach; baza wiedzy = pliki md).
- Dyrektorzy: PROFILE na jednym VPS (hermes profile create), profil per osoba (wspólna pamięć wewnątrz profilu!).
- KIPG zidentyfikowane: kipg.pl (Krajowy Instytut Prawa Gospodarczego), ma API bez publicznej dokumentacji -> dostęp przez Radka.
- Portal PKB bez publicznego API -> potrzebny eksport ankiet od Radka.
- Oficjalne doki: hermes-agent.nousresearch.com/docs (hermes-agent.ai = strona firm trzecich).

## Kontekst

- Cel: agent "asystent prezesa" dla prezesa Partnerskich Klubów Biznesu (Radek).
- Architektura wg Pawła: Hermes Agent na VPS Hostinger + WŁASNA aplikacja czatu (logo, kolory, à la GPT/WhatsApp) + panel bazy wiedzy + integracje: partnerskieklubybiznesu.pl (ankiety potrzeb członków) i aplikacja weryfikująca firmy ("KIPG" wg transkrypcji) + research internetowy → brief przed spotkaniem z firmą.
- Później: ograniczone dostępy dla dyrektorów (jeden silnik vs osobni Hermesi?).
- System ma być powielalny (produkt dla kolejnych klubów).
- Źródło wymagań: transkrypcja Sembly z 2026-07-31 (rozmowa Paweł + Marcin Karpeta).
