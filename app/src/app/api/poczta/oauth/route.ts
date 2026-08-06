import { NextRequest } from 'next/server';
import { odbierzKod } from '@/lib/poczta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const wroc = (parametr: string) =>
  new Response(null, {
    status: 302,
    headers: {
      Location: `/poczta?${parametr}`,
      'Set-Cookie': 'pkb-poczta-stan=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });

/** Google odsyla tu prezesa po kliknieciu "Zezwól". Zamieniamy kod na trwale polaczenie. */
export async function GET(req: NextRequest) {
  const parametry = req.nextUrl.searchParams;

  if (parametry.get('error')) {
    return wroc(`blad=${encodeURIComponent('Zgoda nie została udzielona.')}`);
  }

  const stanZAdresu = parametry.get('state');
  const stanZCiasteczka = req.cookies.get('pkb-poczta-stan')?.value;
  if (!stanZAdresu || stanZAdresu !== stanZCiasteczka) {
    return wroc(`blad=${encodeURIComponent('Sesja podłączania wygasła. Spróbuj jeszcze raz.')}`);
  }

  const kod = parametry.get('code');
  if (!kod) return wroc(`blad=${encodeURIComponent('Google nie przekazało kodu.')}`);

  try {
    const adres = await odbierzKod(kod);
    return wroc(`podlaczono=${encodeURIComponent(adres)}`);
  } catch (e) {
    return wroc(`blad=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);
  }
}
