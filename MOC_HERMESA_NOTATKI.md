# Pełna moc Hermesa - notatki z 5 filmików + panel rozwoju agenta

Data: 2026-08-02. Analiza 5 filmików (pełne transkrypty: 4x kome.ai, 1x oficjalne napisy YouTube) + research panelu achievementów w oficjalnych źródłach. Werdykt ogólny: wszystkie filmiki to poziom podstawowy (żaden nie pokrywa API servera, profili per osoba ani pełnego hardeningu - nasza wiedza jest szersza), ale wyciągnąłem z nich sporo konkretnych patentów i cały katalog efektów WOW.

---

## 1. ZAGADKA ROZWIĄZANA: panel premiowania agenta = wtyczka "Hermes Achievements"

To, co widziałeś, to niemal na pewno **Hermes Achievements** (github.com/PCinkusz/hermes-achievements) - wtyczka do oficjalnego web dashboardu Hermesa (port 9119):

- **60+ kolekcjonerskich odznak** generowanych z PRAWDZIWEJ historii sesji agenta (użycie skilli, pamięci, crona, research webowy, debugowanie, sesje nocne...).
- Poziomy: **Copper -> Silver -> Gold -> Diamond -> Olympian**; stany Unlocked / Discovered / Secret; każda karta ma sekcję "What counts".
- Instalacja w 2 kroki na VPS: `git clone https://github.com/PCinkusz/hermes-achievements ~/.hermes/plugins/hermes-achievements`, potem rescan pluginów (albo restart `hermes dashboard`).
- Ma własne REST API (`/achievements`, `/recent-unlocks`, `/sessions/{id}/badges`) - czyli odznaki możemy potem wyświetlić w NASZEJ aplikacji dla Radka.

Sam oficjalny dashboard (bez wtyczki) nie ma gamifikacji, ale ma: **Analytics** (tokeny/koszty/sesje za 7/30/90 dni + wykresy), **Skills** (lista skilli + przycisk "Learn a skill"), Models, Cron, Sessions, Profiles (z licznikiem skilli per profil). Hermes Workspace (ten drugi panel) ma Kanban i cost ledger, ale odznak nie ma.

**Bonus z dokumentacji (nie z filmików): `hermes journey` / `hermes memory-graph --play` - animowana oś czasu uczenia się agenta.** Gotowy "ekran rozwoju" na demo.

Do naszej własnej aplikacji: `GET /v1/skills` i `GET /v1/toolsets` (port 8642) zwracają listę umiejętności agenta - zbudujemy z tego polski ekran "Twój asystent nauczył się dziś..." łączący skille + koszty + odznaki.

---

## 2. Katalog WOW dla Radka (zebrane ze wszystkich filmików, posortowane wg siły efektu)

1. **Agent pisze PIERWSZY - proaktywny poranny brief.** Cron ustawiony jednym zdaniem: "codziennie o 7:00 przygotuj podsumowanie i wyślij mi na Telegram". Prezes dostaje wartość zanim o cokolwiek poprosi. Wszystkie filmiki zgodnie: to robi największe wrażenie.
2. **Głosówki W OBIE STRONY.** Radek nagrywa głosówkę w aucie, agent transkrybuje, wykonuje i może ODPOWIEDZIEĆ głosem. KRYTYCZNE: domyślnie `stt.language='en'` - ustawić `pl`, inaczej polskie głosówki będą kaleczone. Darmowy TTS (edge) na start, ElevenLabs jak ma brzmieć premium.
3. **Widoczny rozwój agenta** (to, czego szukałeś): rosnąca lista skilli ("asystent nauczył się dziś nowej umiejętności"), odznaki z wtyczki Achievements, animowane `hermes journey`. Narracja sprzedażowa: "cyfrowy stażysta, który w dniu 30 jest mądrzejszy niż w dniu 1".
4. **Agent naprawia się sam.** W dwóch filmikach na żywo: padł gateway Telegrama, użytkownik napisał "nie dostaję odpowiedzi", agent sam zdiagnozował, zrestartował i potwierdził. Pierwsza linia supportu dla Radka = sam agent.
5. **Zdjęcie -> działanie.** Fotka wizytówki/faktury/notatki ze spotkania klubu wysłana botowi -> agent kategoryzuje i wpisuje do arkusza/CRM. Prezes zrozumie to w 10 sekund.
6. **SOUL.md - osobowość szyta pod prezesa.** Jednym promptem: "bądź dyskretnym, konkretnym asystentem zarządu". Tani, a bardzo odczuwalny efekt. Są też gotowe `/personality`.
7. **Skarbiec pomysłów.** Luźna myśl rzucona głosem -> agent odkłada do Notion/arkusza z kategorią. Zero zgubionych pomysłów prezesa.
8. **Przyciski uprawnień w Telegramie** (Allow once / Allow session / Always allow) przy wrażliwych akcjach - klient czuje kontrolę (lęk nr 1 klientów wg naszych notatek o SimpleFast) i wygląda to premium.
9. **Grupa Telegram z wątkami (Topics)** per obszar: "spotkania", "członkowie", "pomysły" - jeden agent wygląda jak zespół asystentów. Bot musi być dodany jako ADMIN grupy.
10. **Kanban / dashboard "centrum dowodzenia"** - zadania agenta fizycznie przesuwają się po tablicy; do pokazania na demo (kanban zweryfikować na żywej instalacji przed obiecaniem).
11. Wisienki na demo: diagramy Excalidraw z opisu słownego, agent robi krótkie WIDEO o sobie (skill HyperFrames), screenshot dowolnej strony na zawołanie, "codzienna pigułka wiedzy + quiz" cronem.

