import { NextResponse } from 'next/server';
import { handleToggleNode, getGameNodes, verifyAdminPin } from '@/lib/gameServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodeKey, isActive, is_active, adminPin, admin_pin } = body;
    const pin = adminPin || admin_pin;
    const active = isActive !== undefined ? isActive : is_active;

    if (!nodeKey || pin === undefined) {
      return NextResponse.json(
        { success: false, error: 'Puuttuvat kentät: nodeKey ja adminPin ovat pakollisia.' },
        { status: 400 }
      );
    }

    const result = await handleToggleNode(nodeKey, Boolean(active), String(pin));

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Palvelinvirhe tehtävän tilan päivityksessä.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Returns nodes with secret codes ONLY for verified admin PIN
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin') || req.headers.get('x-admin-pin') || '';

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { error: 'Virheellinen Admin PIN-koodi. Pääsy evätty.' },
        { status: 401 }
      );
    }

    const nodes = await getGameNodes(true);
    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Admin nodes error:', error);
    return NextResponse.json({ error: 'Virhe tietojen haussa' }, { status: 500 });
  }
}
