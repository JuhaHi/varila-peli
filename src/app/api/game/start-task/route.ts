import { NextResponse } from 'next/server';
import { handleStartTask } from '@/lib/gameServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const playerId = body.playerId || body.player_id;
    const { nodeKey } = body;

    if (!playerId || !nodeKey) {
      return NextResponse.json(
        { success: false, error: 'Puuttuvat kentät: playerId ja nodeKey ovat pakollisia.' },
        { status: 400 }
      );
    }

    const result = await handleStartTask(playerId, nodeKey);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Start task error:', error);
    return NextResponse.json(
      { success: false, error: 'Palvelinvirhe tehtävän aloituksessa.' },
      { status: 500 }
    );
  }
}
