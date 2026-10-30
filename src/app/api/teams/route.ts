import { NextResponse } from 'next/server';
import { inMemoryDb } from '@/lib/gameServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(inMemoryDb.getPlayers());
}

export async function POST(req: Request) {
  try {
    const { name, pinCode } = await req.json();
    const result = inMemoryDb.loginOrRegister(name, pinCode || '1888');
    return NextResponse.json(result);
  } catch (err) {
    console.error('Teams route error:', err);
    return NextResponse.json({ error: 'Virhe käyttäjän käsittelyssä' }, { status: 500 });
  }
}
