import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await getLeaderboard(body.players, body.attempts, body.resetAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leaderboard sync error:', error);
    return NextResponse.json({ error: 'Virhe pistetilanteen haussa' }, { status: 500 });
  }
}
