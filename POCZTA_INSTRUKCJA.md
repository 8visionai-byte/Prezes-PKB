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

## Krok 1: załóż testową skrzynkę Gmail (robisz Ty)

Nie mogę zakładać kont za Ciebie, to musisz kliknąć sam.

1. Wejdź na https://accounts.google.com/signup
2. Załóż konto, np. `prezes.pkb.test@gmail.com` (nazwa dowolna, byle rozpoznawalna).
3. Włącz na nim weryfikację dwuetapową. Bez tego niektóre ustawienia są zablokowane.
4. Zapisz login i hasło w swoim menedżerze haseł. Do mnie nie wysyłaj.

## Krok 2: aplikacja Google (robisz Ty, ja mówię co klikać)

Wszystko na https://console.cloud.google.com, zalogowany na TĘ testową skrzynkę.

1. **Nowy projekt**: góra strony, lista projektów, „Nowy projekt". Nazwa: `Asystent PKB`.
2. **Włącz Gmail API**: menu boczne → „Interfejsy API i usługi" → „Biblioteka" →
   wyszukaj `Gmail API` → „Włącz".
3. **Ekran zgody** („OAuth consent screen"):
   - typ użytkownika: **Zewnętrzny** (External)
   - nazwa aplikacji: `Asystent Prezesa PKB`
   - e-mail pomocniczy i kontaktowy: Twój testowy adres
   - **Zakresy**: dodaj dokładnie jeden: `https://www.googleapis.com/auth/gmail.send`
   - **Użytkownicy testowi**: dodaj testowy adres z kroku 1 (i mój, jeśli mam testować)
   - zapisz, status zostaw na **Testing**
4. **Dane logowania** („Credentials") → „Utwórz dane logowania" → **Identyfikator klienta OAuth**:
   - typ aplikacji: **Aplikacja internetowa**
   - nazwa: `Aplikacja PKB`
   - **Autoryzowane identyfikatory URI przekierowania**, wklej dokładnie to:

     ```
     https://prezes.simplefast.ai/api/poczta/oauth
     ```

   - „Utwórz". Google pokaże **Client ID** i **Client Secret**. Skopiuj oba.

## Krok 3: wpisz je na serwerze (robisz Ty, sekrety nie idą przez czat)

Otwórz terminal i wklej. Podmień `TU_WKLEJ_...` na wartości z kroku 2.
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

## Krok 4: podłącz skrzynkę (klikasz Ty, w aplikacji)

1. Wejdź na https://prezes.simplefast.ai/poczta
2. Kliknij **Podłącz skrzynkę Google**.
3. Google pokaże ostrzeżenie „Google nie zweryfikowało tej aplikacji". To normalne
   w trybie Testing. Kliknij **Zaawansowane** → **Przejdź do Asystent Prezesa PKB**.
4. Zgódź się na jedno uprawnienie: wysyłanie wiadomości.
5. Wrócisz do aplikacji, na górze zobaczysz zielony haczyk i swój adres.

## Krok 5: test od początku do końca (robisz Ty)

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

Źródła, na których oparłem decyzję o zakresie uprawnień:
- [Choose Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2)
