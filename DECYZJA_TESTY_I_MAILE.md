# Dwie decyzje: jak testować i jak wysyłać maile

Data: 2026-08-04. Research: dokumentacja Hermesa + kod gałęzi main na GitHubie.

---

# 1. Testy u nas vs oddanie prezesowi - REKOMENDACJA

**Nie musisz wybierać. Testujemy u siebie, prezes dostaje czysty profil.**
Ale NIE przez klonowanie, tylko przez mechanizm **Profile Distribution**.

## Dlaczego nie klonowanie

`hermes profile create prezes --clone-from pkb-test` wygląda na oczywiste rozwiązanie i dokumentacja
obiecuje "fresh sessions and memory". **Kod w gałęzi main mówi co innego**: jawnie kopiuje
`memories/MEMORY.md` i `memories/USER.md` (stała `_CLONE_SUBDIR_FILES`, komentarz w kodzie:
"Memory files are part of the agent's curated identity"). Czyli nasza pamięć z testów PRZESZŁABY do prezesa.

To samo dotyczy `hermes profile export/import` - archiwum zawiera memories/, sessions/ i state.db.
**Nie używać do przekazania agenta klientowi.**

## Właściwa droga: Profile Distribution

Pakujemy profil jako repozytorium git i instalujemy u prezesa komendą `hermes profile install`.
Instalator **twardo nie kopiuje**: `auth.json`, `.env`, `memories/`, `sessions/`, `state.db*`,
`logs/`, `workspace/`, `plans/`, `home/`, `*_cache/`, `local/`.
Dokumentacja nazywa to niezmiennikiem pokrytym testami regresji - nie da się tego nadpisać opcją.

Co JEST przenoszone: `distribution.yaml`, `SOUL.md` (osobowość), `config.yaml`, `skills/`, `cron/`, `mcp.json`.
Czyli dokładnie to, co chcemy: cała wypracowana konfiguracja i umiejętności, zero naszych rozmów i wspomnień.

**Krytyczne:** `.gitignore` trzeba stworzyć PRZED `git init` i `git add`, inaczej wypchniemy `.env` i pamięć.

## Plan operacyjny

1. Testujemy w profilu `prezes-test` (już istnieje), nigdy w `default`.
2. Na czas testów w `config.yaml` profilu ustawiamy `memory.write_approval: true`.
   Wtedy agent pyta o zgodę przed każdym zapisem do pamięci - widzimy, co chce zapamiętać.
   Podgląd: `/memory pending`, `/memory approve <id>`, `/memory reject <id>`. Zapisy automatyczne
   (z tła) są oznaczone `[auto]`.
3. Gdy agent jest gotowy: `.gitignore` -> `distribution.yaml` -> `git init` -> push -> u prezesa `hermes profile install`.
4. Weryfikacja po instalacji: zajrzeć do `memories/MEMORY.md` i `USER.md` w profilu prezesa - mają być puste.

## Gdyby jednak trzeba było sprzątać ręcznie

Sama pamięć:
- `hermes -p <profil> memory reset --target all --yes` (kasuje MEMORY.md i USER.md)
- pojedynczy wpis: `hermes journey list` -> `hermes journey delete memory:MEMORY:3 -y`
- to samo w panelu: System -> Memory -> reset

**Historia rozmów to OSOBNA sprawa i reset pamięci jej nie tyka.** Agent ma narzędzie `session_search`
i potrafi wyciągnąć rozmowę sprzed tygodni z bazy SQLite:
- `hermes sessions prune --newer-than 5h --dry-run` (najpierw podgląd), potem `--yes`
- pułapka: `prune` pomija sesje aktywne i zarchiwizowane - trzeba dodać `--include-archived`
- `hermes sessions archive` tylko ukrywa, dane i wyszukiwanie zostają - to NIE jest czyszczenie

Skille wypracowane w testach: `~/.hermes/profiles/<profil>/skills/`. Cron: `cron/jobs.json`.

## Ważne o izolacji profili

Profile izolują DANE (osobne katalogi, pamięć, sesje, skille, klucze), ale **nie są sandboxem**.
Na backendzie `local` agent ma dostęp do dysku jak konto systemowe, więc profil prezesa technicznie
może odczytać pliki profilu testowego. Przy naszym wdrożeniu to nie problem (jeden klient, jeden serwer),
ale gdyby kiedyś dwóch klientów na jednej maszynie - potrzebny osobny użytkownik systemowy albo osobny VPS.

