import { pobierzZadanie } from '@/lib/zadania';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Stan zadania: interfejs odpytuje o to co sekunde i dokleja nowy tekst. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const z = await pobierzZadanie(id);
  if (!z) return Response.json({ error: 'Nie znaleziono zadania.' }, { status: 404 });
  return Response.json({
    id: z.id,
    rozmowaId: z.rozmowaId,
    status: z.status,
    tresc: z.tresc,
    blad: z.blad ?? null,
    nowePliki: z.nowePliki ?? [],
  });
}
