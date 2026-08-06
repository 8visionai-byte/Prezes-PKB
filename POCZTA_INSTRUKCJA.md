# Poczta w aplikacji PKB: co robię ja, a co musisz zrobić Ty

Data: 2026-08-06

## Jak to działa (w dwóch zdaniach)

Asystent nigdy nie wysyła maila sam. Pisze wersję roboczą, ta pojawia się w zakładce
**Poczta**, Ty ją czytasz, poprawiasz i klikasz **Wyślij**. Dopiero wtedy mail wychodzi
z Twojej skrzynki Gmail.

## Skrzynka prezesa czy osobna skrzynka asystenta: moja rekomendacja

**Skrzynka prezesa.** Powody:

1. Odbiorca widzi prawdziwy adres Radka i odpowiada do niego. Mail o klubie biznesowym
   z adresu `asystent@cośtam` wygląda jak wysyłka masowa i ląduje w spamie albo w koszu.
2. Odpowiedzi wracają tam, gdzie mają wracać, czyli do skrzynki prezesa. Przy osobnym
   adresie trzeba by budować drugi mechanizm przekazywania odpowiedzi.
3. Prosimy Google tylko o **jedno** uprawnienie: `gmail.send`. Sprawdziłem w dokumentacji
   Google: to zakres **wrażliwy**, a nie **zastrzeżony**, i pozwala WYŁĄCZNIE wysyłać.
   Asystent nie może odczytać ani jednej wiadomości ze skrzynki prezesa, nie widzi
   wątków, nie widzi załączników, nic nie kasuje. To ważny argument w rozmowie z Radkiem.

Jedna niedogodność, o której musisz wiedzieć od razu (to fakt z dokumentacji Google,
nie moje przypuszczenie): dopóki aplikacja Google jest w trybie **Testing**, połączenie
ze skrzynką wygasa **po 7 dniach** i trzeba je odnowić jednym kliknięciem.

Na stałe da się to załatwić na dwa sposoby:

- jeśli PKB (albo SimpleFast) ma **Google Workspace** na własnej domenie, ustawiamy typ
  aplikacji na **Internal**: żadnej weryfikacji, żadnych 7 dni, koniec tematu;
- jeśli nie, zgłaszamy aplikację do weryfikacji Google (formularz plus krótkie wideo,
  bezpłatne, zwykle kilka dni do kilku tygodni).

Na czas testów tryb Testing w zupełności wystarczy.

---

## Zanim zaczniesz

