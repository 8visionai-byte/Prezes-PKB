# Panel Hermesa - jak wejść i co tam zrobisz

Panel działa na serwerze, ale celowo **nie jest wystawiony do internetu** (to byłby ten sam błąd, przez który w 2026 przejęto tysiące instancji OpenClaw). Wchodzi się przez bezpieczny tunel.

## Wejście w 2 krokach

**1. Otwórz tunel** — wklej w PowerShell i zostaw to okno otwarte:

```bash
ssh -F "C:/Users/PAWEPI~1/.ssh/config" -L 9119:127.0.0.1:9119 pkb-vps
```

**2. Otwórz w przeglądarce:** http://localhost:9119

Login: `pkb`
Hasło: w pliku na Twoim komputerze **`C:\Users\Paweł Pieloch\hermes-panel-haslo.txt`** (otwórz Notatnikiem).

Na serwerze leży też w `/root/hermes-dashboard-haslo.txt` (tylko root). Zapisz je w menedżerze haseł.

### Historia usterki (żeby się nie powtórzyła)

Pierwsze hasło nie działało: skrót (hash) policzyłem komendą z zagnieżdżonymi cudzysłowami przez kilka warstw powłoki i zapisał się skrót INNEGO ciągu znaków niż hasło w pliku. Naprawione: skrót liczony z hasła podanego przez zmienną środowiskową (zero cudzysłowów).
Zweryfikowane realnym logowaniem HTTP: `POST /auth/password-login` z ciałem `{"provider":"basic","username":"pkb","password":"..."}` zwraca `{"ok":true}`, a strona główna panelu z ciasteczkiem sesji zwraca HTTP 200. Test powtórzony PO restarcie kontenera.
Dodatkowo ustawiony `dashboard.basic_auth.secret`, żeby sesje przeżywały restart (bez niego Hermes losuje sekret przy każdym starcie i wylogowuje).

## Co możesz w panelu robić sam

- **Chat** - rozmowa z agentem prosto z przeglądarki
- **Sessions** - historia rozmów, wznawianie starych wątków
- **Skills** - lista umiejętności agenta + przycisk "Learn a skill" (agent tworzy nową umiejętność z Twojego opisu)
- **Models** - podgląd i zmiana modelu głównego oraz modeli pomocniczych
- **Analytics** - zużycie tokenów i koszty za 7/30/90 dni, rozbicie per model
- **Cron** - zaplanowane zadania (np. poranny brief)
- **Config** - ustawienia agenta
- **Profiles** - przełączanie między profilami (default / prezes-test / research)
- **MCP** - podłączone narzędzia zewnętrzne

## Uwaga o zmianach w panelu

Panel zapisuje do tych samych plików, na których pracuję ja przez SSH. Jeśli coś tam zmienisz, powiedz mi - inaczej mogę nadpisać Twoją zmianę przy następnej konfiguracji. Odwrotnie też: po moich zmianach odśwież panel.

## Porty (dla orientacji)

| Port | Co to | Dostępność |
|---|---|---|
| 8642 | API serwera dla aplikacji PKB (profil default) | tylko localhost |
| 8643 | API profilu prezes-test | tylko localhost |
| 9119 | panel webowy | tylko localhost (tunel SSH) |
| 22 | SSH | publicznie (klucz, bez hasła) |
| 80/443 | pod przyszłą aplikację PKB z HTTPS | otwarte, jeszcze nieużywane |
