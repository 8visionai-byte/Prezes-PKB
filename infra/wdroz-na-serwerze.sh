#!/bin/sh
# Wdrozenie aplikacji PKB na serwerze srv1469630.
# Uruchamiane PO wgraniu plikow do /root/pkb-stack:
#     ssh pkb-vps "sh /root/pkb-stack/wdroz-na-serwerze.sh"
#
# Skrypt jest bezpieczny do wielokrotnego uruchamiania.
set -e

STACK=/root/pkb-stack
W=/root/hermes-data/profiles/prezes-test/workspace

# --- 1. Wspolny dostep aplikacji i agenta do tych samych katalogow ---
# Aplikacja w kontenerze dziala jako uid 1001 (nextjs), agent Hermes jako uid 10000.
# Bez tego kroku aplikacja NIE zapisze wgranego dokumentu ("Permission denied"),
# a agent nie odczyta tego, co prezes wrzucil.
# Wlasciciel = 1001 (zapis z aplikacji), grupa = 10000 (zapis z agenta),
# bit setgid (2xxx) sprawia, ze nowe pliki dziedzicza grupe agenta.
mkdir -p "$W/baza-wiedzy" "$W/aplikacja"
chown -R 1001:10000 "$W/baza-wiedzy" "$W/aplikacja"
chmod 2775 "$W/baza-wiedzy" "$W/aplikacja"
chmod -R g+rw "$W/baza-wiedzy" "$W/aplikacja" 2>/dev/null || true

# Umiejetnosci agenta aplikacja tylko czyta (pokazuje je w panelu bocznym).
chmod -R o+rX /root/hermes-data/profiles/prezes-test/skills 2>/dev/null || true

# --- 2. Przebudowa i restart ---
cd "$STACK"
docker compose build app
docker compose up -d app caddy

# --- 3. Dowod, ze wstalo ---
sleep 4
docker compose ps --format '{{.Service}}\t{{.Status}}'
echo "--- test zapisu z aplikacji ---"
docker compose exec -T app sh -c 'touch /dane/baza-wiedzy/_test && rm /dane/baza-wiedzy/_test && echo ZAPIS-OK'
echo "--- test odczytu z agenta ---"
docker exec -u 10000 hermes sh -c 'ls /opt/data/profiles/prezes-test/workspace/baza-wiedzy >/dev/null && echo ODCZYT-OK'