Zaloguj się w Google na to konto, którego chcesz używać do testów (Paweł używa swojego
konta „testy AI"). Wszystko poniżej robisz zalogowany na TYM koncie.

UWAGA: Google przebudowało konsolę. Nie ma już jednej strony „OAuth consent screen".
Jest **Google Auth Platform** z czterema zakładkami: Branding, Audience, Clients, Data Access.
Stare poradniki z internetu będą się nie zgadzać.

## Krok 1: przełącz się na właściwy projekt

To najczęstszy błąd: projekt jest utworzony, ale na górze konsoli nadal wybrany jest stary.
Wtedy wszystko poniżej ląduje w niewłaściwym projekcie.

1. Wejdź na https://console.cloud.google.com
2. Kliknij nazwę projektu na górnej belce (obok napisu „Google Cloud").
3. Wybierz **PKB Asystent Prezesa**.
4. Sprawdź, że na belce widnieje właśnie ta nazwa. Dopiero teraz idź dalej.

## Krok 2: włącz Gmail API

1. Wejdź na https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Upewnij się, że u góry jest projekt **PKB Asystent Prezesa**.
3. Kliknij **Włącz** (Enable). Chwilę to trwa.

## Krok 3: ekran zgody (Google Auth Platform)

1. Wejdź na https://console.cloud.google.com/auth/overview
2. Jeśli zobaczysz „Google Auth platform not configured yet", kliknij **Rozpocznij**
   (Get Started). Kreator ma cztery ekrany:
   - **App Information**: nazwa aplikacji `Asystent Prezesa PKB`,
     „User support email" to Twój testowy adres. Dalej.
   - **Audience**: wybierz **Zewnętrzny** (External). Dalej.
   - **Contact Information**: Twój testowy adres. Dalej.
   - **Finish**: zaznacz zgodę na zasady Google, **Kontynuuj**, potem **Utwórz**.

## Krok 4: dopisz siebie jako użytkownika testowego

Bez tego Google w ogóle nie wpuści Cię na ekran zgody.

1. Wejdź na https://console.cloud.google.com/auth/audience
2. Status publikacji zostaw na **Testing**.
3. W sekcji **Użytkownicy testowi** kliknij **Dodaj użytkowników**.
4. Wpisz swój testowy adres Gmail. Zapisz.

## Krok 5: dodaj jedno uprawnienie

1. Wejdź na https://console.cloud.google.com/auth/scopes
2. Kliknij **Dodaj lub usuń zakresy** (Add or remove scopes).
3. Na dole okna jest pole „Dodaj zakresy ręcznie". Wklej dokładnie to:

   ```
   https://www.googleapis.com/auth/gmail.send
   ```

4. Kliknij **Dodaj do tabeli**, potem **Aktualizuj**, na końcu **Zapisz**.
5. Sprawdź, że na liście jest DOKŁADNIE jeden zakres Gmaila. Jeśli wpadło coś więcej
   (np. `gmail.readonly`), usuń to. Mniej uprawnień = łatwiejsza zgoda i mniejsze ryzyko.

## Krok 6: utwórz klienta OAuth

1. Wejdź na https://console.cloud.google.com/auth/clients
2. Kliknij **Utwórz klienta** (Create client).
3. **Typ aplikacji**: **Aplikacja internetowa** (Web application).
4. **Nazwa**: `Aplikacja PKB`.
5. W sekcji **Autoryzowane identyfikatory URI przekierowania** kliknij **Dodaj URI**
   i wklej dokładnie to, ze slashem i bez spacji na końcu:

   ```
   https://prezes.simplefast.ai/api/poczta/oauth
   ```

   Ten adres musi się zgadzać co do znaku z tym, co ma aplikacja. Jedna literówka
   i Google odrzuci logowanie komunikatem `redirect_uri_mismatch`.
6. Kliknij **Utwórz**. Google pokaże **Identyfikator klienta** i **Tajny klucz klienta**.
   Skopiuj oba. Gdyby okienko zniknęło, wejdź w utworzonego klienta na liście,
   wartości tam są, można je też pobrać jako plik JSON.

## Krok 7: wpisz je na serwerze (robisz Ty, sekrety nie idą przez czat)

Otwórz terminal i wklej. Podmień `TU_WKLEJ_...` na wartości z kroku 6.
Zwróć uwagę na apostrofy, one chronią znaki specjalne.

```bash
ssh -F "C:/Users/PAWEPI~1/.ssh/config" pkb-vps
```

Potem, już na serwerze:

```bash
cat >> /root/pkb-stack/.env <<'KONIEC'
GOOGLE_CLIENT_ID=TU_WKLEJ_CLIENT_ID
GOOGLE_CLIENT_SECRET=TU_WKLEJ_CLIENT_SECRET
POCZTA_REDIRECT_URL=https://prezes.simplefast.ai/api/poczta/oauth
KONIEC
chmod 600 /root/pkb-stack/.env
cd /root/pkb-stack && docker compose up -d app
```

Uwaga na jedną pułapkę: jeśli w sekrecie znajdzie się znak `$`, w pliku `.env`
trzeba go podwoić (`$$`). Docker Compose inaczej potraktuje go jako zmienną
i sekret dojdzie obcięty. Nam to już raz zepsuło hasło do panelu.

## Krok 8: podłącz skrzynkę (klikasz Ty, w aplikacji)

1. Wejdź na https://prezes.simplefast.ai/poczta
2. Kliknij **Podłącz skrzynkę Google**.
3. Google pokaże ostrzeżenie „Google nie zweryfikowało tej aplikacji". To normalne
   w trybie Testing. Kliknij **Zaawansowane** → **Przejdź do Asystent Prezesa PKB**.
4. Zgódź się na jedno uprawnienie: wysyłanie wiadomości.
5. Wrócisz do aplikacji, na górze zobaczysz zielony haczyk i swój adres.

## Krok 9: test od początku do końca (robisz Ty)

1. W czacie napisz: `napisz maila do jan.kowalski@example.com z podziękowaniem za spotkanie`
2. Asystent odpowie, że wersja robocza czeka w zakładce Poczta.
3. Wejdź w **Poczta**, przeczytaj, popraw treść jeśli chcesz.
4. Kliknij **Wyślij**, potwierdź w okienku.
5. Sprawdź, czy mail doszedł.

---

## Czego asystent NIE może

- Nie może wysłać maila sam. Nie ma do tego narzędzia, ma tylko zapis wersji roboczej.
- Nie może czytać Twojej skrzynki. Uprawnienie `gmail.send` na to nie pozwala.
- Nie może zmienić adresata po Twojej akceptacji. Wysyłamy dokładnie to, co widziałeś.
- Nie wymyśla adresów. Gdy nie zna adresu, zostawia puste pole i pisze o tym wprost.

## Gdzie co leży

| Element | Miejsce |
|---|---|
| Wersje robocze | `/root/hermes-data/profiles/prezes-test/workspace/aplikacja/drafty/` |
| Połączenie ze skrzynką | `.../aplikacja/poczta.json`, chmod 600 |
| Kod wysyłki | [app/src/lib/poczta.ts](app/src/lib/poczta.ts) |
| Jedyny punkt wysyłki | [app/src/app/api/poczta/wyslij/route.ts](app/src/app/api/poczta/wyslij/route.ts) |
| Umiejętność agenta | [infra/skill-poczta/SKILL.md](infra/skill-poczta/SKILL.md) |

## Gdy coś nie zagra

| Komunikat | Co jest nie tak |
|---|---|
| `redirect_uri_mismatch` | Adres w kroku 6 nie zgadza się co do znaku z tym w `.env`. Porównaj oba. |
| `access_blocked` albo „nie ukończono procesu weryfikacji" | Nie dodałeś swojego adresu jako użytkownika testowego (krok 4). |
| „Google nie zweryfikowało tej aplikacji" | To normalne w trybie Testing. Zaawansowane → Przejdź do... |
| „Google nie odesłało tokenu odświeżającego" | Konto ma już zgodę dla tej aplikacji. Wejdź na https://myaccount.google.com/permissions, usuń „Asystent Prezesa PKB" i podłącz jeszcze raz. |
| „Połączenie ze skrzynką wygasło" | Minęło 7 dni w trybie Testing. Kliknij Podłącz jeszcze raz. |
| „Poczta czeka na konfigurację" | Zmienne z kroku 7 nie doszły do kontenera. Sprawdź `.env` i zrób `docker compose up -d app`. |

Źródła, na których oparłem decyzje (sprawdzone 2026-08-06, nie z pamięci):
- [Choose Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) - klasyfikacja `gmail.send` jako zakresu wrażliwego
- [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2) - 7 dni w trybie Testing
- [Configure the OAuth consent screen](https://developers.google.com/workspace/guides/configure-oauth-consent) - nowy układ Google Auth Platform
- [Create access credentials](https://developers.google.com/workspace/guides/create-credentials) - tworzenie klienta typu Aplikacja internetowa
