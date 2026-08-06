import { randomBytes } from 'node:crypto';
import { adresZgody, pocztaSkonfigurowana } from '@/lib/poczta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Poczatek podlaczania skrzynki: odsylamy prezesa na ekran zgody Google.
 * Losowy `state` w ciasteczku chroni przed podstawieniem cudzego kodu (CSRF).
 */
export async function GET() {
  if (!pocztaSkonfigurowana()) {
    return Response.json(
      { error: 'Poczta nie jest jeszcze skonfigurowana po stronie serwera.' },
      { status: 503 },
    );
  }

  const stan = randomBytes(16).toString('hex');
  return new Response(null, {
    status: 302,
    headers: {
      Location: adresZgody(stan),
      'Set-Cookie': `pkb-poczta-stan=${stan}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
