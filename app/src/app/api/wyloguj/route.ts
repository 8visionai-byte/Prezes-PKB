export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Wylogowanie z bramy na serwerze.
 *
 * Brama trzyma haslo w pamieci przegladarki. Nie da sie jej stamtad usunac poleceniem,
 * ale odpowiedz 401 z zadaniem podania hasla skutecznie ta pamiec kasuje.
 * To rozwiazanie na czas, zanim powstana prawdziwe konta.
 */
export async function GET() {
  return new Response('Wylogowano.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Asystent Prezesa PKB", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}
