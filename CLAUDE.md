# Asystent Prezesa PKB — instrukcje projektu

Agent AI dla Radka, prezesa Partnerskich Klubów Biznesu. Produktem dla prezesa jest NASZA aplikacja
webowa (branding PKB, czat jak GPT), która rozmawia z silnikiem Hermes Agent przez jego API.
Prezes nigdy nie widzi Telegrama, terminala ani panelu Hermesa.

Pełny kontekst: `STATUS.md` (stan prac), `ARCHITEKTURA_ASYSTENT_PREZESA.md` (architektura),
`PLAN_REALIZACJI_APLIKACJA_PKB.md` (zakres i roadmapa), `WDROZENIE_KROK_PO_KROKU.md`,
`MOC_HERMESA_NOTATKI.md`, `DOSTEP_SSH_I_MCP.md`, `infra/docker-compose.yml`.
Na każde "kontynuuj" / "wznów" — NAJPIERW przeczytaj STATUS.md.

## Serwer projektu: srv1469630

- IP **187.124.30.210**, KVM 2 (2 vCPU / 8 GB / 96 GB), Ubuntu 24.04.4, Frankfurt, opłacony do 2027-03-07.
- Dane agenta: `/root/hermes-data` (montowane w kontenerze jako `/opt/data`).
- Kontener: `hermes` (obraz `nousresearch/hermes-agent:latest`).
- API server dla aplikacji PKB: `127.0.0.1:8642` (nigdy nie wystawiać na 0.0.0.0).

### Jak się połączyć (WAŻNE — pułapka tej maszyny)

`ssh.exe` na Windows NIE czyta ścieżek zawierających "ł" (`C:\Users\Paweł Pieloch`) — zwraca
`Could not create directory '/c/Users/Pawe\263 Pieloch/.ssh'` i ignoruje klucz oraz plik config.
Dlatego ZAWSZE używaj krótkiej nazwy folderu i jawnego `-F`:

```
ssh -F "C:/Users/PAWEPI~1/.ssh/config" pkb-vps "komenda"
```

Klucz prywatny: `C:\Users\PAWEPI~1\.ssh\pkb_vps` (bez hasła, dedykowany TYLKO do tego serwera).

## Twarde zasady

1. **NIE dotykaj serwera srv1670856** (187.127.85.198) — tam żyje produkcja Pawła: PapiShop/PapiPlanner
   i Onyx wraz z własnym Traefikiem. Klucz `pkb_vps` celowo tam nie działa.
2. **Nigdy nie montuj `/var/run/docker.sock`** do kontenera Hermesa. Dałoby to agentowi kontrolę nad
   silnikiem Dockera całego serwera, a backendy kontenerowe pomijają warstwę zatwierdzania komend.
3. **Sekrety nie przechodzą przez czat.** Klucz OpenRouter, `API_SERVER_KEY`, hasła — Paweł wpisuje je
   sam w kreatorze albo przez `hermes config set` w swojej sesji. Nie drukuj ich, nie zapisuj w repo.
4. **Nic destrukcyjnego bez zgody Pawła** (kasowanie kontenerów, wolumenów, danych, zmiana OS).
   Przed większą zmianą: snapshot w hPanel.
5. Strefa czasowa serwera ma być **Europe/Warsaw** — inaczej crony i poranne briefy wypadają o 2 h za wcześnie.
6. Odpowiadaj po polsku, prostym językiem. Bez myślnika em-dash w treściach dla klienta.

## Stan i następne kroki

Aktualne w `STATUS.md`. Realizacja aplikacji idzie przez GSD w osobnym repo `app/`
(prompt startowy w `app/KICKOFF_GSD.md`).