---

## 3. Nowe patenty techniczne do naszego wdrożenia (dedup z 5 filmików)

**Sekrety i backup:**
- `hermes config set NAZWA wartość` / `hermes config get` - oficjalna ścieżka podawania sekretów BEZ czatu (czat = klucz w historii sesji i u providera modelu). Uwaga: w Dockerze .env siedzi w kontenerze (/opt/data/.env), nie na roocie VPS.
- Backup całego stanu agenta do PRYWATNEGO repo GitHub + nocny cron sync: fine-grained PAT ograniczony do jednego repo (tylko contents read/write, z datą wygaśnięcia), agent sam robi .gitignore na sekrety. VPS padnie -> nowy Hermes wstaje z repo. Plus "wróć do wczorajszej wersji" jako rollback.
- Snapshot VPS w panelu Hostingera przed każdą większą zmianą.

**Crony (dla briefów Radka):**
- Kontener chodzi w UTC - sztywna godzina pęknie przy zmianie czasu. Wzorzec: cron częstszy + skrypt sam sprawdza czas Europe/Warsaw i działa raz dziennie.
- `context_from` przekazuje wynik jednego crona do następnego; `--no-agent --script` odpala czysty skrypt bez LLM (watchdogi za 0 tokenów); crony ograniczone czasowo ("przez 12h co 10 min, potem się usuń").
- Sesja crona nie może tworzyć kolejnych cronów - prompt musi być samowystarczalny.
- `model_override` per zadanie: tani model do rozmów, mocny tylko do konkretnego crona/zadania.

**Skille:**
- Workflow budowy: najpierw przejść flow ręcznie na czacie, poprawić zachowanie, dopiero potem "owiń to w skill". Ta sama instrukcja podana 2x = sygnał, że ma powstać skill.
- Gdy agent nie wywołuje skilla: kazać mu poprawić YAML front matter ("kiedy mówię X, używaj skilla Y").
- `hermes skills install <url>` robi najpierw security scan; `hermes skills browse/search`. Nieużywane skille wyłączać (każdy nagłówek je kontekst).

**Konfiguracja, o której nie wiedzieliśmy:**
- `hermes setup tools` (dokonfigurowanie narzędzi z czerwonym X), `hermes memory setup` (kreator providera pamięci), `hermes mcp add nazwa --url ... --auth oauth` (kontener na --network=host, więc OAuth callback działa).
- Parametry kreatora: max iterations (domyślnie 90, dla długich zadań 250+), tool progress mode "all", context compression threshold 0.8, session reset "inactivity + daily" (świeża sesja rano = niższe koszty). Kompakcja sesji ~136-170k tokenów; nieudana kompakcja wstawia fallback marker - nie panikować.
- Browser tool domyślnie NIE działa (brak Chrome) - przed demo prewencyjnie: "install agent browser".
- Wejście do kontenera: `cd /docker/hermes-agent-XXXX && docker compose exec -it hermes-agent /bin/bash`; hasło admina web-terminala w Docker Manager -> Environment (ADMIN_PASSWORD).
- Panel: zakładka Channels z ręcznym Configure - ratunek, gdy kreator wywali błąd przy tokenie Telegrama; panel Logs jako pierwsze miejsce debugowania; "stale MEMORY.md to przyczyna nr 1 dziwnych zachowań" - najpierw czyścić pamięć.
- Limity na kluczu OpenRouter mają też RESET dzienny/tygodniowy/miesięczny + datę wygaśnięcia klucza (mocniejsza siatka niż sam limit kwotowy).
- Higiena per agent: osobny e-mail dla agenta, osobny klucz per narzędzie (łatwa rotacja), start read-only i podnoszenie uprawnień jak nowemu pracownikowi. Nazwane klucze OpenRouter per agent = widać, kto ile wydaje.
- Onboarding agenta: pierwszy prompt "działasz w kontenerze Docker na VPS - sprawdź środowisko, wypisz narzędzia i skille", potem "zadaj mi pytania, żeby zrozumieć, czym się zajmuję" -> "zaproponuj automatyzacje". Idealne do sprofilowania pod Radka.
- Cron "agent audytuje sam siebie": co niedzielę przegląd VPS pod kątem nietypowej aktywności + raport bezpieczeństwa.
- Meta-patent dla nas (SimpleFast): osobny projekt Claude Code z folderem per wdrożenie klienta (IP, konfiguracja, notatki security) - Claude Code ratuje Hermesa, gdy ten padnie.

