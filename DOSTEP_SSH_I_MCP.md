# Dostępy: SSH do VPS + ewentualnie Hostinger MCP

Data: 2026-08-03. Serwer projektu: **srv1469630.hstgr.cloud, IP 187.124.30.210**, KVM 2, Ubuntu 24.04, Frankfurt, opłacony do 2027-03-07. Stan: czysty (OpenClaw usunięty 2026-08-03 16:27, snapshot zrobiony).

---

## 1. SSH - kanał główny (zrobione po stronie Twojego komputera)

Wygenerowany został dedykowany klucz TYLKO do tego serwera:
- klucz prywatny: `C:\Users\Paweł Pieloch\.ssh\pkb_vps` (nigdy nikomu nie wysyłaj, nie wklejaj do czatu)
- klucz publiczny: `C:\Users\Paweł Pieloch\.ssh\pkb_vps.pub` (ten można pokazywać)
- skrót połączenia zapisany w `C:\Users\Paweł Pieloch\.ssh\config` jako host `pkb-vps`

Klucz publiczny do wklejenia w hPanel:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINZPQHq4DE6AowoOBQsbv7Nh9lyGAmFKCuII+jOFapDm claude-code-pkb-vps
```

### Co robi Paweł (2 minuty)

1. hPanel -> VPS -> srv1469630 -> **Settings -> SSH keys** (albo Security -> SSH keys) -> **Add SSH key**.
2. Wklej powyższy klucz publiczny, nazwij go np. `claude-code-pkb`, zapisz.
3. Napisz mi "klucz dodany" - ja sprawdzę połączenie komendą `ssh pkb-vps "hostname"`.

Gdyby w panelu nie było sekcji SSH keys, alternatywa: podaj mi, że mam wgrać klucz przez hasło root - wtedy wpiszesz hasło sam raz w terminalu, a ja podam gotową komendę.

### Bezpieczeństwo tego rozwiązania
- Klucz jest bez hasła, żeby dało się nim pracować automatycznie. Ryzyko: kto ma dostęp do Twojego komputera, ma root na tym VPS.
- Ograniczenie szkody: klucz działa TYLKO na tym jednym serwerze (nie na PapiShop/Onyx).
- Odcięcie dostępu w każdej chwili: usuń klucz w hPanel albo skasuj linię z `/root/.ssh/authorized_keys` na serwerze.
- Po instalacji dorobimy: logowanie hasłem wyłączone, fail2ban, ufw, automatyczne aktualizacje bezpieczeństwa.

---

## 1a. PUŁAPKA TEJ MASZYNY (rozwiązana)

`ssh.exe` na Windows nie radzi sobie z literą "ł" w ścieżce `C:\Users\Paweł Pieloch` - zwraca błąd
`Could not create directory '/c/Users/Pawe\263 Pieloch/.ssh'` i NIE czyta ani klucza, ani pliku config.
Obejście: używamy krótkiej nazwy folderu `C:/Users/PAWEPI~1/`. Wpisane na stałe do `~/.ssh/config`.
Wzorzec komendy dla przyszłych sesji:

```
export HOME=/c/Users/PAWEPI~1; ssh pkb-vps "komenda"
```

## 1b. Żeby KAŻDA sesja Claude Code wiedziała o dostępie

Zrobione automatycznie:
- `CLAUDE.md` w folderze projektu (adres serwera, wzorzec komendy, twarde zasady) - czytany przy każdej sesji w tym drzewie katalogów.
- Pamięć długoterminowa: `reference_hostinger_vps.md` + wpis w MEMORY.md - ładowana w każdej sesji, niezależnie od folderu.

Do zrobienia RĘCZNIE przez Pawła (klasyfikator bezpieczeństwa nie pozwala agentowi edytować własnych uprawnień):
otwórz `C:\Users\Paweł Pieloch\.claude\settings.json` i wklej ten blok tuż przed linią `"effortLevel": "xhigh",`

```json
  "permissions": {
    "allow": [
      "Bash(ssh -F \"C:/Users/PAWEPI~1/.ssh/config\" *)",
      "Bash(scp -F \"C:/Users/PAWEPI~1/.ssh/config\" *)"
    ]
  },
```

Efekt: każda sesja może pracować na serwerze bez pytania o zgodę przy każdej komendzie.
Zakres jest wąski - reguła obejmuje wyłącznie polecenia używające TEGO pliku konfiguracyjnego SSH.
Cofnięcie: usuń blok albo usuń klucz publiczny w hPanel.

## 2. Hostinger MCP - wyniki researchu (2026-08-03, zweryfikowane)

**Istnieje oficjalny serwer MCP Hostingera.** Dwa warianty:

- **Zdalny (rekomendowany, bez instalacji, bez tokenu na dysku):**
  `claude mcp add --transport http hostinger https://mcp.hostinger.com`
  Autoryzacja OAuth w przeglądarce (zweryfikowane na żywo: endpoint zwraca scope `mcp:use`).
- Lokalny: pakiet npm `hostinger-api-mcp` (wymaga Node 24+) i token w zmiennej `HOSTINGER_API_TOKEN`.

**Co potrafi (278 narzędzi):** VPS (restart, snapshoty, backupy, firewall, klucze SSH, metryki), Docker Manager
jako "projects" (deploy z compose, update, restart, logi, delete), DNS (odczyt/zapis/kasowanie rekordów,
snapshoty stref), domeny, hosting, mail, billing.

**KRYTYCZNE OSTRZEŻENIE - token NIE MA zakresów.** Oficjalna dokumentacja Hostingera mówi wprost:
"Tokens will have same permissions as the owning user". Jedyne ograniczenie to opcjonalna data ważności.
Promień rażenia przy wycieku = CAŁE konto:
- wszystkie VPS (w tym `recreateVirtualMachine` i zmiana hasła root) - także serwer z PapiShop i Onyxem,
- wszystkie domeny (zmiana nameserverów, **kod EPP do transferu domeny**),
- wszystkie strefy DNS (kasowanie i reset),
- wszystkie skrzynki mailowe (zmiana haseł),
- **billing** (tworzenie zamówień zakupu, metody płatności).

**Rekomendacja: na razie NIE podpinamy MCP.** Wszystko, co robimy teraz (instalacja, konfiguracja, deploy,
logi), idzie po SSH i dotyczy jednego serwera. MCP daje realną wartość dopiero przy rekordach DNS pod
subdomenę - a to jest jednorazowe kliknięcie w panelu. Jeśli mimo to chcesz go podpiąć, wybierz wariant
zdalny (OAuth), bo nie zostawia tokenu w pliku, i traktuj to jak dostęp administratora do całego konta.

---

## 3. Czego NIE robimy

- Nie pozwalamy asystentowi Horizons w panelu Hostingera konfigurować Hermesa ("mogę pomóc przygotować konfigurację pod nowego agenta"). Chcemy własny `docker-compose.yml` trzymany w repozytorium, powtarzalny dla kolejnych klubów. Konfiguracja klikana w panelu przez cudzego agenta nie jest odtwarzalna i nie mamy nad nią kontroli.
- Nie instalujemy nic na srv1670856 (PapiShop + Onyx). UWAGA: ten serwer wygasa **2026-08-14**, trzeba go odnowić.

---

## 4. Uwaga o snapshocie

Snapshot z 2026-08-03 16:27 ma datę wygaśnięcia **2026-08-04** - czyli to zabezpieczenie na jedną dobę. Po instalacji Hermesa zrobimy nowy snapshot jako punkt "czysta instalacja", a docelowo backup katalogu z danymi agenta (crontab + kopia poza serwerem).
