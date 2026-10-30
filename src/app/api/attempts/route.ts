import { NextResponse } from 'next/server';
import { getPlayerAttempts } from '@/lib/gameServer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId') || searchParams.get('player_id');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId on pakollinen parametri' }, { status: 400 });
    }

    const attempts = await getPlayerAttempts(playerId);
    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Attempts fetch error:', error);
    return NextResponse.json({ error: 'Virhe suoritustietojen haussa' }, { status: 500 });
  }
}