---

# 2. Wysyłka maili z zatwierdzeniem - JAK TO ZBUDOWAĆ

Scenariusz: prezes mówi "wyślij maila do dyrektora X", agent pokazuje draft, prezes klika "wyślij".

## Przepływ techniczny (wszystko potwierdzone w kodzie)

Nasza aplikacja PKB rozmawia z Hermesem przez API server. Sekwencja:

1. `POST /v1/runs` z treścią prezesa -> zwraca `run_id`
2. Aplikacja słucha `GET /v1/runs/{run_id}/events` (strumień SSE)
3. Agent przygotowuje draft i próbuje wysłać mail -> wtyczka przechwytuje wywołanie
4. Do SSE leci `{"event": "approval.request", "choices": ["once","session","always","deny"], ...}`,
   status runu zmienia się na `waiting_for_approval`
5. Aplikacja pokazuje prezesowi draft i przyciski (renderować DOKŁADNIE te choices, które przyszły -
   lista bywa krótsza, np. tylko `["once","deny"]`)
6. Prezes klika -> `POST /v1/runs/{run_id}/approval` z `{"choice": "once"}`
7. Do SSE leci `approval.responded`, status wraca na `running`, mail wychodzi

## Skąd bierze się bramka zatwierdzenia

Wbudowany system approvals w Hermesie dotyczy **wyłącznie niebezpiecznych komend powłoki** -
dopasowuje się do tekstu komendy, nie do nazw narzędzi. Nie ma w config.yaml opcji
"narzędzie X wymaga zgody".

Ale jest oficjalny mechanizm: **wtyczka z hookiem `pre_tool_call`**, która zwraca
`{"action": "approve", "message": "...", "rule_key": "send_message:email"}`.
Wtedy Hermes eskaluje do **tej samej ludzkiej bramki**, której używają niebezpieczne komendy.
Docstring w kodzie mówi wprost: *"The LLM cannot skip or bypass this - the tool call is intercepted
before execution"*.

Właściwości istotne produkcyjnie:
- **fail-closed**: brak człowieka = blokada, błąd bramki = blokada, timeout = odmowa
- w cronie honoruje `approvals.cron_mode` (domyślnie `deny`) - czyli zaplanowane zadanie samo maila nie wyśle
- `rule_key` steruje ziarnistością "always" - zgoda na jedną regułę nie otwiera innej

Haczyk: wtyczki są domyślnie wyłączone, trzeba `~/.hermes/plugins/<nazwa>/` z `plugin.yaml`
i `__init__.py` z `register(ctx)`, potem `hermes plugins enable <nazwa>`.
Drugi haczyk: dokumentacja hooków opisuje tylko `{"action": "block"}`. Akcja `approve` jest
zaimplementowana i otestowana (`tests/tools/test_request_tool_approval.py`, jeden test używa
wprost przykładu "smtp send"), ale **nieudokumentowana** - budujemy na kodzie, nie na obietnicy.

## Czym wysyłać maile

Narzędzie `send_message` (wbudowane, `tools/send_message_tool.py`) obsługuje platformę email:
`send_message(target="email:adres@firma.pl", message="...")`. Też nieudokumentowane, istnieje w kodzie.

Konfiguracja SMTP w `.env` profilu (Gmail z hasłem aplikacji):
```
EMAIL_ADDRESS, EMAIL_PASSWORD (16-znakowe hasło aplikacji), EMAIL_IMAP_HOST=imap.gmail.com,
EMAIL_SMTP_HOST=smtp.gmail.com, EMAIL_ALLOWED_USERS, EMAIL_HOME_ADDRESS
```
Porty domyślne: IMAP 993, SMTP 587.

**Konieczne: dedykowane konto pocztowe, nie prywatne Radka.** Agent ma pełny dostęp do skrzynki,
a hasło leży w pliku `.env` na serwerze. Hasło ustawia Paweł sam, nie przechodzi przez czat ani repo.

## NIEZWERYFIKOWANE
- Żadna z komend nie była uruchomiona na naszym serwerze - to research z dokumentacji i kodu.
- Rozbieżność dokumentacja/kod przy `--clone-from` trzeba sprawdzić empirycznie na naszej wersji.
- Nie ustalono, czy `hermes memory reset` czyści dane zewnętrznych dostawców pamięci (my ich nie używamy).
- Nie potwierdzono, czy `sessions prune` czyści też indeks pełnotekstowy FTS5.