**Integracje:**
- Composio jako jedna brama do setek narzędzi (Gmail, Kalendarz, Notion, Todoist; ~20k tool calls/mies. za darmo) - ale UWAGA: w oficjalnej dokumentacji Hermesa nie ma o nim ani słowa (podpina się instrukcją od OpenClaw). Może się psuć przy aktualizacjach. Oficjalna ścieżka = serwery MCP. Werdykt: do szybkiego demo OK, do produkcji u Radka - MCP.

---

## 4. Co odrzucamy / prostujemy

- **OpenAI Codex OAuth (subskrypcja ChatGPT jako silnik)** - pokazywany w 4 z 5 filmików jako "najtańsza opcja". Działa i jest w docs, ale dla komercyjnego wdrożenia u klienta to szara strefa ToS i pojedynczy punkt awarii (limity planu w godzinach szczytu - autor jednego filmu 2x wpadł na limit W TRAKCIE nagrania). Zostajemy przy OpenRouter.
- Omijanie CAPTCHA przez Browserbase (film Tech With Tim) - NIE wdrażamy, ryzyko prawne/ToS.
- Liczby marketingowe ("pokonał Claude Code 14:4", "190-224 tys. gwiazdek", liczby skilli) - zmienne i niezweryfikowane, nie powtarzać Radkowi jako faktów.
- Nazwy modeli z filmików - artefakty automatycznych napisów (ASR), brać wyłącznie z OpenRoutera.
- Kredyty scrapingowe z checkoutu Hostingera mogą zamknąć temat web search na start, ale to rozwiązanie do wyczerpania kredytów - docelowo SearXNG (bez limitu, prywatnie).

---

## 5. Werdykt per film

| Film | Ocena | Najcenniejsze |
|---|---|---|
| Mikołaj Abramczuk "O co tyle szumu?" (22.06, 42 min) | dobry poziom podstawowy PL | Composio, Telegram Topics jako multi-wątki, workflow budowy skilla, checklista bezpieczeństwa VPS (Google Doc w opisie) |
| Nate Herk "Zero to Personal AI Assistant" (09.05, 58 min, 331 tys. wyśw.) | najlepszy z tej piątki | backup GitHub + rollback, crony pro (context_from, --no-agent), hermes config set, głosówki 2-stronne, samonaprawa gatewaya, drzewo decyzyjne multi-agent |
| Robert Szewczyk "Bez programowania" (11.06, 38 min) | solidny, ~70% pokrycia z tym co mamy | proaktywny nieproszony brief (otwierająca scena), obejście strefy czasowej w cronie, ręczne Configure w Channels, repo vps-security |
| Metics Media PL "Kompletny przewodnik" (29.04, 40 min) | podstawowy, ale konkretny | hermes setup tools / memory setup / mcp add, model_override, security scan skilli, PDF-ściągawka z komendami (link w opisie filmu), pułapka: domyślny model kreatora = najdroższy Opus |
| Tech With Tim "Full Course" (05.06, 59 min, 92 tys. wyśw.) | dobry, bezpieczeństwo-first | fine-grained PAT, least privilege per agent, "install agent browser", parametry kreatora (iterations/compression/reset), agent audytuje sam siebie |

Żaden filmik nie pokrywa: API servera :8642 (nasza własna aplikacja), profili per osoba, delegate_task, zewnętrznych backendów web search, pełnego hardeningu. To potwierdza plan: filmiki = faza 1, nasza dokumentacja = fazy 2-3.

---

## NIEZWERYFIKOWANE

- Treść filmików znam z transkryptów (ASR lub oficjalnych napisów), bez obrazu - szczegóły wizualne paneli z narracji autorów.
- Wtyczka hermes-achievements: nie testowana na żywo; kompatybilność z dashboardem w kontenerze Dockera do potwierdzenia na naszym VPS; screenshoty w README to dane demo.
- Kanban w panelu: pokazany w filmikach, słabo udokumentowany oficjalnie - zweryfikować na własnej instalacji zanim obiecamy Radkowi.
- `hermes journey` / `memory-graph --play`: z dokumentacji, nie testowane.
- Darmowe kredyty scrapingowe w checkoutcie Hostingera - do potwierdzenia przy zakupie.
- STT po polsku (stt.language: pl) - do przetestowania z prawdziwą głosówką przed demo u Radka.
