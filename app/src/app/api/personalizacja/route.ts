import { NextRequest } from 'next/server';
import { wczytajPersonalizacje, zapiszPersonalizacje } from '@/lib/personalizacja';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await wczytajPersonalizacje());
}

export async function PUT(req: NextRequest) {
  try {
    const dane = await req.json();
    return Response.json(await zapiszPersonalizacje(dane));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
