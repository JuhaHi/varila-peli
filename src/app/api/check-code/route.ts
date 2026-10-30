import { NextResponse } from 'next/server';
import { handleCheckCode } from '@/lib/gameServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const playerId = body.playerId || body.player_id || body.teamId;
    const { nodeKey, inputCode } = body;

    if (!playerId || !nodeKey || !inputCode) {
      return NextResponse.json({ success: false, message: 'Puuttuvat kentät (playerId, nodeKey tai inputCode).' }, { status: 400 });
    }

    const result = await handleCheckCode(playerId, nodeKey, inputCode);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Check code error:', error);
    return NextResponse.json({ success: false, message: 'Palvelinvirhe koodin tarkistuksessa.' }, { status: 500 });
  }
}
