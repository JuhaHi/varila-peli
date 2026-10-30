import { NextRequest, NextResponse } from 'next/server';
import { getGameNodes } from '@/lib/gameServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nodes = await getGameNodes();
    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Nodes error:', error);
    return NextResponse.json({ error: 'Virhe anomaliatietojen haussa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const nodes = await getGameNodes(false, body.nodeStates);
    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Nodes sync error:', error);
    return NextResponse.json({ error: 'Virhe anomaliatietojen haussa' }, { status: 500 });
  }
}
