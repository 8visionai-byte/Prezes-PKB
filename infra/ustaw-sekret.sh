#!/bin/sh
# Bezpieczne wpisanie sekretu do /root/pkb-stack/.env
#
# Uzycie:
#     sh /root/pkb-stack/ustaw-sekret.sh OPENAI_API_KEY
#
# Skrypt zapyta o wartosc. Wpisujesz ja NA SLEPO (nie widac znakow),
# nie zostaje w historii polecen i nigdy nie jest drukowana.
#
# Powstal po wpadce: wartosc wklejona recznie bez nazwy zmiennej trafila
# do pliku jako goła linia, aplikacja jej nie widziala, a przy diagnostyce
# klucz wyswietlil sie w calosci.
set -e

NAZWA="$1"
PLIK=/root/pkb-stack/.env

if [ -z "$NAZWA" ]; then
  echo "Podaj nazwe zmiennej, np.: sh ustaw-sekret.sh OPENAI_API_KEY"
  exit 1
fi

# Tylko WIELKIE_LITERY_I_PODKRESLENIA: chroni przed wklejeniem wartosci jako nazwy.
if ! echo "$NAZWA" | grep -qE '^[A-Z][A-Z0-9_]*$'; then
  echo "Nazwa zmiennej moze zawierac tylko wielkie litery, cyfry i podkreslenia."
  echo "Podano: $NAZWA"
  exit 1
fi

printf "Wklej wartosc dla %s (nie zobaczysz znakow), potem Enter: " "$NAZWA"
stty -echo 2>/dev/null || true
read WARTOSC
stty echo 2>/dev/null || true
echo

if [ -z "$WARTOSC" ]; then
  echo "Pusta wartosc, nic nie zmieniam."
  exit 1
fi

touch "$PLIK"
# Usuwamy poprzedni wpis tej zmiennej, zeby nie robily sie duplikaty.
grep -v "^${NAZWA}=" "$PLIK" > "${PLIK}.nowy" 2>/dev/null || true
# Docker Compose traktuje "$" w pliku .env jako zmienna. Podwajamy, zeby sekret
# dotarl w calosci. Ta pulapka obcięła nam juz raz hasło do panelu.
echo "${NAZWA}=$(printf '%s' "$WARTOSC" | sed 's/\$/$$/g')" >> "${PLIK}.nowy"
mv "${PLIK}.nowy" "$PLIK"
chmod 600 "$PLIK"

echo "Zapisane. Zmienne w pliku (same nazwy):"
cut -d= -f1 "$PLIK"

echo
echo "Przebudowuje kontener aplikacji, zeby zobaczyl nowa zmienna..."
cd /root/pkb-stack
docker compose up -d --force-recreate app >/dev/null 2>&1
sleep 3
if docker compose exec -T app sh -c "[ -n \"\$$NAZWA\" ]"; then
  echo "OK: kontener widzi $NAZWA."
else
  echo "UWAGA: kontener NADAL nie widzi $NAZWA. Zglos to."
fi
