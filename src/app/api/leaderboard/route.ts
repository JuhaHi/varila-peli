import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/gameServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLeaderboard();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Virhe pistetilanteen haussa' }, { status: 500 });
  }
}
